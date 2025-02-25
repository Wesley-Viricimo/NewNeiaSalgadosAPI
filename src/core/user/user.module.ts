import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/shared/utils/httpResponseService/errorResponse.service';
import { EmailService } from 'src/service/aws/send-email.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    ErrorExceptionFilters,
    PrismaService,
    EmailService,
    ExceptionHandler
  ],
})
export class UserModule {}
