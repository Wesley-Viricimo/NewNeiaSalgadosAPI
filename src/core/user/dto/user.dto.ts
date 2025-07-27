import { coerceRequiredString } from "src/shared/utils/helpers/zod.helper";
import { z } from "zod";

export const UserDtoSchema = z.object({
    name: z.string(),
    surname: z.string(),
    cpf: coerceRequiredString(),
    phone: coerceRequiredString(),
    email: z.string().email('Invalid Email'),
    password: coerceRequiredString(),
    role: z.string().nullable().optional()
});

export type UserDto = z.infer<typeof UserDtoSchema>;

export const UserQuerySchema = z.object({
    page: z.number().default(1),
    perPage: z.number().default(10),
    user: z.string().nullable().optional(),
    cpf: z.string().nullable().optional(),
    status: z.string().nullable().optional()
});

export type UserQuery = z.infer<typeof UserQuerySchema>;

export const UserUpdateParamsSchema = z.object({
    userId: z.number(),
    role: z.string()
});

export type UserUpdateParams = z.infer<typeof UserUpdateParamsSchema>;

export const MailConfirmationSchema = z.object({
    email: z.string().email('Invalid Email'),
    code: z.string()
});

export type MailConfirmationDto = z.infer<typeof MailConfirmationSchema>;

export const ChangeUserStatusSchema = z.object({
    isActive: z.boolean(),
    userId: z.number()
});

export type ChangeUserStatusDto = z.infer<typeof ChangeUserStatusSchema>;

export const ResendEmailSchema = z.object({
    email: z.string()
});

export type ResendEmailDto = z.infer<typeof ResendEmailSchema>;