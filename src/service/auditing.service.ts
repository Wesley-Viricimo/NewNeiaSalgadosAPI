import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { AuditingModel } from "src/shared/types/auditing";

@Injectable()
export class AuditingService {
    constructor(
        private readonly prismaService: PrismaService
    ) {}

    async saveAudith(auditingModel: AuditingModel) {
        if(!auditingModel.changeType) auditingModel.changeType = "TIPO DE ALTERAÇÃO NÃO IDENTIFICADA";
        if(!auditingModel.operation) auditingModel.operation = "OPERAÇÃO NÃO IDENTIFICADA";
        if(!auditingModel.description) auditingModel.description = "DESCRIÇÃO DAS ALTERAÇÕES REALIZADAS NÃO ESPECIFICADA";

        await this.prismaService.auditing.create({
            data: {
                idUser: auditingModel.idUser,
                changeType: auditingModel.changeType,
                operation: auditingModel.operation,
                description: auditingModel.description
            }
        })

    }
}