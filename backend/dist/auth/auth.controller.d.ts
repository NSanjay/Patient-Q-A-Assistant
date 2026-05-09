import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    selectCohort(cohort: string): {
        token: string;
        sessionId: string;
        variant: string;
    };
}
