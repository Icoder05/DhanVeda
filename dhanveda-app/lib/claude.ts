import { GoogleGenAI } from '@google/genai'
import Anthropic from '@anthropic-ai/sdk'

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export interface ClaudeRequest {
  prompt: string
  maxTokens?: number
  webSearch?: boolean
}

function extractJSON(text: string): unknown {
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in response')
  const js = clean.substring(start, end + 1)
  try {
    return JSON.parse(js)
  } catch {
    const fixed = js
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
    return JSON.parse(fixed)
  }
}

// ── Compressed scoring prompt for Groq free tier ─────────────────────────────
// Full research-page prompt is ~6200 tokens — over the 6000 TPM free-tier cap.
// This version covers the same rubric in ~1800 tokens.
function buildGroqPrompt(stock: string, liveData: string): string {
  return `You are a strict Indian equity research analyst (DSP/Kotak/HDFC AMC standard). Analyse: "${stock}"

${liveData
  ? `LIVE DATA (pre-fetched via Gemini Google Search — use these exact figures):\n${liveData}`
  : `Use your training knowledge. Mark estimated figures clearly.`}

INDIA BENCHMARKS: Nifty50 P/E 22-24x · avg ROE 14-16% · avg ROCE 15-18% · nominal GDP growth 10-12% · 10yr G-Sec 7.0%
Sector P/E medians: IT 25-30x · FMCG 45-55x · Pvt Banks 18-25x(P/B) · PSU Banks 8-12x · Pharma 28-35x · Auto 18-25x · Oil/Gas 10-15x · CapGoods 40-65x · Metals 8-12x · Chemicals 25-35x · Cement 20-30x

SCORE (anchor: 50=median NSE-500 | 73-82=Nifty compounder | 83+=exceptional | floor 5 | cap 95):

[A] PROFITABILITY /20
ROE/7: ≥20%=+7 | 15-19%=+5 | 10-14%=+3 | 5-9%=+1 | <5%=0
ROCE/7: ≥20%=+7 | 15-19%=+5 | 12-14%=+3 | 8-11%=+1 | <8%=0
Net Margin/6: >18%=+6 | 10-18%=+4 | 4-9%=+2 | <4%=0 · DEDUCT -2 if OPM contracted >150bps YoY

[B] VALUATION /20
P/E vs sector median/8: >25% below=+8 | ±15%=+5 | 15-35% above=0 | 35-60% above=-4 | >2× median=-6 (banks: use P/B vs sector)
P/B vs ROE/6: ≤2 ROE≥18%=+6 | 2-4 ROE≥15%=+4 | 2-4 ROE 10-14%=+1 | >4 ROE<15%=0 | >6 ROE<12%=-3
EV/EBITDA/6: <10=+6 | 10-18=+3 | 18-28=0 | >28=-4

[C] FINANCIAL HEALTH /20
D/E/8: <0.25=+8 | 0.25-0.75=+5 | 0.75-1.5=+2 | 1.5-3=-4 | >3=-8 (banks skip D/E: Tier-1 CAR ≥15%=+8 | 12-15%=+4 | <12%=-4)
Interest Coverage/7: >8×=+7 | 4-8×=+5 | 2-4×=+2 | 1-2×=-5 | <1×=-8
Current Ratio/5: >2=+5 | 1.5-2=+3 | 1-1.5=+1 | <1=-4

[D] GROWTH /20
Revenue CAGR/8: >20%=+8 | 12-20%=+5 | 8-11%=+2 | 4-7%=0 | declining=-3
EPS Growth/7: >20%=+7 | 12-20%=+5 | 8-11%=+2 | <8%=0 | declining despite rev growth=-4
FCF/5: positive+growing=+5 | positive flat=+2 | negative 2+yrs=-3

[E] TECHNICAL + GOVERNANCE /20
Price vs 200DMA/8: above=+5 | below=-5; 50DMA>200DMA=+3 | 50DMA<200DMA=-3
RSI-14/3: 40-65=+3 | >75=-3 | <30=-2
52W range/3: within 8% of high+vol=+3 | near 52W low+vol=-2
Promoter pledge/4: 0% hold≥40%=+4 | <5%=+2 | 10-25%=-3 | 25-50%=-6 | >50%=-8
BRSR+governance/2: filed+clean=+2 | SEBI/NCLT adverse=-3

MANDATORY DEDUCTIONS: -12 active SEBI/NCLT/ED action · -10 auditor resignation or qualified opinion · -8 receivables >2× rev growth 3qtrs · -7 three consecutive rev+margin decline qtrs · -6 pledge >35% · -5 interest cov <1.5× · -4 promoter pay >15% net profit

Output ONLY valid JSON (no markdown fences, no text before or after):
{"name":"full legal company name","ticker":"NSE ticker only","sector":"NSE sector","score":INTEGER,"score_reasoning":"top 2 point-adds with Indian benchmark cited + top 2 deductions with actual figure","esg_overall":"Leader|Performer|Average|Laggard","esg_env":INTEGER,"esg_soc":INTEGER,"esg_gov":INTEGER,"esg_note":"one factual sentence on BRSR status or ESG disclosure","carbon_exposure":"Low|Medium|High","bull_case":["India-data-backed reason with number","reason 2","reason 3"],"bear_case":["India-specific risk with number","risk 2","risk 3"],"ratios":{"pe":"","pb":"","ev_ebitda":"","roe":"","roce":"","npm":"","opm":"","debt_equity":"","current_ratio":"","interest_cov":"","revenue_growth":"","eps_growth":"","promoter_pledge":"","dividend_yield":""},"ratio_context":{"pe":"good|neutral|bad","pb":"good|neutral|bad","ev_ebitda":"good|neutral|bad","roe":"good|neutral|bad","roce":"good|neutral|bad","npm":"good|neutral|bad","opm":"good|neutral|bad","debt_equity":"good|neutral|bad","current_ratio":"good|neutral|bad","interest_cov":"good|neutral|bad","revenue_growth":"good|neutral|bad","eps_growth":"good|neutral|bad","promoter_pledge":"good|neutral|bad","dividend_yield":"good|neutral|bad"},"quarterly_results":"Most recent quarter: revenue ₹Xcr, PAT ₹Xcr, OPM X% — vs prior qtr (QoQ) and same qtr last year (YoY). Actual numbers only.","management_commentary":["exact quote or paraphrase from latest concall","second key guidance"],"shareholding":"Promoter X%, FII X%, DII X% — from latest BSE/NSE filing","red_flags":["specific flag with data point"],"technical_summary":"Price ₹X vs 200DMA ₹X (X% above/below). RSI-14 ~X. MACD bullish/bearish. Volume above/below 30-day avg.","verdict":"Strong Buy|Buy|Hold|Avoid|Strong Avoid (High|Medium|Low Confidence) — core thesis with specific numbers + main India-market risk in 2 sentences."}`
}

