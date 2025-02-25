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
                                <head>
                                  <style>
                                    body {
                                      font-family: Arial, sans-serif;
                                      background-color: #f4f4f9;
                                      color: #333;
                                      margin: 0;
                                      padding: 0;
                                    }
                                    .email-container {
                                      max-width: 600px;
                                      margin: 20px auto;
                                      background-color: #ffffff;
                                      border-radius: 8px;
                                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                                      overflow: hidden;
                                      border: 1px solid #ddd;
                                    }
                                    .header {
                                      background-color: #ff6f61;
                                      color: white;
                                      padding: 20px;
                                      text-align: center;
                                      font-size: 24px;
                                      font-weight: bold;
                                    }
                                    .content {
                                      padding: 20px;
                                      text-align: left;
                                      line-height: 1.6;
                                    }
                                    .content p {
                                      margin: 15px 0;
                                    }
                                    .activation-code {
                                      display: inline-block;
                                      padding: 10px 15px;
                                      margin: 20px 0;
                                      font-size: 18px;
                                      font-weight: bold;
                                      color: white;
                                      background-color: #ff6f61;
                                      border-radius: 4px;
                                      text-align: center;
                                    }
                                    .footer {
                                      background-color: #f4f4f9;
                                      color: #888;
                                      text-align: center;
                                      padding: 15px;
                                      font-size: 14px;
                                      border-top: 1px solid #ddd;
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div class="email-container">
                                    <div class="header">
                                      Confirmação de Cadastro
                                    </div>
                                    <div class="content">
                                      <p>Olá <strong>${name}</strong>,</p>
                                      <p>Seu código de ativação é:</p>
                                      <div class="activation-code">${activationCode}</div>
                                      <p>Use este código para ativar sua conta. Caso não tenha solicitado este cadastro, por favor ignore este e-mail.</p>
                                      <p>Atenciosamente,<br>Equipe Neia Salgados</p>
                                    </div>
                                    <div class="footer">
                                      © 2024 Neia Salgados. Todos os direitos reservados.
                                    </div>
                                  </div>
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