'use client'
import { useState } from 'react'

// [state, peak sun hours, state subsidy ₹, DISCOM tariff ₹/kWh FY2024-25]
const STATES: [string, number, number, number][] = [
  ['Rajasthan',        6.2, 0,     6.65],
  ['Gujarat',          5.9, 0,     4.80],
  ['Maharashtra',      5.5, 10000, 8.00],
  ['Karnataka',        5.4, 0,     6.45],
  ['Tamil Nadu',       5.3, 0,     4.35],
  ['Telangana',        5.2, 0,     6.00],
  ['Andhra Pradesh',   5.4, 0,     6.00],
  ['Madhya Pradesh',   5.6, 0,     5.70],
  ['Punjab',           4.9, 0,     7.10],
  ['Haryana',          4.7, 0,     8.00],
  ['Delhi',            4.8, 0,     7.00],
  ['Uttar Pradesh',    5.0, 0,     5.50],
  ['Kerala',           4.5, 0,     6.00],
  ['West Bengal',      4.6, 0,     7.50],
  ['Himachal Pradesh', 4.8, 0,     4.50],
  ['Uttarakhand',      4.9, 0,     5.20],
  ['Odisha',           5.1, 0,     5.00],
  ['Jharkhand',        5.0, 0,     6.50],
  ['Chhattisgarh',     5.2, 0,     5.50],
  ['Bihar',            5.0, 0,     6.50],
  ['Assam',            4.5, 0,     6.50],
  ['National Average', 4.6, 0,     6.00],
]

// Bisection-based IRR (handles non-linear cash flows)
function calcIRR(cashFlows: number[]): number {
  let lo = -0.99, hi = 5.0
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2
    const npv = cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + mid, t), 0)
    if (Math.abs(npv) < 0.5) return mid
    npv > 0 ? (lo = mid) : (hi = mid)
  }
  return (lo + hi) / 2
}

type Tab = 'summary' | 'cost' | 'emi' | 'sensitivity'

