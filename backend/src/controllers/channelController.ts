import { Request, Response } from "express";
import { Channel } from "../models/Channel";
import { meetsClearance, rankOf, Role } from "../utils/roles";
import { AppError } from "../middleware/errorHandler";

export async function listChannels(req: Request, res: Response): Promise<void> {
  const role = req.user!.role;
  const rank = rankOf(role);
  const allowed = (["guest", "verified", "operative", "sysadmin"] as Role[]).filter((r) => rankOf(r) <= rank);

  // Hidden-routes requirement: channels above clearance are excluded from
  // the query entirely, so they never appear in navigation until the
  // account is upgraded — not merely hidden by the frontend.
  const channels = await Channel.find({ archived: false, requiredClearance: { $in: allowed } })
    .sort({ requiredClearance: 1, name: 1 })
    .lean();

  res.status(200).json({ channels });
}

export async function getChannel(req: Request, res: Response): Promise<void> {
  const role = req.user!.role;
  const channel = await Channel.findOne({ slug: req.params.slug, archived: false });
  if (!channel || !meetsClearance(role, channel.requiredClearance)) {
    throw new AppError(404, "Route not found.");
  }
  res.status(200).json({ channel });
}
