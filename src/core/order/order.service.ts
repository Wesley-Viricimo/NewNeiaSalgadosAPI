import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PAYMENT_METHOD, TYPE_OF_DELIVERY, ORDER_STATUS_DELIVERY, ORDER_STATUS_WITHDRAWAL } from './constants/order.constants';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Order, Prisma } from '@prisma/client';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { userSelectConfig, addressSelectConfig, orderItensSelectConfig, orderSelectFields, orderSelectByIdFields } from 'src/core/order/config/order-select-config';
import { subMinutes, isAfter, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler
  ) { }

  async create(createOrderDto: CreateOrderDto, userId: number) {

    await this.validateOrderFields(createOrderDto, userId);

    const totalValue = await this.calculateTotalOrderValue(createOrderDto.orderItens);

    const orderItemsData = await Promise.all(createOrderDto.orderItens.map(async (item) => {

      const product = await this.prismaService.product.findUnique({
        where: { idProduct: item.product.idProduct }
      });
    
      return {
        quantity: item.quantity,
        description: product.description,
        price: product.price
      };
    }));

    return await this.prismaService.order.create({
      data: {
        typeOfDelivery: TYPE_OF_DELIVERY[createOrderDto.typeOfDelivery],
        orderStatus: createOrderDto.typeOfDelivery === 0 ? ORDER_STATUS_DELIVERY[0] : ORDER_STATUS_WITHDRAWAL[0],
        paymentMethod: PAYMENT_METHOD[createOrderDto.paymentMethod],
        total: totalValue,
        orderItens: {
          create: orderItemsData
        },
        user: {
          connect: {
            idUser: userId
          }
        },
        address: {
          connect: {
            idAddress: createOrderDto.idAddress
          }
        }
      },
      include: {
        user: userSelectConfig,
        address: addressSelectConfig,
        orderItens: orderItensSelectConfig
      }
    })
      .then(order => {
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Pedido realizado com sucesso!' };
        return {
          data: {
            user: order.user,
            address: order.address,
            orderItens: order.orderItens,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            typeOfDelivery: order.typeOfDelivery,
            total: order.total
          },
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao realizar pedido!');
      });
  }

  private async validateOrderFields(orderDto: CreateOrderDto | UpdateOrderDto, userId: number, isUpdate = false, orderId?: number) {
    if (!TYPE_OF_DELIVERY[orderDto.typeOfDelivery]) this.exceptionHandler.errorBadRequestResponse(`Tipo de entrega: ${orderDto.typeOfDelivery} inválido!`);

    if (!PAYMENT_METHOD[orderDto.paymentMethod]) this.exceptionHandler.errorBadRequestResponse(`Forma de pagamento: ${orderDto.paymentMethod} inválida!`);

    if (orderDto.orderItens.length === 0) this.exceptionHandler.errorBadRequestResponse(`Pedido não pode ser realizado sem itens!`);

    const user = await this.prismaService.user.findUnique({
      where: { idUser: userId }
    });

    if (!user) this.exceptionHandler.errorNotFoundResponse(`Este usuário não está cadastrado no sistema!`);

    const address = await this.prismaService.address.findUnique({
      where: { idAddress: orderDto.idAddress }
    });

    if (!address) this.exceptionHandler.errorNotFoundResponse(`Este endereço não está cadastrado no sistema!`);

    if (address.idUser !== user.idUser) this.exceptionHandler.errorBadRequestResponse(`O endereço fornecido não pertence a este usuário!`);

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

  async findAllOrders(page: number, perPage: number, isPending: boolean = false): Promise<PaginatedOutputDto<Object>> {
    const selectedFields = orderSelectFields;

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    return await paginate<Order, Prisma.OrderFindManyArgs>(
      this.prismaService.order,
      {
        where: isPending ? { deliveryDate: null } : undefined,
        orderBy: { createdAt: isPending ? 'asc' : 'desc' },
        select: selectedFields
      },
      { page: page, perPage: perPage }
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

  async findAllOrdersByUser(userId: number, page: number, perPage: number): Promise<PaginatedOutputDto<Object>> {

    const selectedFields = orderSelectFields;

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    return await paginate<Order, Prisma.OrderFindManyArgs>(
      this.prismaService.order,
      {
        where: { idUser: userId },
        select: selectedFields,
      },
      { page: page, perPage: perPage }
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
        total: order.total
      },
      message,
      statusCode: HttpStatus.OK
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number) {

    await this.validateOrderFields(updateOrderDto, userId, true, id);

    const totalValue = await this.calculateTotalOrderValue(updateOrderDto.orderItens);

    const orderItemsData = await Promise.all(updateOrderDto.orderItens.map(async (item) => {

      const product = await this.prismaService.product.findUnique({
        where: { idProduct: item.product.idProduct }
      });
    
      return {
        quantity: item.quantity,
        description: product.description,
        price: product.price
      };
    }));

    return await this.prismaService.order.update({
      where: { idOrder: id },
      data: {
        typeOfDelivery: TYPE_OF_DELIVERY[updateOrderDto.typeOfDelivery],
        paymentMethod: PAYMENT_METHOD[updateOrderDto.paymentMethod],
        total: totalValue,
        orderItens: {
          create: orderItemsData
        }
      },
      include: {
        user: userSelectConfig,
        address: addressSelectConfig,
        orderItens: orderItensSelectConfig
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

  async validateUpdateOrderStatus(orderId: number, orderstatus: number) {
    
    const order = await this.prismaService.order.findUnique({
      where: { idOrder: orderId }
    });

    if (!order) this.exceptionHandler.errorNotFoundResponse(`Este pedido não foi encontrado!`);
    if (order.orderStatus == 'ENTREGUE') this.exceptionHandler.errorBadRequestResponse(`Pedidos entregues não podem ser alterados!`);
    if (order.orderStatus == 'CANCELADO') this.exceptionHandler.errorBadRequestResponse(`Pedidos cancelados não podem ser alterados!`);

    let isPending: boolean;

    switch (order.typeOfDelivery) {
      case 'ENTREGA': {
        if (!ORDER_STATUS_DELIVERY[orderstatus]) this.exceptionHandler.errorBadRequestResponse(`Status do pedido ${orderstatus} é inválido!`);
        if (ORDER_STATUS_DELIVERY[orderstatus] == 'ENTREGUE' || ORDER_STATUS_DELIVERY[orderstatus] == 'CANCELADO') {
          isPending = false;
        } else {
          isPending = true;
        }

        return this.updateOrderStatus(order.idOrder, ORDER_STATUS_DELIVERY[orderstatus], isPending);
      }

      case 'RETIRA': {
        if (!ORDER_STATUS_WITHDRAWAL[orderstatus]) this.exceptionHandler.errorBadRequestResponse(`Status do pedido ${orderstatus} é inválido!`);
        if (ORDER_STATUS_WITHDRAWAL[orderstatus] == 'ENTREGUE' || ORDER_STATUS_WITHDRAWAL[orderstatus] == 'CANCELADO') {
          isPending = false;
        } else {
          isPending = true;
        }

        return this.updateOrderStatus(order.idOrder, ORDER_STATUS_WITHDRAWAL[orderstatus], isPending);
      }

      default: break;
    }
  }

  async updateOrderStatus(orderId: number, orderStatus: string, isPending: boolean) {
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
        orderItens: orderItensSelectConfig
      }
    })
      .then(order => {
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Status do pedido atualizado com sucesso!' };
        return {
          data: {
            orderId: order.idOrder,
            user: order.user,
            address: order.address,
            orderItens: order.orderItens,
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            typeOfDelivery: order.typeOfDelivery,
            total: order.total,
            deliveryDate: order.deliveryDate? format(new Date(order.deliveryDate), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ''
          },
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar status do pedido!');
      });
  }
}
