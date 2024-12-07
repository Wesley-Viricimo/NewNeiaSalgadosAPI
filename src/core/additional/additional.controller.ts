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
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdditionalDto: UpdateAdditionalDto) {
    return this.additionalService.update(+id, updateAdditionalDto);
  }

  @Get()
  findAllAdditional() {
    return this.additionalService.findAllAdditional();
  }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.additionalService.remove(+id);
  }
}
