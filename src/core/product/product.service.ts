import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductSide } from './entities/product.entity';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Prisma, Product } from '@prisma/client';
import { productSelectConfig } from './config/product-select-config';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';
import { S3Service } from 'src/shared/utils/aws/handle-fileS3.service';

@Injectable()
export class ProductService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly s3Service: S3Service
  ) {}

  async create(createProductDto: CreateProductDto, file: Express.Multer.File) {

    await this.validateFieldsCreateProduct(createProductDto, file);

    let urlImage: string | null = null;

    if(file)
      urlImage = await this.s3Service.uploadFile(file);
    
    return await this.prismaService.product.create({
      data: {
        description: createProductDto.description,
        price: Number(createProductDto.price),
        idCategory: createProductDto.idCategory,
        urlImage
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
    .catch(() => {
      this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar produto!');
    });
  }

  private async validateFieldsCreateProduct(createProductDto: CreateProductDto, file: Express.Multer.File) {
    if(file) 
      if(!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg') && !file?.mimetype.includes('png')) this.exceptionHandler.errorUnsupportedMediaTypeResponse(`A ${ProductSide['urlImage']} do produto deve ser do tipo JPG ou JPEG!`);

    if(isNaN(Number(createProductDto.price))) this.exceptionHandler.errorBadRequestResponse(`O preço do produto deve ser um valor numérico!`);

    const existsProduct = await this.prismaService.product.findUnique({
      where: { description: createProductDto.description }
    });

    if(existsProduct) {
      this.exceptionHandler.errorBadRequestResponse('Produto já cadastrado!');
    }
  }

  async findAll(page: number, perPage: number, title: string): Promise<PaginatedOutputDto<Object>> {

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    const selectedFields = productSelectConfig;

    return await paginate<Product, Prisma.ProductFindManyArgs>(
      this.prismaService.product,
      {
        where:  { description: { contains: title, mode: 'insensitive' } },
        select: selectedFields 
      }
    )
    .then(response => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Produtos listados com sucesso.' };
      return {
        data: response.data,
        meta: response.meta,
        message,
        statusCode: HttpStatus.OK
      }
    });
  }

  async findById(id: number) {

    const product = await this.prismaService.product.findUnique({
      where: { idProduct: id }
    }); 

    if(!product) this.exceptionHandler.errorNotFoundResponse('Este produto não está cadastrado no sistema!');

    const message = { severity: 'success', summary: 'Sucesso', detail: 'Produto listado com sucesso!' };

    return {
      data: {
        idProduct: product.idProduct,
        idCategory: product.idCategory,
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

    await this.validateExistsProduct(product, updateProductDto);
    
    if(!product) this.exceptionHandler.errorNotFoundResponse('Este produto não está cadastrado no sistema!');

    let urlImage: string | null = product.urlImage;

    if(file) {
      if(product.urlImage) {
        await this.s3Service.deleteFile(product.urlImage);
      }
      urlImage = await this.s3Service.uploadFile(file);
    }

    return await this.prismaService.product.update({
      where: { idProduct: id },
      data: {
        idProduct: id,
        idCategory: updateProductDto.idCategory,
        description: updateProductDto.description,
        price: Number(updateProductDto.price),
        urlImage: urlImage
      }
    })
    .then(product => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado com sucesso!' };
      return {
        data: {
          idProduct: product.idProduct,
          idCategory: product.idCategory,
          description: product.description,
          price: product.price,
          urlImage: product.urlImage
        },
        message,
        statusCode: HttpStatus.CREATED
      }
    })
    .catch(() => {
      this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar produto!');
    });
  }

  private async validateFieldsUpdateProduct(updateProductDto: UpdateProductDto, file: Express.Multer.File) {
    if(file) 
      if(!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg') && !file?.mimetype.includes('png')) this.exceptionHandler.errorUnsupportedMediaTypeResponse(`A ${ProductSide['urlImage']} do produto deve ser do tipo JPG, JPEG ou PNG!`);

    if(isNaN(Number(updateProductDto.price))) this.exceptionHandler.errorBadRequestResponse(`O preço do produto deve ser um valor numérico!`);
  }

  private async validateExistsProduct(product: Product, updateProductDto: UpdateProductDto) {
    const existsProduct = await this.prismaService.product.findUnique({
      where: { description: updateProductDto.description }
    });

    if(existsProduct && (product.idProduct !== existsProduct.idProduct)) {
      this.exceptionHandler.errorBadRequestResponse(`Este produto já foi cadastrado!`);
    }
  }

  async delete(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { idProduct: id }
    });

    if(!product) this.exceptionHandler.errorNotFoundResponse(`Este produto não está cadastrado no sistema!`);

    if(product.urlImage) 
      await this.s3Service.deleteFile(product.urlImage);

    return await this.prismaService.product.delete({
      where: { idProduct: id }
    })
    .catch(() => {
      this.exceptionHandler.errorBadRequestResponse('Erro ao excluir produto!');
    });
  }
}
