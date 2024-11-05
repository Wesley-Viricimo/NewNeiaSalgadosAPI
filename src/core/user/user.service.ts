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

    this.verifyCpfIsValid(user.cpf);

    await this.verifyEmailExists(user.email);

    await this.verifyCpfExists(user.cpf);
    
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

  verifyCpfIsValid(userCpf: string) {
    if(!cpf.isValid(userCpf)) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['cpf']} não é válido!`);
    }
  }

  async verifyEmailExists(email: string) {
    const emailExists = await this.findUserByEmail(email);
      
    if(emailExists) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['email']} já está cadastrado no sistema!`);
    }
  }

  async findUserByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email: email }
    });

    return user;
  }

  async verifyCpfExists(cpf: string) {
    const cpfExists = await this.findUserByCpf(cpf);
    
    if(cpfExists) {
      throw new ErrorExceptionFilters('BAD_REQUEST', `Este ${UserSide['cpf']} já está cadastrado no sistema!`);
    }
    
  }

  async findUserByCpf(cpf: string) {
    const user = await this.prismaService.user.findUnique({
      where: { cpf: cpf }
    });

    return user;
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
