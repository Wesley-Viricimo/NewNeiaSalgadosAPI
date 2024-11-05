import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
    @IsNotEmpty({ message: "O campo descrição não pode ser vazio!" })
    description: string;

    @IsNotEmpty({ message: "O campo preço não pode ser vazio!" })
    price: number; 
      
    urlImage: string
}
