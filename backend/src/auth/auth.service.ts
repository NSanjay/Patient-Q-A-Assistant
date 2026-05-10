import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

export type Cohort = 'A' | 'B';

export interface SessionPayload {
  cohort: Cohort;
  sessionId: string;
  variant: 'A' | 'B';
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateToken(cohort: Cohort): { token: string; sessionId: string; variant: string } {
    const sessionId = uuidv4();
    const lastChar = sessionId.replace(/-/g, '').slice(-1);
    const variant = parseInt(lastChar, 16) % 2 === 0 ? 'A' : 'B';
    console.log(lastChar, variant)
    const payload: SessionPayload = { cohort, sessionId, variant };
    const token = this.jwtService.sign(payload);
    return { token, sessionId, variant };
  }

  verifyToken(token: string): SessionPayload {
    return this.jwtService.verify<SessionPayload>(token);
  }
}
