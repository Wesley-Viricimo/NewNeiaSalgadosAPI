import { Injectable, HttpStatus } from '@nestjs/common';
import { ErrorExceptionFilters } from "../httpResponseService/errorResponse.service";

@Injectable()
export class ExceptionHandler {

  errorUnauthorizedResponse(detail: string) {
    const message = this.responseErrorMessage('Unauthorized', detail)
    throw new ErrorExceptionFilters('UNAUTHORIZED', {
      message,
      statusCode: HttpStatus.UNAUTHORIZED
    });
  }

  errorBadRequestResponse(detail: string) {
    const message = this.responseErrorMessage('Erro', detail);
    throw new ErrorExceptionFilters('BAD_REQUEST', {
      message,
      statusCode: HttpStatus.BAD_REQUEST
    });
  }

  errorNotFoundResponse(detail: string) {
    const message = this.responseErrorMessage('Not Found', detail);
    throw new ErrorExceptionFilters('NOT_FOUND', {
      message,
      statusCode: HttpStatus.NOT_FOUND
    });
  }

  errorUnsupportedMediaTypeResponse(detail: string) {
    const message = this.responseErrorMessage('Unsupported Media Type', detail);
    throw new ErrorExceptionFilters('UNSUPPORTED_MEDIA_TYPE', {
      message,
      statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE
    });
  }

  errorForbiddenResponse(detail: string) {
    const message = this.responseErrorMessage('Unauthorized', detail);
    throw new ErrorExceptionFilters('FORBIDDEN', {
      message,
      statusCode: HttpStatus.FORBIDDEN
    });
  }

  private responseErrorMessage(summary: string, detail: string) {
    return {
      severity: 'error',
      summary: summary,
      detail
    }
  }
}

