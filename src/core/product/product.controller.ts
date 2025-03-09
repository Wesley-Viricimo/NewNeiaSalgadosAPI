import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, HttpCode, HttpStatus, Query, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { Product } from './entities/product.entity';
import { FileFastifyInterceptor } from "fastify-file-interceptor";
import { FastifyRequest } from 'fastify';

@Controller('api/v1/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(FileFastifyInterceptor('product-image'))
  create(
    @Body() createProductDto: CreateProductDto, 
    @UploadedFile() file: Express.Multer.File,
    @Req() request: FastifyRequest
  ) {
    return this.productService.create(createProductDto, file, request['userId']);
  }

  @ApiPaginatedResponse(Product)
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('title') title: string
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.productService.findAll(page, perPage, title);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(+id);
  }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Patch(':id')
  @UseInterceptors(FileFastifyInterceptor('product-image'))
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @UploadedFile() file: Express.Multer.File) {
    return this.productService.update(+id, updateProductDto, file);
  }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productService.delete(+id);
  }
}