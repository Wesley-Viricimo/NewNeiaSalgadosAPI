import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AddressService } from './address.service';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Address } from './entities/address.entity';
import { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from 'src/shared/utils/pipes/zod-validation.pipe';
import { AddressDto, AddressDtoSchema, AddressQuery, AddressQuerySchema } from './dto/address.dto';

@Controller('api/v1/address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(AddressDtoSchema)) address: AddressDto, 
    @Req() request: FastifyRequest
  ) {
    return this.addressService.create(address, request['userId']);
  }

  @Get(':id')
  findById(@Param('id') id: number, @Req() request: FastifyRequest) {
    return this.addressService.findById(+id, request['userId']);
  }

  @Get('consultacep/:cep')
  findAddressByCep(@Param('cep') cep: string) {
    return this.addressService.findAddressByCep(cep);
  }

  @Get('user/all')
  @ApiPaginatedResponse(Address)
  async findAddressByUserId(
    @Req() request: FastifyRequest,
    @Query(new ZodValidationPipe(AddressQuerySchema)) addressQuery: AddressQuery
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.addressService.findAddressesByUserId(request['userId'], addressQuery);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.CREATED)
  update(
    @Param('id') id: string, 
    @Body(new ZodValidationPipe(AddressDtoSchema)) address: AddressDto, 
    @Req() request: FastifyRequest
  ) {
    return this.addressService.update(+id, address, request['userId']);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: number) {
    return this.addressService.delete(+id);
  }
}
