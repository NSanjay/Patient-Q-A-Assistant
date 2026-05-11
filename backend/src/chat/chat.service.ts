import { Injectable } from '@nestjs/common';
import { PatientResolverService } from './patient-resolver.service';
import { AgentService } from './agent.service';
import { LoggingService } from '../logging/logging.service';
import { PatientsService } from '../patients/patients.service';

import * as CONSTANTS from '../common/constants';


@Injectable()
export class ChatService {
  constructor(
    private resolver: PatientResolverService,
    private agent: AgentService,
    private logger: LoggingService,
    private patients: PatientsService,
  ) {}

  async handleMessage(input: {
    message: string;
    cohort: string;
    sessionId: string;
    variant: 'A' | 'B';
    conversationHistory: Array<{ role: string; content: string }>;
  }) {
    const { message, cohort, sessionId, variant, conversationHistory } = input;

    const baseLog = {
        cohort, sessionId, variant,
        rawQuery: message,
        injectionDetected: false,
        cohortViolation: false,
        answer: CONSTANTS.SAFE_FALLBACK_ANSWER,
        confidence: 'Low',
        citations: [],
        rawModelOutput: '',
        resolvedPatientId: '',
        recordsRetrieved: {},
        fallbackTriggered: true,
      }
    // ── 1. LLM Injection Classifier (before any DB access) ────────────────
    const injectionResult = await this.agent.classifyInjection(message);
    if (injectionResult.isInjection) {
      await this.logger.log({
        cohort, sessionId, variant,
        rawQuery: message,
        injectionDetected: true,
        injectionDetails: injectionResult.reason,
        cohortViolation: false,
        answer: 'BLOCKED',
        confidence: 'Low',
        citations: [],
        rawModelOutput: '',
        resolvedPatientId: '',
        recordsRetrieved: {},
        fallbackTriggered: true,
      });
      return {
        answer: CONSTANTS.INJECTION_FALLBACK_ANSWER,
        citations: [],
        confidence: 'Low',
        injectionDetected: true,
      };
    }

    // ── 2. Resolve patient ─────────────────────────────────────────────────
    const enrichedMessage = await this.agent.enrichWithHistory(message, conversationHistory);
    const resolved = await this.resolver.resolve(enrichedMessage, cohort);
    const rawAndEnrichedMessage = enrichedMessage !== message
      ? `${message} [enriched: ${enrichedMessage}]`
      : message

    if (resolved.status === 'clarification_needed') {
      return {
        answer: resolved.clarificationMessage,
        citations: [],
        confidence: 'Low',
        clarificationNeeded: true,
      };
    }
    if (resolved.status === 'cross_cohort') {
      await this.logger.log({ ...baseLog, confidence: 'High', fallbackTriggered: true });
      return { answer: CONSTANTS.SAFE_FALLBACK_ANSWER, citations: [], confidence: 'High' };
    }

    if (resolved.status === 'not_found' || !resolved.patients?.length) {
      await this.logger.log({ ...baseLog, confidence: 'Medium', fallbackTriggered: true });
      return { answer: CONSTANTS.SAFE_FALLBACK_ANSWER, citations: [], confidence: 'Medium' };
    }

    const patient = resolved.patients[0];

    // ── 3. Retrieve all records (cohort-scoped) ────────────────────────────
    const records = await this.patients.getAllRecords(patient.id, cohort);
    if (!records) {
      await this.logger.log({
        cohort, sessionId, variant,
        rawQuery: rawAndEnrichedMessage,
        injectionDetected: false,
        cohortViolation: true,
        injectionDetails: `Attempted access to patient ${patient.id} outside cohort ${cohort}`,
        answer: 'BLOCKED',
        confidence: 'Low',
        citations: [],
        rawModelOutput: '',
        resolvedPatientId: patient.id,
        recordsRetrieved: {},
        fallbackTriggered: true,
      });
      return { answer: CONSTANTS.SAFE_FALLBACK_ANSWER, citations: [], confidence: 'Low' };
    }

    // ── 4. Run LLM agent (injection classify + retrieval plan + answer) ────
    const agentOutput = await this.agent.run({
      query: enrichedMessage,
      patientContext: records,
      variant,
      conversationHistory,
    });

    // ── 5. Log everything ──────────────────────────────────────────────────
    await this.logger.log({
      cohort, sessionId, variant,
      rawQuery: rawAndEnrichedMessage,
      resolvedPatientId: patient.id,
      recordsRetrieved: {
        patient: records.patient,
        allergies: records.allergies,
        conditions: records.conditions,
        medications: records.medications,
        observations: records.observations,
      },
      rawModelOutput: agentOutput.rawOutput,
      answer: agentOutput.answer,
      citations: agentOutput.citations,
      confidence: agentOutput.confidence,
      injectionDetected: agentOutput.injectionDetected,
      injectionDetails: agentOutput.injectionReason ?? '',
      cohortViolation: false,
      tablesUsed: agentOutput.tablesUsed,
      inferenceMade: agentOutput.inferenceMade,
      fallbackTriggered: agentOutput.fallbackTriggered,
      latencyMs: agentOutput.latencyMs,
    });

    return {
      answer: agentOutput.answer,
      citations: agentOutput.citations,
      confidence: agentOutput.confidence,
      patient: { id: patient.id, name: `${patient.name_first} ${patient.name_last}` },
      variant,
      inferenceMade: agentOutput.inferenceMade,
      tablesUsed: agentOutput.tablesUsed,
    };
  }
}
