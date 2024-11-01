import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/AuthDto';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService
  ){}

  auth(auth: AuthDto) {
    return 'This action adds a new auth';
  }
}
