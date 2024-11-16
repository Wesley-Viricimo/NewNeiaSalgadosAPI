import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { ViaCepService } from 'src/shared/utils/Api/viacep.service';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule], // Importa o HttpModule para disponibilizar o HttpService
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
