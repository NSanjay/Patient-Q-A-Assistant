import { Injectable } from '@nestjs/common';
import { PatientsService } from '../patients/patients.service';
import { Patient } from '../common/entities';

export interface ResolverResult {
  status: 'resolved' | 'clarification_needed' | 'not_found';
  patients?: Patient[];
  clarificationMessage?: string;
}

@Injectable()
export class PatientResolverService {
  constructor(private patientsService: PatientsService) {}

  async resolve(query: string, cohort: string): Promise<ResolverResult> {
    const q = query.toLowerCase();

    // ── 1. UUID patient ID in query ──────────────────────────────────────
    const uuidMatch = query.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (uuidMatch) {
      const patient = await this.patientsService.getById(uuidMatch[0], cohort);
      if (patient) return { status: 'resolved', patients: [patient] };
      return { status: 'not_found' };
    }

    // ── 2. Name match — try all word combinations from the query ─────────
    const nameMatches = await this.tryNameMatch(query, cohort);
    if (nameMatches.length === 1) return { status: 'resolved', patients: nameMatches };
    if (nameMatches.length > 1) return this.clarify(nameMatches, 'Multiple patients match that name');

    // ── 3. Room + bed match ──────────────────────────────────────────────
    const roomMatch = q.match(/room\s+(\w+)/i);
    const bedMatch = q.match(/bed\s+([a-c]|primary|secondary)/i);
    if (roomMatch) {
      const room = roomMatch[1];
      const bed = bedMatch ? bedMatch[1] : null;
      const patients = await this.patientsService.findByRoom(room, bed, cohort);
      if (patients.length === 1) return { status: 'resolved', patients };
      if (patients.length > 1) return this.clarify(patients, `Multiple patients in room ${room}`);
    }

    // ── 4. Unit match ────────────────────────────────────────────────────
    const unitMatch = q.match(/\b(east\s+tower|west\s+tower)\b/i);
    if (unitMatch) {
      const patients = await this.patientsService.findByUnit(unitMatch[1], cohort);
      if (patients.length === 1) return { status: 'resolved', patients };
      if (patients.length > 1) return this.clarify(patients, `Multiple patients in ${unitMatch[1]}`);
    }

    // ── 5. Medication match ──────────────────────────────────────────────
    const medKeywords = this.extractMedKeywords(q);
    for (const kw of medKeywords) {
      const patients = await this.patientsService.findByMedication(kw, cohort);
      if (patients.length === 1) return { status: 'resolved', patients };
      if (patients.length > 1) return this.clarify(patients, `Multiple patients on ${kw}`);
    }

    // ── 6. Condition match ───────────────────────────────────────────────
    const condKeywords = this.extractConditionKeywords(q);
    for (const kw of condKeywords) {
      const patients = await this.patientsService.findByCondition(kw, cohort);
      if (patients.length === 1) return { status: 'resolved', patients };
      if (patients.length > 1) return this.clarify(patients, `Multiple patients with ${kw}`);
    }

    // ── 7. Allergen match ────────────────────────────────────────────────
    const allergenMatch = q.match(/allergic\s+to\s+([a-z\s]+?)(?:\s|$|,|\?)/i);
    if (allergenMatch) {
      const patients = await this.patientsService.findByAllergen(allergenMatch[1], cohort);
      if (patients.length === 1) return { status: 'resolved', patients };
      if (patients.length > 1) return this.clarify(patients, `Multiple patients allergic to ${allergenMatch[1]}`);
    }

    // ── 8. Demographics ──────────────────────────────────────────────────
    const gender = q.includes('female') ? 'female' : q.includes(' male') ? 'male' : null;
    const ethnicity = q.includes('hispanic') ? 'hispanic'
      : q.includes('black') ? 'black'
      : q.includes('white') ? 'white'
      : null;
    if (gender || ethnicity) {
      const patients = await this.patientsService.findByDemographics(gender, ethnicity, cohort);
      if (patients.length === 1) return { status: 'resolved', patients };
      if (patients.length > 1) return this.clarify(patients, 'Multiple patients match those demographics');
    }

    return { status: 'not_found' };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async tryNameMatch(query: string, cohort: string): Promise<Patient[]> {
    // Extract all words 3+ chars as candidate name tokens (preserve original casing)
    const words = query
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3);

    const seen = new Set<string>();
    const results: Patient[] = [];

    // Try full query first
    const fullMatches = await this.patientsService.findByName(query, cohort);
    for (const p of fullMatches) {
      if (!seen.has(p.id)) { seen.add(p.id); results.push(p); }
    }
    if (results.length) return results;

    // Try consecutive word pairs (first + last name)
    for (let i = 0; i < words.length - 1; i++) {
      const pair = `${words[i]} ${words[i + 1]}`;
      const matches = await this.patientsService.findByName(pair, cohort);
      for (const p of matches) {
        if (!seen.has(p.id)) { seen.add(p.id); results.push(p); }
      }
    }
    if (results.length) return results;

    // Try individual words (single name like "Adolfo")
    for (const word of words) {
      // Skip common English words that aren't names
      if (this.isCommonWord(word)) continue;
      const matches = await this.patientsService.findByName(word, cohort);
      for (const p of matches) {
        if (!seen.has(p.id)) { seen.add(p.id); results.push(p); }
      }
    }

    return results;
  }

  private isCommonWord(word: string): boolean {
    const common = new Set([
      'what', 'are', 'the', 'for', 'and', 'with', 'has', 'have',
      'does', 'did', 'can', 'could', 'show', 'tell', 'give', 'get',
      'list', 'find', 'which', 'who', 'how', 'when', 'where', 'why',
      'patient', 'patients', 'condition', 'conditions', 'medication',
      'medications', 'allergy', 'allergies', 'observation', 'observations',
      'latest', 'recent', 'current', 'all', 'any', 'their', 'his', 'her',
      'vitals', 'records', 'info', 'information', 'about', 'from',
    ]);
    return common.has(word.toLowerCase());
  }

  private extractMedKeywords(query: string): string[] {
    const patterns = [
      /(?:on|taking|prescribed|given)\s+([a-z]+(?:\s+[a-z]+)?)/gi,
      /([a-z]+(?:pril|olol|artan|statin|pam|zam|pine|done|zole|mycin|cillin))\b/gi,
    ];
    const keywords: string[] = [];
    for (const pattern of patterns) {
      const matches = [...query.matchAll(pattern)];
      keywords.push(...matches.map(m => m[1]));
    }
    return keywords;
  }

  private extractConditionKeywords(query: string): string[] {
    const conditionTerms = [
      'diabetes', 'diabetic', 'hypertension', 'heart failure', 'cardiac',
      'kidney', 'renal', 'cancer', 'depression', 'anxiety', 'copd',
      'asthma', 'stroke', 'dementia', 'alzheimer', 'pneumonia', 'sepsis',
      'anemia', 'obesity', 'arthritis', 'fracture', 'infection',
    ];
    return conditionTerms.filter(term => query.includes(term));
  }

  private clarify(patients: Patient[], reason: string): ResolverResult {
    const names = patients
      .map(p => `${p.name_first} ${p.name_last} (Room ${p.room_description || 'N/A'})`)
      .join(', ');
    return {
      status: 'clarification_needed',
      patients,
      clarificationMessage:
        `${reason} in your cohort: ${names}. Could you clarify which patient you mean?`,
    };
  }
}
