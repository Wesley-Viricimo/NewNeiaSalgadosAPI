import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    ErrorExceptionFilters,
    PrismaService
  ],
})
export class AuthModule {}
