# Patient Q&A Assistant

An AI-powered clinical assistant that allows healthcare staff to query patient records using natural language. Built as a production-minded prototype with strong emphasis on AI safety, retrieval grounding, cohort isolation, and observability.

## Deployment
- FrontEnd: https://patient-q-a-assistant.vercel.app/
- Backend: https://patient-q-a-assistant-backend.up.railway.app
---

## Architecture Overview

```
Expo (React Native Web)
        ↓ HTTPS + Bearer JWT
NestJS Backend
  ├── Auth Module          → cohort selection, JWT generation
  ├── Chat Module
  │     ├── Patient Resolver     → SQL-based (name, room, medication, condition)
  │     ├── LLM Injection Classifier  → llama-3.1-8b-instant
  │     ├── LLM Retrieval Planner     → llama-3.1-8b-instant (varies by variant)
  │     └── LLM Main Agent            → llama-3.3-70b-versatile (varies by variant)
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
   a. SQL resolver identifies patient from query
   b. LLM injection classifier screens for adversarial input
   c. LLM retrieval planner selects relevant tables (variant-dependent)
   d. SQL fetches records scoped to verified patient + cohort
   e. LLM agent summarizes and cites evidence (variant-dependent)
   f. Full request logged to request_log table
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Expo (React Native Web) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL 16 (Docker) |
| LLM Orchestration | LangChain + Groq |
| Main Model | llama-3.3-70b-versatile |
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

The system resolves which patient a query refers to using a priority chain:

1. **UUID match** — direct patient ID in query
2. **Name match** — first, last, or full name (`ILIKE`, cohort-scoped)
3. **Room + bed match** — e.g. "patient in room 219 bed C"
4. **Unit match** — e.g. "East Tower"
5. **Medication match** — e.g. "patient on Mirtazapine"
6. **Condition match** — e.g. "diabetic patient"
7. **Allergen match** — e.g. "patient allergic to Sulfa"
8. **Demographics** — gender + ethnicity combination

If multiple patients match → system asks for clarification.
If no match → safe fallback response.

---

## A/B Prompt Variants

Variant is assigned deterministically per session (last hex digit of session UUID: even → A, odd → B).

| | Variant A — Careful Clinician | Variant B — Structured Reasoner |
|---|---|---|
| Retrieval | Conservative, over-fetches tables | Aggressive pruning, minimum tables |
| Insufficient data | Answers with available data, low confidence | Infers from supporting evidence, discloses explicitly |
| Inference | Never | Allowed with citation, capped at Medium confidence |
| Confidence | Strict — requires direct evidence for High | Derived from reasoning chain |
| Citations | Inline with answer | Structured block |

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

| Field | Description |
|---|---|
| `cohort` | Active cohort (A or B) |
| `session_id` | Session UUID |
| `prompt_variant` | A or B |
| `raw_query` | Original user message |
| `resolved_patient_id` | Patient UUID identified from query |
| `records_retrieved` | Full patient data passed to LLM |
| `raw_model_output` | Unprocessed LLM response |
| `answer` | Final structured answer |
| `citations` | Source citations |
| `confidence` | High / Medium / Low |
| `tables_used` | Tables selected by retrieval planner |
| `injection_detected` | Whether injection was flagged |
| `injection_details` | Classifier reasoning |
| `cohort_violation` | Whether cross-group access was attempted |
| `inference_made` | Whether Variant B made an inference |
| `fallback_triggered` | Whether safe fallback was used |
| `latency_ms` | End-to-end response time |

---

## Usage Notes

- **Patient queries should include both first and last name** for accurate resolution
  (e.g. "What are Adolfo Ricker's vitals?" not "What are Adolfo's vitals?")
  Single-name queries may resolve incorrectly if multiple patients share the name.
- **Cohort-wide searches are not supported** — queries like "which patients have diabetes"
  or "list all patients in Bed A" are out of scope. The system resolves one patient per query
  by design to minimize data exposure.
- **Follow-up questions using pronouns** ("he", "she", "their") are supported within
  a conversation session, provided a patient was identified in a prior turn.

## What I Would Improve With One Additional Day

1. **Vector similarity search** — replace SQL `ILIKE` name matching with `pgvector` embeddings over patient summaries. Handles "the elderly lady with breathing problems" without exact field matches.

2. **text2SQL retrieval** — fine-tune a model like SQLCoder on the schema. The LLM generates a parameterized SQL query validated against a cohort-enforcement ruleset before execution. Fully auditable, handles arbitrary query complexity.

3. **Streaming responses** — Server-Sent Events for real-time token streaming. Dramatically improves perceived latency for long answers.

4. **Conversation memory & context summarization** — currently we pass the last 6 messages raw. Also the records context passed to the LLM can be large. A summarization step would compress older turns and enable much longer coherent conversations.

5. **Confidence calibration** — use model logprobs and source record count to compute confidence mathematically rather than relying on the LLM to self-report it.

6. **Hallucination detector** — a post-generation step that verifies every claim in the answer against the source records before returning to the user.
