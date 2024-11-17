import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/rolesPermission.decorator';
import { FastifyRequest } from 'fastify';
import { ExceptionHandler } from '../utils/services/exceptions/exceptions-handler';

interface UserInfo {
  idUser: number,
  email: string,
  role: string
}

interface DecodedToken {
  payload: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
    private readonly exceptionHandler: ExceptionHandler
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publicRoute = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (publicRoute) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const requestInfo = this.getUserInfo(request);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && !requiredRoles.includes(requestInfo.role)) this.exceptionHandler.errorUnauthorizedResponse('Este usuário não tem permissão para acessar este recurso!');

    const userInfo = await this.prismaService.user.findUnique({
      where: { idUser: requestInfo.idUser }
    });

    if (!userInfo) this.exceptionHandler.errorNotFoundResponse('Usuário não está cadastrado no sistema!');

    if(!userInfo.isActive) this.exceptionHandler.errorUnauthorizedResponse('Este usuário está inativo!');

    return true;
  }

  private getUserInfo(request: FastifyRequest): UserInfo {

    const authorizationHeader = request.headers.authorization as string;

    if(!authorizationHeader)
      this.exceptionHandler.errorUnauthorizedResponse('Token é requerido!');

    try {
      const response = {} as UserInfo;

      const decodedToken = verify(authorizationHeader, process.env.JWT_KEY) as DecodedToken;
      const userToken = JSON.parse(atob(decodedToken.payload));

      response.idUser = userToken.idUser;
      response.email = userToken.email;
      response.role = userToken.role;

      request['userId'] = response.idUser;

      return response;
    } catch (err) {
      this.exceptionHandler.errorUnauthorizedResponse('Token inválido!');
    } 
  }
}
