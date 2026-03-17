import * as z from "zod";
import { ObjectIdSchema, SafeStringSchema } from "../validation/utils";

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    token: z.string().optional(), // Optional: Wird nur bei Login mit Turnstile verwendet
});

export const RegisterSchema = z.object({
    name: SafeStringSchema.min(4),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    token: z.string().optional(), // Optional: Wird nur bei Registrierung mit Turnstile verwendet
}).refine((data) => data.password === data.confirmPassword, {
    message: "app_invalid_password_match", path: ["confirmPassword"],
});

export const InvalidateSessionSchema = z.object({
    sessionId: ObjectIdSchema,
});

export type LoginSchemaType = z.infer<typeof LoginSchema>;
export type RegisterSchemaType = z.infer<typeof RegisterSchema>;