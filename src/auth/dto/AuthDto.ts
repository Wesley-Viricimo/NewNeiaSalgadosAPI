import { IsNotEmpty } from 'class-validator';

export class AuthDto {
    @IsNotEmpty({ message: "E-mail não pode ser vazio!" })
    email: string;

    @IsNotEmpty({ message: "Senha não pode ser vazia!" })
    password: string;   
}
