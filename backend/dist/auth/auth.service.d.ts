import { JwtService } from '@nestjs/jwt';
export type Cohort = 'A' | 'B';
export interface SessionPayload {
    cohort: Cohort;
    sessionId: string;
    variant: 'A' | 'B';
}
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    generateToken(cohort: Cohort): {
        token: string;
        sessionId: string;
        variant: string;
    };
    verifyToken(token: string): SessionPayload;
}
