import { FastifyRequest } from 'fastify';
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { ZodValidationPipe } from 'src/shared/utils/pipes/zod-validation.pipe';
import { CategoryDto, CategoryDtoSchema, CategoryQuery, CategoryQuerySchema } from './dto/category.dto';
import { RolesHelper } from 'src/shared/utils/helpers/roles.helper';

@Controller('api/v1/category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService
  ) {}

  @Roles(RolesHelper.ADMIN, RolesHelper.DEV, RolesHelper.COMERCIAL)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(
    @Body(new ZodValidationPipe(CategoryDtoSchema)) categoryDto: CategoryDto,
    @Req() request: FastifyRequest
  ) {
    return this.categoryService.create(categoryDto, request['userId']);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll(
    @Query(new ZodValidationPipe(CategoryQuerySchema)) categoryQuery: CategoryQuery
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.categoryService.findAll(categoryQuery);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.categoryService.findById(+id);
  }

  @Roles(RolesHelper.ADMIN, RolesHelper.DEV, RolesHelper.COMERCIAL)
  @HttpCode(HttpStatus.CREATED)
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body(new ZodValidationPipe(CategoryDtoSchema)) categoryDto: CategoryDto,
    @Req() request: FastifyRequest
  ) {
    return this.categoryService.update(+id, categoryDto, request['userId']);
  }

  @Roles(RolesHelper.ADMIN, RolesHelper.DEV, RolesHelper.COMERCIAL)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: FastifyRequest
  ) {
    return this.categoryService.delete(+id, request['userId']);
  }
}
