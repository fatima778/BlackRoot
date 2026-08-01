import { Request, Response } from "express";
import { Types } from "mongoose";
import { Entry } from "../models/Entry";
import { Channel } from "../models/Channel";
import { User } from "../models/User";
import { logAudit } from "../models/AuditLog";
import { createEntrySchema, updateEntrySchema, replySchema, searchSchema } from "../validators/entryValidators";
import { meetsClearance, rankOf, Role } from "../utils/roles";
import { isOwnerOrRole } from "../middleware/rbac";
import { AppError } from "../middleware/errorHandler";

/**
 * Clearance ranks the requesting role is cleared to see, expressed as the
 * Mongo query fragment. This is the actual leak-prevention mechanism:
 * under-clearance entries are excluded by the database query itself, never
 * fetched-then-filtered in application code or the frontend.
 */
function clearanceFilter(role: Role) {
  const rank = rankOf(role);
  const allowed = (["guest", "verified", "operative", "sysadmin"] as Role[]).filter((r) => rankOf(r) <= rank);
  return { requiredClearance: { $in: allowed } };
}

/** Strips an entry down to a redacted placeholder shape for locked content. */
function redact(entry: { _id: Types.ObjectId; title: string; requiredClearance: Role; channel: Types.ObjectId }) {
  return {
    id: entry._id,
    channel: entry.channel,
    locked: true,
    requiredClearance: entry.requiredClearance,
  };
}

export async function listEntries(req: Request, res: Response): Promise<void> {
  const { channelId } = req.params;
  const role = req.user!.role;

  const channel = await Channel.findById(channelId);
  if (!channel || channel.archived || !meetsClearance(role, channel.requiredClearance)) {
    // Channel itself is above clearance or doesn't exist: identical response either way.
    res.status(404).json({ error: "Route not found." });
    return;
  }

  // Only entries this role is cleared for are ever fetched from the DB.
  const visible = await Entry.find({ channel: channelId, status: "published", ...clearanceFilter(role) })
    .sort({ pinned: -1, createdAt: -1 })
    .populate("author", "alias role")
    .lean();

  res.status(200).json({ entries: visible });
}

export async function getEntry(req: Request, res: Response): Promise<void> {
  const role = req.user!.role;
  const entry = await Entry.findById(req.params.entryId).populate("author", "alias role").populate(
    "replies.author",
    "alias role",
  );
  if (!entry) {
    res.status(404).json({ error: "Entry not found." });
    return;
  }
  if (!meetsClearance(role, entry.requiredClearance)) {
    // Return only the fact that something is locked plus the required
    // clearance — no title, body, author, or reply content leaves the server.
    res.status(200).json({ entry: redact(entry) });
    return;
  }
  if (entry.requiredClearance === "sysadmin" || entry.requiredClearance === "operative") {
    await logAudit(new Types.ObjectId(req.user!.id), "sensitive_entry_access", "Entry", entry._id.toString());
  }
  res.status(200).json({ entry });
}

export async function createEntry(req: Request, res: Response): Promise<void> {
  const input = createEntrySchema.parse(req.body);
  const role = req.user!.role;

  const channel = await Channel.findById(input.channelId);
  if (!channel || channel.archived) throw new AppError(404, "Channel not found.");
  if (channel.locked) throw new AppError(423, "Channel is locked.");
  if (!meetsClearance(role, channel.requiredClearanceToPost)) {
    throw new AppError(403, "Insufficient clearance to post in this channel.");
  }
  // An author may never publish an entry above their own clearance —
  // requiredClearance is clamped, never trusted verbatim from the client.
  const clamped: Role = meetsClearance(role, input.requiredClearance) ? input.requiredClearance : role;

  const entry = await Entry.create({
    channel: channel._id,
    author: req.user!.id,
    title: input.title,
    body: input.body,
    requiredClearance: clamped,
    status: input.status,
  });
  await User.updateOne({ _id: req.user!.id }, { $inc: { postCount: 1 } });
  await entry.populate("author", "alias role");
  res.status(201).json({ entry });
}

export async function updateEntry(req: Request, res: Response): Promise<void> {
  const input = updateEntrySchema.parse(req.body);
  const entry = await Entry.findById(req.params.entryId);
  if (!entry) throw new AppError(404, "Entry not found.");
  if (entry.locked && req.user!.role !== "sysadmin") throw new AppError(423, "Entry is locked by moderation.");

  if (!isOwnerOrRole(req.user!.id, req.user!.role, entry.author.toString(), "sysadmin")) {
    throw new AppError(403, "You may only edit your own entries.");
  }
  if (input.title) entry.title = input.title;
  if (input.body) entry.body = input.body;
  entry.editedAt = new Date();
  await entry.save();
  await entry.populate([
    { path: "author", select: "alias role" },
    { path: "replies.author", select: "alias role" },
  ]);
  res.status(200).json({ entry });
}

export async function deleteEntry(req: Request, res: Response): Promise<void> {
  const entry = await Entry.findById(req.params.entryId);
  if (!entry) throw new AppError(404, "Entry not found.");
  if (!isOwnerOrRole(req.user!.id, req.user!.role, entry.author.toString(), "sysadmin")) {
    throw new AppError(403, "You may only delete your own entries.");
  }
  await entry.deleteOne();
  res.status(204).send();
}

export async function addReply(req: Request, res: Response): Promise<void> {
  const input = replySchema.parse(req.body);
  const role = req.user!.role;
  const entry = await Entry.findById(req.params.entryId);
  if (!entry) throw new AppError(404, "Entry not found.");
  if (!meetsClearance(role, entry.requiredClearance)) throw new AppError(404, "Entry not found.");
  if (entry.locked) throw new AppError(423, "Thread is locked.");

  entry.replies.push({
    _id: new Types.ObjectId(),
    author: new Types.ObjectId(req.user!.id),
    body: input.body,
    createdAt: new Date(),
    editedAt: null,
  });
  await entry.save();
  await User.updateOne({ _id: req.user!.id }, { $inc: { postCount: 1 } });

  // The frontend renders author.alias / author.role for the top-level entry
  // AND for every reply (including the one just pushed) — populate both,
  // or the client receives bare ObjectIds where it expects populated docs.
  await entry.populate([
    { path: "author", select: "alias role" },
    { path: "replies.author", select: "alias role" },
  ]);

  res.status(201).json({ entry });
}

export async function flagEntry(req: Request, res: Response): Promise<void> {
  const entry = await Entry.findById(req.params.entryId);
  if (!entry) throw new AppError(404, "Entry not found.");
  if (!meetsClearance(req.user!.role, entry.requiredClearance)) throw new AppError(404, "Entry not found.");
  entry.flagged = true;
  await entry.save();
  res.status(200).json({ message: "Entry flagged for moderator review.", flagged: true });
}

export async function searchEntries(req: Request, res: Response): Promise<void> {
  const { q } = searchSchema.parse(req.query);
  const role = req.user!.role;

  // $text search combined with the same clearance filter used everywhere
  // else — results below clearance are excluded at the database layer,
  // so titles/snippets from locked entries never reach the response.
  const results = await Entry.find(
    { $text: { $search: q }, status: "published", ...clearanceFilter(role) },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(25)
    .select("title channel requiredClearance createdAt")
    .populate("channel", "slug name")
    .lean();

  res.status(200).json({ results });
}
