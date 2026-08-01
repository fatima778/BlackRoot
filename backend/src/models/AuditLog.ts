import { Schema, model, Document, Types } from "mongoose";

export type AuditAction =
  | "role_change"
  | "session_revoke"
  | "channel_create"
  | "channel_update"
  | "channel_archive"
  | "entry_create"
  | "entry_update"
  | "entry_clearance_change"
  | "entry_purge"
  | "sensitive_entry_access"
  | "activation_code_regenerate";

export interface AuditLogDoc extends Document {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  action: AuditAction;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDoc>({
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
  detail: { type: String, default: "" },
  createdAt: { type: Date, default: () => new Date() },
});

export const AuditLog = model<AuditLogDoc>("AuditLog", auditLogSchema);

export async function logAudit(
  actor: Types.ObjectId,
  action: AuditAction,
  targetType: string,
  targetId: string,
  detail = "",
): Promise<void> {
  await AuditLog.create({ actor, action, targetType, targetId, detail });
}
