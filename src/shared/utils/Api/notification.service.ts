import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(
    private readonly httpService: HttpService
  ) {}

  async sendPushNotification(token: string, title: string, body: string, optionals?: any) {
    // Verifique se o token é uma string válida
    if (!token || typeof token !== 'string') {
      throw new Error('O token fornecido é inválido.');
    }

    // Corrigindo o formato do payload
    const payload = {
      to: token,                // Token como string (não como objeto)
      sound: 'default',         // Som da notificação
      title: title,             // Título da notificação
      body: body,               // Corpo da notificação
      data: optionals || {},    // Dados adicionais (opcional)
    };

    console.log('Payload a ser enviado:', payload);

    try {
      const response = await lastValueFrom(
        this.httpService.post(this.expoPushUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })
      );

      // Verifica se a requisição foi bem-sucedida
      if (response.status === 200) {
        console.log('Notificação enviada com sucesso', response.data);
      } else {
        console.error('Erro ao enviar notificação', response.data);
      }
    } catch (error) {
      // Caso ocorra algum erro, detalhar mais informações para o diagnóstico
      console.error('Erro ao enviar notificação:', error.response?.data || error.message);
    }
  }
}