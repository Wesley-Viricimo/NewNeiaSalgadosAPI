import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { ViaCepService } from 'src/shared/utils/Api/viacep.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class AddressService {
  constructor(
    private readonly viaCepService: ViaCepService,
    private readonly prismaService: PrismaService
){}

  async create(address: CreateAddressDto) {

    const user = await this.prismaService.user.findUnique({
      where: { idUser: Number(address.idUser) }
    })

    if (!user) {
      //throw new ErrorExceptionFilters('BAD_REQUEST', `A ${ProductSide['description']} é obrigatória!`);
    }
    
    return address;
  }

  async findAddressByCep(cep: string) {
    try {
      return await this.viaCepService.fetch(cep);
    } catch (error) {
      const message = { severity: 'error', summary: 'Erro', detail: 'CEP informado não foi encontrado!' };
        throw new ErrorExceptionFilters('NOT_FOUND', {
          message,
          statusCode: HttpStatus.NOT_FOUND,
        });
    } 
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
