import { Module } from '@nestjs/common';
import { AdditionalService } from './additional.service';
import { AdditionalController } from './additional.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';

@Module({
  controllers: [AdditionalController],
  providers: [
    AdditionalService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler
  ],
})
export class AdditionalModule {}
