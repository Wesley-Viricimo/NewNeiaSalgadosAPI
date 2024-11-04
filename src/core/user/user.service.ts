import { Injectable, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UserSide } from './entities/user.entity';
import { cpf } from 'cpf-cnpj-validator';
import { hash } from 'bcryptjs';

@Injectable()
export class UserService {

  constructor(
    private readonly prismaService: PrismaService
  ) {}
  
  async create(user: CreateUserDto) {

    if(!user.name) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${UserSide['name']} não pode ser vazio!`);
    }

    if(!user.surname) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${UserSide['surname']} não pode ser vazio!`);
    }

    if(!user.cpf) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${UserSide['cpf']} não pode ser vazio!`);
    }

    if(!user.phone) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${UserSide['phone']} não pode ser vazio!`);
    }

    if(!user.email) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${UserSide['email']} não pode ser vazio!`);
    }

    if(!user.password) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `O ${UserSide['password']} deve ser fornecido!`);
    }

    if(!cpf.isValid(user.cpf)) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['cpf']} não é válido!`);
    }

    const emailExists = await this.prismaService.user.findFirst({
      where: { email: user.email }
    });

    if (emailExists) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['email']} já está cadastrado no sistema!`);
    }

    const cpfExists = await this.prismaService.user.findFirst({
      where: { cpf: user.cpf }
    });

    if (cpfExists) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['cpf']} já está cadastrado no sistema!`);
    }
    
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

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
