import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { ViaCepService } from 'src/service/viacep.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ErrorExceptionFilters } from 'src/shared/utils/httpResponseService/errorResponse.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';

@Module({
  imports: [HttpModule],
  controllers: [AddressController],
  providers: [
    AddressService,
    ViaCepService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler
  ],
})
export class AddressModule {}
