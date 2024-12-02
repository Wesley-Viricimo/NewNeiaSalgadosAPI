import { Injectable, HttpStatus } from '@nestjs/common';
import { AuthDto } from './dto/AuthDto';
import { UserService } from 'src/core/user/user.service';
import { compare } from 'bcryptjs';
import { TokenService } from './token/token.service';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';

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
    private readonly exceptionHandler: ExceptionHandler
  ){}

  async auth(auth: AuthDto) {
    const { email, password } = auth;
    const user = await this.userService.findUserByEmail(email);

    if(!user) this.exceptionHandler.errorUnauthorizedResponse('Nome de usuário ou senha incorretos. Verifique e tente novamente.');

    if(!user.isActive) this.exceptionHandler.errorUnauthorizedResponse('Este usuário está inativo');
      
    const compareHash = await compare(password, user.password);

    if(user && compareHash) {
      const payload = this.createPayload(user);
      
      const message = { severity: 'success', summary: 'Sucesso', detail: 'Usuário autenticado com sucesso!' };

      return { 
        data: {
          userId: user.idUser,
          name: user.surname,
          role: user.role,
          token: await this.tokenService.createToken(payload)
        },
        message,
        status: HttpStatus.CREATED
      };
    } else {
      this.exceptionHandler.errorUnauthorizedResponse('Nome de usuário ou senha incorretos. Verifique e tente novamente.');
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

}
