import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { hash } from 'bcryptjs';

@Injectable()
export class UserService {

  constructor(
    private readonly prismaService: PrismaService
  ) {}
  
  async create(user: CreateUserDto) {
    
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
            status: user.status
          },
          message,
          statusCode: HttpStatus.CREATED
        };
      })
      .catch((err) => {
        console.log(err);
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
