export interface AuditingModel {
    idUser: number,
    entity: string,
    changeType: string,
    operation: string,
    description: string
}

export interface DescriptionAuditingModel {
    idEntity: number,
    action: string,
    previousValue: string,
    newValue: string
}