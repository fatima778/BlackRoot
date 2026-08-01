import { Schema, model, Document, Types } from "mongoose";

/**
 * Refresh tokens are represented server-side by row + a random jti embedded
 * in the JWT. Deleting/flagging the row here is what makes logout and
 * "revoke a user's session" (admin bulk action) actually work — clearing
 * client storage alone would not invalidate anything.
 */
export interface SessionDoc extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  jti: string;
  revoked: boolean;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
}

const sessionSchema = new Schema<SessionDoc>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jti: { type: String, required: true, unique: true },
  revoked: { type: Boolean, default: false },
  userAgent: { type: String, default: "" },
  createdAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date, required: true },
});

export const Session = model<SessionDoc>("Session", sessionSchema);
