import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './core/product/product.module';
import { UserModule } from './core/user/user.module';
import { AddressModule } from './core/address/address.module';

@Module({
  imports: [
    AuthModule, 
    ProductModule,
    UserModule,
    AddressModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
