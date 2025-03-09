import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotificationService } from 'src/service/notification.service';
import { HttpModule } from '@nestjs/axios';
import { ErrorExceptionFilters } from 'src/shared/utils/httpResponseService/errorResponse.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';

@Module({
  imports: [HttpModule],
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
