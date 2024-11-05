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

    if (!user) throw new ErrorExceptionFilters('NOT_FOUND', `Este ${AddressSide['user']} não está cadastrado no sistema!`);

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

    if(addressExists) throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${AddressSide['address']} endereço já foi cadastrado no sistema!`);
    
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

  async update(id: number, updateAddressDto: UpdateAddressDto, userId: number) {

    const address = await this.prismaService.address.findUnique({
      where: { idAddress: id }
    });

    if(!address) throw new ErrorExceptionFilters('NOT_FOUND', `Este ${AddressSide['address']} não foi encontrado!`);

    if(address.idUser !== userId) throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${AddressSide['address']} não pertence a este usuário!`);

    return await this.prismaService.address.update({
      where: { idAddress: id },
      data: {
        cep: updateAddressDto.cep,
        state: updateAddressDto.state,
        city: updateAddressDto.city,
        district: updateAddressDto.district,
        road: updateAddressDto.road,
        number: updateAddressDto.number,
        complement: updateAddressDto.complement,
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

  remove(id: number) {
    return `This action removes a #${id} address`;
  }
}
