import { CreateAdditionalProductDto } from './dto/create-additional-product.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { AdditionalService } from './additional.service';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';

@Controller('api/v1/additional')
export class AdditionalController {
  constructor(private readonly additionalService: AdditionalService) {}

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createAdditionalDto: CreateAdditionalDto) {
    return this.additionalService.create(createAdditionalDto);
  }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Post('/product')
  createAdditionalProduct(@Body() createAdditionalProductDto: CreateAdditionalProductDto) {
    return this.additionalService.createAdditionalProduct(createAdditionalProductDto);
  }

  @Get('product/:id')
  @HttpCode(HttpStatus.OK)
  findAdditionalByProduct(@Param('id') id: string) {
    return this.additionalService.findAdditionalByProduct(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdditionalDto: UpdateAdditionalDto) {
    return this.additionalService.update(+id, updateAdditionalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.additionalService.remove(+id);
  }
}