/* ── ESG Scoring Algorithm — DhanVeda v1.0 (June 2026) ────────────────────────
   Inputs:  sector, BSE shareholding data (promoter pledge/holding), market cap
   Outputs: E/S/G scores (0-10), ESG Tier (A+ → D), Transition Risk, BRSR flag

   E and S scores are sector-structural (business model determines them; no
   free structured API exists for Indian companies at this granularity).
   G score is computed from live BSE shareholding data (promoter pledging).

   Update this file per release when sector research or company-specific
   environmental commitments change materially.
─────────────────────────────────────────────────────────────────────────────── */

/* E and S sector baselines (structural research, June 2026)
   E = Environmental intensity (0-10): carbon output, water use, waste
   S = Social impact (0-10): workforce quality, health/inclusion, supply chain
   tierBase and riskBase = starting point before pledge/E adjustment
*/
export const SECTOR_BASE: Record<string, { e: number; s: number; tierBase: string; riskBase: string }> = {
  'IT':            { e: 8, s: 7, tierBase: 'A',  riskBase: 'Very Low'  },
  'Power':         { e: 6, s: 6, tierBase: 'A',  riskBase: 'Medium'    },
  'Pharma':        { e: 6, s: 8, tierBase: 'B+', riskBase: 'Low'       },
  'Banking':       { e: 6, s: 8, tierBase: 'B+', riskBase: 'Low'       },
  'NBFC':          { e: 6, s: 7, tierBase: 'B+', riskBase: 'Low'       },
  'Insurance':     { e: 6, s: 8, tierBase: 'B',  riskBase: 'Low'       },
  'FMCG':          { e: 5, s: 6, tierBase: 'B',  riskBase: 'Low'       },
  'Telecom':       { e: 5, s: 7, tierBase: 'B',  riskBase: 'Low'       },
  'Agri':          { e: 5, s: 7, tierBase: 'B',  riskBase: 'Low'       },
  'Consumer':      { e: 5, s: 6, tierBase: 'B',  riskBase: 'Low'       },
  'Retail':        { e: 5, s: 6, tierBase: 'B',  riskBase: 'Low'       },
  'Media':         { e: 6, s: 6, tierBase: 'B',  riskBase: 'Low'       },
  'Hotels':        { e: 5, s: 6, tierBase: 'B',  riskBase: 'Low'       },
  'Capital Goods': { e: 4, s: 6, tierBase: 'C',  riskBase: 'Medium'    },
  'Infra':         { e: 4, s: 6, tierBase: 'C',  riskBase: 'Medium'    },
  'Auto':          { e: 4, s: 6, tierBase: 'C',  riskBase: 'Medium'    },
  'Paints':        { e: 4, s: 6, tierBase: 'C',  riskBase: 'Medium'    },
  'Chemicals':     { e: 4, s: 5, tierBase: 'C',  riskBase: 'High'      },
  'Textiles':      { e: 3, s: 6, tierBase: 'C',  riskBase: 'Medium'    },
  'Cement':        { e: 3, s: 5, tierBase: 'C',  riskBase: 'High'      },
  'Metals':        { e: 3, s: 5, tierBase: 'D',  riskBase: 'High'      },
  'Energy':        { e: 2, s: 5, tierBase: 'D',  riskBase: 'Very High' },
  'Realty':        { e: 4, s: 6, tierBase: 'C',  riskBase: 'Medium'    },
  'Internet':      { e: 7, s: 6, tierBase: 'A',  riskBase: 'Low'       },
  'Logistics':     { e: 3, s: 6, tierBase: 'C',  riskBase: 'High'      },
  'Others':        { e: 5, s: 5, tierBase: 'B',  riskBase: 'Medium'    },
  'REIT':          { e: 5, s: 7, tierBase: 'B',  riskBase: 'Low'       },
  'InvIT':         { e: 5, s: 6, tierBase: 'B',  riskBase: 'Medium'    },
}

// Sector baseline G before pledge adjustment
const SECTOR_BASE_G: Record<string, number> = {
  'IT': 8, 'Power': 6, 'Pharma': 7, 'Banking': 7, 'NBFC': 7,
  'Insurance': 7, 'FMCG': 7, 'Telecom': 6, 'Agri': 5, 'Consumer': 6,
  'Retail': 6, 'Media': 5, 'Hotels': 6, 'Capital Goods': 6, 'Infra': 5,
  'Auto': 6, 'Paints': 7, 'Chemicals': 6, 'Textiles': 5, 'Cement': 6,
  'Metals': 5, 'Energy': 6,
  'Realty': 5, 'Internet': 7, 'Logistics': 5, 'Others': 5, 'REIT': 8, 'InvIT': 7,
}

