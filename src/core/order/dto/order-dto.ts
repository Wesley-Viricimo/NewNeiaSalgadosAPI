import { zStringToInt, zStringToNumber } from 'src/shared/utils/helpers/zod.helper';
import { z } from 'zod';

const AdditionalItemDtoSchema = z.object({
    idAdditional: z.number()
});

export type AdditionalItemDto = z.infer<typeof AdditionalItemDtoSchema>;

const ProductOrderDtoSchema = z.object({
    idProduct: z.number()
});

const OrderItemDtoSchema = z.object({
    product: ProductOrderDtoSchema,
    comment: z.string().nullable().optional(),
    quantity: z.number()
});

export const OrderDtoSchema = z.object({
    idAddress: zStringToNumber().nullable().optional(),
    paymentMethod: zStringToNumber(),
    typeOfDelivery: zStringToNumber(),
    additionalItens: z.array(AdditionalItemDtoSchema).nullable().optional(),
    orderItens: z.array(OrderItemDtoSchema)
});

export type OrderDto = z.infer<typeof OrderDtoSchema>;

export const OrderFindAllQuerySchema = z.object({
    page: zStringToNumber().default(1),
    perPage: zStringToNumber().default(10),
    user: z.string().nullable().optional(),
    status: z.string().nullable().optional()
});

export type OrderFindAllQuery = z.infer<typeof OrderFindAllQuerySchema>;

export const OrderUpdateStatusParamsSchema = z.object({
    orderId: zStringToNumber(),
    orderStatus: zStringToNumber()
});

export type OrderUpdateStatusParams = z.infer<typeof OrderUpdateStatusParamsSchema>;