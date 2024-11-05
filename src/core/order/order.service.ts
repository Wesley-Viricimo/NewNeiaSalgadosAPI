import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PAYMENT_METHOD, TYPE_OF_DELIVERY, ORDER_STATUS_DELIVERY, ORDER_STATUS_WITHDRAWAL } from './constants/order.constants';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService
  ){}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    await this.validationsOrder(createOrderDto, userId);
    
     const orderItemsData = createOrderDto.orderItens.map((item) => ({
      idProduct: item.product.idProduct,
      quantity: item.quantity
     }));

     return await this.prismaService.order.create({
      data: {
        typeOfDelivery: TYPE_OF_DELIVERY[createOrderDto.typeOfDelivery],
        orderStatus: createOrderDto.typeOfDelivery === 0 ? ORDER_STATUS_DELIVERY[0] : ORDER_STATUS_WITHDRAWAL[0],
        paymentMethod: PAYMENT_METHOD[createOrderDto.paymentMethod],
        total: 30.35,
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
        user: {
          select: {
            name: true,
            surname: true,
            cpf: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        address: {
          select: {
            cep: true,
            state: true,
            city: true,
            district: true,
            road: true,
            number: true,
            complement: true
          }
        },
        orderItens: {
          select: {
            quantity: true,
            product: {
              select: {
                description: true,
                price: true
              }
            }
          }
        }
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

  private async validationsOrder(createOrderDto: CreateOrderDto, userId: number) {
    if(!TYPE_OF_DELIVERY[createOrderDto.typeOfDelivery]) throw new ErrorExceptionFilters('BAD_REQUEST', `Tipo de entrega: ${createOrderDto.typeOfDelivery} inválido!`);

    if(!PAYMENT_METHOD[createOrderDto.paymentMethod]) throw new ErrorExceptionFilters('BAD_REQUEST', `Forma de pagamento: ${createOrderDto.paymentMethod} inválida!`);

    if(createOrderDto.orderItens.length === 0) throw new ErrorExceptionFilters('BAD_REQUEST', `Pedido não pode ser realizado sem itens!`);

    for(const item of createOrderDto.orderItens) {
      const product = await this.prismaService.product.findUnique({
        where: { idProduct: item.product.idProduct }
      });

      if(!product) throw new ErrorExceptionFilters('BAD_REQUEST', `Produto id: ${item.product.idProduct} não está cadastrado no sistema!`);
     }

    const user = await this.prismaService.user.findUnique({
      where: { idUser: userId }
    });

    if(!user) throw new ErrorExceptionFilters('NOT_FOUND', `Este usuário não está cadastrado no sistema!`);
    
     const orderPending = await this.prismaService.order.findFirst({
        where: { idUser: userId, isPending: true }
     });

     if(orderPending) throw new ErrorExceptionFilters('BAD_REQUEST', `Já existe um pedido em andamento para este usuário e não é possível realizar outro no momento!`);

     const address = await this.prismaService.address.findUnique({
      where: { idAddress: createOrderDto.idAddress }
     });

     if(address.idUser !== user.idUser) throw new ErrorExceptionFilters('BAD_REQUEST', `O endereço fornecido não pertence a este usuário!`);
  }

  findAll() {
    return `This action returns all order`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
