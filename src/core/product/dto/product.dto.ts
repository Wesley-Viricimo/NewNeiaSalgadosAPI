import { zStringToInt, zStringToNumber } from "src/shared/utils/helpers/zod.helper";
import { z } from "zod";

export const ProductDtoSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: zStringToNumber(),
    idCategory: zStringToInt(),
    urlImage: z.string().optional()
});

export type ProductDto = z.infer<typeof ProductDtoSchema>;