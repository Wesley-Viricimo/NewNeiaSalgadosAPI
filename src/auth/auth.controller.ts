import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/shared/decorators/publicRoute.decorator';
import { AuthDto, AuthDtoSchema } from './dto/auth.dto';
import { ZodValidationPipe } from 'src/shared/utils/pipes/zod-validation.pipe';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  create(@Body(new ZodValidationPipe(AuthDtoSchema)) user: AuthDto) {
    return this.authService.auth(user);
  }
}