// ── Gemini raw text — for the data-fetch phase only ──────────────────────────
// Returns plain text (no JSON extraction). Used by callCollaborative.
async function callGeminiRaw(prompt: string, maxTokens: number): Promise<string> {
  if (!gemini) throw new Error('no gemini client')

  const response = await gemini.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      maxOutputTokens: maxTokens,
      temperature: 0.1,
      tools: [{ googleSearch: {} }],
    },
  })
  const text = response.text ?? ''
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

// ── Gemini JSON — full single-provider analysis ───────────────────────────────
async function geminiGenerate(model: string, prompt: string, maxTokens: number, webSearch: boolean) {
  if (!gemini) throw new Error('no gemini client')
  const response = await gemini.models.generateContent({
    model,
    contents: prompt,
    config: {
      maxOutputTokens: maxTokens,
      temperature: 0,
      ...(webSearch && { tools: [{ googleSearch: {} }] }),
    },
  })
  const text = response.text ?? ''
  if (!text) throw new Error('Empty response from Gemini')
  return extractJSON(text)
}

async function callGemini({ prompt, maxTokens = 2500, webSearch = true }: ClaudeRequest) {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite']
  let lastErr: any
  for (const model of models) {
    if (webSearch) {
      try { return await geminiGenerate(model, prompt, maxTokens, true) }
      catch (e: any) { console.warn(`[ai] ${model}+search failed (${e.status ?? e.message})`) }
    }
    try { return await geminiGenerate(model, prompt, maxTokens, false) }
    catch (e: any) { lastErr = e; console.warn(`[ai] ${model} failed (${e.status ?? e.message})`) }
  }
  throw lastErr ?? new Error('All Gemini models failed')
}

