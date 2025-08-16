export interface NotificationDto {
    title: string,
    description: string,
    notificationType: 'success' | 'info' | 'warn' | 'error'
}