import { Schema, model, Document, Types } from "mongoose";
import { Role, ROLES } from "../utils/roles";

export interface ChannelDoc extends Document {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  description: string;
  requiredClearance: Role;
  requiredClearanceToPost: Role;
  archived: boolean;
  locked: boolean;
  createdAt: Date;
}

const channelSchema = new Schema<ChannelDoc>({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  requiredClearance: { type: String, enum: ROLES, default: "guest", required: true },
  requiredClearanceToPost: { type: String, enum: ROLES, default: "verified", required: true },
  archived: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() },
});

export const Channel = model<ChannelDoc>("Channel", channelSchema);
