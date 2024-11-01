import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
  UnauthorizedException,
  UnsupportedMediaTypeException
} from '@nestjs/common';

const createErrorFunction = (
  ExceptionClass: new (message?: string) => HttpException,
) => {
  return (errorMessage?: string) => {
    throw new ExceptionClass(errorMessage);
  };
};

const _errors = {
  BAD_REQUEST: createErrorFunction(BadRequestException),
  UNAUTHORIZED: createErrorFunction(UnauthorizedException),
  NOT_FOUND: createErrorFunction(NotFoundException),
  CONFLICT: createErrorFunction(ConflictException),
  PAYLOAD_TOO_LARGE: createErrorFunction(PayloadTooLargeException),
  INTERNAL_SERVER_ERROR: createErrorFunction(InternalServerErrorException),
  UNSUPPORTED_MEDIA_TYPE: createErrorFunction(UnsupportedMediaTypeException)
};

type DefinedErrors = keyof typeof _errors;

export class ErrorExceptionFilters {
  constructor(status: DefinedErrors, errorMessage?: any) {
    if (!status) return;
    _errors[status](errorMessage);
  }
}
