import { zStringToInt, zStringToNumber } from "src/shared/utils/helpers/zod.helper";
import { z } from "zod";

export const ProductDtoSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: zStringToNumber(),
    idCategory: zStringToInt(),
    urlImage: z.string().nullable().optional()
});

export type ProductDto = z.infer<typeof ProductDtoSchema>;

export const ProductQuerySchema = z.object({
    page: zStringToNumber().default(1),
    perPage: zStringToNumber().default(10),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    category: zStringToNumber().nullable().optional()
});

export type ProductQuery = z.infer<typeof ProductQuerySchema>;