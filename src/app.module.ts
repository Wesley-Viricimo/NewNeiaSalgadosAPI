import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './core/product/product.module';
import { UserModule } from './core/user/user.module';
import { AddressModule } from './core/address/address.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './shared/guards/auth.guard';
import { PrismaService } from './shared/prisma/prisma.service';

@Module({
  imports: [
    AuthModule, 
    ProductModule,
    UserModule,
    AddressModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ],
})
export class AppModule {}
