import { FastifyRequest } from 'fastify';
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';

@Controller('api/v1/category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService
  ) {}

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() request: FastifyRequest
  ) {
    return this.categoryService.create(createCategoryDto, request['userId']);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.categoryService.findById(+id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() request: FastifyRequest
  ) {
    return this.categoryService.update(+id, updateCategoryDto, request['userId']);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: FastifyRequest
  ) {
    return this.categoryService.delete(+id, request['userId']);
  }
}
