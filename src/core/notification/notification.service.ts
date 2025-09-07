import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { NotificationsGateway } from '../gateway/notifications.gateway';
import { NotificationDto } from './dto/notification.dto';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

    constructor(
        private readonly exceptionHandler: ExceptionHandler,
        private readonly httpService: HttpService,
        private readonly socketNotification: NotificationsGateway,
        private readonly notificationRepository: NotificationRepository
    ) { }

    async getAllUnreadNotifications() {
        return await this.notificationRepository.getAllUnreadNotifications()
            .then(response => {
                const message = { severity: 'success', summary: 'Sucesso', detail: 'Notificações listadas com sucesso.' };
                return {
                    data: response,
                    message,
                    statusCode: HttpStatus.OK
                }
            })
    }

    async markNotificationAsRead(idNotification: number, idUser: number) {
        try {
            const notification = await this.notificationRepository.findNotificationById(idNotification);

            if (!notification) this.exceptionHandler.errorBadRequestResponse('Notificação não foi encontrada!');

            const response = await this.notificationRepository.markNotificationUserAsRead(idNotification, idUser);

            await this.notificationRepository.markReadNotification(idNotification);

            return {
                data: response,
                message: { severity: 'success', summary: 'Sucesso', detail: 'Notificação lida com sucesso.' },
                statusCode: HttpStatus.CREATED
            };
        } catch(err) {
            this.logger.error(`Erro ao marcar notificação como lida: ${err}`);
            this.exceptionHandler.errorBadRequestResponse('Erro ao marcar notificação como lida!');
        }
    }

    async sendNotificationToAdmin(dto: NotificationDto) {
        const notification = await this.notificationRepository.createNotification(dto);
        this.socketNotification.emitToAllRoles(dto.notificationType, notification);
    }

    async sendNotificationToUser(token: string, title: string, body: string, optionals?: any) {
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
            this.logger.error('Erro ao enviar notificação:', error.response?.data || error.message);
        }
    }
}
