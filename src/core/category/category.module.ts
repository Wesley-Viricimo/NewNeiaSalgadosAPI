import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { ErrorExceptionFilters } from 'src/shared/utils/services/httpResponseService/errorResponse.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ExceptionHandler } from 'src/shared/utils/services/exceptions/exceptions-handler';

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
