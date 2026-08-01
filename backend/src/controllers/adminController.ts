import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Session } from "../models/Session";
import { Channel } from "../models/Channel";
import { Entry } from "../models/Entry";
import { ActivationCode } from "../models/ActivationCode";
import { generateActivationCode } from "../utils/codeGenerator";
import { AuditLog, logAudit } from "../models/AuditLog";
import { roleChangeSchema, createChannelSchema, updateChannelSchema } from "../validators/entryValidators";
import { AppError } from "../middleware/errorHandler";

// --- Users & roles -----------------------------------------------------

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await User.find().select("-passwordHash").sort({ joinedAt: -1 }).lean();
  res.status(200).json({ users });
}

export async function changeUserRole(req: Request, res: Response): Promise<void> {
  const { role } = roleChangeSchema.parse(req.body);
  const targetId = req.params.userId as string;

  // Privilege-escalation guard: this route is already sysadmin-only via
  // requireSysadmin, but additionally a sysadmin may not strip their OWN
  // last-admin status by accident via a crafted request, and no user can
  // ever reach this route to modify their own role through any other path
  // since role is read from req.user (the verified token), never the body.
  const target = await User.findById(targetId);
  if (!target) throw new AppError(404, "User not found.");

  const previousRole = target.role;
  target.role = role;
  await target.save();

  await logAudit(
    new Types.ObjectId(req.user!.id),
    "role_change",
    "User",
    target._id.toString(),
    `${previousRole} -> ${role}`,
  );

  res.status(200).json({ user: { id: target._id, alias: target.alias, role: target.role } });
}

export async function revokeUserSessions(req: Request, res: Response): Promise<void> {
  const targetId = req.params.userId as string;
  await Session.updateMany({ user: targetId, revoked: false }, { revoked: true });
  await logAudit(new Types.ObjectId(req.user!.id), "session_revoke", "User", targetId);
  res.status(200).json({ message: "All active sessions for this user have been revoked." });
}

// --- Invite codes --------------------------------------------------------

// --- Network activation code (single, shared, sysadmin-controlled) ------

export async function getActivationCode(_req: Request, res: Response): Promise<void> {
  // Lazily create one on first request if the network has never had one —
  // no separate "initialize" step for a fresh deployment to remember.
  let current = await ActivationCode.findOne();
  if (!current) {
    current = await ActivationCode.create({ code: generateActivationCode() });
  }
  res.status(200).json({ code: current.code, updatedAt: current.updatedAt });
}

export async function regenerateActivationCode(req: Request, res: Response): Promise<void> {
  const newCode = generateActivationCode();
  const updated = await ActivationCode.findOneAndUpdate(
    {},
    { code: newCode, updatedBy: req.user!.id, updatedAt: new Date() },
    { upsert: true, new: true },
  );
  await logAudit(
    new Types.ObjectId(req.user!.id),
    "activation_code_regenerate",
    "ActivationCode",
    updated!._id.toString(),
    "network activation code regenerated",
  );
  res.status(200).json({ code: updated!.code, updatedAt: updated!.updatedAt });
}

// --- Channels ------------------------------------------------------------

export async function adminListChannels(_req: Request, res: Response): Promise<void> {
  // Unlike the public listChannels endpoint, this deliberately does NOT
  // filter out archived channels — the console needs to see them in order
  // to unarchive them. There's nowhere else to recover an archived channel
  // from otherwise.
  const channels = await Channel.find().sort({ archived: 1, requiredClearance: 1, name: 1 }).lean();
  res.status(200).json({ channels });
}

export async function createChannel(req: Request, res: Response): Promise<void> {
  const input = createChannelSchema.parse(req.body);
  const existing = await Channel.findOne({ slug: input.slug });
  if (existing) throw new AppError(409, "A channel with that slug already exists.");
  const channel = await Channel.create(input);
  await logAudit(new Types.ObjectId(req.user!.id), "channel_create", "Channel", channel._id.toString(), channel.slug);
  res.status(201).json({ channel });
}

export async function updateChannel(req: Request, res: Response): Promise<void> {
  const input = updateChannelSchema.parse(req.body);
  const channel = await Channel.findById(req.params.channelId);
  if (!channel) throw new AppError(404, "Channel not found.");
  Object.assign(channel, input);
  await channel.save();
  await logAudit(new Types.ObjectId(req.user!.id), "channel_update", "Channel", channel._id.toString());
  res.status(200).json({ channel });
}

export async function archiveChannel(req: Request, res: Response): Promise<void> {
  const channel = await Channel.findById(req.params.channelId);
  if (!channel) throw new AppError(404, "Channel not found.");
  channel.archived = true;
  await channel.save();
  await logAudit(new Types.ObjectId(req.user!.id), "channel_archive", "Channel", channel._id.toString());
  res.status(200).json({ message: "Channel archived." });
}

// --- Entries (admin management, including clearance reassignment) -------

export async function adminListEntries(req: Request, res: Response): Promise<void> {
  const { channelId } = req.query as { channelId?: string };
  const filter = channelId ? { channel: channelId } : {};
  const entries = await Entry.find(filter)
    .populate("author", "alias")
    .populate("channel", "slug name")
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json({ entries });
}

export async function setEntryClearance(req: Request, res: Response): Promise<void> {
  const { requiredClearance } = req.body as { requiredClearance: string };
  const entry = await Entry.findById(req.params.entryId);
  if (!entry) throw new AppError(404, "Entry not found.");
  const previous = entry.requiredClearance;
  entry.requiredClearance = requiredClearance as typeof entry.requiredClearance;
  await entry.save();
  await logAudit(
    new Types.ObjectId(req.user!.id),
    "entry_clearance_change",
    "Entry",
    entry._id.toString(),
    `${previous} -> ${requiredClearance}`,
  );
  res.status(200).json({ entry });
}

export async function purgeEntry(req: Request, res: Response): Promise<void> {
  const entry = await Entry.findById(req.params.entryId);
  if (!entry) throw new AppError(404, "Entry not found.");
  await entry.deleteOne();
  await logAudit(new Types.ObjectId(req.user!.id), "entry_purge", "Entry", req.params.entryId as string);
  res.status(200).json({ message: "Entry purged." });
}

export async function setEntryLock(req: Request, res: Response): Promise<void> {
  const { locked } = req.body as { locked: boolean };
  const entry = await Entry.findById(req.params.entryId);
  if (!entry) throw new AppError(404, "Entry not found.");
  entry.locked = Boolean(locked);
  await entry.save();
  res.status(200).json({ entry });
}

// --- Audit log ------------------------------------------------------------

export async function listAuditLog(_req: Request, res: Response): Promise<void> {
  const log = await AuditLog.find().populate("actor", "alias role").sort({ createdAt: -1 }).limit(200).lean();
  res.status(200).json({ log });
}
