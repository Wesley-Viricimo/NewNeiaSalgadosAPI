import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ViaCepService } from 'src/service/viacep.service';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AddressDto, AddressQuery } from './dto/address.dto';
import { UserService } from '../user/user.service';
import { AddressRepository } from './address.repository';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(
    private readonly viaCepService: ViaCepService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly userService: UserService,
    private readonly addressRepository: AddressRepository
  ) { }

  async create(addressDto: AddressDto, userId: number) {
    await this.validationFieldsAddress(addressDto, userId);

    return await this.addressRepository.createAddress(addressDto, userId)
      .then(address => {
        console.log('address', address)
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
      .catch((err) => {
        this.logger.error(`Erro ao cadastrar endereço: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar endereço!');
      });
  }

  async findById(addressId: number, userId: number) {
    const address = await this.addressRepository.findAddressById(addressId);
    if (!address) this.exceptionHandler.errorNotFoundResponse(`Este endereço não está cadastrado no sistema!`);

    if (address.idUser !== userId) this.exceptionHandler.errorForbiddenResponse(`Este endereço não pertence a este usuário!`);
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

  private async validationFieldsAddress(addressDto: AddressDto, userId: number) {
    await this.userService.getUserById(userId);

    const addressExists = await this.addressRepository.getAddressByUser(addressDto, userId);
    if (addressExists) this.exceptionHandler.errorBadRequestResponse(`Este endereço endereço já foi cadastrado no sistema!`);
  }

  async findAddressesByUserId(userId: number, addressQuery: AddressQuery): Promise<PaginatedOutputDto<Object>> {
    return await this.addressRepository.getAddressesByUserId(userId, addressQuery)
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

  async update(id: number, addressDto: AddressDto, userId: number) {
    const address = await this.getAddressById(id);

    if (address.idUser !== userId) this.exceptionHandler.errorBadRequestResponse(`Este endereço não pertence a este usuário!`);

    return await this.addressRepository.updateAddress(id, addressDto)
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

  async delete(id: number) {
    await this.getAddressById(id);

    return await this.addressRepository.deleteAddress(id)
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao excluir endereço!');
      });
  }

  async getAddressById(addressId: number) {
    try {
      const address = await this.addressRepository.findAddressById(addressId);

      if (!address) throw new Error(`O endereço id ${addressId} não está cadastrado no sistema!`);

      return address;
    } catch (err) {
      if (err instanceof Error) this.exceptionHandler.errorBadRequestResponse(err.message);
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar endereço por id. Erro: ${err}`);
    }
  }

}
