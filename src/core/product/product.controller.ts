import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Query, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { Product } from './entities/product.entity';
import { FileFastifyInterceptor } from "fastify-file-interceptor";
import { FastifyRequest } from 'fastify';
import { ProductDto, ProductDtoSchema } from './dto/product.dto';
import { ZodValidationPipe } from 'src/shared/utils/pipes/zod-validation.pipe';

@Controller('api/v1/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(FileFastifyInterceptor('file'))
  create(
    @Body(new ZodValidationPipe(ProductDtoSchema)) productDto: ProductDto, 
    @UploadedFile() file: Express.Multer.File,
    @Req() request: FastifyRequest
  ) {
    return this.productService.create(productDto, file, request['userId']);
  }

  @ApiPaginatedResponse(Product)
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('title') title: string,
    @Query('description') description: string,
    @Query('category') category: number
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.productService.findAll(page, perPage, title, description, category);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(+id);
  }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Patch(':id')
  @UseInterceptors(FileFastifyInterceptor('file'))
  update(
    @Param('id') id: string, 
    @Body(new ZodValidationPipe(ProductDtoSchema)) productDto: ProductDto, 
    @UploadedFile() file: Express.Multer.File,
    @Req() request: FastifyRequest
  ) {
    return this.productService.update(+id, productDto, file, request['userId']);
  }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Req() request: FastifyRequest
  ) {
    return this.productService.delete(+id, request['userId']);
  }
}