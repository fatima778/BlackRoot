import { z } from "zod";

export const registerSchema = z.object({
  alias: z
    .string()
    .min(3, "Handle must be at least 3 characters.")
    .max(24, "Handle must be at most 24 characters.")
    .regex(/^[a-zA-Z0-9_\-]+$/, "Handle may only contain letters, numbers, _ and -."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .regex(/[A-Z]/, "Password needs at least one uppercase letter.")
    .regex(/[0-9]/, "Password needs at least one digit."),
  activationCode: z.string().min(4, "Activation code is too short.").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const requestVerificationSchema = z.object({
  agreedToRules: z
    .boolean()
    .refine((val) => val === true, { message: "You must accept the community rules to proceed." }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  recoveryCode: z
    .string()
    .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Recovery code format looks wrong."),
  newPassword: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .regex(/[A-Z]/, "Password needs at least one uppercase letter.")
    .regex(/[0-9]/, "Password needs at least one digit."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
