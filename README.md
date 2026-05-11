# Patient Q&A Assistant

An AI-powered clinical assistant that allows healthcare staff to query patient records using natural language. Built as a production-minded prototype with strong emphasis on AI safety, retrieval grounding, cohort isolation, and observability.

## Deployment
- FrontEnd: https://patient-q-a-assistant.vercel.app/
- Backend: https://patient-q-a-assistant-backend.up.railway.app
---

## Screenshots
- Login Screen: ![img_2.png](img_2.png)
- Sample Conversation: ![img_6.png](img_6.png)
- Injection Attempt: ![img_5.png](img_5.png)
- Conversation & Pronoun Resolution: ![img_7.png](img_7.png)
- Fallback Answer for Insufficient Context: ![img_8.png](img_8.png)

## Architecture Overview

```
Expo (React Native Web)
        ↓ HTTPS + Bearer JWT
NestJS Backend
  ├── Auth Module          → cohort selection, JWT generation
  ├── Chat Module
  │     ├── LLM Injection Classifier  → llama-3.1-8b-instant
  │     ├── Query / Context Resolver  → llama-3.1-8b-instant
  │     ├── Patient Resolver          → SQL-based (name, room, medication, condition)
  │     ├── LLM Retrieval Planner     → llama-3.1-8b-instant (varies by variant)
  │     └── LLM Main Agent            → openai/gpt-oss-120b (2 variants {'A', 'B'} for A/B testing)
  ├── Patients Module      → cohort-scoped SQL retrieval
  └── Logging Module       → full request/response audit trail
        ↓
PostgreSQL (patient data + request_log)
        ↓
Groq API (LLM inference)
```

### Request Lifecycle

```
1. User selects cohort (A or B)
2. Server selects variant per-session, and issues signed JWT { cohort, sessionId, variant }
3. All subsequent requests require Bearer token
4. Per request:
  4. Per request:
   a. Input sanitized (character allowlist, 200 char max)
   b. LLM injection classifier screens for adversarial input (before any DB access)
      i. Returns with a Fallback answer if it detects injection.
      ii. Proceeds with the flow otherwise
   c. SQL resolver identifies patient - cross-cohort existence check halts if wrong group
   d. LLM retrieval planner selects relevant tables (variant-dependent)
   e. SQL fetches records scoped to verified patient + cohort
   f. Query enriched with conversation history for pronoun resolution
   g. LLM agent summarizes and cites evidence (variant-dependent)
   h. Full request logged to request_log table
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Expo (React Native Web) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL 16 (Docker) |
| LLM Orchestration | LangChain + Groq |
| Main Model | openai/gpt-oss-120b |
| Classifier/Planner | llama-3.1-8b-instant |
| Auth | JWT (8h expiry, signed HS256) |

---

## Setup Instructions

### Prerequisites

- Node.js v20+
- Docker Desktop
- A [Groq](https://console.groq.com) API key (free)

### 1. Clone the repository

```bash
git clone <repo-url>
cd Patient-Q-A-Assistant
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Seed the database

```bash
pip3 install psycopg2-binary
python3 data/seed.py
```

### 4. Configure the backend

```bash
cd backend
cp .env.example .env
# Fill in your GROQ_API_KEY in .env
```

### 5. Run the backend

```bash
cd backend
npm install
npm run start:dev
# Runs on http://localhost:3000
```

### 6. Run the frontend

```bash
cd frontend
npm install
npx expo start --web
# Opens at http://localhost:8081
```

---

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=patientqa
DB_USER=admin
DB_PASSWORD=secret
JWT_SECRET=your-jwt-secret-here
GROQ_API_KEY=your-groq-api-key-here
PORT=3000
```

---

## Patient Resolution

The system resolves which patient a query refers to using a strict priority chain. All queries use exact matching (`=` not `ILIKE`) to prevent substring false positives.

1. **UUID match** - direct patient ID in query
2. **Cross-cohort existence check** - if patient name exists in the other cohort, halt immediately and return safe fallback
3. **Exact full name match** - both first and last name, cohort-scoped
4. **Word pair matching** - consecutive word pairs from query, cohort-scoped
5. **Room + bed match** - e.g. "patient in room 219 bed C"
6. **Unit match** - e.g. "East Tower"
7. **Medication match** - description or generic name, e.g. "patient on Mirtazapine"
8. **Condition match** - ICD-10 description, e.g. "diabetic patient"
9. **Allergen match** - e.g. "patient allergic to Sulfa"
10. **Demographics** - gender + ethnicity combination

If multiple patients match → system asks for clarification (capped at 3 named patients).
If no match → safe fallback response.

## Usage Notes

- **Always use full name** (first + last) for accurate patient resolution
- **Cohort-wide searches are not supported** - "which patients have diabetes" or "list all patients in Bed A" return safe fallback by design
- **Follow-up pronouns** ("he", "she") work within a conversation session after a patient is identified
- **Conversation history is best-effort** - the system maintains context for up to 6 turns. Pronoun resolution ("he", "she") works when the prior turn successfully resolved and answered a patient query. It will not work after fallback responses, clarification requests, or injection blocks since these are excluded from history to prevent context poisoning. When in doubt, re-state the patient's full name. 
- **Pronoun follow-ups after unanswerable questions** may not resolve correctly. If the system returns a fallback ("I cannot answer..."), the next follow-up using "he/she/they" will lose patient context since fallback turns are excluded from conversation history. Re-state the patient's full name in the follow-up.

---

## A/B Prompt Variants

Variant is assigned deterministically per session (last hex digit of session UUID: even → A, odd → B).

| | Variant A - Careful Clinician               | Variant B - Structured Reasoner                       |
|---|---------------------------------------------|-------------------------------------------------------|
| Retrieval | Conservative, over-fetches tables           | Aggressive pruning, minimum tables                    |
| Insufficient data | Answers with available data, low confidence | Infers from supporting evidence, discloses explicitly |
| Inference | Never                                       | Allowed with citation, capped at Medium confidence    |
| Confidence | Strict - requires direct evidence for High  | Derived from reasoning chain                          |
| Citations | Inline with answer                          | Structured block                                      |

---

## API Endpoints

### `POST /auth/select-cohort`
No authentication required.
```json
// Request
{ "cohort": "A" }

