import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UserSide } from './entities/user.entity';
import { cpf } from 'cpf-cnpj-validator';
import { hash } from 'bcryptjs';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { userSelectConfig, userTokenSelectConfig } from './config/user-select-config';
import { Prisma, User } from '@prisma/client';
import { ROLES } from './constants/users.constants';
import { EmailService } from 'src/service/aws/send-email.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { ChangeUserStatusDto, MailConfirmationDto, ResendEmailDto, UserDto, UserQuery, UserUpdateParams } from './dto/user.dto';

@Injectable()
export class UserService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly auditingService: AuditingService
  ) { }

  async create(userDto: UserDto) {

    await this.validateFieldsCreateUser(userDto);

    const passwordHash = await hash(userDto.password, 8);

    return await this.prismaService.user.create({
      data: {
        name: userDto.name,
        surname: userDto.surname,
        cpf: userDto.cpf,
        phone: userDto.phone,
        email: userDto.email,
        password: passwordHash
      },
    })
      .then(async (user) => {
        const activationCode = this.generateActivationCode();

        await this.prismaService.userActivationCode.create({
          data: {
            code: activationCode,
            idUser: user.idUser
          }
        });

        await this.emailService.sendActivateAccountEmail(user.email, user.name, activationCode);

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Usuário cadastrado com sucesso!' };
        return {
          data: {
            name: user.name,
            surname: user.surname,
            cpf: user.cpf,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          },
          message,
          statusCode: HttpStatus.CREATED
        };
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar usuário!');
      });
  }

  async createAdmin(user: UserDto) {

    await this.validateFieldsCreateUser(user);

    const passwordHash = await hash(user.password, 8);

    return await this.prismaService.user.create({
      data: {
        name: user.name,
        surname: user.surname,
        cpf: user.cpf,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isActive: true,
        password: passwordHash
      },
    })
      .then(async (user) => {
        const activationCode = this.generateActivationCode();

        const activation = await this.prismaService.userActivationCode.create({
          data: {
            code: activationCode,
            idUser: user.idUser
          }
        });

        await this.prismaService.userActivationCode.update({
          where: { idCode: activation.idCode },
          data: {
            confirmed: true
          }
        })

        const message = { severity: 'success', summary: 'Sucesso', detail: `Usuário ${user.role} cadastrado com sucesso!` };
        return {
          data: {
            name: user.name,
            surname: user.surname,
            cpf: user.cpf,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          },
          message,
          statusCode: HttpStatus.CREATED
        };
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse(`Erro ao cadastrar usuário ${user.role}!`);
      });
  }

  private generateActivationCode(): string {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  private async validateFieldsCreateUser(userDto: UserDto) {
    if (userDto.cpf.length > 11) this.exceptionHandler.errorBadRequestResponse(`${UserSide['cpf']} não pode exceder 11 caracteres!`);
    if (!cpf.isValid(userDto.cpf)) this.exceptionHandler.errorBadRequestResponse(`Este ${UserSide['cpf']} não é válido!`);

    await this.findUserByCpf(userDto.cpf);
    const emailExists = await this.findUserByEmail(userDto.email);

    if (emailExists) this.exceptionHandler.errorBadRequestResponse(`O email ${emailExists.email} já foi cadastrado no sistema!`);
  }

  async findAll(userQuery: UserQuery): Promise<PaginatedOutputDto<Object>> {

    const selectedFields = userSelectConfig;

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page: userQuery.page, perPage: userQuery.perPage });

    const where: Prisma.UserWhereInput = {};

    if (userQuery.user) where.name = { contains: userQuery.user, mode: 'insensitive' };
    if (userQuery.cpf) where.cpf = { contains: userQuery.cpf, mode: 'insensitive' };
    if (userQuery.status == 'active') where.isActive = true;
    if (userQuery.status == 'inactive') where.isActive = false;

    return await paginate<User, Prisma.UserFindManyArgs>(
      this.prismaService.user,
      {
        where,
        select: selectedFields
      },
      { page: userQuery.page, perPage: userQuery.perPage }
    )
      .then(response => {
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Usuários listados com sucesso.' };
        return {
          data: response.data,
          meta: response.meta,
          message,
          statusCode: HttpStatus.OK
        }
      });
  }

  async findById(id: number) {

    const user = await this.getUserById(id);

    const message = { severity: 'success', summary: 'Sucesso', detail: 'Usuário listado com sucesso!' };

    return {
      data: {
        idUser: user.idUser,
        name: user.name,
        surname: user.surname,
        cpf: user.cpf,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      message,
      statusCode: HttpStatus.OK
    }
  }

  async update(userDto: UserDto, userId: number) {

    await this.validateFieldsUpdateUser(userDto, userId);

    let passwordHash: string;

    if (userDto.password) {
      passwordHash = await hash(userDto.password, 8);
    }

    const updateUserData: any = {
      name: userDto.name,
      surname: userDto.surname,
      cpf: userDto.cpf,
      email: userDto.email,
    };

    if (passwordHash) {
      updateUserData.password = passwordHash;
    }

    return await this.prismaService.user.update({
      where: { idUser: userId },
      data: updateUserData,
    })
      .then(user => {
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Usuário atualizado com sucesso!' };
        return {
          data: {
            idUser: user.idUser,
            name: user.name,
            surname: user.surname,
            cpf: user.cpf,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          },
          message,
          statusCode: HttpStatus.OK
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar usuário!');
      })
  }

  private async validateFieldsUpdateUser(user: UserDto, userId: number) {
    if (user.cpf) {
      if (user.cpf.length > 11) this.exceptionHandler.errorBadRequestResponse(`${UserSide['cpf']} não pode exceder 11 caracteres!`);
      if (!cpf.isValid(user.cpf)) this.exceptionHandler.errorBadRequestResponse(`Este ${UserSide['cpf']} não é válido!`);

      const cpfExists = await this.findUserByCpf(user.cpf);
      if (cpfExists && cpfExists.idUser !== userId) this.exceptionHandler.errorBadRequestResponse(`Este ${UserSide['cpf']} já está cadastrado no sistema!`);
    }

    if (user.email) {
      const emailExists = await this.findUserByEmail(user.email);
      if (emailExists && emailExists.idUser !== userId) this.exceptionHandler.errorBadRequestResponse(`Este ${UserSide['email']} já está cadastrado no sistema!`);
    }
  }

  async updateUserRole(userUpdate: UserUpdateParams, adminId: number) {
    if (!ROLES[userUpdate.role]) this.exceptionHandler.errorBadRequestResponse(`Não existe a função com o id: ${userUpdate.role}`);
    if (userUpdate.userId == adminId) this.exceptionHandler.errorBadRequestResponse('Um usuário não pode alterar a própria função!');

    const admin = await this.getUserById(adminId);

    if (ROLES[userUpdate.role] == 'DEV' && ROLES[userUpdate.role] != admin.role) this.exceptionHandler.errorBadRequestResponse(`Somente usuários DEV podem alterar a função do usuário para DEV!`);
    if (admin.role == 'ADMIN' && ROLES[userUpdate.role] == 'ADMIN') this.exceptionHandler.errorBadRequestResponse('Somente usuários DEV podem alterar a função do usuário para ADMIN!');

    const user = await this.getUserById(userUpdate.userId);

    if (!user) this.exceptionHandler.errorBadRequestResponse('Este usuário não está cadastrado no sistema!');
    if (user.isActive == false) this.exceptionHandler.errorBadRequestResponse('Não é possível alterar a função de usuários inativos!');

    if (admin.role == 'ADMIN' && (user.role == 'ADMIN' || user.role == 'DEV')) this.exceptionHandler.errorBadRequestResponse('Não é permitido que usuários ADMIN altere privilégios de outros usuários ADMIN ou DEV!');

    return await this.prismaService.user.update({
      where: { idUser: user.idUser },
      data: { role: ROLES[userUpdate.role] }
    })
      .then(async (result) => {

        await this.auditingService.saveAudit({
          idUser: admin.idUser,
          action: "ATUALIZAÇÃO DE FUNÇÃO DE USUÁRIO",
          entityType: "USER",
          changeType: "UPDATE",
          entityId: result.idUser,
          previousValue: user,
          newValue: result
        } as ActionAuditingModel);

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Função do usuário atualizada com sucesso!' };
        return {
          data: {
            idUser: result.idUser,
            name: result.name,
            surname: result.surname,
            cpf: result.cpf,
            email: result.email,
            role: result.role,
            isActive: result.isActive
          },
          message,
          statusCode: HttpStatus.CREATED
        }
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar função do usuário!')
      })
  }

  async confirmationCode(mailConfirmation: MailConfirmationDto) {

    const user = await this.prismaService.user.findFirst({
      where: { email: mailConfirmation.email }
    });

    if (!user) this.exceptionHandler.errorNotFoundResponse('Este usuário não está cadastrado no sistema!');

    const confirmationCode = await this.prismaService.userActivationCode.findUnique({
      where: { idUser: user.idUser }
    });

    const userConfirmationSelectConfig = {
      select: {
        confirmed: true
      }
    }

    if (confirmationCode) {
      if (confirmationCode.confirmed) this.exceptionHandler.errorBadRequestResponse('Esta conta já foi ativa!');

      if (confirmationCode.code !== mailConfirmation.code.toUpperCase()) this.exceptionHandler.errorBadRequestResponse('Este código de ativação está incorreto!');

      await this.prismaService.userActivationCode.update({
        where: { idCode: confirmationCode.idCode },
        data: { confirmed: true }
      });

      return await this.prismaService.user.update({
        where: { idUser: user.idUser },
        data: {
          isActive: true
        },
        include: {
          userActivationCode: userConfirmationSelectConfig
        }
      })
        .then(user => {
          const message = { severity: 'success', summary: 'Sucesso', detail: 'Conta ativada com sucesso!' };
          return {
            data: {
              name: user.name,
              surname: user.surname,
              cpf: user.cpf,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              userActivationCode: user.userActivationCode
            },
            message,
            statusCode: HttpStatus.OK
          }
        })
        .catch(() => {
          this.exceptionHandler.errorBadRequestResponse('Erro ao ativar conta!');
        });
    }
  }

  async resendConfirmationCode(mailResendDto: ResendEmailDto) {

    const user = await this.prismaService.user.findFirst({
      where: { email: mailResendDto.email }
    });

    if (!user) this.exceptionHandler.errorNotFoundResponse('Este usuário não está cadastrado no sistema!');

    const confirmationCode = await this.prismaService.userActivationCode.findUnique({
      where: { idUser: user.idUser }
    });

    if (user.isActive && confirmationCode.confirmed) this.exceptionHandler.errorBadRequestResponse('Esta conta já foi ativa');

    await this.emailService.sendActivateAccountEmail(user.email, user.name, confirmationCode.code);

    const message = { severity: 'success', summary: 'Sucesso', detail: 'Código de ativação reenviado com sucesso!' };

    return {
      message,
      statusCode: HttpStatus.OK
    }
  }

  async changeUserActivity(changeUserStatusDTO: ChangeUserStatusDto, idUser: number) {
    const user = await this.getUserById(changeUserStatusDTO.userId);

    if (user.idUser == idUser) this.exceptionHandler.errorBadRequestResponse('Não é possível alterar o próprio status de atividade!');

    if (!user) this.exceptionHandler.errorNotFoundResponse('Este usuário não está cadastrado no sistema!');

    const selectedFields = userSelectConfig;

    return await this.prismaService.user.update({
      where: { idUser: changeUserStatusDTO.userId },
      data: { isActive: changeUserStatusDTO.isActive },
      select: selectedFields
    })
      .then(async (result) => {

        await this.auditingService.saveAudit({
          idUser: idUser,
          action: "ATUALIZAÇÃO DE ATIVIDADE DE USUÁRIO",
          entityType: "USER",
          changeType: "UPDATE",
          entityId: result.idUser,
          previousValue: user,
          newValue: result
        } as ActionAuditingModel);

        const message = { severity: 'success', summary: 'Sucesso', detail: 'Atividade do usuário atualizada com sucesso!' };

        return {
          data: result,
          message,
          statusCode: HttpStatus.CREATED
        };
      })
      .catch(() => {
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar atividade do usuário!');
      });
  }

  async saveNotificationToken(notificationToken: string, userId: number) {
    try {

      return await this.prismaService.userNotificationToken.upsert({
        where: { idUser: userId }, // Busca pelo userId, para garantir que cada usuário tenha um único token
        update: {
          token: notificationToken, // Atualiza o token se já existir
        },
        create: {
          token: notificationToken, // Cria um novo token se não existir
          user: {
            connect: {
              idUser: userId
            },
          },
        },
        include: {
          user: userTokenSelectConfig
        },
      })
        .then(notificationToken => {
          const message = { severity: 'success', summary: 'Sucesso', detail: 'Token de notificação cadastrado com sucesso!' };
          return {
            data: {
              idToken: notificationToken.idToken,
              token: notificationToken.token,
              user: notificationToken.user,
            },
            message,
            statusCode: HttpStatus.CREATED
          };
        });
    } catch (error) {
      this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar token de notificação!');
    }
  }

  async getUserById(idUser: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { idUser }
      });

      if (!user) this.exceptionHandler.errorBadRequestResponse(`O usuário id ${idUser} não está cadastrado no sistema!`);

      return user;
    } catch (err) {
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar usuário por id. Erro: ${err}`);
    }
  }

  async findUserByEmail(email: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { email: email }
      });

      return user;
    } catch (err) {
      console.log('err', err)
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar usuário por e-mail. Erro: ${err}`)
    }
  }

  async findUserByCpf(cpf: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { cpf: cpf }
      });

      if (user) this.exceptionHandler.errorBadRequestResponse(`O cpf ${cpf} já foi cadastrado no sistema!`);

      return user;
    } catch (err) {
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar usuário por cpf. Erro: ${err}`)
    }
  }
}
