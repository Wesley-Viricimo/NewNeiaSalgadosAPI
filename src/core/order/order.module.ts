import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ErrorExceptionFilters } from 'src/service/errorResponse.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { NotificationService } from '../notification/notification.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [HttpModule, GatewayModule],
  controllers: [OrderController],
  providers: [
    OrderService, 
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    NotificationService,
    AuditingService
  ],
})
export class OrderModule {}
