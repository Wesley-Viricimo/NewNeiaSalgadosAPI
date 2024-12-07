import { IsNotEmpty } from 'class-validator';

export class CreateProductDto {
    @IsNotEmpty({ message: "O campo título não pode ser vazio!" })
    title: string;

    @IsNotEmpty({ message: "O campo descrição não pode ser vazio!" })
    description: string;

    @IsNotEmpty({ message: "O campo preço não pode ser vazio!" })
    price: number; 

    @IsNotEmpty({ message: "O id da categoria não pode ser vazio!" })
    idCategory: number;
      
    urlImage: string
}
