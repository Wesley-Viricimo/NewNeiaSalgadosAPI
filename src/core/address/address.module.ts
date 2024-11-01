import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { ViaCepService } from 'src/shared/utils/Api/viacep.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule], // Importa o HttpModule para disponibilizar o HttpService
  controllers: [AddressController],
  providers: [
    AddressService,
    ViaCepService
  ],
})
export class AddressModule {}
