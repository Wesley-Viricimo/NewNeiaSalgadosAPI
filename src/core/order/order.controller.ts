import { Controller, Get, Post, Body, Patch, Param, Req, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { Order } from './entities/order.entity';
import { FastifyRequest } from 'fastify';
import { OrderDto, OrderDtoSchema } from './dto/order-dto';
import { ZodValidationPipe } from 'src/shared/utils/pipes/zod-validation.pipe';

@Controller('api/v1/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(OrderDtoSchema)) orderDto: OrderDto, @Req() request: FastifyRequest) {
    return this.orderService.create(orderDto, request['userId']);
  }

  @Roles('ADMIN', 'DEV')
  @Get()
  findAllOrders(
    @Query('user') user: string,
    @Query('status') status: string,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10
  ): Promise<PaginatedOutputDto<Object>> {
    return this.orderService.findAllOrders(user, status, page, perPage);
  }

  @Get('user/all')
  @ApiPaginatedResponse(Order)
  async findAllOrdersByUser(
    @Req() request: FastifyRequest,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.orderService.findAllOrdersByUser(request['userId'], page, perPage);
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
  @Patch(':orderId/orderstatus/:orderstatus')
  @HttpCode(HttpStatus.CREATED)
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Param('orderstatus') orderstatus: string,
    @Req() request: FastifyRequest
  ) {
    return this.orderService.validateUpdateOrderStatus(+orderId, +orderstatus, request['userId']);
  }
  
}
