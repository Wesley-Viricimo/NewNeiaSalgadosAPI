import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UserService } from 'src/core/user/user.service';
import { TokenService } from './token/token.service';
import { ErrorExceptionFilters } from 'src/service/errorResponse.service';
import { EmailService } from 'src/service/aws/send-email.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { UserRepository } from 'src/core/user/user.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    ErrorExceptionFilters,
    PrismaService,
    UserService,
    TokenService,
    EmailService,
    ExceptionHandler,
    AuditingService,
    UserRepository
  ],
})
export class AuthModule {}
