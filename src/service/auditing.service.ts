import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { ActionAuditingModel, AuditingModel, DescriptionAuditingModel } from "src/shared/types/auditing";

@Injectable()
export class AuditingService {
    constructor(private readonly prismaService: PrismaService) { }

    async saveAudit(params: ActionAuditingModel) {
        const changeType = params.changeType ?? params.action;
        
        const description: DescriptionAuditingModel = {
            action: params.action,
            entity: `${params.entityType.toUpperCase()} ID: ${params.entityId}`,
            previousValue: params.previousValue ?? "",
            newValue: params.newValue ?? "",
        };

        const auditingModel: AuditingModel = {
            idUser: params.idUser,
            changeType,
            operation: description.action,
            description: description,
        };

        await this.saveAuditing(auditingModel.idUser, auditingModel.changeType, auditingModel.operation, JSON.stringify(auditingModel.description));
    }

    async saveAuditing(idUser: number, changeType: string, operation: string, description: string) {
        await this.prismaService.auditing.create({
            data: {
                idUser: idUser,
                changeType: changeType,
                operation: operation,
                description: description
            }
        })
    }
}
