import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/AuthDto';
import { Public } from 'src/shared/decorators/publicRoute.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  create(@Body() user: AuthDto) {
    return this.authService.auth(user);
  }
}
