/* ── BSE India Public API Client ─────────────────────────────────────────────
   Fetches shareholding pattern (promoter holding + pledge %) from BSE India.
   Used by:
     - migrate route (seeding G scores for key companies)
     - bse-refresh route (per-ticker refresh on demand)

   BSE codes for companies with company-specific E overrides.
   Update this map alongside COMPANY_E_OVERRIDES in lib/esgScoring.ts.
   Version: v1.0 — June 2026
─────────────────────────────────────────────────────────────────────────────── */

// NSE ticker → BSE scripcode mapping (maintained per version release)
export const NSE_TO_BSE: Record<string, string> = {
  'ADANIGREEN':  '541450',
  'TATAPOWER':   '500400',
  'COALINDIA':   '533278',
  'ONGC':        '500312',
  'RELIANCE':    '500325',
  'INFY':        '500209',
  'TCS':         '532540',
  'WIPRO':       '507685',
  'HCLTECH':     '532281',
  'TATAMOTORS':  '500570',
  'M&M':         '500520',
  'ASIANPAINT':  '500820',
  'HINDUNILVR':  '500696',
  'SUNPHARMA':   '524715',
  'NESTLEIND':   '500790',
  'HDFCBANK':    '500180',
  'KOTAKBANK':   '500247',
  'ICICIBANK':   '532174',
  'AXISBANK':    '532215',
  'SBIN':        '500112',
  'NTPC':        '532555',
  'POWERGRID':   '532898',
  'DRREDDY':     '500124',
  'CIPLA':       '500087',
  'BHARTIARTL':  '532454',
  'JSWSTEEL':    '500228',
  'TATASTEEL':   '500470',
  'ULTRACEMCO':  '532538',
  'MARUTI':      '532500',
  'PIDILITIND':  '500331',
}

const BSE_BASE = 'https://api.bseindia.com/BseIndiaAPI/api'

const HEADERS: Record<string, string> = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.bseindia.com',
  'Referer': 'https://www.bseindia.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
}

export interface ShareholdingData {
  promoterHolding: number | null
  promoterPledge: number | null
  bseCode: string | null
  dataDate: string | null
}

export async function getShareholding(ticker: string): Promise<ShareholdingData> {
  const bseCode = NSE_TO_BSE[ticker] ?? null
  if (!bseCode) return { promoterHolding: null, promoterPledge: null, bseCode: null, dataDate: null }

  try {
    const res = await fetch(
      `${BSE_BASE}/Shpatternqbs/w?scripcode=${bseCode}`,
      { headers: HEADERS, signal: AbortSignal.timeout(6000) },
    )
    if (!res.ok) return { promoterHolding: null, promoterPledge: null, bseCode, dataDate: null }

    const json = await res.json()
    // BSE returns shareholding in Table array
    const rows: any[] = json?.Table ?? json?.table ?? []
    const row = rows[0] ?? {}

    const holding = parseFloat(
      row.PART_A_PROMOTER_TOTAL_HOLD ??
      row.promoter_total_holding ?? 'NaN'
    )
    const pledge = parseFloat(
      row.PART_A_PROMOTER_TOTAL_PLEDGE ??
      row.promoter_total_pledged ?? 'NaN'
    )
    const dataDate = row.QuarterDate ?? row.QUARTERDATE ?? null

    return {
      promoterHolding: isNaN(holding) ? null : Math.round(holding * 100) / 100,
      promoterPledge:  isNaN(pledge)  ? null : Math.round(pledge  * 100) / 100,
      bseCode,
      dataDate: dataDate ? String(dataDate) : null,
    }
  } catch {
    return { promoterHolding: null, promoterPledge: null, bseCode, dataDate: null }
  }
}

// Fetch shareholding for multiple tickers with rate limiting
export async function getShareholdingBatch(
  tickers: string[],
  delayMs = 300,
): Promise<Map<string, ShareholdingData>> {
  const result = new Map<string, ShareholdingData>()
  for (const ticker of tickers) {
    result.set(ticker, await getShareholding(ticker))
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))
  }
  return result
}
