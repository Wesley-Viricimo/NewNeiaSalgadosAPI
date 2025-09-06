import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Additional } from '@prisma/client';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { AdditionalDto, AdditionalQuery } from './dto/additional.dto';
import { AdditionalRepository } from './additional.repository';

@Injectable()
export class AdditionalService {
  private readonly logger = new Logger(AdditionalService.name);

  constructor(
    private readonly exceptionHandler: ExceptionHandler,
    private readonly auditingService: AuditingService,
    private readonly additionalRepository: AdditionalRepository
  ) { }

  async create(additionalDto: AdditionalDto, idUser: number) {
    await this.validateFieldsCreateAdditional(additionalDto);

    return this.additionalRepository.createAdditional(additionalDto)
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
      .catch((err) => {
        this.logger.error(`Erro ao cadastrar adicional: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar adicional!');
      });
  }

  async validateFieldsCreateAdditional(additionalDto: AdditionalDto) {
    const existsAdditional = await this.additionalRepository.getAdditionalByDescription(additionalDto.description);
    if (existsAdditional) this.exceptionHandler.errorBadRequestResponse('Adicional já cadastrado no sistema!');
  }

  async update(id: number, updateAdditionalDto: AdditionalDto, idUser: number) {
    const additional = await this.getAdditionalById(id);

    await this.validateFieldsUpdateAdditional(additional, updateAdditionalDto);

    return await this.additionalRepository.updateAdditional(id, updateAdditionalDto)
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
      .catch((err) => {
        this.logger.error(`Erro ao atualizar adicional: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar adicional!');
      });
  }

  async validateFieldsUpdateAdditional(additional: Additional, updateAdditionalDto: AdditionalDto) {
    const existsAdditional = await this.additionalRepository.getAdditionalByDescription(updateAdditionalDto.description);
    if (existsAdditional && (additional.idAdditional !== existsAdditional.idAdditional)) this.exceptionHandler.errorBadRequestResponse(`Este adicional já foi cadastrada no sistema!`);
  }

  async findAllAdditional(additionalQuery: AdditionalQuery): Promise<PaginatedOutputDto<Object>> {
    if (additionalQuery.page === 0 && additionalQuery.perPage === 0) {
      const additional = await this.additionalRepository.findAllAdditionalNotPaginated(additionalQuery.description);

      return {
        data: additional,
        meta: null
      };
    }

    return await this.additionalRepository.findallAdditionalPaginated(additionalQuery);
  }

  async remove(id: number, idUser: number) {
    const additional = await this.getAdditionalById(id);

    return this.additionalRepository.deleteAdditional(id)
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
      .catch((err) => {
        this.logger.error(`Erro ao excluir adicional: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao excluir adicional!');
      })
  }

  async getAdditionalById(additionalId: number) {
    try {
      const additional = await this.additionalRepository.getAdditionalById(additionalId);
      if (!additional) throw new Error(`O adicional id ${additionalId} não está cadastrado no sistema!`);

      return additional;
    } catch (err) {
      this.logger.error(`Erro ao buscar adicional por id: ${err}`);
      if (err instanceof Error) this.exceptionHandler.errorBadRequestResponse(err.message);
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar adicional por id. Erro: ${err}`);
    }
  }
}
