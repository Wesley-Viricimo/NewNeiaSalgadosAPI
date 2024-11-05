import { ProductDto } from './product-dto';

export class OrderItemDto {
    product: ProductDto;
    quantity: number;
}