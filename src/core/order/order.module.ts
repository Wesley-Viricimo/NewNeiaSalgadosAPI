import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';

@Module({
  controllers: [OrderController],
  providers: [
    OrderService, 
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler
  ],
})
export class OrderModule {}
