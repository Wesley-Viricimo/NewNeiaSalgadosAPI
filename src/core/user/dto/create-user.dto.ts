import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty({ message: "O campo nome é obrigatório!" })
    name: string;

    @IsNotEmpty({ message: "O campo apelido é obrigatório!" })
    surname: string;

    @IsNotEmpty({ message: "O campo cpf é obrigatório!" })
    cpf: string;

    @IsNotEmpty({ message: "O campo telefone é obrigatório!" })
    phone: string;

    @IsEmail({}, { message: "E-mail informado é inválido!" })
    @IsNotEmpty({ message: "O campo e-mail é obrigatório!" })
    email: string;

    @IsNotEmpty({ message: "O campo senha é obrigatório!" })
    password: string;
}