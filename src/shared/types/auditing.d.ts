import { User } from "@prisma/client";

export interface AuditingModel {
    user: User,
    operation: string,
    description: string
}