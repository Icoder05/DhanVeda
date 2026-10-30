// E2-E4. Usage: node experiments/esg_exp.ts experiments/results/esg_results.json  (Node 23.6+ strips types natively)
import { computeESGFromData, deriveTier, SECTOR_BASE } from '../dhanveda-app/lib/esgScoring.ts'
import { STOCK_UNIVERSE } from '../dhanveda-app/lib/stockSeed.ts'
import { writeFileSync } from 'node:fs'
// seeded PRNG for reproducibility
let seed = 20261025
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
const TIERS = ['A+','A','B+','B','C','D']
const U = STOCK_UNIVERSE
const count = (arr: string[]) => Object.fromEntries(TIERS.map(t => [t, arr.filter(x => x === t).length]))
// E1 baseline: no BSE data
const base = U.map(s => ({ s, r: computeESGFromData({ ticker: s.ticker, sector: s.sector, marketCap: s.marketCap, promoterPledge: null, promoterHolding: null }) }))
console.log('N', U.length, 'baseline tiers', count(base.map(b => b.r.esgTier)))
const byCap: any = {}
for (const c of ['Large','Mid','Small']) byCap[c] = count(base.filter(b => b.s.marketCap === c).map(b => b.r.esgTier))
console.log('by cap', byCap)
const risks = ['Very Low','Low','Medium','High','Very High']
console.log('risk', Object.fromEntries(risks.map(r => [r, base.filter(b => b.r.esgRisk === r).length])))
// sector variance explained: how much of composite variance is between-sector
const comp = base.map(b => (b.r.esgE + b.r.esgS + b.r.esgG) / 3)
const mean = comp.reduce((a, b) => a + b, 0) / comp.length
const sst = comp.reduce((a, b) => a + (b - mean) ** 2, 0)
const sectors = [...new Set(U.map(s => s.sector))]
let ssb = 0
const secStats: any[] = []
for (const sec of sectors) {
  const v = base.filter(b => b.s.sector === sec).map(b => (b.r.esgE + b.r.esgS + b.r.esgG) / 3)
  const m = v.reduce((a, b) => a + b, 0) / v.length
  ssb += v.length * (m - mean) ** 2
  secStats.push({ sector: sec, n: v.length, mean: +m.toFixed(2) })
}
console.log('eta^2 sector (baseline)', (ssb / sst).toFixed(4), 'overrides used', base.filter(b => b.r.esgE !== (SECTOR_BASE[b.s.sector]?.e ?? 5)).length)
// E3 boundary sensitivity: G +-1
let flipUp = 0, flipDown = 0, flipAny = 0
for (const b of base) {
  const t0 = b.r.esgTier
  const up = deriveTier(b.r.esgE, b.r.esgS, Math.min(10, b.r.esgG + 1))
  const dn = deriveTier(b.r.esgE, b.r.esgS, Math.max(1, b.r.esgG - 1))
  if (up !== t0) flipUp++; if (dn !== t0) flipDown++; if (up !== t0 || dn !== t0) flipAny++
}
console.log('G+1 flips', flipUp, 'G-1 flips', flipDown, 'any', flipAny)
// E2 Monte Carlo: pledge & holding uncertainty (ASSUMED distributions)
const samplePledge = () => rnd() < 0.72 ? 0 : (rnd() < 0.6 ? rnd() * 10 : (rnd() < 0.7 ? 10 + rnd() * 25 : 35 + rnd() * 40))
const sampleHold = () => 20 + rnd() * 55
const R = 10000
const tierCounts: Record<string, number[]> = Object.fromEntries(TIERS.map(t => [t, []]))
const perStockStable: number[] = new Array(U.length).fill(0)
const modal: Record<string, number>[] = U.map(() => ({}))
for (let i = 0; i < R; i++) {
  const c: Record<string, number> = Object.fromEntries(TIERS.map(t => [t, 0]))
  U.forEach((s, j) => {
    const r = computeESGFromData({ ticker: s.ticker, sector: s.sector, marketCap: s.marketCap, promoterPledge: samplePledge(), promoterHolding: sampleHold() })
    c[r.esgTier]++
    modal[j][r.esgTier] = (modal[j][r.esgTier] ?? 0) + 1
  })
  for (const t of TIERS) tierCounts[t].push(c[t])
}
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))] }
const mc = TIERS.map(t => { const a = tierCounts[t]; const m = a.reduce((x, y) => x + y, 0) / a.length; const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); return { tier: t, baseline: count(base.map(b => b.r.esgTier))[t], mean: +m.toFixed(1), sd: +sd.toFixed(2), p025: q(a, 0.025), p975: q(a, 0.975) } })
console.log('MC', mc)
const stab = modal.map(m => Math.max(...Object.values(m)) / R)
const bins = [0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0001]
const hist: any[] = []
let lo = 0
for (const b of bins) { hist.push({ range: `${lo}-${b > 1 ? 1 : b}`, n: stab.filter(x => x >= lo && x < b).length }); lo = b }
console.log('stability hist', hist, 'mean stability', (stab.reduce((a, b) => a + b, 0) / stab.length).toFixed(3), 'share <0.8', stab.filter(x => x < 0.8).length)
writeFileSync(process.argv[2], JSON.stringify({ n: U.length, baseline: count(base.map(b => b.r.esgTier)), byCap, secStats: secStats.sort((a, b) => b.mean - a.mean), mc, hist, flipUp, flipDown, flipAny }, null, 1))