export default function SolarPage() {
  const [state, setState] = useState('National Average')
  const [bill, setBill] = useState(3000)
  const [size, setSize] = useState(3)
  const [tariffInfl, setTariffInfl] = useState(5)
  const [result, setResult] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('summary')

  function calculate() {
    const sd = STATES.find(s => s[0] === state) ?? STATES[STATES.length - 1]
    const [stateLabel, psh, stateSub, stateTariff] = sd

    const tariff = stateTariff
    const PR = 0.80           // Performance ratio (shading, wiring, inverter losses)
    const degradeRate = 0.007 // 0.7% annual panel degradation (industry standard)
    const GRID_EF = 0.716     // kgCO₂/kWh — CEA India grid emission factor FY2022-23
    const REC_PRICE = 347     // ₹/MWh — IEX spot price (approximate, changes monthly)
    const DISCOUNT = 0.08     // 8% discount rate for NPV

    // Annual energy generation applying PR and degradation
    const annualUnitsY1 = psh * size * 365 * PR
    const recPerYear = annualUnitsY1 / 1000

    // Suggested size (cover ~100% of bill)
    const suggestedSize = Math.max(1, Math.min(20, Math.ceil(bill / (tariff * psh * PR * 30))))

    // Cost breakdown (FY2024-25 market rates, mono PERC panels)
    const panelCost    = size * 28000
    const inverterCost = size * 6000
    const mountingCost = size * 4000
    const wiringCost   = size * 3000
    const installCost  = size * 8000
    const netMeterFee  = 3000
    const rawCost = panelCost + inverterCost + mountingCost + wiringCost + installCost + netMeterFee

    // PM Surya Ghar Phase 3 subsidy (FY2024-25):
    // ≤2 kW: ₹30,000/kW | 2-3 kW: +₹18,000/kW | >3 kW: capped at ₹78,000
    const centralSub = size <= 2
      ? size * 30000
      : Math.min(78000, 60000 + Math.max(0, Math.min(1, size - 2)) * 18000)
    const totalSub = centralSub + stateSub
    const net = Math.max(rawCost - totalSub, 0)

    // Year-1 income
    const year1Elec = annualUnitsY1 * tariff
    const year1Rec  = recPerYear * REC_PRICE
    const year1Savings = year1Elec + year1Rec

    // 25-year cash flows with degradation + tariff inflation
    const cashFlows: number[] = [-net]
    let total25 = 0, npv = -net, totalGen25 = 0
    for (let y = 1; y <= 25; y++) {
      const gen     = annualUnitsY1 * Math.pow(1 - degradeRate, y)
      const tariffY = tariff * Math.pow(1 + tariffInfl / 100, y)
      const cf      = gen * tariffY + (gen / 1000) * REC_PRICE
      cashFlows.push(cf)
      total25   += cf
      totalGen25 += gen
      npv       += cf / Math.pow(1 + DISCOUNT, y)
    }

    const irr     = calcIRR(cashFlows) * 100
    const lcoe    = net / totalGen25         // ₹/kWh levelised cost of energy
    const co2     = (totalGen25 * GRID_EF) / 1000  // tonnes over 25 years
    const payback = net / year1Savings

    // EMI — Green energy loan: 9% p.a., 60 months
    const emiR = 0.09 / 12, emiT = 60
    const emi          = net > 0 ? Math.round(net * (emiR * Math.pow(1 + emiR, emiT)) / (Math.pow(1 + emiR, emiT) - 1)) : 0
    const totalEmiPaid = emi * emiT
    const emiInterest  = totalEmiPaid - net

    // Sensitivity — NPV at different tariff inflation rates
    const sensitivity = [0, 3, 5, 7, 10].map(inf => {
      let npvS = -net
      for (let y = 1; y <= 25; y++) {
        const gen     = annualUnitsY1 * Math.pow(1 - degradeRate, y)
        const tariffY = tariff * Math.pow(1 + inf / 100, y)
        npvS += (gen * tariffY + (gen / 1000) * REC_PRICE) / Math.pow(1 + DISCOUNT, y)
      }
      const pb = net / (annualUnitsY1 * tariff * (1 + inf / 100) + recPerYear * REC_PRICE)
      return { inf, npv: Math.round(npvS / 100000), payback: pb.toFixed(1) }
    })

    setResult({
      net, year1Savings, year1Elec, year1Rec: Math.round(year1Rec),
      payback, npv, irr, lcoe, co2: Math.round(co2),
      rawCost, centralSub, stateSub, totalSub,
      emi, emiT, emiInterest, totalEmiPaid,
      units: Math.round(annualUnitsY1), tariff: tariff.toFixed(2),
      recs: recPerYear.toFixed(1),
      state: stateLabel, roofArea: size * 100,
      suggestedSize, sensitivity, tariffInfl,
      panelCost, inverterCost, mountingCost, wiringCost, installCost, netMeterFee,
    })
  }

  const inr = (n: number) => Math.round(n).toLocaleString('en-IN')
  const L   = (n: number) => (n / 100000).toFixed(1)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Solar ROI Calculator</h1>
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          Techno-economic analysis — real IRR, LCOE, 25yr NPV, sensitivity · PM Surya Ghar + REC income
        </p>
      </div>

      {/* ── Inputs ── */}
      <div className="rounded-xl p-5 mb-6" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>State / UT</label>
            <div className="relative">
              <select value={state} onChange={e => setState(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }}>
                {STATES.map(([s]) => <option key={s} style={{ background: '#fff' }}>{s}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Monthly Electricity Bill (₹)</label>
            <input type="number" value={bill} onChange={e => setBill(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.2)', color: '#064E3B' }} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>System Size</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>{size} kW</span>
            </label>
            <input type="range" min={1} max={20} value={size} onChange={e => setSize(Number(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="flex justify-between mt-1" style={{ fontSize: 10, color: '#9CA3AF' }}><span>1 kW</span><span>20 kW</span></div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Tariff Inflation Assumption</span>
              <span style={{ color: '#D97706', fontWeight: 700 }}>{tariffInfl}% p.a.</span>
            </label>
            <input type="range" min={0} max={12} value={tariffInfl} onChange={e => setTariffInfl(Number(e.target.value))}
              className="w-full accent-amber-500" />
            <div className="flex justify-between mt-1" style={{ fontSize: 10, color: '#9CA3AF' }}><span>0%</span><span>12%</span></div>
          </div>
        </div>
        <button onClick={calculate}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white hover:brightness-110 transition-all"
          style={{ background: '#059669' }}>
          Calculate Solar Returns →
        </button>
      </div>

      {result && (
        <div className="space-y-4 anim-in">

          {/* Suggested size tip */}
          {result.suggestedSize !== size && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span style={{ color: '#D97706', fontSize: 16 }}>⚡</span>
              <span style={{ color: '#92400E' }}>
                Based on your ₹{bill} bill at ₹{result.tariff}/kWh,{' '}
                <strong style={{ color: '#D97706' }}>{result.suggestedSize} kW</strong> covers ~100% of your usage.
                You selected {size} kW.
              </span>
            </div>
          )}

          {/* ── Hero KPIs ── */}
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>
              {size} kW · {result.state} · ₹{result.tariff}/kWh tariff · {result.tariffInfl}% inflation assumption
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {[
                ['Net Investment', `₹${L(result.net)}L`,       `After ₹${inr(result.totalSub)} subsidy`,    '#059669'],
                ['Annual Savings', `₹${inr(result.year1Savings)}`, 'Electricity + REC (Yr 1)',              '#D97706'],
                ['Payback Period', `${result.payback.toFixed(1)} yrs`, result.payback < 3 ? 'Excellent' : result.payback < 5 ? 'Very Good' : 'Good', '#059669'],
                ['Real IRR',       `${result.irr.toFixed(1)}%`, 'Post-subsidy, 25yr cash flows',           '#059669'],
              ].map(([label, val, sub, color]) => (
                <div key={label as string} className="rounded-xl p-4 text-center" style={{ background: '#F0FDF4', border: `1px solid rgba(5,150,105,0.1)`, borderTop: `3px solid ${color as string}` }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
                  <div className="text-lg font-bold" style={{ color: color as string }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['25yr NPV @8%',   `₹${L(result.npv)}L`,          'Discounted returns',           '#D97706'],
                ['LCOE',           `₹${result.lcoe.toFixed(2)}/kWh`, `vs ₹${result.tariff} grid`, '#059669'],
                ['CO₂ Offset',     `${result.co2} t`,              `≈ ${result.co2 * 50} trees`,  '#059669'],
                ['Roof Area Reqd', `${result.roofArea} sq ft`,     '~100 sq ft per kW',            '#6B7280'],
              ].map(([label, val, sub, color]) => (
                <div key={label as string} className="rounded-xl p-4 text-center" style={{ background: '#F0FDF4', border: `1px solid rgba(5,150,105,0.1)`, borderTop: `3px solid ${color as string}` }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
                  <div className="text-lg font-bold" style={{ color: color as string }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Technical parameters ── */}
          <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Technical Parameters</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Annual Generation',   `${result.units.toLocaleString('en-IN')} kWh`, 'PR = 80% applied'],
                ['RECs Generated',      `${result.recs} MWh/yr`,    `₹${inr(result.year1Rec)}/yr income`],
                ['Panel Degradation',   '0.7% / year',              'Mono PERC standard'],
                ['Grid Emission Factor','0.716 kg/kWh',             'CEA India FY23'],
              ].map(([label, val, sub]) => (
                <div key={label as string} className="rounded-lg p-3"
                  style={{ background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.12)' }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#064E3B', marginTop: 2 }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-2 flex-wrap">
            {(['summary', 'cost', 'emi', 'sensitivity'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background: tab === t ? '#059669' : '#F0FDF4',
                  color: tab === t ? 'white' : '#6B7280',
                  border: `1px solid ${tab === t ? '#059669' : 'rgba(5,150,105,0.2)'}`,
                }}>
                {t === 'emi' ? 'EMI / Loan' : t === 'sensitivity' ? 'Sensitivity' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Summary ── */}
          {tab === 'summary' && (
            <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Year 1 Income Breakdown</div>
              <div className="space-y-3">
                {[
                  ['Electricity Savings', result.year1Elec, result.year1Savings, '#059669'],
                  ['REC Income (IEX ~₹347/MWh)', result.year1Rec, result.year1Savings, '#D97706'],
                ].map(([label, val, total, color]) => {
                  const pct = Math.round((val as number) / (total as number) * 100)
                  return (
                    <div key={label as string}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span style={{ color: '#374151' }}>{label}</span>
                        <span style={{ fontWeight: 600, color: '#064E3B' }}>₹{inr(val as number)} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: 'rgba(5,150,105,0.1)' }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color as string }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 flex justify-between text-sm" style={{ borderTop: '1px solid rgba(5,150,105,0.12)' }}>
                <span style={{ color: '#6B7280' }}>Total Year-1 Annual Income</span>
                <span className="font-bold" style={{ color: '#059669' }}>₹{inr(result.year1Savings)} / year</span>
              </div>
              <div className="mt-4 pt-4 flex justify-between text-sm" style={{ borderTop: '1px solid rgba(5,150,105,0.12)' }}>
                <span style={{ color: '#6B7280' }}>25yr Gross Returns</span>
                <span className="font-bold" style={{ color: '#D97706' }}>₹{L(result.npv + result.net)}L total · ₹{L(result.npv)}L NPV profit</span>
              </div>
            </div>
          )}

          {/* ── Cost Breakdown ── */}
          {tab === 'cost' && (
            <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Cost Breakdown — FY2024-25 Market Rates</div>
              <table className="w-full">
                <tbody>
                  {[
                    ['Solar Panels (Mono PERC)',    result.panelCost],
                    ['String Inverter',             result.inverterCost],
                    ['Mounting Structure (GI)',     result.mountingCost],
                    ['AC/DC Wiring & BOS',         result.wiringCost],
                    ['Installation & Commissioning',result.installCost],
                    ['Net Meter Application Fee',   result.netMeterFee],
                  ].map(([row, val]) => (
                    <tr key={row as string} style={{ borderBottom: '1px solid rgba(5,150,105,0.08)' }}>
                      <td className="py-2.5 text-sm" style={{ color: '#374151' }}>{row}</td>
                      <td className="py-2.5 text-sm font-semibold text-right" style={{ color: '#064E3B' }}>₹{inr(val as number)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid rgba(5,150,105,0.2)' }}>
                    <td className="py-2.5 text-sm font-bold" style={{ color: '#064E3B' }}>Gross Total</td>
                    <td className="py-2.5 text-sm font-bold text-right" style={{ color: '#064E3B' }}>₹{inr(result.rawCost)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-sm text-emerald-600">− Central Subsidy (PM-SGY)</td>
                    <td className="py-2 text-sm text-emerald-600 font-semibold text-right">−₹{inr(result.centralSub)}</td>
                  </tr>
                  {result.stateSub > 0 && (
                    <tr>
                      <td className="py-2 text-sm text-emerald-600">− State Subsidy</td>
                      <td className="py-2 text-sm text-emerald-600 font-semibold text-right">−₹{inr(result.stateSub)}</td>
                    </tr>
                  )}
                  <tr style={{ background: 'rgba(5,150,105,0.07)', borderRadius: 8 }}>
                    <td className="py-3 px-3 text-sm font-bold rounded-l-lg" style={{ color: '#059669' }}>Net Investment</td>
                    <td className="py-3 px-3 text-sm font-bold text-right rounded-r-lg" style={{ color: '#059669' }}>₹{inr(result.net)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ── EMI ── */}
          {tab === 'emi' && (
            <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Loan Financing — Green Energy Loan @ 9% p.a., 60 Months
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  ['Monthly EMI',        `₹${inr(result.emi)}`,          '60 months @ 9%',    '#064E3B'],
                  ['Total Interest',     `₹${inr(result.emiInterest)}`,  'Finance cost',       '#DC2626'],
                  ['Total Amount Paid',  `₹${inr(result.totalEmiPaid)}`, 'Principal + Interest','#374151'],
                  ['Monthly Net Saving', `₹${inr(Math.max(0, result.year1Savings / 12 - result.emi))}`, 'Solar income − EMI', '#059669'],
                ].map(([label, val, sub, color]) => (
                  <div key={label as string} className="rounded-xl p-4 text-center" style={{ background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.1)', borderTop: `3px solid ${color as string}` }}>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
                    <div className="text-lg font-bold" style={{ color: color as string }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs p-3 rounded-lg leading-relaxed"
                style={{ background: '#F0FDF4', border: '1px solid rgba(5,150,105,0.15)', color: '#374151' }}>
                <strong style={{ color: '#059669' }}>Tip:</strong> SBI, Bank of Baroda, and NABARD offer PM-SGY linked green energy loans
                at 6–8% for eligible beneficiaries — lower than the 9% assumed here. Check with your local branch.
              </div>
            </div>
          )}

          {/* ── Sensitivity ── */}
          {tab === 'sensitivity' && (
            <div className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Sensitivity — NPV @8% Discount Rate vs Tariff Inflation
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(5,150,105,0.15)' }}>
                    <th className="pb-3 text-left font-medium" style={{ fontSize: 11, color: '#9CA3AF' }}>Tariff Inflation</th>
                    <th className="pb-3 text-right font-medium" style={{ fontSize: 11, color: '#9CA3AF' }}>Simple Payback</th>
                    <th className="pb-3 text-right font-medium" style={{ fontSize: 11, color: '#9CA3AF' }}>25yr NPV @8%</th>
                    <th className="pb-3 text-right font-medium" style={{ fontSize: 11, color: '#9CA3AF' }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sensitivity.map((row: any) => (
                    <tr key={row.inf} style={{ background: row.inf === result.tariffInfl ? 'rgba(5,150,105,0.06)' : undefined, borderBottom: '1px solid rgba(5,150,105,0.08)' }}>
                      <td className="py-2.5 text-sm" style={{ color: '#374151' }}>
                        {row.inf === result.tariffInfl && <span className="text-emerald-600 mr-1">▸</span>}
                        {row.inf}% p.a.
                      </td>
                      <td className="py-2.5 text-sm text-right" style={{ color: '#6B7280' }}>{row.payback} yrs</td>
                      <td className="py-2.5 text-sm font-semibold text-right"
                        style={{ color: row.npv > 0 ? '#059669' : '#DC2626' }}>
                        {row.npv > 0 ? '+' : ''}₹{row.npv}L
                      </td>
                      <td className="py-2.5 text-xs text-right"
                        style={{ color: row.npv > 100 ? '#059669' : row.npv > 50 ? '#D97706' : row.npv > 0 ? '#9CA3AF' : '#DC2626' }}>
                        {row.npv > 100 ? 'Excellent' : row.npv > 50 ? 'Very Good' : row.npv > 0 ? 'Good' : 'Marginal'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12, lineHeight: 1.6 }}>
                India electricity tariffs have risen ~5-7% p.a. historically. Higher tariff inflation = better solar returns.
                At 0% inflation solar is still typically profitable but with longer payback.
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', paddingBottom: 8, lineHeight: 1.6 }}>
            Assumptions: Mono PERC panels · PR 80% · Degradation 0.7%/yr · REC ₹347/MWh (IEX, approx) ·
            Tariff inflation {result.tariffInfl}% p.a. · NPV @8% · CEA grid EF 0.716 kgCO₂/kWh · PM-SGY FY2024-25
          </div>
        </div>
      )}
    </div>
  )
}


