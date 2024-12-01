import { IsNotEmpty } from 'class-validator';

export class MailResendDto {
    @IsNotEmpty({ message: "E-mail não pode ser vazio!" })
    email: string;
}