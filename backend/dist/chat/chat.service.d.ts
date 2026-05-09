import { PatientResolverService } from './patient-resolver.service';
import { AgentService } from './agent.service';
import { LoggingService } from '../logging/logging.service';
import { PatientsService } from '../patients/patients.service';
export declare class ChatService {
    private resolver;
    private agent;
    private logger;
    private patients;
    constructor(resolver: PatientResolverService, agent: AgentService, logger: LoggingService, patients: PatientsService);
    handleMessage(input: {
        message: string;
        cohort: string;
        sessionId: string;
        variant: 'A' | 'B';
        conversationHistory: Array<{
            role: string;
            content: string;
        }>;
    }): Promise<{
        answer: string;
        citations: never[];
        confidence: string;
        injectionDetected: boolean;
        clarificationNeeded?: undefined;
        patient?: undefined;
        variant?: undefined;
    } | {
        answer: string | undefined;
        citations: never[];
        confidence: string;
        clarificationNeeded: boolean;
        injectionDetected?: undefined;
        patient?: undefined;
        variant?: undefined;
    } | {
        answer: string;
        citations: never[];
        confidence: string;
        injectionDetected?: undefined;
        clarificationNeeded?: undefined;
        patient?: undefined;
        variant?: undefined;
    } | {
        answer: string;
        citations: {
            table: string;
            field: string;
            value: string;
        }[];
        confidence: "High" | "Medium" | "Low";
        patient: {
            id: string;
            name: string;
        };
        variant: "A" | "B";
        injectionDetected?: undefined;
        clarificationNeeded?: undefined;
    }>;
}