// Response
{ "token": "eyJ...", "sessionId": "uuid", "variant": "A" }
```

### `POST /chat/message`
Requires `Authorization: Bearer <token>`.
```json
// Request
{
  "message": "What are the latest vitals for Adolfo Ricker?",
  "conversationHistory": []
}

// Response
{
  "answer": "Adolfo Ricker's latest vitals include...",
  "citations": [{ "table": "patient_observation", "field": "HeartRate", "value": "90 bpm" }],
  "confidence": "High",
  "patient": { "id": "uuid", "name": "Adolfo Ricker" },
  "variant": "A",
  "inferenceMade": false,
  "tablesUsed": ["patient", "patient_observation"]
}
```

---

## Observability

Every request logs the following to the `request_log` table:

| Field | Description                                         |
|---|-----------------------------------------------------|
| `cohort` | Active cohort (A or B)                              |
| `session_id` | Session UUID                                        |
| `prompt_variant` | A or B                                              |
| `raw_query` | Original user message (+ Optional enriched message) |
| `resolved_patient_id` | Patient UUID identified from query                  |
| `records_retrieved` | Full patient data passed to LLM                     |
| `raw_model_output` | Unprocessed LLM response                            |
| `answer` | Final structured answer                             |
| `citations` | Source citations                                    |
| `confidence` | High / Medium / Low                                 |
| `tables_used` | Tables selected by retrieval planner                |
| `injection_detected` | Whether injection was flagged                       |
| `injection_details` | Classifier reasoning                                |
| `cohort_violation` | Whether cross-group access was attempted            |
| `inference_made` | Whether Variant B made an inference                 |
| `fallback_triggered` | Whether safe fallback was used                      |
| `latency_ms` | End-to-end response time                            |

---

## What I Would Improve With One Additional Day (Various possibilities)

1. **Semantic schema retrieval & metadata catalog** – instead of exposing raw tables directly to the LLM, introduce a schema catalog containing table descriptions, column semantics, relationships, and sensitivity levels. Retrieval over this metadata would allow the system to scale to thousands of tables while remaining explainable and auditable.

2. **AST-based query planning** – replace heuristic table selection with a structured query planner that builds an intermediate query AST (Abstract Syntax Tree). This avoids brittle hardcoded templates and safely supports dynamic joins, filters, aggregations, and multi-table retrieval at scale.

3. **Vector similarity search** – replace strict SQL field matching with `pgvector` embeddings over patient summaries and schema metadata. This enables fuzzy clinical retrieval such as “the elderly lady with breathing problems” without exact identifier matches.

4. **text2SQL / constrained query generation** – fine-tune a model such as SQLCoder or use constrained SQL generation over the schema catalog. Generated queries would remain parameterized and validated against authorization and cohort-enforcement rules before execution.

5. **Fine-grained authorization & row-level security** – move beyond prompt-level filtering into deterministic access controls at the database layer, including row-level permissions, cohort isolation, audit trails, and column-level PHI restrictions.

6. **Streaming responses** – use Server-Sent Events or WebSockets for incremental token streaming. This significantly improves perceived responsiveness for longer clinical summaries and explanations.

7. **Conversation memory & hierarchical summarization** – replace the current fixed-window chat history with progressive conversation summarization and context compression. This would support longer multi-turn clinical sessions while reducing token usage. (This would be the most impactful for the current implementation)

8. **Confidence calibration** – combine model confidence, retrieval coverage, source agreement, and record counts into a calibrated confidence score rather than relying solely on the LLM’s self-reported certainty.

9. **Hallucination and factuality verification** – add a post-generation verification layer that checks every generated clinical claim against retrieved source records before returning the response.

10. **Hybrid retrieval orchestration** – combine deterministic filters (patient ID, room, cohort) with semantic retrieval for unstructured clinical language. This balances precision, safety, and recall in hospital workflows.
