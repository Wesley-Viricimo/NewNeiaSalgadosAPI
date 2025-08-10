import { coerceRequiredString, zStringToNumber } from 'src/shared/utils/helpers/zod.helper';
import { z } from 'zod';

export const AddressDtoSchema = z.object({
    cep: z.string(),
    state: z.string(),
    city: z.string(),
    district: z.string(),
    road: z.string(),
    number: z.string(),
    complement: z.string().optional(),
});

export type AddressDto = z.infer<typeof AddressDtoSchema>;

export const AddressQuerySchema = z.object({
    page: zStringToNumber().default(1),
    perPage: zStringToNumber().default(10)
});

export type AddressQuery = z.infer<typeof AddressQuerySchema>;