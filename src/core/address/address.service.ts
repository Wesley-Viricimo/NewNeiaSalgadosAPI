import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { ViaCepService } from 'src/shared/utils/Api/viacep.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AddressSide } from './entities/address.entity';

@Injectable()
export class AddressService {
  constructor(
    private readonly viaCepService: ViaCepService,
    private readonly prismaService: PrismaService
){}

  async create(address: CreateAddressDto, userId: number) {

    const user = await this.prismaService.user.findUnique({
      where: { idUser: userId }
    })

    if (!user) {
      throw new ErrorExceptionFilters('NOT_FOUND', `Este ${AddressSide['user']} não está cadastrado no sistema!`);
    }

    const addressExists = await this.prismaService.address.findFirst({
      where: {
        idUser: userId,
        cep: address.cep,
        state: address.state,
        district: address.district,
        road: address.road,
        number: address.number
      }
    });

    if(addressExists) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${AddressSide['address']} endereço já foi cadastrado no sistema!`);
    }
    
    return await this.prismaService.address.create({
      data: {
        cep: address.cep,
        state: address.state,
        city: address.city,
        district: address.district,
        road: address.road,
        number: address.number,
        complement: address.complement,
        user: {
          connect: {
            idUser: userId
          }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            surname: true,
            cpf: true,
            email: true,
            role: true,
            isActive: true
          }
        }, 
      }
    })
    .then(address => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Endereço cadastrado com sucesso!' };
      return {
        data: {
          cep: address.cep,
          state: address.state,
          city: address.city,
          district: address.district,
          road: address.road,
          number: address.number,
          complement: address.complement,
          user: address.user
        },
        message,
        statusCode: HttpStatus.CREATED
      }
    })
    .catch(() => {
      const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao cadastrar endereço!' };
        throw new ErrorExceptionFilters('BAD_REQUEST', {
          message,
          statusCode: HttpStatus.BAD_REQUEST,
        })
    });
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
