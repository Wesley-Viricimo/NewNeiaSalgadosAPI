import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PAYMENT_METHOD, TYPE_OF_DELIVERY, ORDER_STATUS_DELIVERY, ORDER_STATUS_WITHDRAWAL } from './constants/order.constants';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { Order, Prisma } from '@prisma/client';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';

@Injectable()
export class OrderService {
  constructor(
    private readonly prismaService: PrismaService
  ){}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    
    await this.validationFieldsOrder(createOrderDto, userId);

    const totalValue = await this.getTotalOrderValue(createOrderDto);
    
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

  private async validationFieldsOrder(createOrderDto: CreateOrderDto, userId: number) {
    if(!TYPE_OF_DELIVERY[createOrderDto.typeOfDelivery]) throw new ErrorExceptionFilters('BAD_REQUEST', `Tipo de entrega: ${createOrderDto.typeOfDelivery} inválido!`);

    if(!PAYMENT_METHOD[createOrderDto.paymentMethod]) throw new ErrorExceptionFilters('BAD_REQUEST', `Forma de pagamento: ${createOrderDto.paymentMethod} inválida!`);

    if(createOrderDto.orderItens.length === 0) throw new ErrorExceptionFilters('BAD_REQUEST', `Pedido não pode ser realizado sem itens!`);

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

     if(!address) throw new ErrorExceptionFilters('NOT_FOUND', `Este endereço não está cadastrado no sistema!`);

     if(address.idUser !== user.idUser) throw new ErrorExceptionFilters('BAD_REQUEST', `O endereço fornecido não pertence a este usuário!`);
  }

  private async getTotalOrderValue(createOrderDto: CreateOrderDto) {
    let totalValue = 0;

    for(const item of createOrderDto.orderItens) {
      const product = await this.prismaService.product.findUnique({
        where: { idProduct: item.product.idProduct }
      });

      if(!product) throw new ErrorExceptionFilters('BAD_REQUEST', `Produto id: ${item.product.idProduct} não está cadastrado no sistema!`);

      totalValue += product.price * item.quantity;
     }

     return totalValue;
  }

  async findAllOrders(page: number, perPage: number, isPending: boolean = false): Promise<PaginatedOutputDto<Object>> {
    const selectedFields = {  // Use `select` para campos escalares
      idOrder: true,
      user: {  // `include` é permitido dentro de `select` para relações
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
      },
      typeOfDelivery: true,
      paymentMethod: true,
      orderStatus: true,
      total: true, 
    };

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
    
    const selectedFields = {  // Use `select` para campos escalares
      idOrder: true,
      user: {  // `include` é permitido dentro de `select` para relações
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
      },
      typeOfDelivery: true,
      paymentMethod: true,
      orderStatus: true,
      total: true, 
    };

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
    
    const selectedFields = {  // Use `select` para campos escalares
      idOrder: true,
      idUser: true,
      orderStatus: true,
      paymentMethod: true,
      typeOfDelivery: true,
      total: true,
      user: {  // `include` é permitido dentro de `select` para relações
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
    };
    
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

  update(id: number, updateOrderDto: UpdateOrderDto, userId: number) {
    return `This action updates a #${id} order`;
  }

  
}
