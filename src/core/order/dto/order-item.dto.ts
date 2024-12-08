import { ProductDto } from './product-dto';

export class OrderItemDto {
    product: ProductDto;
    comment: string;
    quantity: number;
}