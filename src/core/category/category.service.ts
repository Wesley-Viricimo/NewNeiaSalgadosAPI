import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Category } from '@prisma/client';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly auditingService: AuditingService
  ) {}

  async create(createCategoryDto: CreateCategoryDto, idUser: number) {
    const categoryExists = await this.prismaService.category.findFirst({
      where: {
        description: {
          equals: createCategoryDto.description,  // Sem toUpperCase(), pois agora será insensível
          mode: 'insensitive'  // Torna a comparação insensível a maiúsculas e minúsculas
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
      await this.auditingService.saveAudithCreateCategory(result, idUser);
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

  async findAll() {
    try {
      const categories = await this.prismaService.category.findMany();
  
      const data = categories.map(category => ({
        idCategory: category.idCategory,
        description: category.description
      }));
  
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Categorias listadas com sucesso.' };
      return {
        data,
        message,
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      this.exceptionHandler.errorBadRequestResponse('Erro ao listar categorias!');
    }
  }  

  async findById(id: number) {

    const category = await this.prismaService.category.findUnique({
      where: { idCategory: id }
    });

    if(!category) this.exceptionHandler.errorNotFoundResponse('Esta categoria não está cadastrada no sistema!');

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

    if(!category) this.exceptionHandler.errorNotFoundResponse(`Esta categoria não está cadastrada no sistema!`);

    await this.validateExistsCategory(category, updateCategoryDto);

    return await this.prismaService.category.update({
      where: { idCategory: id },
      data: {
        idCategory: id,
        description: updateCategoryDto.description
      }
    })
    .then(async (result) => {
      await this.auditingService.saveAudithUpdateCategory(category, result, idUser);
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

    if(!category) this.exceptionHandler.errorNotFoundResponse(`Esta categoria não está cadastrada no sistema!`);

    const products = await this.prismaService.product.findMany({
      where: { idCategory: id }
    });

    if(products.length > 0) this.exceptionHandler.errorBadRequestResponse(`Existem produtos que pertecem a esta categoria, então não é possível excluí-la!`);

    return await this.prismaService.category.delete({
      where: { idCategory: id }
    })
    .then(async (result) => {
      await this.auditingService.saveAudithDeleteCategory(result, idUser);
    })
    .catch(() => {
      this.exceptionHandler.errorBadRequestResponse('Erro ao excluir categoria!');
    })
  }

  async validateExistsCategory(category: Category, updateCategoryDto: UpdateCategoryDto) {
    const existsCategory = await this.prismaService.category.findFirst({
      where: { description: updateCategoryDto.description }
    });

    if(existsCategory && (category.idCategory !== existsCategory.idCategory)) this.exceptionHandler.errorBadRequestResponse(`Esta categoria já foi cadastrada no sistema!`);
  }
}
