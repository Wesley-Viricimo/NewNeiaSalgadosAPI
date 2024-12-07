import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdditionalService } from './additional.service';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';

@Controller('additional')
export class AdditionalController {
  constructor(private readonly additionalService: AdditionalService) {}

  @Post()
  create(@Body() createAdditionalDto: CreateAdditionalDto) {
    return this.additionalService.create(createAdditionalDto);
  }

  @Get()
  findAll() {
    return this.additionalService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.additionalService.findOne(+id);
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
