import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  private static sesClient: SESClient;

    constructor() {
      if (!EmailService.sesClient) {
        EmailService.sesClient = new SESClient({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
          },
        });
      }
    }

    async sendActivateAccountEmail(email: string, name: string, activationCode: string): Promise<void> {
        const plainTextMessage = `Olá, ${name}!\n\nSeu código de ativação é: ${activationCode}\n\nUse este código para ativar sua conta.\n\nAtenciosamente,\nEquipe Neia Salgados`;
      
        const htmlMessage = `
          <html>
            <body>
              <p>Olá ${name},</p>
              <p>Seu código de ativação é: <strong>${activationCode}</strong></p>
              <p>Use este código para ativar sua conta.</p>
              <br>
              <p>Atenciosamente,</p>
              <p>Equipe Neia Salgados</p>
            </body>
          </html>
        `;
      
        const params = {
          Destination: {
            ToAddresses: [email],
          },
          Message: {
            Body: {
              Text: {
                Charset: 'UTF-8',
                Data: plainTextMessage,
              },
              Html: {
                Charset: 'UTF-8',
                Data: htmlMessage,
              },
            },
            Subject: {
              Charset: 'UTF-8',
              Data: 'Confirmação de Cadastro',
            },
          },
          Source: process.env.SENDER_EMAIL,
        };
      
        const command = new SendEmailCommand(params);
      
        try {
          await EmailService.sesClient.send(command);
        } catch (error) {
          console.error('Erro ao enviar e-mail:', error);
          throw new Error('Erro ao enviar e-mail');
        }
      }      
}