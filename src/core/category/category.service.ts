import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Category, Prisma } from '@prisma/client';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly auditingService: AuditingService
  ) { }

  async create(createCategoryDto: CreateCategoryDto, idUser: number) {
    const categoryExists = await this.prismaService.category.findFirst({
      where: {
        description: {
          equals: createCategoryDto.description,
          mode: 'insensitive'
        },
      },
    });

    if (categoryExists) this.exceptionHandler.errorBadRequestResponse('A categoria já foi cadastrada!');

    return await this.prismaService.category.create({
      select: { idCategory: true, description: true },
      data: {
        description: createCategoryDto.description
      }
    }).then(async (result) => {

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
      console.log('error', err);
      this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar cadagoria!');
    })
  }

  async findAll(page: number, perPage: number, description: string): Promise<PaginatedOutputDto<Object>> {
    if (page === 0 && perPage === 0) {
      const categories = await this.prismaService.category.findMany({
        where: {
          description: {
            contains: description,
            mode: 'insensitive'
          }
        },
        select: {
          idCategory: true,
          description: true
        }
      });

      return {
        data: categories,
        meta: null
      };
    }

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    return await paginate<Category, Prisma.CategoryFindManyArgs>(
      this.prismaService.category,
      {
        where: {
          description: {
            contains: description,
            mode: 'insensitive'
          }
        },
        select: {
          idCategory: true,
          description: true
        }
      }
    ).then(response => {
      return {
        data: response.data,
        meta: response.meta
      };
    });
  }

  async findById(id: number) {

    const category = await this.prismaService.category.findUnique({
      where: { idCategory: id }
    });

    if (!category) this.exceptionHandler.errorNotFoundResponse('Esta categoria não está cadastrada no sistema!');

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

  async update(id: number, updateCategoryDto: UpdateCategoryDto, idUser: number) {

    const category = await this.prismaService.category.findUnique({
      where: { idCategory: id }
    });

    if (!category) this.exceptionHandler.errorNotFoundResponse(`Esta categoria não está cadastrada no sistema!`);

    await this.validateExistsCategory(category, updateCategoryDto);

    return await this.prismaService.category.update({
      where: { idCategory: id },
      data: {
        idCategory: id,
        description: updateCategoryDto.description
      }
    })
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
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar categoria!');
      });
  }

  async delete(id: number, idUser: number) {
    const category = await this.prismaService.category.findUnique({
      where: { idCategory: id }
    });

    if (!category) this.exceptionHandler.errorNotFoundResponse(`Esta categoria não está cadastrada no sistema!`);

    const products = await this.prismaService.product.findMany({
      where: { idCategory: id }
    });

    if (products.length > 0) this.exceptionHandler.errorBadRequestResponse(`Existem produtos que pertecem a esta categoria, então não é possível excluí-la!`);

    return await this.prismaService.category.delete({
      where: { idCategory: id }
    })
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
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao excluir categoria!');
      })
  }

  async validateExistsCategory(category: Category, updateCategoryDto: UpdateCategoryDto) {
    const existsCategory = await this.prismaService.category.findFirst({
      where: { description: updateCategoryDto.description }
    });

    if (existsCategory && (category.idCategory !== existsCategory.idCategory)) this.exceptionHandler.errorBadRequestResponse(`Esta categoria já foi cadastrada no sistema!`);
  }
}
