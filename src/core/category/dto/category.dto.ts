import { z } from 'zod';

export const CategoryDtoSchema = z.object({
    description: z.string()
});

export type CategoryDto = z.infer<typeof CategoryDtoSchema>;

export const CategoryQuerySchema = z.object({
    page: z.number().default(1),
    perPage: z.number().default(10),
    description: z.string().nullable().optional()
});

export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;