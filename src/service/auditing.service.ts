import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { AuditingModel } from "src/shared/types/auditing";

@Injectable()
export class AuditingService {
    constructor(
        private readonly prismaService: PrismaService
    ) {}

    async saveAudith(auditingModel: AuditingModel) {
        if(!auditingModel.operation)
            auditingModel.operation = "OPERAÇÃO NÃO IDENTIFICADA";

        if(!auditingModel.description)
            auditingModel.description = "ALTERAÇÃO REALIZADA NÃO ESPECIFICADA";

        await this.prismaService.auditing.create({
            data: {
                idUser: auditingModel.user.idUser,
                operation: auditingModel.operation,
                description: auditingModel.description
            }
        })

    }
}