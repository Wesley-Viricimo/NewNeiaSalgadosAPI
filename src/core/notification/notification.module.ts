import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ErrorExceptionFilters } from 'src/service/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { HttpModule } from '@nestjs/axios';
import { GatewayModule } from '../gateway/gateway.module';
import { EmailService } from 'src/service/aws/send-email.service';
import { AuditingService } from 'src/service/auditing.service';
import { NotificationRepository } from './notification.repository';

@Module({
  imports: [HttpModule, GatewayModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    EmailService,
    AuditingService,
    NotificationRepository
  ],
})
export class NotificationModule { }
