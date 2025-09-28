import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TokenDecoderService } from 'src/auth/token/token-decoder.service';

@Module({
  providers: [
    NotificationsGateway,
    PrismaService,
    TokenDecoderService
  ],
  exports: [NotificationsGateway],
})
export class GatewayModule { }