import { IsNotEmpty } from 'class-validator';

export class MailConfirmation {
    @IsNotEmpty({ message: "E-mail não pode ser vazio!" })
    email: string;

    @IsNotEmpty({ message: "Código para ativação da conta não pode ser vazio!" })
    code: string;
}