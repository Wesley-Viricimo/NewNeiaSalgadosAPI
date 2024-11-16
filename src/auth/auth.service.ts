import { Injectable, HttpStatus } from '@nestjs/common';
import { AuthDto } from './dto/AuthDto';
import { UserService } from 'src/core/user/user.service';
import { compare } from 'bcryptjs';
import { TokenService } from './token/token.service';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';

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
    private readonly tokenService: TokenService<TokenAuthPayload>
  ){}

  async auth(auth: AuthDto) {
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
}
