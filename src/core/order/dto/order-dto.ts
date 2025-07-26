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
    comment: z.string().optional(),
    quantity: z.number()
});

export const OrderDtoSchema = z.object({
    idAddress: z.number().optional(),
    paymentMethod: z.number(),
    typeOfDelivery: z.number(),
    additionalItens: z.array(AdditionalItemDtoSchema),
    orderItens: z.array(OrderItemDtoSchema)
});

export type OrderDto = z.infer<typeof OrderDtoSchema>;







