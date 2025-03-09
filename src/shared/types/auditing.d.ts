export interface AuditingModel {
    idUser: number,
    changeType: string,
    operation: string,
    description: string
}

export interface DescriptionAuditingModel {
    action: string,
    entity: string,
    previousValue: string,
    newValue: string
}