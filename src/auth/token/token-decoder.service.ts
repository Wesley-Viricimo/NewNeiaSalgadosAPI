import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { TokenAuthPayload } from '../auth.service';

@Injectable()
export class TokenDecoderService {
  decodeToken(token: string): TokenAuthPayload {
    try {
      const decoded = verify(token, process.env.JWT_KEY) as any;
      
      if (!decoded.payload) {
        throw new HttpException('Invalid token structure', HttpStatus.UNAUTHORIZED);
      }

      const payload = JSON.parse(atob(decoded.payload));
      return payload as TokenAuthPayload;
    } catch (error) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }
}