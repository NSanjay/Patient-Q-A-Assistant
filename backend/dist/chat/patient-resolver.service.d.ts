import { PatientsService } from '../patients/patients.service';
import { Patient } from '../common/entities';
export interface ResolverResult {
    status: 'resolved' | 'clarification_needed' | 'not_found';
    patients?: Patient[];
    clarificationMessage?: string;
}
export declare class PatientResolverService {
    private patientsService;
    constructor(patientsService: PatientsService);
    resolve(query: string, cohort: string): Promise<ResolverResult>;
    private tryNameMatch;
    private isCommonWord;
    private extractMedKeywords;
    private extractConditionKeywords;
    private clarify;
}
