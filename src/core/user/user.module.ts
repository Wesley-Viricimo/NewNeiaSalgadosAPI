import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/service/errorResponse.service';
import { EmailService } from 'src/service/aws/send-email.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    ErrorExceptionFilters,
    PrismaService,
    EmailService,
    ExceptionHandler,
    AuditingService
  ],
})
export class UserModule {}
