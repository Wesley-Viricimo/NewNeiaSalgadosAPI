import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/service/errorResponse.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';
import { AuditingService } from 'src/service/auditing.service';
import { ProductService } from '../product/product.service';
import { S3Service } from 'src/service/aws/handle-fileS3.service';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    AuditingService,
    ProductService,
    S3Service,
  ],
})
export class CategoryModule { }