// ── Groq ──────────────────────────────────────────────────────────────────────
// Uses the compressed prompt (~1800 tokens) to stay within the 6000 TPM free tier.
// liveData is injected by callCollaborative when Gemini pre-fetched it.
async function callGroq({ prompt, maxTokens = 2500 }: ClaudeRequest, liveData = '') {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const stockMatch = prompt.match(/ANALYSE:\s*"([^"]+)"/)
  const stock = stockMatch?.[1]
  // For stock analysis use the compressed scoring prompt; for general chat use the actual prompt
  const groqPrompt = stock ? buildGroqPrompt(stock, liveData) : prompt

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

  let lastErr: any

  for (const id of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: id,
          messages: [{ role: 'user', content: groqPrompt }],
          max_tokens: maxTokens,
          temperature: 0,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body as any)?.error?.message ?? res.statusText
        const err = Object.assign(new Error(msg), { status: res.status })
        const isTransient = res.status === 429 || res.status === 413 ||
          (res.status === 400 && msg.toLowerCase().includes('decommissioned'))
        if (isTransient) {
          console.warn(`[ai] Groq ${id} (${res.status}) — trying next model`)
          lastErr = err
          continue
        }
        throw err
      }

      const data = await res.json()
      const text: string = (data as any).choices?.[0]?.message?.content ?? ''
      if (!text) throw new Error(`Empty response from Groq ${id}`)
      console.log(`[ai] Groq ${id} succeeded`)
      return extractJSON(text)
    } catch (e: any) {
      if (e.status === 429 || e.status === 413) { lastErr = e; continue }
      throw e
    }
  }

  throw lastErr ?? new Error('All Groq models unavailable — wait a minute or upgrade at console.groq.com/settings/billing')
}

// ── OpenRouter ────────────────────────────────────────────────────────────────
// Rate-limit buffer between Groq (6000 TPM free) and Anthropic (paid).
// Uses free-tier models from a separate quota pool: llama-3.3-70b first,
// then qwen-2.5-72b as a second attempt.
async function callOpenRouter({ prompt, maxTokens = 2500 }: ClaudeRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') throw new Error('OPENROUTER_API_KEY not set')

  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
  ]

  let lastErr: any
  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dhanveda.com',
          'X-Title': 'ArthaSift',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = (body as any)?.error?.message ?? res.statusText
        const err = Object.assign(new Error(msg), { status: res.status })
        if (res.status === 429 || res.status === 503) { lastErr = err; continue }
        throw err
      }

      const data = await res.json()
      const text: string = (data as any).choices?.[0]?.message?.content ?? ''
      if (!text) throw new Error(`Empty response from OpenRouter ${model}`)
      console.log(`[ai] OpenRouter ${model} succeeded`)
      return extractJSON(text)
    } catch (e: any) {
      if (e.status === 429 || e.status === 503) { lastErr = e; continue }
      throw e
    }
  }

  throw lastErr ?? new Error('All OpenRouter models unavailable')
}

// ── Anthropic ─────────────────────────────────────────────────────────────────
async function callAnthropic({ prompt, maxTokens = 2500, webSearch = false }: ClaudeRequest) {
  if (!anthropic) throw new Error('ANTHROPIC_API_KEY not set')

  const tools: Anthropic.Tool[] = webSearch
    ? [{ type: 'web_search_20250305' as any, name: 'web_search' } as any]
    : []

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: maxTokens,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
    ...(webSearch && { tools }),
    ...(webSearch && { betas: ['web-search-2025-03-05'] }),
  })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')

  return extractJSON(text)
}

