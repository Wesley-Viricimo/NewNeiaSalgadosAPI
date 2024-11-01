import { Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ViaCepService } from 'src/shared/utils/Api/viacep.service';

@Injectable()
export class AddressService {
  constructor(
    private readonly viaCepService: ViaCepService
  ){}

  async create(address: CreateAddressDto) {
    const cepResponse = await this.viaCepService.fetch(address.cep);

    console.log('response', cepResponse);
  }

  findAll() {
    return `This action returns all address`;
  }

  findOne(id: number) {
    return `This action returns a #${id} address`;
  }

  update(id: number, updateAddressDto: UpdateAddressDto) {
    return `This action updates a #${id} address`;
  }

  remove(id: number) {
    return `This action removes a #${id} address`;
  }
}
