import { Schema, model, Document, Types } from "mongoose";

export interface InviteCodeDoc extends Document {
  _id: Types.ObjectId;
  code: string;
  usedBy: Types.ObjectId | null;
  usedAt: Date | null;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const inviteCodeSchema = new Schema<InviteCodeDoc>({
  code: { type: String, required: true, unique: true },
  usedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  usedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: () => new Date() },
});

export const InviteCode = model<InviteCodeDoc>("InviteCode", inviteCodeSchema);
