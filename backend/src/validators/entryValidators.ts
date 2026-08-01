import { z } from "zod";
import { ROLES } from "../utils/roles";

export const createEntrySchema = z.object({
  channelId: z.string().length(24, "Invalid channel id."),
  title: z.string().min(3).max(160),
  body: z.string().min(1).max(20000),
  requiredClearance: z.enum(ROLES).default("guest"),
  status: z.enum(["draft", "published"]).default("published"),
});

export const updateEntrySchema = z.object({
  title: z.string().min(3).max(160).optional(),
  body: z.string().min(1).max(20000).optional(),
});

export const replySchema = z.object({
  body: z.string().min(1).max(4000),
});

export const createChannelSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9\-]+$/, "Slug must be lowercase, alphanumeric, and hyphens only."),
  name: z.string().min(2).max(60),
  description: z.string().max(300).default(""),
  requiredClearance: z.enum(ROLES).default("guest"),
  requiredClearanceToPost: z.enum(ROLES).default("verified"),
});

export const updateChannelSchema = createChannelSchema.partial().extend({
  archived: z.boolean().optional(),
  locked: z.boolean().optional(),
});

export const roleChangeSchema = z.object({
  role: z.enum(ROLES),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100),
});
