import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import { ViaCepService } from 'src/service/viacep.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AddressSide } from './entities/address.entity';
import { Address, Prisma } from '@prisma/client';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { userSelectConfig, addressByIdSelectConfig, addressSelectConfig } from './config/address-select-config';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';

@Injectable()
export class AddressService {
  constructor(
    private readonly viaCepService: ViaCepService,
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler
){}

  async create(address: CreateAddressDto, userId: number) {

    await this.validationFieldsAddress(address, userId);
    
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
        user: userSelectConfig
      }
    })
    .then(address => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Endereço cadastrado com sucesso!' };
      return {
        data: {
          idAddress: address.idAddress,
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
      this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar endereço!');
    });
  }

  async findById(addressId: number, userId: number) {

    const selectedFields = addressByIdSelectConfig;

    const address = await this.prismaService.address.findUnique({
      where: { idAddress: addressId },
      select: selectedFields
    });

    if(!address) this.exceptionHandler.errorNotFoundResponse(`Este ${AddressSide['address']} não está cadastrado no sistema!`);

    if(address.idUser !== userId) this.exceptionHandler.errorForbiddenResponse(`Este ${AddressSide['address']} não pertence a este usuário!`);

    const message = { severity: 'success', summary: 'Sucesso', detail: 'Endereço listado com sucesso!' };

    return {
      data: {
        idAddress: address.idAddress,
        user: address.user,
        cep: address.cep,
        state: address.state,
        city: address.city,
        district: address.district,
        road: address.road,
        number: address.number,
        complement: address.complement
      },
      message,
      statusCode: HttpStatus.OK
    };
  }

  async findAddressByCep(cep: string) {
    try {
      const data = await this.viaCepService.fetch(cep);
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Busca por CEP realizada com sucesso!' };
      return {
        data: {
          cep: data.cep,
          state: data.estado,
          city: data.localidade,
          district: data.bairro,
          road: data.logradouro,
          ddd: data.ddd
        },
        message,
        statusCode: HttpStatus.OK
      }
    } catch (error) {
      this.exceptionHandler.errorNotFoundResponse('CEP informado está incorreto!');
    } 
  }

  private async validationFieldsAddress(address: CreateAddressDto, userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { idUser: userId }
    });

    if (!user) this.exceptionHandler.errorNotFoundResponse(`Este ${AddressSide['user']} não está cadastrado no sistema!`);

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

    if(addressExists) this.exceptionHandler.errorBadRequestResponse(`Este ${AddressSide['address']} endereço já foi cadastrado no sistema!`);
  }

  async findAddressesByUserId(userId: number, page: number, perPage: number): Promise<PaginatedOutputDto<Object>>{
    
    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    const selectedFields = addressSelectConfig;

    return await paginate<Address, Prisma.AddressFindManyArgs>(
      this.prismaService.address,
      { 
        where: { idUser: userId }, 
        select: selectedFields
      },
      { page: page, perPage: perPage }
    )
    .then(response => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Endereços listados com sucesso.' };
        return {
          data: response.data,
          meta: response.meta,
          message,
          statusCode: HttpStatus.OK
        }
    });
  }

  async update(id: number, updateAddressDto: UpdateAddressDto, userId: number) {

    const address = await this.prismaService.address.findUnique({
      where: { idAddress: id }
    });

    if(!address) this.exceptionHandler.errorNotFoundResponse(`Este ${AddressSide['address']} não está cadastrado no sistema!`);

    if(address.idUser !== userId) this.exceptionHandler.errorBadRequestResponse(`Este ${AddressSide['address']} não pertence a este usuário!`);

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
        user: userSelectConfig
      }
    })
    .then(address => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Endereço atualizado com sucesso!' };
      return {
        data: {
          idAddress: address.idAddress,
          user: address.user,
          cep: address.cep,
          state: address.state,
          city: address.city,
          district: address.district,
          road: address.road,
          number: address.number,
          complement: address.complement
        },
        message,
        statusCode: HttpStatus.CREATED
      }
    })
    .catch(() => {
      this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar endereço!');
    });
  }

  async delete(id: number, userId: number) {
    
    const address = await this.prismaService.address.findUnique({
      where: { idAddress: id }
    });
  
    if (!address) this.exceptionHandler.errorNotFoundResponse(`Este ${AddressSide['address']} não está cadastrado no sistema!`);
  
    if (address.idUser !== userId) this.exceptionHandler.errorBadRequestResponse(`Este ${AddressSide['address']} não pertence a este usuário!`);
  
    return await this.prismaService.address.delete({
      where: { idAddress: id }
    })
    .catch(() => {
      this.exceptionHandler.errorBadRequestResponse('Erro ao excluir endereço!');
    });
  }

}
