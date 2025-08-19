import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PAYMENT_METHOD, TYPE_OF_DELIVERY, ORDER_STATUS_DELIVERY, ORDER_STATUS_WITHDRAWAL, ORDER_PLACED } from './constants/order.constants';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Order, Prisma } from '@prisma/client';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { userSelectConfig, addressSelectConfig, orderItensSelectConfig, orderSelectFields, orderSelectByIdFields, additionalsSelectFields } from 'src/core/order/config/order-select-config';
import { subMinutes, isAfter, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import getMessageStatus from './constants/order.messages';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { AdditionalItemDto, OrderDto, OrderFindAllQuery, OrderUpdateStatusParams } from './dto/order-dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationDto } from '../notification/dto/notification.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly notificationService: NotificationService,
    private readonly auditingService: AuditingService
  ) { }

  async create(orderDto: OrderDto, userId: number) {

    await this.validateOrderFields(orderDto, userId);

    let totalValue = await this.calculateTotalOrderValue(orderDto.orderItens);

    const additionalTotalValue = await this.calculateTotalAdditionalValue(orderDto.additionalItens);

    totalValue += additionalTotalValue;

    const orderAdditionalData = await Promise.all(orderDto.additionalItens.map(async (item) => {
      const additional = await this.prismaService.additional.findUnique({
        where: { idAdditional: item.idAdditional }
      });

      return {
        idAdditional: additional.idAdditional,
        description: additional.description,
        price: additional.price
      };
    }));

    const orderItemsData = await Promise.all(orderDto.orderItens.map(async (item) => {

      const product = await this.prismaService.product.findUnique({
        where: { idProduct: item.product.idProduct }
      });

      return {
        quantity: item.quantity,
        description: product.title,
        comment: item.comment,
        price: product.price
      };
    }));

    const user = await this.prismaService.user.findUnique({
      where: { idUser: userId }
    });

    const orderData = {
      userSurname: user.surname,
      typeOfDelivery: TYPE_OF_DELIVERY[orderDto.typeOfDelivery],
      orderStatus: orderDto.typeOfDelivery === 0 ? ORDER_STATUS_DELIVERY[0] : ORDER_STATUS_WITHDRAWAL[0],
      paymentMethod: PAYMENT_METHOD[orderDto.paymentMethod],
      totalAdditional: additionalTotalValue,
      total: totalValue,
      orderAdditional: {
        create: orderAdditionalData
      },
      orderItens: {
        create: orderItemsData
      },
      user: {
        connect: {
          idUser: userId
        }
      }
    };

    if (TYPE_OF_DELIVERY[orderDto.typeOfDelivery] === "ENTREGA") {
      orderData['address'] = {
        connect: {
          idAddress: orderDto.idAddress
        }
      };
    }

    return await this.prismaService.order.create({
      data: orderData,
      include: {
        user: userSelectConfig,
        address: addressSelectConfig,
        orderItens: orderItensSelectConfig,
        orderAdditional: additionalsSelectFields
      }
    }).then(async (order) => {

      const userNotificationToken = await this.prismaService.userNotificationToken.findUnique({
        where: { idUser: order.idUser }
      });

      if (userNotificationToken) await this.notificationService.sendNotificationToUser(userNotificationToken.token, ORDER_PLACED.title, ORDER_PLACED.body);

      const user = await this.prismaService.user.findUnique({
        where: { idUser: userId }
      })

      const notification: NotificationDto = {
        title: `${user.surname} realizou um novo pedido`,
        description: `O cliente ${user.surname} realizou um novo pedido!`,
        notificationType: 'success'
      };

      await this.notificationService.sendNotificationToAdmin(notification);

      const message = { severity: 'success', summary: 'Sucesso', detail: 'Pedido realizado com sucesso!' };
      return {
        data: {
          user: order.user,
          address: order.address,
          orderItens: order.orderItens,
          orderAdditional: order.orderAdditional,
          orderStatus: order.orderStatus,
          paymentMethod: order.paymentMethod,
          typeOfDelivery: order.typeOfDelivery,
          totalAdditional: order.totalAdditional,
          total: order.total
        },
        message,
        statusCode: HttpStatus.CREATED
      };
    }).catch((error) => {
      console.log('err', error)
      this.exceptionHandler.errorBadRequestResponse('Erro ao realizar pedido!');
    });
  }

  private async validateOrderFields(orderDto: OrderDto, userId: number, isUpdate = false, orderId?: number) {
    if (!TYPE_OF_DELIVERY[orderDto.typeOfDelivery]) this.exceptionHandler.errorBadRequestResponse(`Tipo de entrega: ${orderDto.typeOfDelivery} inválido!`);

    const isEntrega = TYPE_OF_DELIVERY[orderDto.typeOfDelivery] === "ENTREGA";

    if (isEntrega && !orderDto.idAddress) this.exceptionHandler.errorBadRequestResponse(`Endereço de entrega deve ser fornecido!`);

    if (!PAYMENT_METHOD[orderDto.paymentMethod]) this.exceptionHandler.errorBadRequestResponse(`Forma de pagamento: ${orderDto.paymentMethod} inválida!`);

    if (orderDto.orderItens.length === 0) this.exceptionHandler.errorBadRequestResponse(`Pedido não pode ser realizado sem itens!`);

    const user = await this.prismaService.user.findUnique({
      where: { idUser: userId }
    });

    if (!user) this.exceptionHandler.errorNotFoundResponse(`Este usuário não está cadastrado no sistema!`);

    if (isEntrega) {
      const address = await this.prismaService.address.findUnique({
        where: { idAddress: orderDto.idAddress }
      });

      if (!address) this.exceptionHandler.errorNotFoundResponse(`Este endereço não está cadastrado no sistema!`);

      if (address.idUser !== user.idUser) this.exceptionHandler.errorBadRequestResponse(`O endereço fornecido não pertence a este usuário!`);
    }

    if (isUpdate) {
      const order = await this.prismaService.order.findUnique({
        where: { idOrder: orderId }
      });

      if (order?.idUser !== userId) this.exceptionHandler.errorForbiddenResponse(`Este pedido não pertence a este usuário!`);

      if (order.orderStatus == 'ENTREGUE' || order.orderStatus == 'CANCELADO') this.exceptionHandler.errorBadRequestResponse(`Pedidos entregues ou cancelados não podem ser atualizados!`);

      if (order.orderStatus == 'PREPARANDO') {
        const tenMinutesAgo = subMinutes(new Date(), 10);

        if (isAfter(tenMinutesAgo, order.orderStatusUpdatedAt)) this.exceptionHandler.errorBadRequestResponse(`Pedidos pendentes só podem ser atualizados até 10 minutos após a última atualização!`);
      }
    } else {
      const orderPending = await this.prismaService.order.findFirst({
        where: { idUser: userId, deliveryDate: null }
      });

      if (orderPending) this.exceptionHandler.errorBadRequestResponse(`Já existe um pedido em andamento para este usuário e não é possível realizar outro no momento!`);
    }
  }

  private async calculateTotalOrderValue(orderItens: Array<{ product: { idProduct: number }, quantity: number }>) {
    let totalValue = 0;

    for (const item of orderItens) {
      const product = await this.prismaService.product.findUnique({
        where: { idProduct: item.product.idProduct }
      });

      if (!product) this.exceptionHandler.errorBadRequestResponse(`Produto id: ${item.product.idProduct} não está cadastrado no sistema!`);

      totalValue += product.price * item.quantity;
    }

    return totalValue;
  }

  private async calculateTotalAdditionalValue(additionalItens: AdditionalItemDto[]) {
    let totalValue = 0;

    if (additionalItens != undefined) {
      for (const item of additionalItens) {
        const additional = await this.prismaService.additional.findUnique({
          where: { idAdditional: item.idAdditional }
        });

        if (!additional) this.exceptionHandler.errorBadRequestResponse(`O adicional id:${item.idAdditional} não está cadastrado no sistema!`);

        totalValue += additional.price;
      }
    }
    return totalValue;
  }

  async findAllOrders(orderQuery: OrderFindAllQuery): Promise<PaginatedOutputDto<Object>> {
    const selectedFields = orderSelectFields;

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page: orderQuery.page, perPage: orderQuery.perPage });

    const where: Prisma.OrderWhereInput = {};

    if (orderQuery.user) where.user = { name: { contains: orderQuery.user, mode: 'insensitive' } };
    if (orderQuery.status === 'complete') where.deliveryDate = { not: null };
    if (orderQuery.status === 'pending') where.deliveryDate = null;

    return await paginate<Order, Prisma.OrderFindManyArgs>(
      this.prismaService.order,
      {
        where,
        orderBy: { createdAt: 'asc' },
        select: selectedFields
      },
      { page: orderQuery.page, perPage: orderQuery.perPage }
    )
      .then(response => {
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Pedidos listados com sucesso.' };
        return {
          data: response.data,
          meta: response.meta,
          message,
          statusCode: HttpStatus.OK
        }
      });
  }

  async findAllOrdersByUser(orderQuery: OrderFindAllQuery, userId: number): Promise<PaginatedOutputDto<Object>> {

    const selectedFields = orderSelectFields;

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page: orderQuery.page, perPage: orderQuery.perPage });

    return await paginate<Order, Prisma.OrderFindManyArgs>(
      this.prismaService.order,
      {
        where: { idUser: userId },
        select: selectedFields,
      },
      { page: orderQuery.page, perPage: orderQuery.perPage }
    )
      .then(response => {
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Pedidos listados com sucesso.' };
        return {
          data: response.data,
          meta: response.meta,
          message,
          statusCode: HttpStatus.OK
        }
      });
  }

  async findById(id: number, userId: number) {

    const selectedFields = orderSelectByIdFields;

    const order = await this.prismaService.order.findUnique({
      where: { idOrder: id },
      select: selectedFields
    });

    if (!order) this.exceptionHandler.errorNotFoundResponse(`Este pedido não está cadastrado no sistema!`);

    if (order.idUser !== userId) this.exceptionHandler.errorForbiddenResponse(`Este pedido não pertence a este usuário!`);

    const message = { severity: 'success', summary: 'Sucesso', detail: 'Endereço listado com sucesso!' };

    return {
      data: {
        idOrder: order.idOrder,
        user: order.user,
        address: order.address,
        orderItens: order.orderItens,
        typeOfDelivery: order.typeOfDelivery,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        totalAdditional: order.totalAdditional,
        total: order.total
      },
      message,
      statusCode: HttpStatus.OK
    }
  }

  async update(id: number, orderDto: OrderDto, userId: number) {

    await this.validateOrderFields(orderDto, userId, true, id);

    let totalValue = await this.calculateTotalOrderValue(orderDto.orderItens);

    const additionalTotalValue = await this.calculateTotalAdditionalValue(orderDto.additionalItens);

    totalValue += additionalTotalValue;

    const orderAdditionalData = await Promise.all(orderDto.additionalItens.map(async (item) => {
      const additional = await this.prismaService.additional.findUnique({
        where: { idAdditional: item.idAdditional }
      });

      return {
        idAdditional: additional.idAdditional,
        description: additional.description,
        price: additional.price
      };
    }));

    const orderItemsData = await Promise.all(orderDto.orderItens.map(async (item) => {

      const product = await this.prismaService.product.findUnique({
        where: { idProduct: item.product.idProduct }
      });

      return {
        quantity: item.quantity,
        description: product.title,
        comment: item.comment,
        price: product.price
      };
    }));

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
      .then(order => {
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Pedido atualizado com sucesso!' };
        return {
          data: {
            orderId: order.idOrder,
            user: order.user,
            address: order.address,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            typeOfDelivery: order.typeOfDelivery,
            orderItens: order.orderItens,
            orderAdditional: order.orderAdditional,
            totalAdditional: additionalTotalValue,
            total: order.total
          },
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar pedido!');
      });
  }

  async validateUpdateOrderStatus(orderUpdateStatus: OrderUpdateStatusParams, userId: number) {

    const order = await this.prismaService.order.findUnique({
      where: { idOrder: orderUpdateStatus.orderId }
    });

    if (!order) this.exceptionHandler.errorNotFoundResponse(`Este pedido não foi encontrado!`);
    if (order.orderStatus == 'ENTREGUE') this.exceptionHandler.errorBadRequestResponse(`Pedidos entregues não podem ser alterados!`);
    if (order.orderStatus == 'CANCELADO') this.exceptionHandler.errorBadRequestResponse(`Pedidos cancelados não podem ser alterados!`);

    let isPending: boolean;

    switch (order.typeOfDelivery) {
      case 'ENTREGA': {
        if (!ORDER_STATUS_DELIVERY[orderUpdateStatus.orderStatus]) this.exceptionHandler.errorBadRequestResponse(`Status do pedido ${orderUpdateStatus.orderStatus} é inválido!`);
        if (ORDER_STATUS_DELIVERY[orderUpdateStatus.orderStatus] == 'ENTREGUE' || ORDER_STATUS_DELIVERY[orderUpdateStatus.orderStatus] == 'CANCELADO') {
          isPending = false;
        } else {
          isPending = true;
        }

        return this.updateOrderStatus(order.idOrder, ORDER_STATUS_DELIVERY[orderUpdateStatus.orderStatus], isPending, order.typeOfDelivery, userId, order.orderStatus);
      }

      case 'RETIRA': {
        if (!ORDER_STATUS_WITHDRAWAL[orderUpdateStatus.orderStatus]) this.exceptionHandler.errorBadRequestResponse(`Status do pedido ${orderUpdateStatus.orderStatus} é inválido!`);
        if (ORDER_STATUS_WITHDRAWAL[orderUpdateStatus.orderStatus] == 'ENTREGUE' || ORDER_STATUS_WITHDRAWAL[orderUpdateStatus.orderStatus] == 'CANCELADO') {
          isPending = false;
        } else {
          isPending = true;
        }

        return this.updateOrderStatus(order.idOrder, ORDER_STATUS_WITHDRAWAL[orderUpdateStatus.orderStatus], isPending, order.typeOfDelivery, userId, order.orderStatus);
      }

      default: break;
    }
  }

  async updateOrderStatus(orderId: number, orderStatus: string, isPending: boolean, typeOfDelivery: string, userId: number, previousOrderStatus: string) {
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
      .then(async (order) => {

        const notificationType = orderStatus == 'ENTREGUE' ? 'success' : orderStatus == 'CANCELADO' ? 'error' : 'info';

        const notification = {
          title: `Status do pedido atualizado`,
          description: `Status do pedido #${order.idOrder} do cliente ${order.user.surname} foi atualizado para '${orderStatus}'`,
          notificationType
        } as NotificationDto;

        await this.notificationService.sendNotificationToAdmin(notification);

        await this.auditingService.saveAudit({
          idUser: userId,
          action: "ATUALIZAÇÃO DE STATUS DE PEDIDO",
          entityType: "PEDIDO",
          changeType: "UPDATE",
          entityId: order.idOrder,
          previousValue: previousOrderStatus,
          newValue: order.orderStatus
        } as ActionAuditingModel);

        const userNotificationToken = await this.prismaService.userNotificationToken.findUnique({
          where: { idUser: order.idUser }
        });

        const messageStatus = getMessageStatus(orderStatus, typeOfDelivery);
        if (userNotificationToken) {
          await this.notificationService.sendNotificationToUser(userNotificationToken.token, messageStatus.title, messageStatus.body);
        }

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Status do pedido atualizado com sucesso!' };
        return {
          data: {
            orderId: order.idOrder,
            user: order.user,
            address: order.address,
            orderItens: order.orderItens,
            orderAdditional: order.orderAdditional,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            typeOfDelivery: order.typeOfDelivery,
            totalAdditional: order.totalAdditional,
            total: order.total,
            deliveryDate: order.deliveryDate ? format(new Date(order.deliveryDate), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ''
          },
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar status do pedido!');
      });
  }

  async getPendingOrders() {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    return await this.prismaService.order.findMany({
      where: {
        orderStatus: {
          notIn: ['ENTREGUE', 'CANCELADO'],
        },
        updatedAt: {
          lt: twentyMinutesAgo,
        },
      },
    })
  }
}
