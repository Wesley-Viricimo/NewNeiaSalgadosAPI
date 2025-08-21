import { Module } from '@nestjs/common';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { ViaCepService } from 'src/service/viacep.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { ErrorExceptionFilters } from 'src/service/errorResponse.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { UserService } from '../user/user.service';
import { AuditingService } from 'src/service/auditing.service';
import { EmailService } from 'src/service/aws/send-email.service';

@Module({
  imports: [HttpModule],
  controllers: [AddressController],
  providers: [
    AddressService,
    ViaCepService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    UserService,
    EmailService,
    ExceptionHandler,
    AuditingService
  ],
})
export class AddressModule { }
