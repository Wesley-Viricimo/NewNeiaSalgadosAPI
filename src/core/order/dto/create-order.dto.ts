import { AdditionalItemDto } from './additional-item.dto';
import { OrderItemDto } from './order-item.dto'; 

export class CreateOrderDto {
    idAddress: number;
    paymentMethod: number;
    typeOfDelivery: number;
    additionalItens: AdditionalItemDto[];
    orderItens: OrderItemDto[]
}
