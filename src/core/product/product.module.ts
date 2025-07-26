import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/service/errorResponse.service';
import { S3Service } from 'src/service/aws/handle-fileS3.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    S3Service,
    AuditingService
  ],
})
export class ProductModule {}
