import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { NotificationDto } from "./dto/notification.dto";

@Injectable()
export class NotificationRepository {
    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async createNotification(notificationDto: NotificationDto) {
        return await this.prismaService.notification.create({
            data: {
                title: notificationDto.title,
                description: notificationDto.description,
                type: notificationDto.notificationType
            }
        });
    }

    async getAllUnreadNotifications() {
        return await this.prismaService.notification.findMany({
            where: { read: false }
        })
    }

    async findNotificationById(idNotification: number) {
        return await this.prismaService.notification.findUnique({ where: { idNotification } });
    }

    async markNotificationUserAsRead(idNotification: number, idUser: number) {
        return await this.prismaService.notificationRead.create({
            data: { idNotification, idUser }
        });
    }

    async markReadNotification(idNotification: number) {
        return await this.prismaService.notification.update({
            where: { idNotification },
            data: { read: true }
        });
    }
}