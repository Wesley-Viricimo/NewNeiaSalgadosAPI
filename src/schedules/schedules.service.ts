import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationTask } from './tasks/notification.task';

@Injectable()
export class SchedulesService {
    private readonly logger = new Logger(SchedulesService.name);

    constructor(
        private readonly notificationTask: NotificationTask
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async initCronNotifyOrdersPending() {
        this.logger.log('Iniciou cron para notificar pedidos pendentes');
        await this.notificationTask.notifyOrdersPending();
    }
}
