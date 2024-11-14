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

@Injectable()
export class UserService {

  constructor(
    private readonly prismaService: PrismaService
  ) {}
  
  async create(user: CreateUserDto) {

    await this.validateFieldsUser(user);
    
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

  private async validateFieldsUser(user: CreateUserDto) {
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

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  inativateUser(id: number) {
    return `This action removes a #${id} user`;
  }
}
