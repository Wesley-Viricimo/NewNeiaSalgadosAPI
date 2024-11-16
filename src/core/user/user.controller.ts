import { Controller, Get, Post, Body, Patch, Param, HttpCode, Query, HttpStatus, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/shared/decorators/publicRoute.decorator';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { User } from './entities/user.entity';
import { ChangeUserStatusDTO } from './dto/user-status.dto';
import { FastifyRequest } from 'fastify';
import { MailConfirmation } from './dto/mail-confirmation.dto';

@Controller('api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
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

  @Roles('ADMIN', 'DEV')
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userService.findById(+id);
  }

  @Patch()
  @HttpCode(HttpStatus.CREATED)
  update(@Body() updateUserDto: UpdateUserDto, @Req() request: FastifyRequest) {
    return this.userService.update(updateUserDto, request['userId'] );
  }

  @Public()
  @Post('confirm-code')
  confirmationCode(@Body() mailConfirmation: MailConfirmation) {
    return this.userService.confirmationCode(mailConfirmation);
  }

  @Roles('ADMIN', 'DEV')
  @Patch('changeUserActivity/:id')
  @HttpCode(HttpStatus.CREATED)
  changeUserActivity(@Param('id') id: string, @Body() changeUserStatusDTO: ChangeUserStatusDTO) {
    return this.userService.changeUserActivity(+id, changeUserStatusDTO);
  }
}