/* Company-specific Environmental (E) overrides — updated per release
   Captures materially different environmental profiles within a sector.
   Version: v1.0 — June 2026
*/
export const COMPANY_E_OVERRIDES: Record<string, number> = {
  'ADANIGREEN':  10, // Pure-play solar + wind — 20+ GW operational
  'TATAPOWER':    7, // Coal + growing renewable portfolio (~35% clean)
  'COALINDIA':    1, // Largest thermal coal producer globally
  'ONGC':         2, // Offshore oil & gas exploration
  'RELIANCE':     4, // Refinery + Jio + green energy ambition (net-zero 2035)
  'INFY':         9, // Carbon neutral since 2020; SBTi-validated targets
  'TCS':          8, // Net-zero pledge by 2030, science-based targets
  'WIPRO':        8, // Certified carbon neutral across operations
  'HCLTECH':      7, // GHG intensity reduction targets, renewable sourcing
  'TATAMOTORS':   6, // Tata EV leads India market; ICE still majority
  'M&M':          6, // EV push across Bolero/Thar/Scorpio electric variants
  'ASIANPAINT':   6, // Low-VOC product shift, water-based paint transition
  'HINDUNILVR':   7, // Sustainable Living Plan — water, plastics, sourcing
  'SUNPHARMA':    6, // WHO-GMP certified; some historical effluent issues
  'NESTLEIND':    7, // Plastic packaging commitments, water stewardship
  // BSE-listed company overrides
  'BORORENEW':    9, // Sole Indian manufacturer of solar glass — enabler of renewable energy buildout
  'GREAVESCOT':   6, // Pivoting to EV 3-wheelers (Ampere brand); legacy genset business declining
  'GARDENRSI':    5, // Shipbuilding — advancing green-ship designs for Navy & Coast Guard
  'HIMADRI':      3, // Coal tar distillation & carbon black — high-emission process chemistry
  'AARTIIND':     4, // Specialty chemicals with significant effluent discharge; improving TSCA compliance
  'BOMBAYDYE':    4, // Textile dyeing — historically high water & chemical effluent load
  'BCLINDS':      5, // Biofuel/ethanol from rice bran adds green credit to agri-processing
}

/* ── Governance Score from BSE Shareholding Data ─────────────────────────────
   This is the core algorithm that converts raw BSE data → G score (0-10).
   Promoter pledging is the single most financially material governance signal
   for Indian listed companies (SEBI watch threshold: 20% of promoter holding).
*/
export function computeGScore(
  sector: string | null,
  promoterPledge: number | null,   // pledge % of promoter holding (live BSE data)
  promoterHolding: number | null,  // total promoter % (live BSE data)
  brsrMandated: boolean,
): number {
  const baseG = SECTOR_BASE_G[sector ?? ''] ?? 6

  // Pledge adjustment
  let pledgeAdj = 0
  if (promoterPledge !== null) {
    if (promoterPledge === 0)       pledgeAdj = +1   // zero pledge = clean governance
    else if (promoterPledge < 5)    pledgeAdj =  0   // negligible
    else if (promoterPledge < 20)   pledgeAdj = -1   // moderate concern
    else if (promoterPledge < 35)   pledgeAdj = -2   // SEBI watch threshold
    else if (promoterPledge < 50)   pledgeAdj = -4   // high forced-sale risk
    else                            pledgeAdj = -5   // distressed / extreme risk
  }

  // Holding alignment: low promoter holding = weaker skin-in-the-game
  let holdingAdj = 0
  if (promoterHolding !== null) {
    if (promoterHolding >= 50) holdingAdj = +1
    else if (promoterHolding < 25) holdingAdj = -1
  }

  // BRSR mandate (SEBI top-1000) = higher mandatory disclosure standard → G +1
  const brsrAdj = brsrMandated ? 1 : 0

  return Math.min(10, Math.max(1, baseG + pledgeAdj + holdingAdj + brsrAdj))
}

/* Derive ESG Tier from computed E/S/G scores.
   Tier classification logic — updated per release.
*/
export function deriveTier(e: number, s: number, g: number): string {
  const avg = (e + s + g) / 3
  if (e >= 9 && avg >= 8.0) return 'A+'
  if (avg >= 7.5)            return 'A'
  if (avg >= 6.5)            return 'B+'
  if (avg >= 5.5)            return 'B'
  if (avg >= 4.0)            return 'C'
  return 'D'
}

/* Derive Transition Risk from sector baseline + E score + G score + pledge.
   Transition risk = how exposed is this company to India's energy transition
   (500 GW renewable target, carbon regulation tightening).
*/
export function deriveRisk(
  riskBase: string,
  e: number,
  g: number,
  promoterPledge: number | null,
): string {
  const RISKS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const
  let idx = Math.max(0, RISKS.indexOf(riskBase as any))

  // Very low E in any sector = structurally high carbon exposure
  if (e <= 2) idx = Math.min(4, idx + 1)

  // Governance collapse amplifies transition risk (fire-sale scenario)
  if (promoterPledge !== null && promoterPledge > 35 && g < 5)
    idx = Math.min(4, idx + 1)

  // High E score can partially offset sector risk (cleaner than peers)
  if (e >= 8 && idx > 0) idx = Math.max(0, idx - 1)

  return RISKS[idx]
}

/* Main computation entry point — called from migrate and bse-refresh routes */
export function computeESGFromData(input: {
  ticker: string
  sector: string | null
  marketCap: string | null
  promoterPledge: number | null
  promoterHolding: number | null
}): {
  esgE: number; esgS: number; esgG: number
  esgTier: string; esgRisk: string; brsrMandated: boolean
} {
  const base = SECTOR_BASE[input.sector ?? ''] ?? { e: 5, s: 5, tierBase: 'B', riskBase: 'Medium' }
  const brsrMandated = input.marketCap === 'Large'

  const esgE    = COMPANY_E_OVERRIDES[input.ticker] ?? base.e
  const esgS    = base.s
  const esgG    = computeGScore(input.sector, input.promoterPledge, input.promoterHolding, brsrMandated)
  const esgTier = deriveTier(esgE, esgS, esgG)
  const esgRisk = deriveRisk(base.riskBase, esgE, esgG, input.promoterPledge)

  return { esgE, esgS, esgG, esgTier, esgRisk, brsrMandated }
}
