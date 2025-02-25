import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ErrorExceptionFilters } from 'src/shared/utils/httpResponseService/errorResponse.service';
import { ExceptionHandler } from 'src/shared/utils/exceptions/exceptions-handler';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryService,
    ErrorExceptionFilters,
    PrismaService,
    ExceptionHandler
  ],
})
export class CategoryModule {}
