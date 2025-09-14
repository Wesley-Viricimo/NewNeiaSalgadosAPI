import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FastifyRequest } from 'fastify';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { RolesHelper } from 'src/shared/utils/helpers/roles.helper';

@Controller('api/v1/notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Roles(RolesHelper.ADMIN, RolesHelper.DEV, RolesHelper.COMERCIAL)
  @Get('unread')
  getAllUnreadNotifications() {
    return this.notificationService.getAllUnreadNotifications();
  }

  @Roles(RolesHelper.ADMIN, RolesHelper.DEV, RolesHelper.COMERCIAL)
  @Post('markAsRead')
  @HttpCode(HttpStatus.CREATED)
  markNotificationAsRead(
    @Body('idNotification') idNotification: string,
    @Req() request: FastifyRequest
  ) {
    return this.notificationService.markNotificationAsRead(+idNotification, request['userId']);
  }

}
