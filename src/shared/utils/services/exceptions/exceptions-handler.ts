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

      private responseMessage(severity: string, summary: string, detail: string) {
        return {
          severity,
          summary,
          detail
        }
      }
}

