import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    ErrorExceptionFilters,
    PrismaService
  ],
})
export class UserModule {}
