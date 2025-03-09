import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Additional } from '@prisma/client';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';

@Injectable()
export class AdditionalService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler
  ) { }

  async create(createAdditionalDto: CreateAdditionalDto) {

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
      .then(result => {
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

  async update(id: number, updateAdditionalDto: UpdateAdditionalDto) {

    const additional = await this.prismaService.additional.findUnique({
      where: { idAdditional: id }
    });

    if(!additional) this.exceptionHandler.errorBadRequestResponse('Adicional não cadastrado no sistema!');

    await this.validateFieldsUpdateAdditional(additional, updateAdditionalDto);

    return this.prismaService.additional.update({
      where: { idAdditional: id },
      data: {
        description: updateAdditionalDto.description,
        price: updateAdditionalDto.price
      }
    })
      .then(result => {
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

    if(existsAdditional && (additional.idAdditional !== existsAdditional.idAdditional)) this.exceptionHandler.errorBadRequestResponse(`Este adicional já foi cadastrada no sistema!`);
  }

  async findAllAdditional() {
    try {
      const additionals = await this.prismaService.additional.findMany();

      const data = additionals.map(additional => ({
        idAdditional: additional.idAdditional,
        description: additional.description,
        price: additional.price
      }));

      const message = { severity: 'success', summary: 'Sucesso', detail: 'Adicionais listados com sucesso.' };
      return {
        data,
        message,
        statusCode: HttpStatus.OK
      };
    } catch (error) {
      this.exceptionHandler.errorBadRequestResponse('Erro ao listar categorias!');
    }
  }

  async remove(id: number) {
    const additional = await this.prismaService.additional.findUnique({
      where: { idAdditional: id }
    });

    if(!additional) this.exceptionHandler.errorNotFoundResponse(`Esta categoria não está cadastrada no sistema!`);

    const ordersAdditional = await this.prismaService.orderAdditional.findMany({
      where: { idAdditional: id }
    });

    if(ordersAdditional.length > 0) {
      for(const add of ordersAdditional) {
        await this.prismaService.orderAdditional.delete({
          where: { idProductAdditional: add.idProductAdditional }
        })
      }
    }

    return await this.prismaService.additional.delete({
      where: { idAdditional: id }
    })
    .catch(() => {
      this.exceptionHandler.errorBadRequestResponse('Erro ao excluir adicional!');
    })
  }
}
