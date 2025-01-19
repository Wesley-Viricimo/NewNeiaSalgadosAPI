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
    if (!token || typeof token !== 'string') {
      throw new Error('O token fornecido é inválido.');
    }

    // Corrigindo o formato do payload
    const payload = {
      to: token,                // Token
      sound: 'default',         // Som da notificação
      title: title,             // Título da notificação
      body: body,               // Corpo da notificação
      data: optionals || {},    // Dados adicionais (opcional)
    };

    try {
      await lastValueFrom(
        this.httpService.post(this.expoPushUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })
      );

    } catch (error) {
      console.error('Erro ao enviar notificação:', error.response?.data || error.message);
    }
  }
}