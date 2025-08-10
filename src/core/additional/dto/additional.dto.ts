import { zStringToNumber } from "src/shared/utils/helpers/zod.helper";
import { z } from "zod";

export const AdditionalDtoSchema = z.object({
    description: z.string(),
    price: zStringToNumber()
});

export type AdditionalDto = z.infer<typeof AdditionalDtoSchema>;

export const AdditionalQuerySchema = z.object({
    page: zStringToNumber().default(1),
    perPage: zStringToNumber().default(10),
    description: z.string().nullable().optional()
});

export type AdditionalQuery = z.infer<typeof AdditionalQuerySchema>;