import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { UserSide } from './entities/user.entity';
import { cpf } from 'cpf-cnpj-validator';
import { hash } from 'bcryptjs';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { Prisma } from '@prisma/client';
import { ROLES } from './constants/users.constants';
import { EmailService } from 'src/service/aws/send-email.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { ActionAuditingModel } from 'src/shared/types/auditing';
import { ChangeUserStatusDto, MailConfirmationDto, ResendEmailDto, UserDto, UserQuery, UserUpdateParams } from './dto/user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly exceptionHandler: ExceptionHandler,
    private readonly auditingService: AuditingService,
    private readonly userRepository: UserRepository
  ) { }

  async create(userDto: UserDto) {
    await this.validateFieldsCreateUser(userDto);

    const passwordHash = await hash(userDto.password, 8);

    return await this.userRepository.createUser(userDto, passwordHash)
      .then(async (user) => {
        const activationCode = this.generateActivationCode();

        await this.userRepository.updateActivationCode(activationCode, user.idUser);

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
      .catch((err) => {
        this.logger.error(`Erro ao cadastrar usuário: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar usuário!');
      });
  }

  async createAdmin(user: UserDto) {
    await this.validateFieldsCreateUser(user);

    const passwordHash = await hash(user.password, 8);

    return await this.userRepository.createAdminUser(user, passwordHash)
      .then(async (user) => {
        const activationCode = this.generateActivationCode();

        await this.userRepository.updateActivationCode(activationCode, user.idUser);

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
      .catch((err) => {
        this.logger.error(`Erro ao cadastrar usuário administrador ${user.role}: ${err}`);
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
    const where: Prisma.UserWhereInput = {};

    if (userQuery.user) where.name = { contains: userQuery.user, mode: 'insensitive' };
    if (userQuery.cpf) where.cpf = { contains: userQuery.cpf, mode: 'insensitive' };
    if (userQuery.status == 'active') where.isActive = true;
    if (userQuery.status == 'inactive') where.isActive = false;

    return await this.userRepository.findAllUsersPaginated(userQuery, where)
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

    const user = await this.getUserById(userId);

    return await this.userRepository.updateUser(user, userDto, passwordHash)
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
      .catch((err) => {
        this.logger.error(`Erro ao atualizar usuário: ${err}`);
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

    return await this.userRepository.updateUserRole(userUpdate.userId, ROLES[userUpdate.role])
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
      .catch((err) => {
        this.logger.error(`Erro ao atualizar função do usuário: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar função do usuário!')
      })
  }

  async confirmationCode(mailConfirmation: MailConfirmationDto) {
    const user = await this.userRepository.findUserByEmail(mailConfirmation.email);

    if (!user) this.exceptionHandler.errorNotFoundResponse('Este usuário não está cadastrado no sistema!');

    const confirmationCode = await this.userRepository.findUserActivationCode(user.idUser);

    const userConfirmationSelectConfig = {
      select: {
        confirmed: true
      }
    }

    if (confirmationCode) {
      if (confirmationCode.confirmed) this.exceptionHandler.errorBadRequestResponse('Esta conta já foi ativa!');
      if (confirmationCode.code !== mailConfirmation.code.toUpperCase()) this.exceptionHandler.errorBadRequestResponse('Este código de ativação está incorreto!');

      await this.userRepository.updateUserActivationCode(confirmationCode.idCode);

      return await this.userRepository.updateUserActivity(user.idUser, userConfirmationSelectConfig)
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
        .catch((err) => {
          this.logger.error(`Erro ao ativar conta do usuário: ${err}`);
          this.exceptionHandler.errorBadRequestResponse('Erro ao ativar conta!');
        });
    }
  }

  async resendConfirmationCode(mailResendDto: ResendEmailDto) {
    const user = await this.userRepository.findUserByEmail(mailResendDto.email);

    if (!user) this.exceptionHandler.errorNotFoundResponse('Este usuário não está cadastrado no sistema!');

    const confirmationCode = await this.userRepository.findUserActivationCode(user.idUser);

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

    return await this.userRepository.updateUserActivationCodeStatus(changeUserStatusDTO.userId, changeUserStatusDTO.isActive)
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
      .catch((err) => {
        this.logger.error(`Erro ao atualizar atividade do usuário: ${err}`);
        this.exceptionHandler.errorBadRequestResponse('Erro ao atualizar atividade do usuário!');
      });
  }

  async saveNotificationToken(notificationToken: string, userId: number) {
    try {
      return await this.userRepository.saveNotificationToken(userId, notificationToken)
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
      this.logger.error(`Erro ao cadastrar token de notificação: ${error}`);
      this.exceptionHandler.errorBadRequestResponse('Erro ao cadastrar token de notificação!');
    }
  }

  async getUserById(idUser: number) {
    try {
      const user = await this.userRepository.findUserById(idUser);
      if (!user) this.exceptionHandler.errorBadRequestResponse(`O usuário id ${idUser} não está cadastrado no sistema!`);

      return user;
    } catch (err) {
      this.logger.error(`Erro ao buscar usuário por id: ${err}`);
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar usuário por id. Erro: ${err}`);
    }
  }

  async findUserByEmail(email: string) {
    try {
      const user = await this.userRepository.findUserByEmail(email);

      return user;
    } catch (err) {
      this.logger.error(`Erro ao buscar usuário por e-mail: ${err}`);
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar usuário por e-mail. Erro: ${err}`)
    }
  }

  async findUserByCpf(cpf: string) {
    try {
      const user = await this.userRepository.findUserByCpf(cpf);
      if (user) throw new Error(`O cpf ${cpf} já foi cadastrado no sistema!`);

      return user;
    } catch (err) {
      this.logger.error(`Erro ao buscar usuário por cpf: ${err}`);
      if (err instanceof Error) this.exceptionHandler.errorBadRequestResponse(err.message);
      this.exceptionHandler.errorBadRequestResponse(`Houve um erro inesperado ao buscar usuário por cpf. Erro: ${err}`)
    }
  }
}
