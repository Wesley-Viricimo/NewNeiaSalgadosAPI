import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { ProductSide } from './entities/product.entity';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { Prisma, Product } from '@prisma/client';

@Injectable()
export class ProductService {

  constructor(
    private readonly prismaService: PrismaService
  ) {}

  async create(createProductDto: CreateProductDto, file: Express.Multer.File) {

    await this.validateFieldsProduct(createProductDto, file);
    
    return await this.prismaService.product.create({
      data: {
        description: createProductDto.description,
        price: Number(createProductDto.price),
        urlImage: file? file.originalname : null
      }
    })
    .then(result => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Produto cadastrado com sucesso!' };
      return {
        data: result,
        message,
        statusCode: HttpStatus.CREATED
      };
    })
    .catch((err) => {
      console.log(err);
      const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao cadastrar produto!' };
      throw new ErrorExceptionFilters('BAD_REQUEST', {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      })
    });
  }

  private async validateFieldsProduct(createProductDto: CreateProductDto, file: Express.Multer.File) {
    if(file) 
      if(!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg') && !file?.mimetype.includes('png')) throw new ErrorExceptionFilters('UNSUPPORTED_MEDIA_TYPE', `A ${ProductSide['urlImage']} do produto deve ser do tipo JPG ou JPEG!`);

    if(isNaN(Number(createProductDto.price))) throw new ErrorExceptionFilters('BAD_REQUEST', `O preço do produto deve ser um valor numérico!`);

    const existsProduct = await this.prismaService.product.findUnique({
      where: { description: createProductDto.description }
    });

    if(existsProduct) {
      const message = { severity: 'error', summary: 'Erro', detail: 'Produto já cadastrado!' };
      return {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      }
    }
  }

  async findAll(page: number, perPage: number): Promise<PaginatedOutputDto<Object>> {

    const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage });

    const selectedFields = {
      idProduct: true,
      description: true,
      price: true,
      urlImage: true,
    };

    return await paginate<Product, Prisma.ProductFindManyArgs>(
      this.prismaService.product,
      { select: selectedFields }
    )
    .then(response => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Produtos listados com sucesso.' };
      return {
        data: response.data,
        meta: response.meta,
        message,
        statusCode: HttpStatus.OK
      }
    })
    .catch(() => {
      const message = { severity: 'error', summary: 'Erro ao listar produtos', detail: 'Erro' };
      throw new ErrorExceptionFilters('BAD_REQUEST', {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      })
  });
  }

  async findById(id: number) {

    const selectedFields = {
      idProduct: true,
      description: true,
      price: true,
      urlImage: true,
    };

    const product = await this.prismaService.product.findUnique({
      where: { idProduct: id },
      select: selectedFields
    });

    if(!product) throw new ErrorExceptionFilters('NOT_FOUND', `Este produto não está cadastrado no sistema!`);

    const message = { severity: 'success', summary: 'Sucesso', detail: 'Produto listado com sucesso!' };

    return {
      data: {
        idProduct: product.idProduct,
        description: product.description,
        price: product.price,
        urlImage: product.urlImage
      },
      message,
      statusCode: HttpStatus.OK
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto, file: Express.Multer.File) {

    await this.validateFieldsUpdateProduct(updateProductDto, file);

    const product = await this.prismaService.product.findUnique({
      where: { idProduct: id }
    });
    
    if(!product) throw new ErrorExceptionFilters('NOT_FOUND', `Este produto não está cadastrado no sistema!`);

    return await this.prismaService.product.update({
      where: { idProduct: id },
      data: {
        idProduct: id,
        description: updateProductDto.description,
        price: updateProductDto.price,
        urlImage: file? file.originalname : updateProductDto.urlImage
      }
    })
    .then(product => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado com sucesso!' };
      return {
        data: {
          idProduct: product.idProduct,
          description: product.description,
          price: product.price,
          urlImage: product.urlImage
        },
        message,
        statusCode: HttpStatus.CREATED
      }
    })
    .catch((err) => {
      console.log(err)
      const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar produto!' };
        throw new ErrorExceptionFilters('BAD_REQUEST', {
          message,
          statusCode: HttpStatus.BAD_REQUEST
        })
    });
  }

  private async validateFieldsUpdateProduct(createProductDto: UpdateProductDto, file: Express.Multer.File) {
    if(file) 
      if(!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg') && !file?.mimetype.includes('png')) throw new ErrorExceptionFilters('UNSUPPORTED_MEDIA_TYPE', `A ${ProductSide['urlImage']} do produto deve ser do tipo JPG ou JPEG!`);

    if(isNaN(Number(createProductDto.price))) throw new ErrorExceptionFilters('BAD_REQUEST', `O preço do produto deve ser um valor numérico!`);

    const existsProduct = await this.prismaService.product.findUnique({
      where: { description: createProductDto.description }
    });

    if(existsProduct) {
      const message = { severity: 'error', summary: 'Erro', detail: 'Produto já cadastrado!' };
      return {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      }
    }
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
