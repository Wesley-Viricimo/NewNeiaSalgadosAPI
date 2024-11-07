import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Req() request: Request) {
    return this.orderService.create(createOrderDto, request['userId']);
  }

  @Roles('ADMIN', 'DEV')
  @Get()
  findAllOrders() {
    return this.orderService.findAll();
  }

  @Roles('ADMIN', 'DEV')
  @Get('pending')
  findAllOrdersPending() {
    return this.orderService.findAll();
  }

  @Get('user/all')
  findAllOrdersByUser() {
    return this.orderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }
  
}