// ── Gemini + Groq Collaborative ───────────────────────────────────────────────
// Phase 1 — Gemini searches Google for live NSE/BSE financial data (plain text).
// Phase 2 — Groq receives that data and applies the strict scoring rubric → JSON.
// Why this works: Gemini has real-time Google Search; Groq follows complex
// structured instructions more reliably. Together they cover each other's gaps.
async function callCollaborative(req: ClaudeRequest): Promise<unknown> {
  const { prompt, maxTokens = 2500 } = req
  if (!gemini || !process.env.GROQ_API_KEY) {
    throw new Error('Collaborative mode requires both GEMINI_API_KEY and GROQ_API_KEY')
  }

  // Pull stock name out of the prompt (inserted by the research page as ANALYSE: "...")
  const stockMatch = prompt.match(/ANALYSE:\s*"([^"]+)"/)
  const stock = stockMatch?.[1] ?? ''
  if (!stock) throw new Error('Could not extract stock name from prompt')

  // Phase 1: Gemini fetches live NSE/BSE data via Google Search — plain text
  const dataFetchPrompt =
    `Search the web RIGHT NOW for live Indian stock market data on NSE/BSE for: "${stock}"\n\n` +
    `Return ONLY these metrics in plain text, one per line (format: Label: Value). Mark N/A if not found.\n\n` +
    `Current NSE price | 52-week high | 52-week low | Market cap\n` +
    `P/E ratio (TTM) | P/B ratio | EV/EBITDA\n` +
    `ROE % | ROCE % | Net Profit Margin % | Operating Margin % and YoY change in bps\n` +
    `Debt/Equity ratio | Current Ratio | Interest Coverage ratio\n` +
    `Revenue growth YoY % (3-yr CAGR if available) | EPS growth YoY % | Free Cash Flow (positive/negative)\n` +
    `Promoter holding % | Promoter pledge % | FII % | DII %\n` +
    `Dividend yield % | Latest quarter: revenue ₹cr, PAT ₹cr, OPM %\n` +
    `Prior quarter QoQ comparison | Same quarter last year YoY comparison\n` +
    `200-day moving average | 50-day moving average | RSI-14 | MACD signal\n` +
    `Any SEBI notice, NCLT filing, or enforcement action | Auditor status\n` +
    `BRSR filed? | Latest earnings concall key guidance\n\n` +
    `Output ONLY the raw data lines. No analysis. No JSON. No markdown.`

  let liveData = ''

  try {
    const raw = await callGeminiRaw(dataFetchPrompt, 1200)
    if (raw && raw.length > 150) {
      liveData = raw.trim()
      console.log('[ai:collaborative] Gemini data fetch OK → handing to Groq for scoring')
    } else {
      console.warn('[ai:collaborative] Gemini returned too little data')
    }
  } catch (e: any) {
    console.warn('[ai:collaborative] Gemini data fetch failed:', e.message)
  }

  // Phase 2: Groq scores using the compressed prompt (fits within 6000 TPM free tier).
  // If Groq is over quota, Gemini handles the full analysis directly.
  try {
    return await callGroq({ prompt, maxTokens }, liveData)
  } catch (groqErr: any) {
    console.warn('[ai:collaborative] Groq scoring failed, Gemini doing full analysis:', groqErr.message)
    return await geminiGenerate('gemini-2.0-flash', req.prompt, maxTokens, true)
  }
}

// ── Main entry ────────────────────────────────────────────────────────────────
// Provider priority — Gemini → Anthropic → Groq → OpenRouter
//
//  STOCK ANALYSIS ('ANALYSE:' in prompt):
//    1. Collaborative — Gemini Google Search (live data) + Groq scoring rubric
//    2. Gemini alone  — real-time Google Search grounding
//    3. Anthropic     — quality fallback, paid but always available
//    4. Groq          — fast, free (6 000 TPM limit)
//    5. OpenRouter    — last-resort free pool (Llama 3.3 70B / Qwen 72B)
//
//  PORTFOLIO / GENERAL (no 'ANALYSE:'):
//    1. Gemini (no web search — live data not needed for portfolio prompts)
//    2. Anthropic
//    3. Groq
//    4. OpenRouter

export async function callClaude(req: ClaudeRequest) {
  const errors: string[] = []
  const isStockAnalysis = req.prompt.includes('ANALYSE:')

  // Collaborative mode is stock-specific — skip for general/portfolio prompts
  if (isStockAnalysis && gemini && process.env.GROQ_API_KEY) {
    try { return await callCollaborative(req) }
    catch (e: any) {
      errors.push(`Collaborative(${e.status ?? '?'}): ${e.message}`)
      console.warn('[ai] Collaborative failed:', e.message)
    }
  }

  // 1 — Gemini
  if (gemini) {
    try { return await callGemini(req) }
    catch (e: any) {
      errors.push(`Gemini(${e.status ?? '?'}): ${e.message}`)
      console.warn('[ai] Gemini failed:', e.status, e.message)
    }
  }

  // 2 — Anthropic
  if (anthropic) {
    try { return await callAnthropic(req) }
    catch (e: any) {
      errors.push(`Anthropic: ${e.message}`)
      console.warn('[ai] Anthropic failed:', e.message)
    }
  }

  // 3 — Groq
  if (process.env.GROQ_API_KEY) {
    try { return await callGroq(req) }
    catch (e: any) {
      errors.push(`Groq(${e.status ?? '?'}): ${e.message}`)
      console.warn('[ai] Groq failed:', e.status, e.message)
    }
  }

  // 4 — OpenRouter (last-resort free pool)
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
    try { return await callOpenRouter(req) }
    catch (e: any) {
      errors.push(`OpenRouter(${e.status ?? '?'}): ${e.message}`)
      console.warn('[ai] OpenRouter failed:', e.status, e.message)
    }
  }

  if (errors.length === 0) {
    throw new Error(
      'No AI provider configured. Add GEMINI_API_KEY and GROQ_API_KEY to .env.local'
    )
  }

  throw new Error(`All AI providers failed — ${errors.join(' | ')}`)
}
