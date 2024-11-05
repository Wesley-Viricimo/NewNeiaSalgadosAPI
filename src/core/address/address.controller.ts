import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @HttpCode(201)
  create(@Body() address: CreateAddressDto, @Req() request: Request) {
    return this.addressService.create(address, request['userId']);
  }

  @Get('consultacep/:cep')
  findAddressByCep(@Param('cep') cep: string) {
    return this.addressService.findAddressByCep(cep);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addressService.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(201)
  update(
    @Param('id') id: string, 
    @Body() updateAddressDto: UpdateAddressDto,
    @Req() request: Request
  ) {
    return this.addressService.update(+id, updateAddressDto, request['userId']);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string, @Req() request: Request) {
    return this.addressService.delete(+id, request['userId']);
  }
}
