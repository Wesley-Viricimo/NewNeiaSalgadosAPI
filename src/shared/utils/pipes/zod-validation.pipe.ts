// zod-validation.pipe.ts
import { PipeTransform, Injectable } from '@nestjs/common';
import { ZodSchema, ZodIssue } from 'zod';
import { HttpStatus } from '@nestjs/common';
import { ErrorExceptionFilters } from '../../../service/errorResponse.service';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: any) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatErrors(result.error.issues);
      const formattedResponse = this.responseErrorMessage('Erro de validação', errors);

      throw new ErrorExceptionFilters('BAD_REQUEST', {
        message: formattedResponse,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    return result.data;
  }

  private formatErrors(issues: ZodIssue[]): { path: string; message: string }[] {
    return issues.map((err) => {
      const path = err.path.join('.');
      return { path, message: err.message };
    });
  }

  private responseErrorMessage(title: string, errors: { path: string; message: string }[]) {
    return {
      title,
      errors,
    };
  }
}