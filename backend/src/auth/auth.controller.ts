import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService, Cohort } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('select-cohort')
  selectCohort(@Body('cohort') cohort: string) {
    if (cohort !== 'A' && cohort !== 'B') {
      throw new BadRequestException('Cohort must be A or B');
    }
    return this.authService.generateToken(cohort as Cohort);
  }
}
