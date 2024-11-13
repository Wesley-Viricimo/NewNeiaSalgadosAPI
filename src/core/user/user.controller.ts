import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/shared/decorators/publicRoute.decorator';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { User } from './entities/user.entity';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  create(@Body() user: CreateUserDto) {
    return this.userService.create(user);
  }

  @Roles('ADMIN', 'DEV')
  @Get('all')
  @ApiPaginatedResponse(User)
  async findAll(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.userService.findAll(page, perPage);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  inativateUser(@Param('id') id: string) {
    return this.userService.inativateUser(+id);
  }
}
