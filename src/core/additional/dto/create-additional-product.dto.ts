import { IsNotEmpty } from 'class-validator';

export class CreateAdditionalProductDto {
    @IsNotEmpty({ message: "O id do adicional não pode ser vazio!" })
    idAdditional: number[];

    @IsNotEmpty({ message: "O id do produto não pode ser vazio!" })
    idProduct: number;
}