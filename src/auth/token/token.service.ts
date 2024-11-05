import { sign } from 'jsonwebtoken';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class TokenService<T> {
    async createToken(payload: T): Promise<string> {
        const encodedPayload = btoa(JSON.stringify({ ...payload }));
        try {
          return sign({ payload: encodedPayload }, process.env.JWT_KEY, {
            expiresIn: '1 day',
          });
        } catch (error) {
          throw new HttpException('Erro ao gerar token', HttpStatus.BAD_REQUEST);
        }
      }
}
