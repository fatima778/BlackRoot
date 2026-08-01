import { Schema, model, Document, Types } from "mongoose";
import { Role, ROLES } from "../utils/roles";

export interface ReplySub {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
}

export interface EntryDoc extends Document {
  _id: Types.ObjectId;
  channel: Types.ObjectId;
  author: Types.ObjectId;
  title: string;
  body: string;
  requiredClearance: Role;
  status: "draft" | "published";
  pinned: boolean;
  locked: boolean;
  flagged: boolean;
  replies: ReplySub[];
  createdAt: Date;
  editedAt: Date | null;
}

const replySchema = new Schema<ReplySub>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, maxlength: 4000 },
    createdAt: { type: Date, default: () => new Date() },
    editedAt: { type: Date, default: null },
  },
  { _id: true },
);

const entrySchema = new Schema<EntryDoc>({
  channel: { type: Schema.Types.ObjectId, ref: "Channel", required: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, maxlength: 160 },
  body: { type: String, required: true, maxlength: 20000 },
  requiredClearance: { type: String, enum: ROLES, default: "guest", required: true },
  status: { type: String, enum: ["draft", "published"], default: "published" },
  pinned: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  replies: { type: [replySchema], default: [] },
  createdAt: { type: Date, default: () => new Date() },
  editedAt: { type: Date, default: null },
});

// Text index for search — the query layer (not the frontend) filters by clearance.
entrySchema.index({ title: "text", body: "text" });

export const Entry = model<EntryDoc>("Entry", entrySchema);
