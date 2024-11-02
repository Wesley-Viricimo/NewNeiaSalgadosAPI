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

  async create(address: CreateAddressDto) {

    if(!address.idUser) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${AddressSide['user']} não pode ser vazio!`);
    }

    const user = await this.prismaService.user.findUnique({
      where: { idUser: address.idUser }
    })

    if (!user) {
      throw new ErrorExceptionFilters('NOT_FOUND', `Este ${AddressSide['user']} não está cadastrado no sistema!`);
    }
    
    if(!address.cep) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${AddressSide['cep']} não pode ser vazio!`);
    }

    if(!address.state) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${AddressSide['state']} não pode ser vazio!`);
    }

    if(!address.city) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${AddressSide['city']} não pode ser vazio!`);
    }

    if(!address.district) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${AddressSide['district']} não pode ser vazio!`);
    }

    if(!address.road) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `A ${AddressSide['road']} não pode ser vazia!`);
    }

    if(!address.number) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${AddressSide['number']} não pode ser vazio!`);
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
            idUser: address.idUser
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
