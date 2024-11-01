import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/AuthDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('create')
  create(@Body() user: AuthDto) {
    return this.authService.auth(user);
  }
}
