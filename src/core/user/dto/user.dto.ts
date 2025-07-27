import { z } from "zod";

export const UserDtoSchema = z.object({
    name: z.string(),
    surname: z.string(),
    cpf: z.string(),
    phone: z.string(),
    email: z.string(),
    password: z.string(),
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