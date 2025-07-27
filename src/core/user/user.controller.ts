import { Controller, Get, Post, Body, Patch, Param, HttpCode, Query, HttpStatus, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { Public } from 'src/shared/decorators/publicRoute.decorator';
import { ApiPaginatedResponse } from 'src/shared/decorators/pagination.decorator';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { User } from './entities/user.entity';
import { ChangeUserStatusDTO } from './dto/user-status.dto';
import { FastifyRequest } from 'fastify';
import { MailConfirmation } from './dto/mail-confirmation.dto';
import { MailResendDto } from './dto/mail-resend-dto';
import { ZodValidationPipe } from 'src/shared/utils/pipes/zod-validation.pipe';
import { UserDto, UserDtoSchema, UserQuery, UserQuerySchema, UserUpdateParams, UserUpdateParamsSchema } from './dto/user.dto';

@Controller('api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(UserDtoSchema)) userDto: UserDto) {
    return this.userService.create(userDto);
  }

  @Roles('ADMIN', 'DEV')
  @Post('create-admin')
  @HttpCode(HttpStatus.CREATED)
  createAdmin(@Body(new ZodValidationPipe(UserDtoSchema)) userDto: UserDto) {
    return this.userService.createAdmin(userDto)
  }

  @Roles('ADMIN', 'DEV', 'COMERCIAL')
  @Get()
  @ApiPaginatedResponse(User)
  async findAll(
    @Query(new ZodValidationPipe(UserQuerySchema)) userQuery: UserQuery
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.userService.findAll(userQuery);
  }

  @Roles('ADMIN', 'DEV', 'COMERCIAL')
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userService.findById(+id);
  }

  @Patch()
  @HttpCode(HttpStatus.CREATED)
  update(@Body(new ZodValidationPipe(UserDtoSchema)) userDto: UserDto, @Req() request: FastifyRequest) {
    return this.userService.update(userDto, request['userId'] );
  }

  @Roles('DEV', 'ADMIN')
  @Patch(':userId/role/:role')
  async updateUserRole(
    @Param(new ZodValidationPipe(UserUpdateParamsSchema)) userUpdate: UserUpdateParams,
    @Req() request: FastifyRequest
  ) {
    return await this.userService.updateUserRole(userUpdate, request['userId']);
  }

  @Public()
  @Post('confirm-code')
  confirmationCode(@Body() mailConfirmation: MailConfirmation) {
    return this.userService.confirmationCode(mailConfirmation);
  }

  @Public()
  @Post('resend-confirm-code')
  resendConfirmationCode(@Body() mailResendDto: MailResendDto) {
    return this.userService.resendConfirmationCode(mailResendDto);
  }

  @Roles('ADMIN', 'DEV')
  @Patch('changeUserActivity/:id')
  @HttpCode(HttpStatus.CREATED)
  changeUserActivity(
    @Param('id') id: string, 
    @Body() changeUserStatusDTO: ChangeUserStatusDTO,
    @Req() request: FastifyRequest
  ) {
    return this.userService.changeUserActivity(+id, changeUserStatusDTO, request['userId']);
  }

  @Post('save-notificationToken')
  @HttpCode(HttpStatus.CREATED)
  saveNotificationToken(@Body() notificationToken: string, @Req() request: FastifyRequest) {
    return this.userService.saveNotificationToken(notificationToken, request['userId']);
  }
}
