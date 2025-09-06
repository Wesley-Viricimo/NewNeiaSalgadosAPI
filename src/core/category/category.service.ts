import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { CategoryDto, CategoryQuery } from './dto/category.dto';
import { ProductService } from '../product/product.service';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly auditingService: AuditingService,
    private readonly productService: ProductService,
    private readonly categoryRepository: CategoryRepository
  ) { }

  async create(categoryDto: CategoryDto, idUser: number) {
    const categoryExists = await this.categoryRepository.getCategoryByDescription(categoryDto.description);
    if (categoryExists) this.exceptionHandler.errorBadRequestResponse('A categoria já foi cadastrada!');

    return await this.categoryRepository.createCategory(categoryDto)
      .then(async (result) => {
        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "CADASTRO DE CATEGORIA",
          entityType: "CATEGORIA",
          changeType: "CREATE",
          entityId: result.idCategory,
          previousValue: "",
          newValue: result
        } as ActionAuditingModel);

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Categoria cadastrada com sucesso!' };

        return {
          data: result,
          message,
          statusCode: HttpStatus.CREATED
        }
      }).catch((err) => {
        this.logger.error(`Erro ao cadastrar categoria: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar categoria!');
      })
  }

  async findAll(categoryQuery: CategoryQuery): Promise<PaginatedOutputDto<Object>> {
    if (categoryQuery.page === 0 && categoryQuery.perPage === 0) {
      const categories = await this.categoryRepository.getCategoriesNotPaginated(categoryQuery);

      return {
        data: categories,
        meta: null
      };
    }

    return await this.categoryRepository.getCategoriesPaginated(categoryQuery)
      .then(response => {
        return {
          data: response.data,
          meta: response.meta
        };
      });
  }

  async findById(id: number) {
    const category = await this.getCategoryById(id);
    const message = { severity: 'success', summary: 'Sucesso', detail: 'Categoria listada com sucesso!' };

    return {
      data: {
        idCategory: category.idCategory,
        description: category.description
      },
      message,
      statusCode: HttpStatus.OK
    }
  }

  async update(id: number, categoryDto: CategoryDto, idUser: number) {

    const category = await this.getCategoryById(id);
    await this.validateExistsCategory(category, categoryDto);

    return await this.categoryRepository.updateCategory(id, categoryDto)
      .then(async (result) => {
        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "ATUALIZAÇÃO DE CATEGORIA",
          entityType: "CATEGORIA",
          changeType: "UPDATE",
          entityId: result.idCategory,
          previousValue: category,
          newValue: result
        } as ActionAuditingModel);

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Categoria atualizada com sucesso!' };

        return {
          data: {
            idCategory: result.idCategory,
            desciption: result.description
          },
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch((err) => {
        this.logger.error(`Erro ao atualizar categoria: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar categoria!');
      });
  }

  async delete(id: number, idUser: number) {
    const category = await this.getCategoryById(id);
    const products = await this.productService.getProductsByCategory(id);

    if (products.length > 0) this.exceptionHandler.errorBadRequestResponse(`Existem produtos que pertecem a esta categoria, então não é possível excluí-la!`);

    return await this.categoryRepository.deleteCategory(id)
      .then(async (result) => {
        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "EXCLUSÃO DE CATEGORIA",
          entityType: "CATEGORIA",
          changeType: "DELETE",
          entityId: result.idCategory,
          previousValue: category,
          newValue: ""
        } as ActionAuditingModel);

      })
      .catch((err) => {
        this.logger.error(`Erro ao excluir categoria: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao excluir categoria!');
      })
  }

  async validateExistsCategory(category: Category, categoryDto: CategoryDto) {
    const existsCategory = await this.categoryRepository.getCategoryByDescription(categoryDto.description);
    if (existsCategory && (category.idCategory !== existsCategory.idCategory)) this.exceptionHandler.errorBadRequestResponse(`Esta categoria já foi cadastrada no sistema!`);
  }

  async getCategoryById(categoryId: number) {
    try {
      const category = await this.categoryRepository.getCategoryById(categoryId);
      if (!category) throw new Error(`A categoria id ${categoryId} não está cadastrada no sistema!`);

      return category;
    } catch (err) {
      this.logger.error(`Erro ao buscar categoria por id: ${err}`);
      if (err instanceof Error) this.exceptionHandler.errorBadRequestResponse(err.message);
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar categoria por id. Erro: ${err}`);
    }
  }
}
