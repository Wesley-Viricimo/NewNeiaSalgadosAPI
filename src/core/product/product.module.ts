import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    ErrorExceptionFilters,
    PrismaService
  ],
})
export class ProductModule {}
