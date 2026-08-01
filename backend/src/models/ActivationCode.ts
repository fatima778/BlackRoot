import { Schema, model, Document, Types } from "mongoose";

/**
 * A SINGLETON — there is ever exactly one document in this collection.
 * Unlike a one-time invite code, this value is never "consumed": any number
 * of people can register with the same code until a Sysadmin regenerates
 * it. This is deliberate — the old per-person invite-code model meant a
 * Sysadmin had to mint and hand-deliver a fresh code for every single
 * signup, which doesn't scale past a handful of users. One shared code,
 * distributed by the Sysadmin through whatever out-of-band channel they
 * choose (a Discord, a README, a physical sign-up sheet), removes that
 * bottleneck entirely while still gating registration behind something
 * only a Sysadmin controls.
 */
export interface ActivationCodeDoc extends Document {
  _id: Types.ObjectId;
  code: string;
  updatedBy: Types.ObjectId | null;
  updatedAt: Date;
}

const activationCodeSchema = new Schema<ActivationCodeDoc>({
  code: { type: String, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  updatedAt: { type: Date, default: () => new Date() },
});

export const ActivationCode = model<ActivationCodeDoc>("ActivationCode", activationCodeSchema);
