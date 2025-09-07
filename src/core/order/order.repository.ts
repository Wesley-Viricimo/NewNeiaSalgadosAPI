import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { additionalsSelectFields, addressSelectConfig, orderItensSelectConfig, orderSelectByIdFields, orderSelectFields, userSelectConfig } from "./config/order-select-config";
import { Prisma } from "@prisma/client";
import { paginator, PaginatorTypes } from "@nodeteam/nestjs-prisma-pagination";
import { OrderDto, OrderFindAllQuery } from "./dto/order-dto";
import { Order } from "./entities/order.entity";
import { ORDER_STATUS, PAYMENT_METHOD, TYPE_OF_DELIVERY } from "./constants/order.constants";

@Injectable()
export class OrderRepository {

    constructor(
        private readonly prismaService: PrismaService
    ) { }

    async createOrder(orderData: any) {
        return await this.prismaService.order.create({
            data: orderData,
            include: {
                user: userSelectConfig,
                address: addressSelectConfig,
                orderItens: orderItensSelectConfig,
                orderAdditional: additionalsSelectFields
            }
        })
    }

    async updateOrder(id: number, orderDto: OrderDto, additionalTotalValue: number, totalValue: number, orderAdditionalData: any, orderItemsData: any) {
        return await this.prismaService.order.update({
            where: { idOrder: id },
            data: {
                typeOfDelivery: TYPE_OF_DELIVERY[orderDto.typeOfDelivery],
                paymentMethod: PAYMENT_METHOD[orderDto.paymentMethod],
                totalAdditional: additionalTotalValue,
                total: totalValue,
                orderAdditional: {
                    create: orderAdditionalData
                },
                orderItens: {
                    create: orderItemsData
                }
            },
            include: {
                user: userSelectConfig,
                address: addressSelectConfig,
                orderItens: orderItensSelectConfig,
                orderAdditional: additionalsSelectFields
            }
        })
    }

    async updateOrderStatus(orderId: number, orderStatus: string, isPending: boolean,) {
        return await this.prismaService.order.update({
            where: { idOrder: orderId },
            data: {
                orderStatus: orderStatus,
                deliveryDate: !isPending ? new Date() : null,
                orderStatusUpdatedAt: new Date()
            },
            include: {
                user: userSelectConfig,
                address: addressSelectConfig,
                orderItens: orderItensSelectConfig,
                orderAdditional: additionalsSelectFields
            }
        })
    }

    async findAllOrdersPaginated(orderQuery: OrderFindAllQuery, where: Prisma.OrderWhereInput) {
        const paginate: PaginatorTypes.PaginateFunction = paginator({ page: orderQuery.page, perPage: orderQuery.perPage });

        return await paginate<Order, Prisma.OrderFindManyArgs>(
            this.prismaService.order,
            {
                where,
                orderBy: { createdAt: 'asc' },
                select: orderSelectFields
            },
            { page: orderQuery.page, perPage: orderQuery.perPage }
        )
    }

    async findAllOrdersByUserPaginated(orderQuery: OrderFindAllQuery, userId: number) {
        const paginate: PaginatorTypes.PaginateFunction = paginator({ page: orderQuery.page, perPage: orderQuery.perPage });

        return await paginate<Order, Prisma.OrderFindManyArgs>(
            this.prismaService.order,
            {
                where: { idUser: userId },
                select: orderSelectFields,
            },
            { page: orderQuery.page, perPage: orderQuery.perPage }
        )
    }

    async getPendingOrders() {
        const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

        return await this.prismaService.order.findMany({
            where: {
                orderStatus: {
                    notIn: [ORDER_STATUS.ENTREGUE, ORDER_STATUS.CANCELADO],
                },
                updatedAt: {
                    lt: twentyMinutesAgo,
                },
            },
        })
    }

    async findOrderById(orderId: number) {
        return await this.prismaService.order.findUnique({
            where: { idOrder: orderId },
            select: orderSelectByIdFields

        });
    }

    async findOrderPendingByUserId(userId: number) {
        return await this.prismaService.order.findFirst({
            where: { idUser: userId, deliveryDate: null }
        });
    }

    async getUserNotificationToken(idUser: number) {
        return await this.prismaService.userNotificationToken.findUnique({
            where: { idUser }
        });
    }

    async getOrdersPendingCount(dateFrom: Date) {
        return await this.prismaService.order.findMany({
            where: {
                createdAt: { gte: dateFrom },
                NOT: { orderStatus: { in: [ORDER_STATUS.ENTREGUE, ORDER_STATUS.CANCELADO] } }
            },
            select: { idOrder: true, total: true, paymentMethod: true }
        });
    }

    async getOrdersCountByStatus(dateFrom: Date, status: ORDER_STATUS) {
        return await this.prismaService.order.findMany({
            where: {
                createdAt: { gte: dateFrom },
                orderStatus: ORDER_STATUS[status]
            },
            select: { idOrder: true, total: true, paymentMethod: true }
        });
    }

    async getOrdersTotalsByStatus(dateFrom: Date) {
        return await Promise.all([
            this.prismaService.order.aggregate({
                where: {
                    createdAt: { gte: dateFrom },
                    NOT: { orderStatus: { in: [ORDER_STATUS.ENTREGUE, ORDER_STATUS.CANCELADO] } }
                },
                _sum: { total: true }
            }),

            this.prismaService.order.aggregate({
                where: {
                    createdAt: { gte: dateFrom },
                    orderStatus: ORDER_STATUS.ENTREGUE
                },
                _sum: { total: true }
            }),

            this.prismaService.order.aggregate({
                where: {
                    createdAt: { gte: dateFrom },
                    orderStatus: ORDER_STATUS.CANCELADO
                },
                _sum: { total: true }
            })
        ]);
    }

    async getOrdersItens(ordersFinishAndPending: { idOrder: number; paymentMethod: string; total: number; }[]) {
        return await this.prismaService.orderItem.findMany({
            where: { idOrder: { in: ordersFinishAndPending.map(order => order.idOrder) } }
        });
    }

}