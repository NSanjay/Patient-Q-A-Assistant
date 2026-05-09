"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const patient_resolver_service_1 = require("./patient-resolver.service");
const agent_service_1 = require("./agent.service");
const logging_service_1 = require("../logging/logging.service");
const patients_service_1 = require("../patients/patients.service");
const INJECTION_PATTERNS = [
    /ignore\s+(previous|above|all|your)\s+instructions/i,
    /forget\s+(everything|your|all)/i,
    /you\s+are\s+now\s+a/i,
    /pretend\s+(you|to)/i,
    /reveal\s+(your\s+)?(system\s+)?prompt/i,
    /show\s+me\s+(all\s+)?(other\s+)?patients/i,
    /access\s+(group|cohort)\s+[ab]/i,
    /switch\s+(to\s+)?(group|cohort)/i,
    /what\s+patients\s+are\s+in\s+(group|cohort)/i,
    /list\s+all\s+patients/i,
    /override\s+(your\s+)?(system|instructions)/i,
    /jailbreak/i,
    /DAN/,
    /as\s+an\s+AI\s+without\s+restrictions/i,
    /print\s+(your\s+)?(system\s+)?prompt/i,
    /what\s+is\s+your\s+(system\s+)?prompt/i,
];
const SAFE_FALLBACK = 'I cannot find a matching patient in your cohort, or I cannot answer this question based on the available records.';
let ChatService = class ChatService {
    resolver;
    agent;
    logger;
    patients;
    constructor(resolver, agent, logger, patients) {
        this.resolver = resolver;
        this.agent = agent;
        this.logger = logger;
        this.patients = patients;
    }
    async handleMessage(input) {
        const { message, cohort, sessionId, variant, conversationHistory } = input;
        const injectionMatch = INJECTION_PATTERNS.find(p => p.test(message));
        if (injectionMatch) {
            await this.logger.log({
                cohort, sessionId, variant,
                rawQuery: message,
                injectionDetected: true,
                injectionDetails: `Pattern matched: ${injectionMatch.toString()}`,
                cohortViolation: false,
                answer: 'BLOCKED',
                confidence: 'Low',
                citations: [],
                rawModelOutput: '',
                resolvedPatientId: '',
                recordsRetrieved: {},
            });
            return {
                answer: 'I cannot process that request.',
                citations: [],
                confidence: 'Low',
                injectionDetected: true,
            };
        }
        const resolved = await this.resolver.resolve(message, cohort);
        if (resolved.status === 'clarification_needed') {
            return {
                answer: resolved.clarificationMessage,
                citations: [],
                confidence: 'Low',
                clarificationNeeded: true,
            };
        }
        if (resolved.status === 'not_found' || !resolved.patients?.length) {
            await this.logger.log({
                cohort, sessionId, variant,
                rawQuery: message,
                injectionDetected: false,
                cohortViolation: false,
                answer: 'Patient not found',
                confidence: 'Low',
                citations: [],
                rawModelOutput: '',
                resolvedPatientId: '',
                recordsRetrieved: {},
            });
            return { answer: SAFE_FALLBACK, citations: [], confidence: 'Low' };
        }
        const patient = resolved.patients[0];
        const records = await this.patients.getAllRecords(patient.id, cohort);
        if (!records) {
            await this.logger.log({
                cohort, sessionId, variant,
                rawQuery: message,
                injectionDetected: false,
                cohortViolation: true,
                injectionDetails: `Attempted access to patient ${patient.id} outside cohort ${cohort}`,
                answer: 'BLOCKED',
                confidence: 'Low',
                citations: [],
                rawModelOutput: '',
                resolvedPatientId: patient.id,
                recordsRetrieved: {},
            });
            return { answer: SAFE_FALLBACK, citations: [], confidence: 'Low' };
        }
        const agentOutput = await this.agent.run({
            query: message,
            patientContext: records,
            variant,
            conversationHistory,
        });
        const modelDetectedInjection = agentOutput.rawOutput.includes('INJECTION_DETECTED');
        await this.logger.log({
            cohort, sessionId, variant,
            rawQuery: message,
            resolvedPatientId: patient.id,
            recordsRetrieved: {
                patient: { table: 'patient', id: patient.id },
                allergies: records.allergies.map(a => ({ table: 'patient_allergy', id: a.id })),
                conditions: records.conditions.map(c => ({ table: 'patient_condition', id: c.id })),
                medications: records.medications.map(m => ({ table: 'patient_medication', id: m.id })),
                observations: records.observations.map(o => ({ table: 'patient_observation', id: o.id })),
            },
            rawModelOutput: agentOutput.rawOutput,
            answer: agentOutput.answer,
            citations: agentOutput.citations,
            confidence: agentOutput.confidence,
            injectionDetected: modelDetectedInjection,
            injectionDetails: modelDetectedInjection ? 'Detected by LLM' : '',
            cohortViolation: false,
        });
        return {
            answer: modelDetectedInjection ? 'I cannot process that request.' : agentOutput.answer,
            citations: agentOutput.citations,
            confidence: agentOutput.confidence,
            patient: { id: patient.id, name: `${patient.name_first} ${patient.name_last}` },
            variant,
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [patient_resolver_service_1.PatientResolverService,
        agent_service_1.AgentService,
        logging_service_1.LoggingService,
        patients_service_1.PatientsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map