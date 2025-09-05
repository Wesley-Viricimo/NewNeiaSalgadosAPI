import { Module } from '@nestjs/common';
import { AdditionalService } from './additional.service';
import { AdditionalController } from './additional.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/service/errorResponse.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { AdditionalRepository } from './additional.repository';

@Module({
  controllers: [AdditionalController],
  providers: [
    AdditionalService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    AuditingService,
    AdditionalRepository
  ],
})
export class AdditionalModule {}
