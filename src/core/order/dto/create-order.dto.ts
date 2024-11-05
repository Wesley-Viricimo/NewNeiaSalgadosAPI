import { OrderItemDto } from './order-item.dto'; 

export class CreateOrderDto {
    idAddress: number;
    paymentMethod: number;
    typeOfDelivery: number;
    orderItens: OrderItemDto[]
}
