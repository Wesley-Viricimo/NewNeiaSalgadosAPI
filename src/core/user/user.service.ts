import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UserSide } from './entities/user.entity';
import { cpf } from 'cpf-cnpj-validator';
import { hash } from 'bcryptjs';
import { paginator, PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { PaginatedOutputDto } from 'src/shared/dto/paginatedOutput.dto';
import { userSelectConfig } from './config/user-select-config';
import { Prisma, User } from '@prisma/client';
import { ChangeUserStatusDTO } from './dto/user-status.dto';

@Injectable()
export class UserService {

  constructor(
    private readonly prismaService: PrismaService
  ) {}
  
  async create(user: CreateUserDto) {

    await this.validateFieldsCreateUser(user);
    
      const passwordHash = await hash(user.password, 8);

      return await this.prismaService.user.create({
        data: {
          name: user.name,
          surname: user.surname,
          cpf: user.cpf,
          phone: user.phone,
          email: user.email,
          password: passwordHash
        },
      })
      .then(user => {
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
        console.log(err)
        const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao cadastrar usuário!' };
        throw new ErrorExceptionFilters('BAD_REQUEST', {
          message,
          statusCode: HttpStatus.BAD_REQUEST,
        })
      });
  }

  private async validateFieldsCreateUser(user: CreateUserDto) {
    if(user.cpf.length > 11) throw new ErrorExceptionFilters('BAD_REQUEST', `${UserSide['cpf']} não pode exceder 11 caracteres!`);
    if(!cpf.isValid(user.cpf)) throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['cpf']} não é válido!`);
    const cpfExists = await this.findUserByCpf(user.cpf);
    if(cpfExists) throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['cpf']} já está cadastrado no sistema!`);   

    const emailExists = await this.findUserByEmail(user.email);
    if(emailExists) throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['email']} já está cadastrado no sistema!`);
  }

  async findUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email: email }
    });

    return user;
  }

  async findUserByCpf(cpf: string) {
    const user = await this.prismaService.user.findUnique({
      where: { cpf: cpf }
    });

    return user;
  }

  async findAll(page: number, perPage: number): Promise<PaginatedOutputDto<Object>> {
    
    const selectedFields = userSelectConfig;

    const paginate: PaginatorTypes.PaginateFunction = paginator({ page, perPage });

    return await paginate<User, Prisma.UserFindManyArgs>(
      this.prismaService.user,
      {
        select: selectedFields
      },
      { page: page, perPage: perPage }
    )
    .then(response => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Usuários listados com sucesso.' };
      return {
        data: response.data,
        meta: response.meta,
        message,
        statusCode: HttpStatus.OK
      }
    })
    .catch(() => {
      const message = { severity: 'error', summary: 'Erro ao listar usuários', detail: 'Erro' };
      throw new ErrorExceptionFilters('BAD_REQUEST', {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      })
    });
  }

  async findById(id: number) {

    const user = await this.prismaService.user.findUnique({
      where: { idUser: id }
    });

    if(!user) throw new ErrorExceptionFilters('NOT_FOUND', `Este usuário não está cadastrado no sistema!`);

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

  async update(updateUserDto: UpdateUserDto, userId: number) {
    
    await this.validateFieldsUpdateUser(updateUserDto, userId);
  
    let passwordHash: string;

    if (updateUserDto.password) {
      passwordHash = await hash(updateUserDto.password, 8);
    }
  
    const updateUserData: any = {
      name: updateUserDto.name,
      surname: updateUserDto.surname,
      cpf: updateUserDto.cpf,
      email: updateUserDto.email,
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
      const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar usuário!' };
        throw new ErrorExceptionFilters('BAD_REQUEST', {
          message,
          statusCode: HttpStatus.BAD_REQUEST,
        })
    })
  }

  private async validateFieldsUpdateUser(user: UpdateUserDto, userId: number) {
    if(user.cpf) {
      if(user.cpf.length > 11) throw new ErrorExceptionFilters('BAD_REQUEST', `${UserSide['cpf']} não pode exceder 11 caracteres!`);
      if(!cpf.isValid(user.cpf)) throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['cpf']} não é válido!`);

      const cpfExists = await this.findUserByCpf(user.cpf);
      if(cpfExists && cpfExists.idUser !== userId) throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['cpf']} já está cadastrado no sistema!`);
    }    

    if(user.email) {
      const emailExists = await this.findUserByEmail(user.email);
      if(emailExists && emailExists.idUser !==userId) throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['email']} já está cadastrado no sistema!`);
    }
  }

  async changeUserActivity(id: number, changeUserStatusDTO: ChangeUserStatusDTO) {
    
    const user = await this.prismaService.user.findUnique({
      where: { idUser: id }
    });
  
    if (!user) throw new ErrorExceptionFilters('NOT_FOUND', `Este usuário não está cadastrado no sistema!`);
  
    const selectedFields = userSelectConfig;
  
    return await this.prismaService.user.update({
      where: { idUser: id },
      data: { isActive: changeUserStatusDTO.isActive },
      select: selectedFields
    })
    .then(result => {
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Atividade do usuário atualizada com sucesso!' };
      return {
        data: result,
        message,
        statusCode: HttpStatus.CREATED
      };
    })
    .catch((err) => {
      console.log(err);
      const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar atividade do usuário!' };
      throw new ErrorExceptionFilters('BAD_REQUEST', {
        message,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    });
  }  
}
