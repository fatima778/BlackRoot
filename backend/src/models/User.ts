import { Schema, model, Document, Types } from "mongoose";
import { Role, ROLES } from "../utils/roles";

export interface UserDoc extends Document {
  _id: Types.ObjectId;
  alias: string;
  email: string;
  passwordHash: string;
  role: Role;
  joinedAt: Date;
  activatedAt: Date;
  postCount: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  recoveryCodeHash: string | null;
}

const userSchema = new Schema<UserDoc>({
  alias: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 24 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ROLES, default: "guest", required: true },
  joinedAt: { type: Date, default: () => new Date() },
  // Set the instant an account is created — there is no email/SMS gate to
  // clear first. Guest is already the network's most-restricted tier, so
  // an additional activation-link step would add operational overhead
  // (someone has to generate and hand-deliver that link) without changing
  // what an unactivated account could actually do. This field exists so
  // "when did this account become live" is still a real, queryable fact.
  activatedAt: { type: Date, default: () => new Date() },
  postCount: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  // Hash of a one-time recovery code shown to the user exactly once, at
  // registration. This is the password-reset mechanism in an environment
  // with no outbound email/SMS provider — functionally identical to 2FA
  // backup codes. Never store the plaintext code; only its bcrypt hash.
  recoveryCodeHash: { type: String, default: null },
});

export const User = model<UserDoc>("User", userSchema);
