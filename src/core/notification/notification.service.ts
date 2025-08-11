import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';

@Injectable()
export class NotificationService {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly exceptionHandler: ExceptionHandler
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
}
