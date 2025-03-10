export interface DescriptionAuditingModel {
    action: string;
    entity: string;
    previousValue: Object;
    newValue: Object;
}

export interface AuditingModel {
    idUser: number;
    changeType: string;
    operation: string;
    description: Object;
}

export interface AuditingProductModel {
    description: string;
    price: number;
    idProduct: number;
    title: string;
    urlImage: string;
}

export interface AuditingUserModel {
    idUser: number;
    name: string;
    surname: string;
    cpf: string;
    email: string;
    role: string;
    isActive: boolean;
}

export interface AuditingUpdateOrderStatusModel {
    idOrder: number;
    idUser: number;
    previousValue: string;
    newValue: string;
}