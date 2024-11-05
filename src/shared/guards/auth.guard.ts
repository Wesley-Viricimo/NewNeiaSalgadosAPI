import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/rolesPermission.decorator';
import { ErrorExceptionFilters } from '../utils/services/httpResponseService/errorResponse.service';

interface UserInfo {
  idUser: number,
  email: string,
  isActive: boolean,
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
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publicRoute = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (publicRoute) return true;

    const request = context.switchToHttp().getRequest() as Request;

    const requestInfo = this.getUserInfo(request);

    if(!requestInfo.isActive) throw new HttpException('Usuário inativo', HttpStatus.UNAUTHORIZED);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && !requiredRoles.includes(requestInfo.role)) {
      this.unauthorizedUserResponse();
    }

    try {
      const userInfo = await this.prismaService.user.findUnique({
        where: { idUser: requestInfo.idUser }
      });

      if (!userInfo) throw new HttpException('Usuário não foi encontrado', HttpStatus.NOT_FOUND);
      
    } catch (error) {
      this.invalidToken();
    }

    return true;
  }

  private getUserInfo(request: Request): UserInfo {

    const authorizationHeader = request.headers.authorization as string;

    if(!authorizationHeader)
      this.requiredTokenResponse();

    try {
      const response = {} as UserInfo;

      const decodedToken = verify(authorizationHeader, process.env.JWT_KEY) as DecodedToken;
      const userToken = JSON.parse(atob(decodedToken.payload));

      response.idUser = userToken.idUser;
      response.email = userToken.email;
      response.role = userToken.role;
      response.isActive = userToken.isActive;

      request['userId'] = response.idUser;

      return response;
    } catch (err) {
      this.invalidToken();
    } 
  }

  private unauthorizedUserResponse() {
    const message = { severity: 'error', summary: 'Forbidden', detail: 'Este usuário não tem permissão para acessar este recurso!' };
    throw new ErrorExceptionFilters('FORBIDDEN', {
      message,
      statusCode: HttpStatus.FORBIDDEN,
    });
  }

  private requiredTokenResponse() {
    const message = { severity: 'error', summary: 'Forbidden', detail: 'Token é requerido!' };
    throw new ErrorExceptionFilters('UNAUTHORIZED', {
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }

  private invalidToken() {
    const message = { severity: 'error', summary: 'Error', detail: 'Token inválido!' };
    throw new ErrorExceptionFilters('INTERNAL_SERVER_ERROR', {
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
