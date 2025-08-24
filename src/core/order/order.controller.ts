import { Controller, Get, Post, Body, Patch, Param, Req, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { Order } from './entities/order.entity';
import { FastifyRequest } from 'fastify';
import { OrderDto, OrderDtoSchema, OrderFindAllQuery, OrderFindAllQuerySchema, OrderTotalizersQuery, OrderTotalizersQuerySchema, OrderUpdateStatusParams, OrderUpdateStatusParamsSchema } from './dto/order-dto';
import { ZodValidationPipe } from 'src/shared/utils/pipes/zod-validation.pipe';

@Controller('api/v1/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(OrderDtoSchema)) orderDto: OrderDto, @Req() request: FastifyRequest) {
    return this.orderService.create(orderDto, request['userId']);
  }

  @Roles('ADMIN', 'DEV')
  @Get()
  findAllOrders(
    @Query(new ZodValidationPipe(OrderFindAllQuerySchema)) orderQuery: OrderFindAllQuery
  ): Promise<PaginatedOutputDto<Object>> {
    return this.orderService.findAllOrders(orderQuery);
  }

  @Get('user/all')
  @ApiPaginatedResponse(Order)
  async findAllOrdersByUser(
    @Req() request: FastifyRequest,
    @Query(new ZodValidationPipe(OrderFindAllQuerySchema)) orderQuery: OrderFindAllQuery
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.orderService.findAllOrdersByUser(orderQuery, request['userId']);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: FastifyRequest) {
    return this.orderService.findById(+id, request['userId']);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.CREATED)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(OrderDtoSchema)) updateOrderDto: OrderDto,
    @Req() request: FastifyRequest
  ) {
    return this.orderService.update(+id, updateOrderDto, request['userId']);
  }

  @Roles('ADMIN', 'DEV')
  @Patch(':orderId/orderstatus/:orderStatus')
  @HttpCode(HttpStatus.CREATED)
  updateOrderStatus(
    @Param(new ZodValidationPipe(OrderUpdateStatusParamsSchema)) orderUpdateStatus: OrderUpdateStatusParams,
    @Req() request: FastifyRequest
  ) {
    return this.orderService.validateUpdateOrderStatus(orderUpdateStatus, request['userId']);
  }

  @Roles('ADMIN', 'DEV')
  @Get('totalizers')
  @HttpCode(HttpStatus.OK)
  async getTotalizers(
    @Query(new ZodValidationPipe(OrderTotalizersQuerySchema)) totalizersQuery: OrderTotalizersQuery
  ) {
    return await this.orderService.getOrdersTotalizers(totalizersQuery.period);
  }

}
