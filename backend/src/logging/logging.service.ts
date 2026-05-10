import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLog } from '../common/entities';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingService {
  constructor(
    @InjectRepository(RequestLog)
    private logRepo: Repository<RequestLog>,
  ) {}

  async log(data: {
    cohort: string;
    sessionId: string;
    variant: string;
    rawQuery: string;
    resolvedPatientId?: string | null;
    recordsRetrieved?: any;
    rawModelOutput?: string;
    answer?: string;
    citations?: any;
    confidence?: string;
    injectionDetected?: boolean;
    injectionDetails?: string | null;
    cohortViolation?: boolean;
    tablesUsed?: string[];
    inferenceMade?: boolean;
    fallbackTriggered?: boolean;
    latencyMs?: number;
  }) {
    try {
      const entry = new RequestLog();
      entry.id = uuidv4();
      entry.cohort = data.cohort;
      entry.session_id = data.sessionId;
      entry.prompt_variant = data.variant;
      entry.raw_query = data.rawQuery;
      entry.resolved_patient_id = data.resolvedPatientId ?? '';
      entry.records_retrieved = data.recordsRetrieved ?? {};
      entry.raw_model_output = data.rawModelOutput ?? '';
      entry.answer = data.answer ?? '';
      entry.citations = data.citations ?? [];
      entry.confidence = data.confidence ?? 'Low';
      entry.injection_detected = data.injectionDetected ?? false;
      entry.injection_details = data.injectionDetails ?? '';
      entry.cohort_violation = data.cohortViolation ?? false;
      entry.tables_used = data.tablesUsed ?? [];
      entry.inference_made = data.inferenceMade ?? false;
      entry.fallback_triggered = data.fallbackTriggered ?? false;
      entry.latency_ms = data.latencyMs ?? 0;
      await this.logRepo.save(entry);
    } catch (e) {
      console.error('Logging failed:', e.message);
    }
  }
}
