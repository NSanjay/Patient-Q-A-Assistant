import { Repository } from 'typeorm';
import { RequestLog } from '../common/entities';
export declare class LoggingService {
    private logRepo;
    constructor(logRepo: Repository<RequestLog>);
    log(data: {
        cohort: string;
        sessionId: string;
        variant: string;
        rawQuery: string;
        resolvedPatientId?: string;
        recordsRetrieved?: any;
        rawModelOutput?: string;
        answer?: string;
        citations?: any;
        confidence?: string;
        injectionDetected?: boolean;
        injectionDetails?: string;
        cohortViolation?: boolean;
    }): Promise<void>;
}
