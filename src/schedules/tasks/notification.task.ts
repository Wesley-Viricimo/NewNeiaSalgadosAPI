import { Injectable, Logger } from "@nestjs/common";
import { NotificationDto } from "src/core/notification/dto/notification.dto";
import { NotificationService } from "src/core/notification/notification.service";
import { OrderService } from "src/core/order/order.service";

@Injectable()
export class NotificationTask {
    private readonly logger = new Logger(NotificationTask.name);

    constructor(
        private readonly orderService: OrderService,
        private readonly notificationService: NotificationService
    ) { }

    async notifyOrdersPending() {
        await this.orderService.getPendingOrders()
            .then(async (orders) => {
                if (orders.length > 0) {
                    this.logger.log(`${orders.length} pedidos pendentes encontrados, notificações serão enviadas aos administradores!`);

                    for (const order of orders) {
                        const notification: NotificationDto = {
                            title: `Pedido sem retorno`,
                            description: `Pedido do cliente ${order.idUser} está sem retorno`,
                            notificationType: 'error'
                        };

                        await this.notificationService.sendNotificationToAdmin(notification);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            })
            .catch((err) => {
                this.logger.error('Houve um erro ao buscar pedidos pendentes para envio de notificação. Erro: ', err);
            });
    }

}