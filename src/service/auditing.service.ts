import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { AuditingModel, AuditingProductModel, AuditingUpdateOrderStatusModel, DescriptionAuditingModel } from "src/shared/types/auditing";


@Injectable()
export class AuditingService {
    constructor(
        private readonly prismaService: PrismaService
    ) {}

    async saveAudithCreateProduct(product: AuditingProductModel, idUser: number) {
        const description: DescriptionAuditingModel = {
            action: "CADASTRO DE PRODUTO",
            entity: `PRODUTO ID: ${product.idProduct}`,
            previousValue: "",
            newValue: JSON.stringify(product)
        };

        const auditingModel: AuditingModel = {
            idUser: idUser,
            changeType: "CREATE",
            operation: description.action,
            description: JSON.stringify(description)
        }
        
        await this.prismaService.auditing.create({
            data: {
                idUser: idUser,
                changeType: auditingModel.changeType,
                operation: auditingModel.operation,
                description: auditingModel.description
            }
        })
    }

    async saveAudithUpdateOrderStatus(auditingUpdateOrderStatusModel: AuditingUpdateOrderStatusModel) {
        const description: DescriptionAuditingModel = {
            action: "ATUALIZAÇÃO DO STATUS DO PEDIDO",
            entity: `PEDIDO ID: ${auditingUpdateOrderStatusModel.idOrder}`,
            previousValue: auditingUpdateOrderStatusModel.previousValue,
            newValue: auditingUpdateOrderStatusModel.newValue
        };

        const auditingModel: AuditingModel = {
            idUser: auditingUpdateOrderStatusModel.idUser,
            changeType: "UPDATE",
            operation: description.action,
            description: JSON.stringify(description)
        }

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