import { zStringToNumber } from 'src/shared/utils/helpers/zod.helper';
import { z } from 'zod';

export const CategoryDtoSchema = z.object({
    description: z.string()
});

export type CategoryDto = z.infer<typeof CategoryDtoSchema>;

export const CategoryQuerySchema = z.object({
    page: zStringToNumber().default(1),
    perPage: zStringToNumber().default(10),
    description: z.string().nullable().optional()
});

export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;