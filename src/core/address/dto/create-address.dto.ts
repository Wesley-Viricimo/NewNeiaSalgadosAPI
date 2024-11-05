import { IsNotEmpty } from 'class-validator';

export class CreateAddressDto {
    @IsNotEmpty({ message: "O campo CEP não pode ser vazio!" })
    cep: string;

    @IsNotEmpty({ message: "O campo estado não pode ser vazio!" })
    state: string;

    @IsNotEmpty({ message: "O campo cidade não pode ser vazio!" })
    city: string;

    @IsNotEmpty({ message: "O campo bairro não pode ser vazio!" })
    district: string;

    @IsNotEmpty({ message: "O campo rua não pode ser vazio!" })
    road: string;

    @IsNotEmpty({ message: "O campo número não pode ser vazio!" })
    number: string;

    complement: string
}