import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Additional, Prisma } from '@prisma/client';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';

@Injectable()
export class AdditionalService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly auditingService: AuditingService
  ) { }

  async create(createAdditionalDto: CreateAdditionalDto, idUser: number) {

    await this.validateFieldsCreateAdditional(createAdditionalDto);

    return await this.prismaService.additional.create({
      select: {
        idAdditional: true,
        description: true,
        price: true
      },
      data: {
        description: createAdditionalDto.description,
        price: createAdditionalDto.price
      }
    })
      .then(async (result) => {

        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "CADASTRO DE ADICIONAL",
          entityType: "ADICIONAL",
          changeType: "CREATE",
          entityId: result.idAdditional,
          previousValue: "",
          newValue: result
        } as ActionAuditingModel);

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Adicional cadastrado com sucesso!' };

        return {
          data: result,
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar adicional!');
      });
  }

  async validateFieldsCreateAdditional(additionalDto: CreateAdditionalDto) {
    if (isNaN(Number(additionalDto.price))) this.exceptionHandler.errorBadRequestResponse(`O preço do adicional deve ser um valor numérico!`);

    const existsAdditional = await this.prismaService.additional.findFirst({
      where: { description: additionalDto.description }
    });

    if (existsAdditional) this.exceptionHandler.errorBadRequestResponse('Adicional já cadastrado no sistema!');
  }

  async update(id: number, updateAdditionalDto: UpdateAdditionalDto, idUser: number) {

    const additional = await this.prismaService.additional.findUnique({
      where: { idAdditional: id }
    });

    if (!additional) this.exceptionHandler.errorBadRequestResponse('Adicional não cadastrado no sistema!');

    await this.validateFieldsUpdateAdditional(additional, updateAdditionalDto);

    return this.prismaService.additional.update({
      where: { idAdditional: id },
      data: {
        description: updateAdditionalDto.description,
        price: updateAdditionalDto.price
      }
    })
      .then(async (result) => {
        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "ATUALIZAÇÃO DE ADICIONAL",
          entityType: "ADICIONAL",
          changeType: "UPDATE",
          entityId: result.idAdditional,
          previousValue: additional,
          newValue: result
        } as ActionAuditingModel);

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Adicional atualizado com sucesso!' };

        return {
          data: result,
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar adicional!');
      });
  }

  async validateFieldsUpdateAdditional(additional: Additional, updateAdditionalDto: UpdateAdditionalDto) {
    if (isNaN(Number(updateAdditionalDto.price))) this.exceptionHandler.errorBadRequestResponse(`O preço do adicional deve ser um valor numérico!`);

    const existsAdditional = await this.prismaService.additional.findFirst({
      where: { description: updateAdditionalDto.description }
    })

    if (existsAdditional && (additional.idAdditional !== existsAdditional.idAdditional)) this.exceptionHandler.errorBadRequestResponse(`Este adicional já foi cadastrada no sistema!`);
  }

  async findAllAdditional(page: number, perPage: number, description: string): Promise<PaginatedOutputDto<Object>> {
    if (page === 0 && perPage === 0) {
      const additional = await this.prismaService.additional.findMany({
        where: {
          description: {
            contains: description,
            mode: 'insensitive'
          }
        },
        select: {
          idAdditional: true,
          description: true,
          price: true
        }
      });

      return {
        data: additional,
        meta: null
      };
    }

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    return await paginate<Additional, Prisma.AdditionalFindManyArgs>(
      this.prismaService.additional,
      {
        where: {
          description: {
            contains: description,
            mode: 'insensitive'
          }
        },
        select: {
          idAdditional: true,
          description: true,
          price: true
        }
      }
    ).then(response => {
      return {
        data: response.data,
        meta: response.meta
      }
    })
  }

  async remove(id: number, idUser: number) {
    const additional = await this.prismaService.additional.findUnique({
      where: { idAdditional: id }
    });

    if (!additional) this.exceptionHandler.errorNotFoundResponse(`Este adicional não está cadastrado no sistema!`);

    const ordersAdditional = await this.prismaService.orderAdditional.findMany({
      where: { idAdditional: id }
    });

    if (ordersAdditional.length > 0) {
      for (const add of ordersAdditional) {
        await this.prismaService.orderAdditional.delete({
          where: { idProductAdditional: add.idProductAdditional }
        })
      }
    }

    return await this.prismaService.additional.delete({
      where: { idAdditional: id }
    })
      .then(async (result) => {
        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "EXCLUSÃO DE ADICIONAL",
          entityType: "ADICIONAL",
          changeType: "DELETE",
          entityId: result.idAdditional,
          previousValue: additional,
          newValue: ""
        } as ActionAuditingModel);

      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao excluir adicional!');
      })
  }
}
