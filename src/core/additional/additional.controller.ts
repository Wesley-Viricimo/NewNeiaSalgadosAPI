import { FastifyRequest } from 'fastify';
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, Req, Query } from '@nestjs/common';
import { AdditionalService } from './additional.service';
import { Roles } from 'src/shared/decorators/rolesPermission.decorator';
import { PaginatedOutputDto } from 'src/shared/pagination/paginatedOutput.dto';
import { ZodValidationPipe } from 'src/shared/utils/pipes/zod-validation.pipe';
import { AdditionalDto, AdditionalDtoSchema, AdditionalQuery, AdditionalQuerySchema } from './dto/additional.dto';

@Controller('api/v1/additional')
export class AdditionalController {
  constructor(private readonly additionalService: AdditionalService) { }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(
    @Body(new ZodValidationPipe(AdditionalDtoSchema)) additionalDto: AdditionalDto,
    @Req() request: FastifyRequest
  ) {
    return this.additionalService.create(additionalDto, request['userId']);
  }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.CREATED)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AdditionalDtoSchema)) additionalDto: AdditionalDto,
    @Req() request: FastifyRequest
  ) {
    return this.additionalService.update(+id, additionalDto, request['userId']);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async findAllAdditional(
    @Query(new ZodValidationPipe(AdditionalQuerySchema)) additionalQuery: AdditionalQuery
  ): Promise<PaginatedOutputDto<Object>> {
    return await this.additionalService.findAllAdditional(additionalQuery);
  }

  @Roles('ADMIN', 'DEV')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() request: FastifyRequest
  ) {
    return this.additionalService.remove(+id, request['userId']);
  }
}
