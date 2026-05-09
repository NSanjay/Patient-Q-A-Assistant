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
exports.PatientResolverService = void 0;
const common_1 = require("@nestjs/common");
const patients_service_1 = require("../patients/patients.service");
let PatientResolverService = class PatientResolverService {
    patientsService;
    constructor(patientsService) {
        this.patientsService = patientsService;
    }
    async resolve(query, cohort) {
        const q = query.toLowerCase();
        const uuidMatch = query.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        if (uuidMatch) {
            const patient = await this.patientsService.getById(uuidMatch[0], cohort);
            if (patient)
                return { status: 'resolved', patients: [patient] };
            return { status: 'not_found' };
        }
        const nameMatches = await this.tryNameMatch(query, cohort);
        if (nameMatches.length === 1)
            return { status: 'resolved', patients: nameMatches };
        if (nameMatches.length > 1)
            return this.clarify(nameMatches, 'Multiple patients match that name');
        const roomMatch = q.match(/room\s+(\w+)/i);
        const bedMatch = q.match(/bed\s+([a-c]|primary|secondary)/i);
        if (roomMatch) {
            const room = roomMatch[1];
            const bed = bedMatch ? bedMatch[1] : null;
            const patients = await this.patientsService.findByRoom(room, bed, cohort);
            if (patients.length === 1)
                return { status: 'resolved', patients };
            if (patients.length > 1)
                return this.clarify(patients, `Multiple patients in room ${room}`);
        }
        const unitMatch = q.match(/\b(east\s+tower|west\s+tower)\b/i);
        if (unitMatch) {
            const patients = await this.patientsService.findByUnit(unitMatch[1], cohort);
            if (patients.length === 1)
                return { status: 'resolved', patients };
            if (patients.length > 1)
                return this.clarify(patients, `Multiple patients in ${unitMatch[1]}`);
        }
        const medKeywords = this.extractMedKeywords(q);
        for (const kw of medKeywords) {
            const patients = await this.patientsService.findByMedication(kw, cohort);
            if (patients.length === 1)
                return { status: 'resolved', patients };
            if (patients.length > 1)
                return this.clarify(patients, `Multiple patients on ${kw}`);
        }
        const condKeywords = this.extractConditionKeywords(q);
        for (const kw of condKeywords) {
            const patients = await this.patientsService.findByCondition(kw, cohort);
            if (patients.length === 1)
                return { status: 'resolved', patients };
            if (patients.length > 1)
                return this.clarify(patients, `Multiple patients with ${kw}`);
        }
        const allergenMatch = q.match(/allergic\s+to\s+([a-z\s]+?)(?:\s|$|,|\?)/i);
        if (allergenMatch) {
            const patients = await this.patientsService.findByAllergen(allergenMatch[1], cohort);
            if (patients.length === 1)
                return { status: 'resolved', patients };
            if (patients.length > 1)
                return this.clarify(patients, `Multiple patients allergic to ${allergenMatch[1]}`);
        }
        const gender = q.includes('female') ? 'female' : q.includes(' male') ? 'male' : null;
        const ethnicity = q.includes('hispanic') ? 'hispanic'
            : q.includes('black') ? 'black'
                : q.includes('white') ? 'white'
                    : null;
        if (gender || ethnicity) {
            const patients = await this.patientsService.findByDemographics(gender, ethnicity, cohort);
            if (patients.length === 1)
                return { status: 'resolved', patients };
            if (patients.length > 1)
                return this.clarify(patients, 'Multiple patients match those demographics');
        }
        return { status: 'not_found' };
    }
    async tryNameMatch(query, cohort) {
        const words = query
            .replace(/[^a-zA-Z\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 3);
        const seen = new Set();
        const results = [];
        const fullMatches = await this.patientsService.findByName(query, cohort);
        for (const p of fullMatches) {
            if (!seen.has(p.id)) {
                seen.add(p.id);
                results.push(p);
            }
        }
        if (results.length)
            return results;
        for (let i = 0; i < words.length - 1; i++) {
            const pair = `${words[i]} ${words[i + 1]}`;
            const matches = await this.patientsService.findByName(pair, cohort);
            for (const p of matches) {
                if (!seen.has(p.id)) {
                    seen.add(p.id);
                    results.push(p);
                }
            }
        }
        if (results.length)
            return results;
        for (const word of words) {
            if (this.isCommonWord(word))
                continue;
            const matches = await this.patientsService.findByName(word, cohort);
            for (const p of matches) {
                if (!seen.has(p.id)) {
                    seen.add(p.id);
                    results.push(p);
                }
            }
        }
        return results;
    }
    isCommonWord(word) {
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
    extractMedKeywords(query) {
        const patterns = [
            /(?:on|taking|prescribed|given)\s+([a-z]+(?:\s+[a-z]+)?)/gi,
            /([a-z]+(?:pril|olol|artan|statin|pam|zam|pine|done|zole|mycin|cillin))\b/gi,
        ];
        const keywords = [];
        for (const pattern of patterns) {
            const matches = [...query.matchAll(pattern)];
            keywords.push(...matches.map(m => m[1]));
        }
        return keywords;
    }
    extractConditionKeywords(query) {
        const conditionTerms = [
            'diabetes', 'diabetic', 'hypertension', 'heart failure', 'cardiac',
            'kidney', 'renal', 'cancer', 'depression', 'anxiety', 'copd',
            'asthma', 'stroke', 'dementia', 'alzheimer', 'pneumonia', 'sepsis',
            'anemia', 'obesity', 'arthritis', 'fracture', 'infection',
        ];
        return conditionTerms.filter(term => query.includes(term));
    }
    clarify(patients, reason) {
        const names = patients
            .map(p => `${p.name_first} ${p.name_last} (Room ${p.room_description || 'N/A'})`)
            .join(', ');
        return {
            status: 'clarification_needed',
            patients,
            clarificationMessage: `${reason} in your cohort: ${names}. Could you clarify which patient you mean?`,
        };
    }
};
exports.PatientResolverService = PatientResolverService;
exports.PatientResolverService = PatientResolverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [patients_service_1.PatientsService])
], PatientResolverService);
//# sourceMappingURL=patient-resolver.service.js.map