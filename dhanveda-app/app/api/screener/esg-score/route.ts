import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { stockUniverse } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { callClaude } from '@/lib/claude'

// On-demand AI ESG scoring for a single stock.
// Refreshes up to once every 7 days per stock (or on force).
// Uses a compact prompt (~350 tokens) — no financial KPI fetching.

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, force } = await req.json()
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 })

  const t = String(ticker).trim().toUpperCase()

  try {
    const existing = await db.select().from(stockUniverse).where(eq(stockUniverse.ticker, t)).limit(1)
    const stock = existing[0]
    if (!stock) return NextResponse.json({ error: 'Unknown ticker' }, { status: 404 })

    // Skip if scored within last 7 days and not force-refreshing
    if (!force && stock.esgUpdatedAt) {
      const ageMs = Date.now() - new Date(stock.esgUpdatedAt).getTime()
      if (ageMs < 7 * 24 * 60 * 60 * 1000) {
        return NextResponse.json({ ...pick(stock), cached: true })
      }
    }

    const prompt =
      `You are an ESG analyst for Indian listed companies. Analyse "${stock.name}" (NSE: ${t}, Sector: ${stock.sector ?? 'Unknown'}).\n` +
      `Consider: SEBI BRSR disclosures, carbon commitments, water stewardship, supply chain practices, ` +
      `workforce safety/diversity, board composition, promoter pledging history, related-party transactions, ` +
      `regulatory actions, and any sustainability awards or controversies.\n\n` +
      `Return ONLY this JSON — no markdown, no explanation:\n` +
      `{\n` +
      `  "esg_e": <integer 0-10>,\n` +
      `  "esg_s": <integer 0-10>,\n` +
      `  "esg_g": <integer 0-10>,\n` +
      `  "esg_tier": <"A+" | "A" | "B+" | "B" | "C" | "D">,\n` +
      `  "esg_risk": <"Very Low" | "Low" | "Medium" | "High" | "Very High">,\n` +
      `  "esg_notes": <one sentence, max 120 chars, key ESG strength or risk>\n` +
      `}\n\n` +
      `Tier guide: A+ = exemplary green leader, A = low carbon/digital, B+ = strong social/governance, ` +
      `B = average ESG positive, C = moderate impact with improvement path, D = high emission or governance risk.\n` +
      `E score: 1-3 = fossil/mining, 4-5 = industrial, 6-7 = services/transition, 8-10 = green/digital.\n` +
      `G score: penalise for pledge >20%, SEBI notices, audit qualifications; reward for BRSR, independent directors.\n` +
      `Be honest — do not inflate scores.`

    const raw = await callClaude({ prompt, maxTokens: 250 }) as any

    const now = new Date()
    const update = {
      esgE:         clamp(raw?.esg_e),
      esgS:         clamp(raw?.esg_s),
      esgG:         clamp(raw?.esg_g),
      esgTier:      validTier(raw?.esg_tier, stock.esgTier),
      esgRisk:      validRisk(raw?.esg_risk, stock.esgRisk),
      esgNotes:     typeof raw?.esg_notes === 'string' ? raw.esg_notes.slice(0, 200) : stock.esgNotes,
      esgUpdatedAt: now,
    }

    await db.update(stockUniverse).set(update).where(eq(stockUniverse.ticker, t))

    return NextResponse.json({ ...update, ticker: t, cached: false })
  } catch (err: any) {
    console.error('[screener/esg-score]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function clamp(v: unknown): number | null {
  const n = Number(v)
  return isNaN(n) ? null : Math.min(10, Math.max(0, Math.round(n)))
}

const VALID_TIERS = new Set(['A+', 'A', 'B+', 'B', 'C', 'D'])
const VALID_RISKS = new Set(['Very Low', 'Low', 'Medium', 'High', 'Very High'])

function validTier(v: unknown, fallback: string | null): string | null {
  return typeof v === 'string' && VALID_TIERS.has(v) ? v : fallback
}
function validRisk(v: unknown, fallback: string | null): string | null {
  return typeof v === 'string' && VALID_RISKS.has(v) ? v : fallback
}

function pick(s: any) {
  return { ticker: s.ticker, esgE: s.esgE, esgS: s.esgS, esgG: s.esgG, esgTier: s.esgTier, esgRisk: s.esgRisk, esgNotes: s.esgNotes, esgUpdatedAt: s.esgUpdatedAt }
}
