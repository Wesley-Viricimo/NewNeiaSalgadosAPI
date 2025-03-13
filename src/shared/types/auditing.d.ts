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

export interface ActionAuditingModel {
    idUser: number;
    action: string;
    entityType: string;
    entityId: number;
    previousValue: string | object;
    newValue: string | object;
    changeType: string;
  }