# System architecture

DhanVeda (deployed as **ArthaSift**) is a Next.js 15 application on Vercel (region `sin1`) backed by Neon Postgres. The source is in [`dhanveda-app/`](../dhanveda-app).

## Technology stack

| Layer | Technology | Role |
|-------|------------|------|
| Front end | Next.js 15 App Router, React 19, Tailwind CSS, Recharts, TradingView widget | 38 pages across research, decision, green finance, money, venture and admin |
| API | 40 Next.js route handlers (60 s limit on AI routes) | Auth, AI, screener, community, portfolio, admin |
| Auth | NextAuth v5 (credentials, Google), bcrypt, e-mail OTP 2FA | Session check on every AI route |
| Data | Neon serverless Postgres via Drizzle ORM, 15 tables | Users, logs, stock universe, metrics, ESG, portfolio, community |
| Market data | Yahoo Finance v7 batch quotes; BSE shareholding API | Prices and valuation; promoter holding and pledge |
| AI providers | Gemini 2.0 Flash / Flash-Lite · Claude 3.5 Haiku · Groq Llama 3.3 70B / 3.1 8B · OpenRouter Llama 3.3 70B / Qwen 2.5 72B | Analysis, scoring, chat, venture documents |

## The AI provider hierarchy

Every AI feature goes through one server-side router, `callClaude()` in [`lib/claude.ts`](../dhanveda-app/lib/claude.ts). It walks a fixed hierarchy of nine model endpoints from four providers and returns the first response that parses as JSON.

```mermaid
flowchart TD
    U([User request]) --> R{Stock-analysis prompt?<br/><code>ANALYSE: "..."</code>}
    R -- yes --> T0
    R -- no --> T1
    subgraph T0 [Tier 0 · Collaborative]
        G0[Gemini + Google Search<br/>retrieves ~30 'Label: Value' lines] --> Q0[Groq Llama-3.3-70B<br/>applies compressed rubric]
    end
    T0 -- fail --> T1[Tier 1 · Gemini 2.0 Flash → Flash-Lite]
    T1 -- fail --> T2[Tier 2 · Claude 3.5 Haiku]
    T2 -- fail --> T3[Tier 3 · Groq Llama-3.3-70B → 3.1-8B]
    T3 -- fail --> T4[Tier 4 · OpenRouter Llama / Qwen free]
    T0 & T1 & T2 & T3 & T4 --> J[extractJSON&#40;&#41; repair] --> OUT([JSON response])
```

Design decisions:

1. **Retrieval is separated from judgement (Tier 0).** Gemini returns plain metric lines with no analysis, and Groq scores them. This addresses the main failure mode in FinanceBench, which is getting the right figure rather than reasoning about it.
2. **Escalation is triggered by failure, not by quality.** HTTP 429/413/503 responses, decommissioned models, empty bodies and unparseable JSON all cause escalation. A well-formed but wrong answer is accepted.
3. **JSON repair is an implicit stage.** `extractJSON()` strips code fences, extracts the outermost object, and retries after removing trailing commas and escaping newlines.
4. **Venture module** uses a separate four-tier chain at temperature 0.3, while every analysis call uses temperature 0.

## Token engineering

Groq's free tier for Llama-3.3-70B allowed **6,000 tokens per minute**. A full analysis call needs 3,645 prompt tokens plus 2,500 reserved for output, which is **6,145** tokens, so a single call does not fit. `buildGroqPrompt()` rewrites the rubric in telegraphic form. It keeps every threshold and point value and drops only the explanatory prose:

```text
"+7 ROE >= 20% (top-quartile Indian company, well above Nifty avg 14-16%)"   →   "ROE/7: >=20%=+7"
```

| Prompt variant | Characters | cl100k tokens | o200k tokens | Change |
|----------------|-----------:|--------------:|-------------:|-------:|
| Full rubric | 12,269 | 3,645 | 3,618 | — |
| Compressed | 4,137 | 1,571 | 1,575 | **−56.9%** |
| Compressed + Gemini live data | 4,776 | 1,737 | 1,739 | −52.3% |

## Deterministic components

- **ESG engine** ([`lib/esgScoring.ts`](../dhanveda-app/lib/esgScoring.ts), `v1.0-june2026`)
  - E and S come from baselines for 28 sectors, plus 22 company overrides.
  - G starts from the sector baseline and is then adjusted:
    - live BSE promoter pledge: from +1 at 0% down to −5 above 50%;
    - promoter holding: ±1;
    - BRSR mandate: +1.
  - The tier is taken from the mean of E, S and G, on a scale from A+ to D.
- **Caching**
  - Market quotes: 24 h.
  - AI ESG scores: 7 days.
  - Analysis results: a 12-hour client cache keyed on stock and half-day.
- **Usage accounting:** each call adds `prompt.length / 4 + maxTokens` to `users.tokens_used` and writes a row to `activity_logs`. After 90 days, rows are rolled up into `daily_stats`.

## Data model (tables relevant to research)

| Table | Role | Timestamps |
|-------|------|-----------|
| `activity_logs` | One row per AI call: user, feature, stock | `created_at` |
| `daily_stats` | Counts per date, feature and stock, kept after the 90-day roll-up | `date` |
| `stock_universe` | ESG matrix: E, S, G, tier, risk, BRSR, pledge, holding, BSE code | `esg_updated_at`, `shareholding_date` |
| `stock_metrics` | Cached fundamentals, DV Score column, raw provider payload (`jsonb`) | `fetched_at`, `updated_at` |
| `users.tokens_used` | Running token estimate per user | — |

A proposed `ai_runs` table, which would log provider, model, latency, real token usage and output per call, is specified in Section 6.5 of the report.
