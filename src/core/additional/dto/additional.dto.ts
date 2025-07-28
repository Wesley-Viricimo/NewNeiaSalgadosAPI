import { z } from "zod";

export const AdditionalDtoSchema = z.object({
    description: z.string(),
    price: z.number()
});

export type AdditionalDto = z.infer<typeof AdditionalDtoSchema>;

export const AdditionalQuerySchema = z.object({
    page: z.number().default(1),
    perPage: z.number().default(10),
    description: z.string().nullable().optional()
});

export type AdditionalQuery = z.infer<typeof AdditionalQuerySchema>;