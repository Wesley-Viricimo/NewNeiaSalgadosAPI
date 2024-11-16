import { Injectable, HttpStatus } from '@nestjs/common';
import { AuthDto } from './dto/AuthDto';
import { UserService } from 'src/core/user/user.service';
import { compare } from 'bcryptjs';
import { TokenService } from './token/token.service';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MailConfirmation } from './dto/MailConfirmationDto';

interface TokenAuthPayload {
  idUser: number,
  email: string,
  isActive: boolean,
  role: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService<TokenAuthPayload>,
    private readonly prismaService: PrismaService
  ){}

  async auth(auth: AuthDto) {
    try {
      const { email, password } = auth;
      const user = await this.userService.findUserByEmail(email);

      if(!user) this.autenticationFailedResponse();

      if(!user.isActive) throw new ErrorExceptionFilters('UNAUTHORIZED', `Este usuário está inativo!`);
      
      const compareHash = await compare(password, user.password);

      if(user && compareHash) {
        const payload = this.createPayload(user);
        
        const message = { severity: 'success', summary: 'Sucesso', detail: 'Usuário autenticado com sucesso!' };

        return { 
          data: {
            userId: user.idUser,
            email: user.email,
            token: await this.tokenService.createToken(payload)
          },
          message,
          status: HttpStatus.CREATED
        };
      } else {
        this.autenticationFailedResponse();
      }

    } catch (err) {
      this.autenticationFailedResponse();
    }
  }

  private createPayload(user: any): TokenAuthPayload {
    return {
      idUser: user.idUser,
      email: user.email,
      isActive: user.isActive,
      role: user.role
    }
  }

  private autenticationFailedResponse() {
    const message = { severity: 'error', summary: 'Erro', detail: 'Nome de usuário ou senha incorretos. Verifique e tente novamente.' };
      throw new ErrorExceptionFilters('UNAUTHORIZED', {
        message,
        statusCode: HttpStatus.UNAUTHORIZED,
      });
  }
  
  async confirmationCode(mailConfirmation: MailConfirmation) {

    const user = await this.prismaService.user.findFirst({
      where: { email: mailConfirmation.email }
    });

    if(!user) throw new ErrorExceptionFilters('NOT_FOUND', `Este usuário não está cadastrado no sistema!`);

    const confirmationCode = await this.prismaService.userActivationCode.findUnique({
      where: { idUser: user.idUser }
    });

    const userConfirmationSelectConfig = {
      select: {
        confirmed: true
      }
    }

    if(confirmationCode) {
      if(confirmationCode.confirmed) throw new ErrorExceptionFilters('NOT_FOUND', `Esta conta já foi ativa!`);

      if(confirmationCode.code !== mailConfirmation.code.toUpperCase()) throw new ErrorExceptionFilters('NOT_FOUND', `Este código de ativação está incorreto!`);

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
        const message = { severity: 'error', summary: 'Erro', detail: 'Erro ao ativar conta!' };
        throw new ErrorExceptionFilters('BAD_REQUEST', {
          message,
          statusCode: HttpStatus.BAD_REQUEST,
        })
      });
    }
  }
}
