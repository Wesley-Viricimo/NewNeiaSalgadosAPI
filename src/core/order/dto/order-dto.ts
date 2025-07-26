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
    idAddress: z.number().nullable().optional(),
    paymentMethod: z.number(),
    typeOfDelivery: z.number(),
    additionalItens: z.array(AdditionalItemDtoSchema).nullable().optional(),
    orderItens: z.array(OrderItemDtoSchema)
});

export type OrderDto = z.infer<typeof OrderDtoSchema>;

export const OrderFindAllQuerySchema = z.object({
    page: z.number().default(1),
    perPage: z.number().default(10),
    user: z.string().nullable().optional(),
    status: z.string().nullable().optional()
});

export type OrderFindAllQuery = z.infer<typeof OrderFindAllQuerySchema>;

export const OrderUpdateStatusParamsSchema = z.object({
    orderId: z.number(),
    orderStatus: z.number()
});

export type OrderUpdateStatusParams = z.infer<typeof OrderUpdateStatusParamsSchema>;