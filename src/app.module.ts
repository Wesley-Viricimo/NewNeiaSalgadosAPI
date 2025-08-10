import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './core/product/product.module';
import { UserModule } from './core/user/user.module';
import { AddressModule } from './core/address/address.module';
import { OrderModule } from './core/order/order.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './shared/guards/auth.guard';
import { PrismaService } from './shared/prisma/prisma.service';
import { ExceptionHandler } from './shared/utils/exceptions/exceptions-handler';
import { CategoryModule } from './core/category/category.module';
import { AdditionalModule } from './core/additional/additional.module';
import { NotificationsGateway } from './core/gateway/notifications.gateway';

@Module({
  imports: [
    AuthModule, 
    ProductModule,
    UserModule,
    AddressModule,
    OrderModule,
    CategoryModule,
    AdditionalModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    ExceptionHandler,
    NotificationsGateway,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ],
})
export class AppModule {}
