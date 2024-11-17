import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';
import { S3Service } from 'src/shared/utils/aws/upload-fileS3.service';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler,
    S3Service
  ],
})
export class ProductModule {}
