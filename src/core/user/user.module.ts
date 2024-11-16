import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TokenService } from 'src/auth/token/token.service';
import { EmailService } from 'src/shared/utils/aws/send-email.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    ErrorExceptionFilters,
    PrismaService,
    TokenService,
    EmailService
  ],
})
export class UserModule {}
