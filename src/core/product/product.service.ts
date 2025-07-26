import { Injectable, HttpStatus } from '@nestjs/common';
import { ProductSide } from './entities/product.entity';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Prisma, Product } from '@prisma/client';
import { productSelectConfig } from './config/product-select-config';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { S3Service } from 'src/service/aws/handle-fileS3.service';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly s3Service: S3Service,
    private readonly auditingService: AuditingService
  ) { }

  async create(productDto: ProductDto, file: Express.Multer.File, idUser: number) {

    const selectedFields = productSelectConfig;

    await this.validateFieldsCreateProduct(productDto, file);

    let urlImage: string | null = null;

    if (file && typeof file.mimetype === 'string')
      urlImage = await this.s3Service.uploadFile(file);

    return await this.prismaService.product.create({
      select: selectedFields,
      data: {
        title: productDto.title,
        description: productDto.description,
        price: Number(productDto.price),
        idCategory: Number(productDto.idCategory),
        urlImage
      }
    })
      .then(async (result) => {

        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "CADASTRO DE PRODUTO",
          entityType: "PRODUTO",
          changeType: "CREATE",
          entityId: result.idProduct,
          previousValue: "",
          newValue: result
        } as ActionAuditingModel);

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

  private async validateFieldsCreateProduct(productDto: ProductDto, file: Express.Multer.File) {
    if (file && typeof file.mimetype === 'string')
      if (!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg') && !file?.mimetype.includes('png')) this.exceptionHandler.errorUnsupportedMediaTypeResponse(`A ${ProductSide['urlImage']} do produto deve ser do tipo JPG ou JPEG!`);

    if (isNaN(Number(productDto.price))) this.exceptionHandler.errorBadRequestResponse(`O preço do produto deve ser um valor numérico!`);

    const existsProduct = await this.prismaService.product.findUnique({
      where: { title: productDto.title }
    });

    if (existsProduct) this.exceptionHandler.errorBadRequestResponse('Produto já cadastrado no sistema!');

    const existsCategory = await this.prismaService.category.findUnique({
      where: { idCategory: Number(productDto.idCategory) }
    });

    if (!existsCategory) this.exceptionHandler.errorBadRequestResponse('Categoria não cadastrada no sistema!');
  }

  async findAll(page: number, perPage: number, title: string, description: string, category: number): Promise<PaginatedOutputDto<Object>> {

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    const selectedFields = productSelectConfig;

    const where: Prisma.ProductWhereInput = {};

    if (title) where.title = { contains: title, mode: 'insensitive' };
    if (description) where.description = { contains: description, mode: 'insensitive' };
    if (category) where.idCategory = Number(category);

    return await paginate<Product, Prisma.ProductFindManyArgs>(
      this.prismaService.product,
      {
        where,
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

    if (!product) this.exceptionHandler.errorNotFoundResponse('Este produto não está cadastrado no sistema!');
    const message = { severity: 'success', summary: 'Sucesso', detail: 'Produto listado com sucesso!' };

    return {
      data: {
        idProduct: product.idProduct,
        idCategory: product.idCategory,
        title: product.title,
        description: product.description,
        price: product.price,
        urlImage: product.urlImage
      },
      message,
      statusCode: HttpStatus.OK
    }
  }

  async update(id: number, productDto: ProductDto, file: Express.Multer.File, idUser: number) {

    await this.validateFieldsUpdateProduct(productDto, file);

    const product = await this.prismaService.product.findUnique({
      where: { idProduct: id }
    });

    if (!product) this.exceptionHandler.errorNotFoundResponse('Este produto não está cadastrado no sistema!');

    await this.validateExistsProduct(product, productDto);

    let urlImage: string | null = product.urlImage;

    if (file && typeof file.mimetype === 'string') {
      if (product.urlImage) {
        await this.s3Service.deleteFile(product.urlImage);
      }
      urlImage = await this.s3Service.uploadFile(file);
    }

    return await this.prismaService.product.update({
      where: { idProduct: id },
      data: {
        idProduct: id,
        idCategory: Number(productDto.idCategory),
        description: productDto.description,
        price: Number(productDto.price),
        urlImage: urlImage
      }
    })
      .then(async (result) => {

        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "ATUALIZAÇÃO DE PRODUTO",
          entityType: "PRODUTO",
          changeType: "UPDATE",
          entityId: result.idProduct,
          previousValue: product,
          newValue: result
        } as ActionAuditingModel);

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado com sucesso!' };

        return {
          data: {
            idProduct: result.idProduct,
            idCategory: result.idCategory,
            title: result.title,
            description: result.description,
            price: result.price,
            urlImage: result.urlImage
          },
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar produto!');
      });
  }

  private async validateFieldsUpdateProduct(productDto: ProductDto, file: Express.Multer.File) {
    if (!productDto.title) this.exceptionHandler.errorBadRequestResponse("Título do produdo não pode ser vazio!");

    if (file && typeof file.mimetype === 'string')
      if (!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg') && !file?.mimetype.includes('png')) this.exceptionHandler.errorUnsupportedMediaTypeResponse(`A ${ProductSide['urlImage']} do produto deve ser do tipo JPG, JPEG ou PNG!`);

    if (isNaN(Number(productDto.price))) this.exceptionHandler.errorBadRequestResponse(`O preço do produto deve ser um valor numérico!`);
  }

  private async validateExistsProduct(product: Product, updateProductDto: ProductDto) {
    const existsProduct = await this.prismaService.product.findUnique({
      where: { title: updateProductDto.title }
    });

    if (existsProduct && (product.idProduct !== existsProduct.idProduct)) {
      this.exceptionHandler.errorBadRequestResponse(`Este produto já foi cadastrado!`);
    }
  }

  async delete(id: number, idUser: number) {
    const product = await this.prismaService.product.findUnique({
      where: { idProduct: id }
    });

    if (!product) this.exceptionHandler.errorNotFoundResponse(`Este produto não está cadastrado no sistema!`);

    if (product.urlImage)
      await this.s3Service.deleteFile(product.urlImage);

    return await this.prismaService.product.delete({
      where: { idProduct: id }
    })
      .then(async (product) => {
        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "EXCLUSÃO DE PRODUTO",
          entityType: "PRODUTO",
          changeType: "DELETE",
          entityId: product.idProduct,
          previousValue: product,
          newValue: ""
        } as ActionAuditingModel);

      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao excluir produto!');
      });
  }
}
