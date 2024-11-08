import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AddressService } from './address.service';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { CreateAddressDto } from './dto/create-address.dto';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() address: CreateAddressDto, @Req() request: Request) {
    return this.addressService.create(address, request['userId']);
  }

  @Get(':id')
  findById(@Param('id') id: number, @Req() request: Request) {
    return this.addressService.findById(+id, request['userId']);
  }

  @Get('consultacep/:cep')
  findAddressByCep(@Param('cep') cep: string) {
    return this.addressService.findAddressByCep(cep);
  }

  @Get('user/all')
  @ApiPaginatedResponse(Address)
  async findAddressByUserId(
    @Req() request: Request,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.addressService.findAddressesByUserId(request['userId'], page, perPage);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.CREATED)
  update(
    @Param('id') id: string, 
    @Body() updateAddressDto: UpdateAddressDto,
    @Req() request: Request
  ) {
    return this.addressService.update(+id, updateAddressDto, request['userId']);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @Req() request: Request) {
    return this.addressService.delete(+id, request['userId']);
  }
}
