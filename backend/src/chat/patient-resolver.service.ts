import { Injectable } from '@nestjs/common';
import { PatientsService } from '../patients/patients.service';
import { Patient } from '../common/entities';
import {KNOWN_MEDICATIONS, CONDITION_TERMS, COMMON_WORDS} from '../common/constants';

export interface ResolverResult {
  status: 'resolved' | 'clarification_needed' | 'not_found' | 'cross_cohort';
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
    if (nameMatches === 'cross_cohort') return { status: 'cross_cohort' };
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
    /*
      "allergic to penicillin"
      "allergy to latex"
      "Which patient has Sulfur as an allergen?"
    */
    const allergenMatch = q.match(
  /(?:allergic\s+to|allergy\s+to|has\s+)([a-z][a-z\s\-]+?)(?:\s+as\s+an?\s+allergen|\s|$|,|\?)/i
    );
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

  private async tryNameMatch(query: string, cohort: string): Promise<Patient[] | 'cross_cohort'> {
    const words = query
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !this.isCommonWord(w));

    const seen = new Set<string>();
    const results: Patient[] = [];

    // Step 1: Cross-cohort check first (fail fast)
    // If any word pair exists in the other cohort → stop entirely
    for (let i = 0; i < words.length - 1; i++) {
      const pair = `${words[i]} ${words[i + 1]}`;
      const crossCohort = await this.patientsService.existsInOtherCohort(pair, cohort);
      if (crossCohort) return 'cross_cohort';
    }

    // Step 2: Try full query
    const fullMatches = await this.patientsService.findByName(query, cohort);
    for (const p of fullMatches) {
      if (!seen.has(p.id)) { seen.add(p.id); results.push(p); }
    }
    if (results.length) return results;

    // Step 3: Try consecutive word pairs within cohort
    for (let i = 0; i < words.length - 1; i++) {
      const pair = `${words[i]} ${words[i + 1]}`;
      const matches = await this.patientsService.findByName(pair, cohort);
      for (const p of matches) {
        if (!seen.has(p.id)) { seen.add(p.id); results.push(p); }
      }
    }

    return results;
  }

  private isCommonWord(word: string): boolean {
    return COMMON_WORDS.has(word.toLowerCase());
  }

  private extractMedKeywords(query: string): string[] {
    const patterns = [
      // Context-based extraction
      // "Patient is taking metformin", "Prescribed lisinopril daily", "Started on atorvastatin calcium"
      /(?:on|taking|prescribed|given|started on|discharged on)\s+([a-z][a-z0-9\-]*(?:\s+[a-z][a-z0-9\-]*){0,2})/gi,

      // Common medication suffixes
      // "lisinopril" -> pril, "metoprolol" -> olol, "losartan" -> artan, "atorvastatin" -> statin
      /\b([a-z][a-z0-9\-]*(?:pril|olol|artan|statin|pam|pine|done|zole|mycin|cillin|formin|sone))\b/gi,
    ];

    const keywords = new Set<string>();

    // Regex extraction
    for (const pattern of patterns) {
      const matches = [...query.matchAll(pattern)];

      for (const match of matches) {
        const candidate = match[1]?.trim().toLowerCase();

        if (!candidate) continue;

        keywords.add(candidate);
      }
    }

    // Whitelist direct lookup
    const tokens = query.toLowerCase().split(/\W+/);

    for (const token of tokens) {
      if (KNOWN_MEDICATIONS.has(token)) {
        keywords.add(token);
      }
    }

    return [...keywords];
  }

  private extractConditionKeywords(query: string): string[] {
    const normalized = query.toLowerCase();

    return CONDITION_TERMS.filter(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      return regex.test(normalized);
    });
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
