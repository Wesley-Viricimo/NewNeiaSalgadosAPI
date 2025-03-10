import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { AuditingModel, AuditingProductModel, AuditingUpdateOrderStatusModel, AuditingUserModel, DescriptionAuditingModel } from "src/shared/types/auditing";


@Injectable()
export class AuditingService {
    constructor(
        private readonly prismaService: PrismaService
    ) {}

    async saveAudithCreateProduct(product: AuditingProductModel, idUserAdmin: number) {
        const description: DescriptionAuditingModel = {
            action: "CADASTRO DE PRODUTO",
            entity: `PRODUTO ID: ${product.idProduct}`,
            previousValue: "",
            newValue: product
        };

        const auditingModel: AuditingModel = {
            idUser: idUserAdmin,
            changeType: "CREATE",
            operation: description.action,
            description: description
        }
        
        await this.saveAuditing(auditingModel.idUser, auditingModel.changeType, auditingModel.operation, JSON.stringify(auditingModel.description));
    }

    async saveAudithUpdateProduct(previousProduct: AuditingProductModel, newValueProduct: AuditingProductModel, idUserAdmin: number) {
        const description: DescriptionAuditingModel = {
            action: "ATUALIZAÇÃO DE PRODUTO",
            entity: `PRODUTO ID: ${newValueProduct.idProduct}`,
            previousValue: previousProduct,
            newValue: newValueProduct
        };

        const auditingModel: AuditingModel = {
            idUser: idUserAdmin,
            changeType: "UPDATE",
            operation: description.action,
            description: description
        };

        await this.saveAuditing(auditingModel.idUser, auditingModel.changeType, auditingModel.operation, JSON.stringify(auditingModel.description));
    }

    async saveAudithDeleteProduct(product: AuditingProductModel, idUserAdmin: number) {
        const description: DescriptionAuditingModel = {
            action: "EXCLUSÃO DE PRODUTO",
            entity: `PRODUTO ID: ${product.idProduct}`,
            previousValue: product,
            newValue: ""
        };

        const auditingModel: AuditingModel = {
            idUser: idUserAdmin,
            changeType: "DELETE",
            operation: description.action,
            description: description
        };

        await this.saveAuditing(auditingModel.idUser, auditingModel.changeType, auditingModel.operation, JSON.stringify(auditingModel.description));
    }

    async saveAudithUpdateUserActivity(previousUser: AuditingUserModel, newUser: AuditingUserModel, idUserAdmin: number) {
        const description: DescriptionAuditingModel = {
            action: "ALTERAÇÃO DE STATUS DE USUÁRIO",
            entity: `USUÁRIO ID: ${previousUser.idUser}`,
            previousValue: previousUser,
            newValue: newUser
        };

        const auditingModel: AuditingModel = {
            idUser: idUserAdmin,
            changeType: "UPDATE",
            operation: description.action,
            description: description
        };

        await this.saveAuditing(auditingModel.idUser, auditingModel.changeType, auditingModel.operation, JSON.stringify(auditingModel.description));
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
            description: description
        }

        await this.saveAuditing(auditingModel.idUser, auditingModel.changeType, auditingModel.operation, JSON.stringify(auditingModel.description))
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