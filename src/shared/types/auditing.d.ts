export interface DescriptionAuditingModel {
    action: string,
    entity: string,
    previousValue: string,
    newValue: string
}

export interface AuditingModel {
    idUser: number,
    changeType: string,
    operation: string,
    description: string
}

export interface AuditingProductModel {
    description: string;
    price: number;
    idProduct: number;
    title: string;
    urlImage: string;
}

export interface AuditingUpdateOrderStatusModel {
    idOrder: number;
    idUser: number;
    previousValue: string;
    newValue: string;
}