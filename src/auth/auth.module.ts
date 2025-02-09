import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UserService } from 'src/core/user/user.service';
import { TokenService } from './token/token.service';
import { EmailService } from 'src/shared/utils/aws/send-email.service';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';
import { HttpModule } from '@nestjs/axios';
import { NotificationService } from 'src/shared/utils/Api/notification.service';

@Module({
  imports: [HttpModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    ErrorExceptionFilters,
    PrismaService,
    UserService,
    TokenService,
    EmailService,
    ExceptionHandler,
    NotificationService
  ],
})
export class AuthModule {}
