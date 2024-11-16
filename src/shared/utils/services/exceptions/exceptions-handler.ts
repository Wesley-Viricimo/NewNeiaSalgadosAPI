import { Injectable, HttpStatus } from '@nestjs/common';
import { ErrorExceptionFilters } from "../httpResponseService/errorResponse.service";

@Injectable()
export class ExceptionHandler {

  errorUnauthorizedResponse(detail: string) {
    const message = this.responseMessage('error', 'Erro', detail)
    throw new ErrorExceptionFilters('UNAUTHORIZED', {
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }

  errorBadRequestResponse(detail: string) {
    const message = this.responseMessage('error', 'Erro', detail);
    throw new ErrorExceptionFilters('BAD_REQUEST', {
      message,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }

  errorNotFoundResponse(detail: string) {
    const message = this.responseMessage('error', 'Erro', detail);
    throw new ErrorExceptionFilters('NOT_FOUND', {
      message,
      statusCode: HttpStatus.NOT_FOUND,
    });
  }

  errorForbiddenResponse(detail: string) {
    const message = this.responseMessage('error', 'Erro', detail);
    throw new ErrorExceptionFilters('FORBIDDEN', {
      message,
      statusCode: HttpStatus.FORBIDDEN,
    });
  }

  private responseMessage(severity: string, summary: string, detail: string) {
    return {
      severity,
      summary,
      detail
    }
  }
}

