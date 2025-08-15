import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FastifyRequest } from 'fastify';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';

@Controller('api/v1/notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Roles('ADMIN', 'DEV', 'COMERCIAL')
  @Get('unread')
  getAllUnreadNotifications() {
    return this.notificationService.getAllUnreadNotifications();
  }

  @Roles('ADMIN', 'DEV', 'COMERCIAL')
  @Post('markAsRead')
  @HttpCode(HttpStatus.CREATED)
  markNotificationAsRead(
    @Body('idNotification') idNotification: string,
    @Req() request: FastifyRequest
  ) {
    return this.notificationService.markNotificationAsRead(+idNotification, request['userId']);
  }

}
