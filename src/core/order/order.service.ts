import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PAYMENT_METHOD, TYPE_OF_DELIVERY, ORDER_STATUS_DELIVERY, ORDER_STATUS_WITHDRAWAL } from './constants/order.constants';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { Order, Prisma } from '@prisma/client';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { userSelectConfig, addressSelectConfig, orderItensSelectConfig, orderSelectFields, orderSelectByIdFields } from 'src/core/order/config/order-select-config';
import { subMinutes, isAfter } from 'date-fns';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService
  ){}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    
    await this.validateOrderFields(createOrderDto, userId);

    const totalValue = await this.calculateTotalOrderValue(createOrderDto.orderItens);
    
     const orderItemsData = createOrderDto.orderItens.map((item) => ({
      idProduct: item.product.idProduct,
      quantity: item.quantity
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
            idAddress: userId
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
          orderStatus: order.orderStatus,
          paymentMethod: order.paymentMethod,
          typeOfDelivery: order.typeOfDelivery,
          orderItens: order.orderItens,
          total: order.total,
          isPending: order.isPending
        },
        message,
        statusCode: HttpStatus.CREATED
      }
     })
     .catch(() => {
      const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao realizar pedido!' };
      throw new ErrorExceptionFilters('BAD_REQUEST', {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      })
     });
  }

  private async validateOrderFields(orderDto: CreateOrderDto | UpdateOrderDto, userId: number, isUpdate = false, orderId?: number) {
    if (!TYPE_OF_DELIVERY[orderDto.typeOfDelivery]) throw new ErrorExceptionFilters('BAD_REQUEST', `Tipo de entrega: ${orderDto.typeOfDelivery} inválido!`);
  
    if (!PAYMENT_METHOD[orderDto.paymentMethod]) throw new ErrorExceptionFilters('BAD_REQUEST', `Forma de pagamento: ${orderDto.paymentMethod} inválida!`);
  
    if (orderDto.orderItens.length === 0) throw new ErrorExceptionFilters('BAD_REQUEST', `Pedido não pode ser realizado sem itens!`);
  
    const user = await this.prismaService.user.findUnique({
      where: { idUser: userId }
    });
  
    if (!user) throw new ErrorExceptionFilters('NOT_FOUND', `Este usuário não está cadastrado no sistema!`);
  
    const address = await this.prismaService.address.findUnique({
      where: { idAddress: orderDto.idAddress }
    });
  
    if (!address) throw new ErrorExceptionFilters('NOT_FOUND', `Este endereço não está cadastrado no sistema!`);
  
    if (address.idUser !== user.idUser) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O endereço fornecido não pertence a este usuário!`);
    }
  
    if (isUpdate) {
      const order = await this.prismaService.order.findUnique({
        where: { idOrder: orderId }
      });
  
      if (order?.idUser !== userId) throw new ErrorExceptionFilters('FORBIDDEN', `Este pedido não pertence a este usuário!`);

      if (order.orderStatus == 'ENTREGUE' || order.orderStatus == 'CANCELADO') throw new ErrorExceptionFilters('BAD_REQUEST', `Pedidos entregues ou cancelados não podem ser atualizados!`);

      if (order.orderStatus == 'PREPARANDO') {
        const tenMinutesAgo = subMinutes(new Date(), 10);
        if (isAfter(tenMinutesAgo, order.orderStatusUpdatedAt)) throw new ErrorExceptionFilters('BAD_REQUEST', `Pedidos pendentes só podem ser atualizados até 10 minutos após a última atualização!`);
      }
    } else {
      const orderPending = await this.prismaService.order.findFirst({
        where: { idUser: userId, isPending: true }
      });
  
      if (orderPending) throw new ErrorExceptionFilters('BAD_REQUEST', `Já existe um pedido em andamento para este usuário e não é possível realizar outro no momento!`);
    }
  }  

  private async calculateTotalOrderValue(orderItens: Array<{ product: { idProduct: number }, quantity: number }>) {
    let totalValue = 0;
  
    for (const item of orderItens) {
      const product = await this.prismaService.product.findUnique({
        where: { idProduct: item.product.idProduct }
      });
  
      if (!product) throw new ErrorExceptionFilters('BAD_REQUEST', `Produto id: ${item.product.idProduct} não está cadastrado no sistema!`);
  
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
        where: isPending ? { isPending: isPending } : undefined,
        orderBy: { createdAt: isPending? 'asc' : 'desc' },
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
    })
    .catch((err) => {
      console.log(err)
      const message = { severity: 'error', summary: 'Erro ao listar pedidos', detail: 'Erro' };
        throw new ErrorExceptionFilters('BAD_REQUEST', {
          message,
          statusCode: HttpStatus.BAD_REQUEST,
        })
    });
  }

  async findAllOrdersByUser(userId: number, page: number, perPage: number): Promise<PaginatedOutputDto<Object>>{
    
    const selectedFields = orderSelectFields;

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    return await paginate<Order, Prisma.OrderFindManyArgs>(
      this.prismaService.order,
      { 
        where: { idUser: userId } ,
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
    })
    .catch((err) => {
      console.log(err)
      const message = { severity: 'error', summary: 'Erro ao listar pedidos', detail: 'Erro' };
        throw new ErrorExceptionFilters('BAD_REQUEST', {
          message,
          statusCode: HttpStatus.BAD_REQUEST,
        })
    });
  }

  async findById(id: number, userId: number) {
    
    const selectedFields = orderSelectByIdFields;
    
    const order = await this.prismaService.order.findUnique({
      where: { idOrder: id },
      select: selectedFields
    });

    if(!order) throw new ErrorExceptionFilters('NOT_FOUND', `Este pedido não está cadastrado no sistema!`);

    if(order.idUser !== userId) throw new ErrorExceptionFilters('FORBIDDEN', `Este pedido não pertence a este usuário!`);

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

    const orderItemsData = updateOrderDto.orderItens.map((item) => ({
      idProduct: item.product.idProduct,
      quantity: item.quantity
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
          total: order.total,
          isPending: order.isPending
        },
        message,
        statusCode: HttpStatus.CREATED
      }
     })
     .catch(() => {
      const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar pedido!' };
      throw new ErrorExceptionFilters('BAD_REQUEST', {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      })
     });
  }

  async updateOrderStatus(orderId: number, orderstatus: number, updateOrderDto: updateOrderDto) {
    
    const order = this.prismaService.order.findUnique({
      where: { idOrder: orderId }
    });

    if(!order) throw new ErrorExceptionFilters('NOT_FOUND', `Este pedido não está cadastrado no sistema!`);

    switch((await order).typeOfDelivery) {
      case 'ENTREGA': {
        
      }
      break;

      case 'RETIRA': {

      }
      break
    }
  }
}
