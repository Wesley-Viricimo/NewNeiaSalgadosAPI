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
import { UserService } from '../user/user.service';
import { EmailService } from 'src/service/aws/send-email.service';
import { AdditionalService } from '../additional/additional.service';
import { ProductService } from '../product/product.service';
import { S3Service } from 'src/service/aws/handle-fileS3.service';
import { AddressService } from '../address/address.service';
import { ViaCepService } from 'src/service/viacep.service';
import { AdditionalRepository } from '../additional/additional.repository';
import { AddressRepository } from '../address/address.repository';
import { NotificationRepository } from '../notification/notification.repository';
import { OrderRepository } from './order.repository';
import { ProductRepository } from '../product/product.repository';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [HttpModule, GatewayModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    NotificationService,
    AuditingService,
    UserService,
    EmailService,
    AdditionalService,
    ProductService,
    S3Service,
    AddressService,
    ViaCepService,
    AdditionalRepository,
    AddressRepository,
    NotificationRepository,
    OrderRepository,
    ProductRepository,
    UserRepository
  ],
})
export class OrderModule { }
