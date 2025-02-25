import { HttpStatus } from "@nestjs/common";

export class SuccessResponse<T = any> {
  message: string;
  data: T;
  statusCode: HttpStatus;

  constructor(message: string, statusCode: HttpStatus, data?: T) {
    this.message = message;
    this.data = data || null;
    this.statusCode = statusCode;
  }
}