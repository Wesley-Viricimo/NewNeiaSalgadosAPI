import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    private sesClient: SESClient;

    constructor() {
        this.sesClient = new SESClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY
            }
        });
    }

    async sendEmail(email: string, name:string, token: string): Promise<void> {
        const confirmationLink = `http://localhost:3000/api/v1/auth/confirm-email?token=${token}`;

        const params = {
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: `<p>Olá ${name},</p>
                               <p>Por favor, clique no link abaixo para confirmar seu cadastro:</p>
                               <a href="${confirmationLink}">Confirmar Cadastro</a>`,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Confirmação de Cadastro',
                },
            },
            Source: process.env.SENDER_EMAIL
        };

        const command = new SendEmailCommand(params);

        try {
            await this.sesClient.send(command);
            console.log(`Email enviado com sucesso para: ${email}`);
        } catch (error) {
            console.error('Erro ao enviar e-mail:', error);
            throw new Error('Erro ao enviar e-mail');
        }
    }
}