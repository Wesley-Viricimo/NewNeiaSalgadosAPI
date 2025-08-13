import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { NotificationsGateway } from '../gateway/notifications.gateway';

@Injectable()
export class NotificationService {
    private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

    constructor(
        private readonly prismaService: PrismaService,
        private readonly exceptionHandler: ExceptionHandler,
        private readonly httpService: HttpService,
        private readonly socketNotification: NotificationsGateway
    ) { }

    async getAllUnreadNotifications() {
        return await this.prismaService.notification.findMany({
            where: { read: false },
            select: {
                idNotification: true,
                description: true,
                read: true
            }
        })
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
            const [notification, user] = await Promise.all([
                this.prismaService.notification.findUnique({ where: { idNotification } }),
                this.prismaService.user.findUnique({ where: { idUser } }),
            ]);

            if (!notification)
                this.exceptionHandler.errorBadRequestResponse('Notificação não foi encontrada!');
            if (!user)
                this.exceptionHandler.errorBadRequestResponse('Usuário não cadastrado no sistema!');

            const response = await this.prismaService.notificationRead.create({
                data: { idNotification, idUser }
            });

            await this.prismaService.notification.update({
                where: { idNotification },
                data: { read: true }
            });

            return {
                data: response,
                message: { severity: 'success', summary: 'Sucesso', detail: 'Notificação lida com sucesso.' },
                statusCode: HttpStatus.CREATED
            };
        } catch {
            this.exceptionHandler.errorBadRequestResponse('Erro ao marcar notificação como lida!');
        }
    }

    async sendNotificationToAdmin(title: string, description: string) {
        const notification = await this.prismaService.notification.create({
            data: {
                title,
                description
            }
        });

        this.socketNotification.emitToAllRoles('toast', notification);
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
            console.error('Erro ao enviar notificação:', error.response?.data || error.message);
        }
    }
}
