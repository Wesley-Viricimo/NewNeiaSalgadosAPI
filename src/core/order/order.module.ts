import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';
import { NotificationService } from 'src/shared/utils/Api/notification.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrderController],
  providers: [
    OrderService, 
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    NotificationService
  ],
})
export class OrderModule {}
