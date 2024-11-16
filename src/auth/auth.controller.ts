import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/AuthDto';
import { Public } from 'src/shared/decorators/publicRoute.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  create(@Body() user: AuthDto) {
    return this.authService.auth(user);
  }

  @Public()
  @Get('confirm-email')
  confirmationEmail(@Query('token') token: string) {
    console.log('rota acessada', token)
  }
}
