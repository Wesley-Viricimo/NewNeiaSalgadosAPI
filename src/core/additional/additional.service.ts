import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAdditionalDto } from './dto/create-additional.dto';
import { UpdateAdditionalDto } from './dto/update-additional.dto';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class AdditionalService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler
  ) { }

  async create(createAdditionalDto: CreateAdditionalDto) {

    await this.validateFieldsCreateAdditional(createAdditionalDto);

    return await this.prismaService.additional.create({
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
    await this.validateFieldsUpdateAdditional(id, updateAdditionalDto);

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

  async validateFieldsUpdateAdditional(id: number, updateAdditionalDto: UpdateAdditionalDto) {
    if (isNaN(Number(updateAdditionalDto.price))) this.exceptionHandler.errorBadRequestResponse(`O preço do adicional deve ser um valor numérico!`);

    const existsAdditional = await this.prismaService.additional.findFirst({
      where: { description: updateAdditionalDto.description }
    });

    if (existsAdditional.idAdditional !== id) this.exceptionHandler.errorBadRequestResponse('Adicional já cadastrado no sistema!');
  }

  async findAllAdditional() {

  }

  remove(id: number) {
    return `This action removes a #${id} additional`;
  }
}
