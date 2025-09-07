import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ProductSide } from './entities/product.entity';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Prisma, Product } from '@prisma/client';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { S3Service } from 'src/service/aws/handle-fileS3.service';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { ProductDto, ProductQuery } from './dto/product.dto';
import { ProductRepository } from './product.repository';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly exceptionHandler: ExceptionHandler,
    private readonly s3Service: S3Service,
    private readonly auditingService: AuditingService,
    private readonly productRepository: ProductRepository
  ) { }

  async create(productDto: ProductDto, file: Express.Multer.File, idUser: number) {
    await this.validateFieldsCreateProduct(productDto, file);

    let urlImage: string | null = null;

    if (file && typeof file.mimetype === 'string') {
      urlImage = await this.s3Service.uploadFile(file);
    }

    return await this.productRepository.createProduct(productDto, urlImage)
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
      .catch((err) => {
        this.logger.error(`Erro ao cadastrar produto: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar produto!');
      });
  }

  private async validateFieldsCreateProduct(productDto: ProductDto, file: Express.Multer.File) {
    if (file && typeof file.mimetype === 'string') {
      if (!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg') && !file?.mimetype.includes('png')) this.exceptionHandler.errorUnsupportedMediaTypeResponse(`A ${ProductSide['urlImage']} do produto deve ser do tipo JPG ou JPEG!`);
    }

    const existsProduct = await this.productRepository.findProductByTitle(productDto.title);
    if (existsProduct) this.exceptionHandler.errorBadRequestResponse('Produto já cadastrado no sistema!');

    const existsCategory = await this.productRepository.findProductCategory(productDto.idCategory);
    if (!existsCategory) this.exceptionHandler.errorBadRequestResponse('Categoria não cadastrada no sistema!');
  }

  async findAll(productQuery: ProductQuery): Promise<PaginatedOutputDto<Object>> {
    const where: Prisma.ProductWhereInput = {};

    if (productQuery.title) where.title = { contains: productQuery.title, mode: 'insensitive' };
    if (productQuery.description) where.description = { contains: productQuery.description, mode: 'insensitive' };
    if (productQuery.category) where.idCategory = productQuery.category;

    return await this.productRepository.findAllProductsPaginated(productQuery, where)
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
    const product = await this.getProductById(id);

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

    const product = await this.getProductById(id);

    await this.validateExistsProduct(product, productDto);

    let urlImage: string | null = product.urlImage;

    if (file && typeof file.mimetype === 'string') {
      if (product.urlImage) {
        await this.s3Service.deleteFile(product.urlImage);
      }
      urlImage = await this.s3Service.uploadFile(file);
    }

    return await this.productRepository.updateProduct(id, productDto, urlImage)
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
      .catch((err) => {
        this.logger.error(`Erro ao atualizar produto: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar produto!');
      });
  }

  private async validateFieldsUpdateProduct(productDto: ProductDto, file: Express.Multer.File) {
    if (!productDto.title) this.exceptionHandler.errorBadRequestResponse("Título do produdo não pode ser vazio!");

    if (file && typeof file.mimetype === 'string')
      if (!file?.mimetype.includes('jpg') && !file?.mimetype.includes('jpeg') && !file?.mimetype.includes('png')) this.exceptionHandler.errorUnsupportedMediaTypeResponse(`A ${ProductSide['urlImage']} do produto deve ser do tipo JPG, JPEG ou PNG!`);
  }

  private async validateExistsProduct(product: Product, updateProductDto: ProductDto) {
    const existsProduct = await this.productRepository.findProductByTitle(updateProductDto.title);

    if (existsProduct && (product.idProduct !== existsProduct.idProduct)) {
      this.exceptionHandler.errorBadRequestResponse(`Este produto já foi cadastrado!`);
    }
  }

  async delete(id: number, idUser: number) {
    const product = await this.getProductById(id);
    if (product.urlImage) await this.s3Service.deleteFile(product.urlImage);

    return await this.productRepository.deleteProduct(id)
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
      .catch((err) => {
        this.logger.error(`Erro ao excluir produto: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao excluir produto!');
      });
  }

  async getProductsByCategory(categoryId: number) {
    try {
      return await this.productRepository.findProductsByCategory(categoryId);
    } catch (err) {
      this.logger.error(`Erro ao buscar produtos por categoria: ${err}`);
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar produtos por categoria. Erro: ${err}`);
    }
  }

  async getProductById(productId: number) {
    try {
      const product = await this.productRepository.findProductById(productId);
      if (!product) throw new Error(`O produto id ${productId} não está cadastrado no sistema!`);

      return product;
    } catch (err) {
      this.logger.error(`Erro ao buscar produto por ID: ${err}`);
      if (err instanceof Error) this.exceptionHandler.errorBadRequestResponse(err.message);
      this.exceptionHandler.errorBadRequestResponse('Erro inesperado ao buscar produto.');
    }
  }
}
