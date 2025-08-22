import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { NotificationTask } from './tasks/notification.task';
import { OrderService } from 'src/core/order/order.service';
import { NotificationService } from 'src/core/notification/notification.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { GatewayModule } from 'src/core/gateway/gateway.module';
import { UserService } from 'src/core/user/user.service';
import { EmailService } from 'src/service/aws/send-email.service';

@Module({
  imports: [ 
    HttpModule, 
    GatewayModule
  ],
  providers: [
    SchedulesService,
    NotificationTask,
    OrderService,
    PrismaService,
    NotificationService,
    ExceptionHandler, 
    NotificationService, 
    AuditingService,
    UserService,
    EmailService
  ],
})
export class SchedulesModule {}
