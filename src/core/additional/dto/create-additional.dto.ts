import { IsNotEmpty } from 'class-validator';

export class CreateAdditionalDto {
    @IsNotEmpty({ message: "O campo descrição não pode ser vazio!" })
    description: string;

    @IsNotEmpty({ message: "O campo preço não pode ser vazio!" })
    price: number;
}
