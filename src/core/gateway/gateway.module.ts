import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Module({
  providers: [NotificationsGateway, PrismaService],
  exports: [NotificationsGateway],
})
export class GatewayModule {}