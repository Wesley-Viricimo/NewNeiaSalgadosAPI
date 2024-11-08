import { Controller, Get, Post, Body, Patch, Param, Delete, Req, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { Order } from './entities/order.entity';

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
    
  }

  @Roles('ADMIN', 'DEV')
  @Get('pending')
  findAllOrdersPending() {
    
  }

  @Get('user/all')
  @ApiPaginatedResponse(Order)
  async findAllOrdersByUser(
    @Req() request: Request,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.orderService.findAllOrdersByUser(request['userId'], page, perPage);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request,) {
    return this.orderService.findById(+id, request['userId']);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }
  
}
