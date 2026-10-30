'use client'
import { useState } from 'react'

// ── Sub-tab definitions ────────────────────────────────────────────────────────
const LEARN_TABS = [
  { id: 'overview',  label: 'Overview',          emoji: '🌱' },
  { id: 'workflow',  label: 'Trading Workflow',   emoji: '🔄' },
  { id: 'earn',      label: 'Who Earns & How',    emoji: '✅' },
  { id: 'us-market', label: 'US Carbon Market',   emoji: '🌎' },
  { id: 'vs-stocks', label: 'vs. Stock Market',   emoji: '📈' },
]

// ── Shared micro-components ────────────────────────────────────────────────────
function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
      {children}
    </span>
  )
}

function Card({ title, accent = '#059669', children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
      {title && <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: accent }}>{title}</div>}
      {children}
    </div>
  )
}

// ── Section 1: Overview ────────────────────────────────────────────────────────
function LearnOverview() {
  const timeline = [
    ['2022', 'Energy Conservation Amendment Act — legal foundation for CCTS enacted'],
    ['Jan 2023', 'MoEFCC notifies CCTS framework; BEE designated as regulator/administrator'],
    ['2023–2026', 'Pilot phase covering energy-intensive sectors: cement, steel, aluminium, textiles, pulp & paper'],
    ['2026+', 'Full market launch on IEX — compliance carbon credit auctions begin; banking & borrowing allowed'],
  ]

  return (
    <div className="space-y-4">
      {/* Hero definition */}
      <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(5,150,105,0.02))', border: '1px solid rgba(5,150,105,0.2)' }}>
        <div className="text-base font-bold mb-2" style={{ color: '#064E3B' }}>What is a Carbon Credit?</div>
        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
          One carbon credit equals the right to emit — or the verified removal of —{' '}
          <strong>1 metric tonne of CO₂ equivalent (CO₂e)</strong>. Governments or registries
          issue these credits to incentivise emission reductions. Companies that pollute <em>less</em>{' '}
          than their allowed quota can <strong>sell</strong> surplus credits; companies that pollute{' '}
          <em>more</em> than their limit must <strong>buy</strong> them or face heavy penalties.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip color="#059669">1 Credit = 1 tonne CO₂e</Chip>
          <Chip color="#2563EB">Tradeable financial asset</Chip>
          <Chip color="#D97706">Market-priced (supply &amp; demand)</Chip>
        </div>
      </div>

      {/* Two market types */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Compliance Markets (Mandatory)" accent="#059669">
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
            Governments mandate covered industries to stay within emission caps. Penalties for
            non-compliance are steep — EU ETS charges €100/tonne for excess; Indian CCTS will carry
            financial penalties per BEE guidelines.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs" style={{ color: '#6B7280' }}>
            <li>• <strong style={{ color: '#374151' }}>India:</strong> CCTS under BEE / MoEFCC (pilot 2023–2026)</li>
            <li>• <strong style={{ color: '#374151' }}>Europe:</strong> EU Emissions Trading System (EU ETS) — since 2005</li>
            <li>• <strong style={{ color: '#374151' }}>USA:</strong> California Cap-and-Trade, RGGI (12 states)</li>
            <li>• <strong style={{ color: '#374151' }}>China:</strong> National ETS — world's largest by volume</li>
          </ul>
        </Card>
        <Card title="Voluntary Markets (Optional)" accent="#D97706">
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
            Companies buy credits voluntarily to meet ESG goals, net-zero pledges, or carbon-neutral
            marketing claims. No government mandate — driven entirely by corporate commitments and
            reputational pressure from investors.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs" style={{ color: '#6B7280' }}>
            <li>• <strong style={{ color: '#374151' }}>Verra VCS:</strong> World's largest voluntary registry</li>
            <li>• <strong style={{ color: '#374151' }}>Gold Standard:</strong> Premium certified credits (Swiss-based)</li>
            <li>• <strong style={{ color: '#374151' }}>Examples:</strong> Tesla, Microsoft, Google, Amazon — all net-zero buyers</li>
          </ul>
        </Card>
      </div>

      {/* India CCTS timeline */}
      <Card title="India's CCTS — Timeline &amp; Roadmap">
        <div className="space-y-2">
          {timeline.map(([year, event]) => (
            <div key={year} className="flex gap-3 items-start">
              <div className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 text-center"
                style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', minWidth: 80 }}>
                {year}
              </div>
              <p className="text-xs pt-1 leading-relaxed" style={{ color: '#374151' }}>{event}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: 'rgba(5,150,105,0.04)', color: '#374151' }}>
          <strong style={{ color: '#059669' }}>Key regulators:</strong> Ministry of Environment (MoEFCC) sets policy,
          Bureau of Energy Efficiency (BEE) administers credits, CERC regulates trading, IEX provides the exchange platform.
        </div>
      </Card>
    </div>
  )
}

// ── Section 2: Trading Workflow ────────────────────────────────────────────────
function LearnWorkflow() {
  const steps = [
    {
      n: '01', color: '#2563EB',
      title: 'Government Sets the Annual CAP',
      body: 'The regulator (BEE in India, CARB in California, European Commission for EU ETS) sets the total emissions allowed across all covered sectors for the year. This is the "cap" in cap-and-trade. Critically, the cap decreases every year — making credits scarcer and driving long-term price appreciation.',
    },
    {
      n: '02', color: '#7C3AED',
      title: 'Allowances Allocated to Covered Industries',
      body: 'Each covered company receives a set of free allowances based on historical emissions (grandfathering) or buys them at government auction. One allowance = right to emit one tonne CO₂e that year. Companies know exactly how many tonnes they are "allowed" before the compliance year begins.',
    },
    {
      n: '03', color: '#059669',
      title: 'Reduce Emissions or Buy Credits — Two Outcomes',
      body: '',
      split: [
        {
          color: '#059669',
          label: 'Clean Company (Under Cap)',
          points: [
            'Invests in renewables, efficiency, or fuel switching',
            'Emits less than its annual allowance',
            'Holds surplus credits it can sell on the market',
            'Carbon credits become a direct revenue stream',
          ],
        },
        {
          color: '#DC2626',
          label: 'High-Emission Company (Over Cap)',
          points: [
            'Cannot reduce emissions quickly enough',
            'Emits more than its allowance permits',
            'Must buy credits from the market to cover deficit',
            'Failure to cover = heavy penalty (2–3× market price)',
          ],
        },
      ],
    },
    {
      n: '04', color: '#D97706',
      title: 'Trade on an Exchange or Through Brokers',
      body: 'Credits trade on regulated exchanges (IEX in India, ICE in Europe/USA, CME for futures). Both spot and futures markets exist. The price is set purely by supply and demand — just like a commodity or equity. Institutional traders, hedge funds, and compliance buyers all participate.',
    },
    {
      n: '05', color: '#0891B2',
      title: 'Third-Party Verification — MRV Process',
      body: 'Monitor, Report, Verify (MRV) is mandatory before any credit can be issued or traded. An accredited auditor (Bureau Veritas, DNV, KPMG, SGS) independently verifies that emission reductions are real, additional, and permanent. No verification = no credits. This prevents fraud and greenwashing.',
    },
    {
      n: '06', color: '#064E3B',
      title: 'Registry Issues &amp; Retires Credits',
      body: 'Verified credits are recorded in a national registry (BEE registry in India, CARB registry in California, ERCST in Europe). When a company submits credits for compliance at year-end, they are permanently "retired" — cancelled so they cannot be used again. This prevents double-counting.',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4" style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.12)' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
          This is a <strong>Cap-and-Trade</strong> system. The government controls supply by shrinking
          the cap annually. Companies that decarbonise fastest profit by selling surplus credits; laggards
          pay a rising price for their delay. Think of it as a financial incentive to clean up — not just
          a regulation to comply with.
        </p>
      </div>

      <div className="relative">
        {steps.map((s, i) => (
          <div key={s.n} className="flex gap-4 mb-1">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: s.color, color: '#fff' }}>{s.n}</div>
              {i < steps.length - 1 && (
                <div className="w-0.5 mt-1 mb-1" style={{ background: `${s.color}35`, minHeight: 24, flex: 1 }} />
              )}
            </div>
            <div className="flex-1 mb-2">
              <div className="rounded-xl p-4" style={{ background: '#ffffff', border: `1px solid ${s.color}25` }}>
                <div className="text-sm font-semibold mb-1.5"
                  dangerouslySetInnerHTML={{ __html: s.title }}
                  style={{ color: s.color }} />
                {s.body && (
                  <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{s.body}</p>
                )}
                {s.split && (
                  <div className="grid md:grid-cols-2 gap-3 mt-1">
                    {s.split.map(branch => (
                      <div key={branch.label} className="rounded-lg p-3"
                        style={{ background: `${branch.color}06`, border: `1px solid ${branch.color}20` }}>
                        <div className="text-xs font-bold mb-2" style={{ color: branch.color }}>{branch.label}</div>
                        <ul className="space-y-1">
                          {branch.points.map(pt => (
                            <li key={pt} className="text-xs flex gap-1.5" style={{ color: '#6B7280' }}>
                              <span style={{ color: branch.color }}>•</span> {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Section 3: Who Earns & How ─────────────────────────────────────────────────
function LearnEarn() {
  const generators = [
    {
      emoji: '☀️', type: 'Renewable Energy',
      examples: 'Solar farms, wind turbines, small hydro, biomass / waste-to-energy plants',
      creditPotential: 'High — each MWh of clean power displaces ~0.7–0.9 tonnes coal-based CO₂',
      indiaContext: 'RECs on IEX today; CCTS credits from 2026 (overlapping incentives)',
    },
    {
      emoji: '🏭', type: 'Energy Efficiency (PAT Scheme)',
      examples: 'Cement, steel, aluminium, fertiliser, textile, chlor-alkali — BEE-designated sectors',
      creditPotential: 'Medium — depends on efficiency delta vs. baseline; traded as ESCerts today',
      indiaContext: 'BEE PAT (Perform Achieve Trade) is India\'s original carbon-lite market since 2012',
    },
    {
      emoji: '🌳', type: 'Forestry &amp; Land Use (REDD+)',
      examples: 'Afforestation, avoided deforestation, agroforestry, soil carbon sequestration',
      creditPotential: 'High — forests absorb 2.6 billion tonnes CO₂/year globally',
      indiaContext: 'Voluntary Gold Standard / Verra projects in India\'s northeast and Western Ghats',
    },
    {
      emoji: '🏗️', type: 'Industrial Process Changes',
      examples: 'Carbon Capture &amp; Storage (CCS), fuel switching (coal → gas → green H₂), process redesign',
      creditPotential: 'Medium–High — technology-dependent; CCS can capture 90%+ of point-source emissions',
      indiaContext: 'Pilot projects under CCTS; Steel / cement CCS under National Hydrogen Mission',
    },
    {
      emoji: '♻️', type: 'Waste &amp; Methane Capture',
      examples: 'Landfill gas capture, biogas plants, wastewater treatment optimisation',
      creditPotential: 'Medium — methane has 25× the warming effect of CO₂ over 100 years (GWP-100)',
      indiaContext: 'Voluntary market projects; SWACHH Bharat Mission landfill work eligible under VCS',
    },
  ]

  const steps = [
    ['Identify eligible project', 'Must fall within an approved methodology. BEE maintains India\'s list; globally, Verra and Gold Standard publish 100+ methodologies (e.g., VM0015 for avoided deforestation).'],
    ['Calculate the baseline', '"What would emissions have been WITHOUT this project?" This counterfactual baseline is audited. Credits are issued only for reductions above it.'],
    ['Implement reduction measures', 'Install solar panels, plant trees, upgrade boilers, switch fuels, install methane capture. The physical work happens here.'],
    ['Monitor continuously (M)', 'Use CEMS (Continuous Emission Monitoring Systems) or IoT sensors to measure actual emissions against baseline 24/7. Data must be tamper-proof.'],
    ['Report (R)', 'Submit a detailed emissions report to BEE / accredited registry. India mandates annual reporting for CCTS-covered industries.'],
    ['Verify independently (V)', 'An accredited third-party auditor (DNV, Bureau Veritas, SGS, KPMG) reviews all data on-site and remotely. This step cannot be skipped.'],
    ['Registry issues credits', 'BEE registry (India) or Verra/Gold Standard (global) issues credits = baseline emissions − actual emissions. Now tradeable.'],
  ]

  return (
    <div className="space-y-5">
      <Card title="Who Can Earn Carbon Credits?">
        <div className="space-y-3 mt-1">
          {generators.map(g => (
            <div key={g.type} className="flex gap-3 items-start p-3 rounded-lg"
              style={{ background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.08)' }}>
              <span className="text-2xl flex-shrink-0">{g.emoji}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold mb-0.5"
                  dangerouslySetInnerHTML={{ __html: g.type }}
                  style={{ color: '#064E3B' }} />
                <div className="text-xs mb-1.5"
                  dangerouslySetInnerHTML={{ __html: g.examples }}
                  style={{ color: '#6B7280' }} />
                <div className="flex flex-wrap gap-2">
                  <Chip color="#059669">Credits: {g.creditPotential}</Chip>
                </div>
                <div className="text-xs mt-1.5"
                  dangerouslySetInnerHTML={{ __html: `<strong style="color:#374151">India context:</strong> ${g.indiaContext}` }}
                  style={{ color: '#6B7280' }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="How to Earn Credits — The MRV Process (Step by Step)">
        <p className="text-xs mb-3 leading-relaxed" style={{ color: '#6B7280' }}>
          MRV (Monitor → Report → Verify) is the backbone of carbon market integrity. No MRV, no credits. This is why
          carbon credits differ from greenwashing — independent auditors verify every claim.
        </p>
        <div className="space-y-3">
          {steps.map(([title, desc], i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
                style={{ background: '#059669', fontSize: 10, minWidth: 24, color: '#fff' }}>{i + 1}</div>
              <div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: '#064E3B' }}>{title}</div>
                <div className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Section 4: US Carbon Market ────────────────────────────────────────────────
function LearnUSMarket() {
  const markets = [
    {
      flag: '🌴',
      name: 'California Cap-and-Trade (WCI)',
      operator: 'California Air Resources Board (CARB)',
      sectors: 'Utilities, large industry, fuel distributors — covers ~85% of CA emissions',
      price: '$28–32 / tonne (CCAs)',
      size: '~400M tonnes CO₂e per year',
      notes: 'Largest and most mature US compliance carbon market, running since 2013. Quarterly auctions by CARB. Linked with Québec, Canada (Western Climate Initiative). Has raised over $17 billion in auction revenues since launch.',
      economy: 'California recycles auction revenue as direct consumer rebate cheques ($400–750 per household), funding electric transit, affordable housing near transit corridors, and wildfire prevention — making the policy politically durable and economically redistributive.',
      example: 'Real example: In 2021, CARB raised $4.5B in a single auction year. That money paid for free zero-emission school buses in low-income districts and electrification of the LA Metro — demonstrating how carbon pricing funds the energy transition.',
    },
    {
      flag: '🏙️',
      name: 'RGGI — Regional Greenhouse Gas Initiative',
      operator: '12 Northeast & Mid-Atlantic US states',
      sectors: 'Power sector only — electricity generators above 25 MW',
      price: '$14–17 / tonne (RGGI Allowances)',
      size: '~120M tonnes CO₂e per year',
      notes: 'The first mandatory US cap-and-trade program, operating since 2009. Power sector emissions in RGGI states fell over 50% between 2009 and 2021. All auction revenues flow back to state clean energy programs.',
      economy: 'Economic multiplier effect: for every $1 invested in energy efficiency programs funded by RGGI, states save $3–5 in avoided future energy costs. New Jersey\'s RGGI-funded weatherisation programs reduced household heating bills by $500+/year for low-income residents.',
      example: 'Real example: Massachusetts used RGGI funds to subsidise 200,000 heat pump installations 2018–2023, cutting both household energy bills and emissions simultaneously — the carbon price paid for itself in energy savings.',
    },
    {
      flag: '🌍',
      name: 'Voluntary Carbon Markets (VCM)',
      operator: 'Verra VCS, Gold Standard, ACR, Climate Action Reserve',
      sectors: 'Any project globally that credibly reduces or removes emissions',
      price: '$3–50 / tonne (varies widely by project quality)',
      size: '$2B+ annually (growing 15–20% per year)',
      notes: 'No government mandate. Corporations buy to meet net-zero pledges and ESG commitments. Quality varies significantly — premium credits (REDD+ forest protection, biochar) command $30–50; basic offsets trade near $3–5. Additionality is the key quality test.',
      economy: 'Carbon finance creates new income streams for developing-country conservation projects. REDD+ projects in Indonesia and Brazil pay forest communities directly to protect trees instead of logging. India\'s voluntary market credits from solar/wind in remote areas effectively transfer clean-energy finance from OECD corporations to Indian villages.',
      example: 'Real example: Tesla earned $1.78 billion selling ZEV (zero-emission vehicle) credits to GM, Fiat Chrysler, and other legacy automakers between 2020–2021 — before EV sales took off. Carbon and green credits funded Tesla\'s early survival and R&D. Microsoft has pre-purchased $1B+ in carbon removal credits (direct air capture, biochar) through 2030.',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.12)' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
          The US has <strong>no federal carbon market</strong>, but state and regional markets are among the
          world's most mature. California's market is 12+ years old and provides a real-world roadmap for where
          India's CCTS is heading. The economics, the politics, and the price dynamics are directly comparable.
        </p>
      </div>

      {markets.map(m => (
        <div key={m.name} className="rounded-xl p-5" style={{ background: '#fff', border: '1px solid rgba(5,150,105,0.15)', boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">{m.flag}</span>
            <div>
              <div className="text-sm font-bold" style={{ color: '#064E3B' }}>{m.name}</div>
              <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Operated by: {m.operator}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              ['Credit Price', m.price, '#059669'],
              ['Market Size', m.size, '#2563EB'],
              ['Coverage', m.sectors.split('—')[0].trim(), '#D97706'],
            ].map(([label, val, color]) => (
              <div key={label} className="rounded-lg p-3 text-center" style={{ background: '#F0FDF4' }}>
                <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>{label}</div>
                <div className="text-xs font-bold" style={{ color: color as string }}>{val}</div>
              </div>
            ))}
          </div>

          <p className="text-xs leading-relaxed mb-3" style={{ color: '#6B7280' }}>{m.notes}</p>

          <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(5,150,105,0.04)', border: '1px solid rgba(5,150,105,0.12)' }}>
            <div className="text-xs font-bold mb-1" style={{ color: '#059669' }}>Economic Connection</div>
            <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{m.economy}</p>
          </div>

          <div className="rounded-lg p-3" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)' }}>
            <div className="text-xs font-bold mb-1" style={{ color: '#2563EB' }}>Real-World Example</div>
            <p className="text-xs leading-relaxed" style={{ color: '#374151' }}>{m.example}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Section 5: vs. Stock Market ────────────────────────────────────────────────
function LearnVsStocks() {
  const rows = [
    ['What you own', '1 tonne CO₂e emission allowance / removal certificate', 'Fractional ownership in a company'],
    ['Exchange (India)', 'IEX (CCTS pilot, full launch 2026)', 'NSE / BSE'],
    ['Exchange (Global)', 'ICE, CME (EUA/CCA futures)', 'NYSE, NASDAQ, LSE'],
    ['Primary price driver', 'Policy (cap size, compliance deadlines, elections)', 'Company earnings, growth outlook, macro'],
    ['Supply control', 'Govt shrinks cap 4–5% per year — fixed schedule', 'Company controls share issuance (can dilute)'],
    ['Demand type', 'Compliance mandates + ESG funds + speculators', 'Retail, institutional, FIIs — all investor types'],
    ['Long-term supply bias', 'Declining (cap tightens annually — like forced buyback)', 'Can grow (secondary offerings, ESOPs)'],
    ['Volatility cause', 'Policy reversal, weather, election outcome, recession', 'Earnings surprise, rate moves, macro, sentiment'],
    ['Correlation to equities', 'Low — driven by different fundamentals', 'High — correlated with each other and indices'],
    ['India market maturity', 'Pilot phase, price discovery emerging', 'Mature 30+ year market with deep liquidity'],
    ['Investable today?', 'ESCerts (PAT) and RECs on IEX; CCTS from 2026', 'Yes — full retail access via demat account'],
  ]

  const scenarios = [
    { dir: '↑', scenario: 'Government tightens the cap faster than expected', effect: 'Supply shrinks sharply → fewer credits available → price spikes. EU ETS demonstrated this: €5 (2013) → €105 (2023) as oversupply was absorbed.' },
    { dir: '↓', scenario: 'Economic recession / industrial slowdown', effect: 'Factories cut output → less emissions → less compliance demand → price falls. EU ETS crashed in 2009 recession and again in 2013 from Covid-era over-allocation.' },
    { dir: '↑', scenario: 'Cold winter / heat wave (energy demand spike)', effect: 'Power plants burn more gas and coal → need more credits → demand spikes → price rises. Seasonal volatility is structurally embedded in carbon markets.' },
    { dir: '↓', scenario: 'Government floods the market (political pressure)', effect: 'Oversupply → price collapses. EU ETS crashed to €5 in 2013 because recession + political grants of free allowances created a glut. Lesson: policy risk is real.' },
    { dir: '↑', scenario: 'New sectors / countries added to compliance scheme', effect: 'More buyers suddenly enter → demand jumps while supply stays capped → price rises. India adding aviation in 2026+ could drive CCTS price significantly.' },
    { dir: '↓', scenario: 'Technology breakthrough (cheap solar, CCS scaling)', effect: 'Companies can reduce emissions cheaply → less need to buy credits → demand falls → price dips. Longer term, though, the cap keeps falling so the floor rises.' },
    { dir: '↑', scenario: 'ESG mandates and voluntary buyer surge', effect: 'Large corporates pre-buying forward credits for 2030 net-zero pledges → demand exceeds compliance-only level → price premium. Happened in California CCA market in 2021.' },
  ]

  return (
    <div className="space-y-5">
      {/* Comparison table */}
      <Card title="Carbon Credits vs. Stock Market — Side by Side">
        <div className="overflow-x-auto">
          <table className="w-full text-xs mt-1 border-separate" style={{ borderSpacing: '0 2px' }}>
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 font-semibold" style={{ color: '#9CA3AF', width: '30%' }}>Feature</th>
                <th className="text-left py-2 pr-4 font-semibold" style={{ color: '#059669', width: '35%' }}>Carbon Credits</th>
                <th className="text-left py-2 font-semibold" style={{ color: '#2563EB', width: '35%' }}>Stocks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([feat, carbon, stock], i) => (
                <tr key={feat} className="rounded-lg"
                  style={{ background: i % 2 === 0 ? 'rgba(5,150,105,0.03)' : 'transparent' }}>
                  <td className="py-2 pr-4 font-medium rounded-l-lg" style={{ color: '#374151', paddingLeft: 6 }}>{feat}</td>
                  <td className="py-2 pr-4" style={{ color: '#059669' }}>{carbon}</td>
                  <td className="py-2 rounded-r-lg" style={{ color: '#2563EB' }}>{stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supply-demand price scenarios */}
      <Card title="How Price Fluctuates — Supply &amp; Demand Scenarios" accent="#D97706">
        <p className="text-xs leading-relaxed mb-4" style={{ color: '#374151' }}>
          Carbon credits are like a stock with a <strong>government-mandated share buyback every year</strong>
          — supply shrinks on a fixed schedule. Price is driven by demand shocks on top of that structural
          supply tightening. Unlike stocks, the supply schedule is <em>publicly known in advance</em>,
          making carbon a unique hybrid of commodity, financial instrument, and policy tool.
        </p>
        <div className="space-y-2">
          {scenarios.map(s => (
            <div key={s.scenario} className="flex gap-3 items-start p-3 rounded-lg"
              style={{
                background: s.dir === '↑' ? 'rgba(5,150,105,0.04)' : 'rgba(220,38,38,0.04)',
                border: `1px solid ${s.dir === '↑' ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.15)'}`,
              }}>
              <span className="text-sm font-black flex-shrink-0 mt-0.5" style={{ color: s.dir === '↑' ? '#059669' : '#DC2626' }}>{s.dir}</span>
              <div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: '#374151' }}>{s.scenario}</div>
                <div className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{s.effect}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Structural insight */}
      <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(37,99,235,0.04))', border: '1px solid rgba(5,150,105,0.2)' }}>
        <div className="text-sm font-bold mb-2" style={{ color: '#064E3B' }}>The Structural Long-Term Thesis</div>
        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
          The government-mandated cap shrinks 4–5% per year. If economic activity stays flat, the price
          <em> must</em> rise — mathematically. The EU ETS demonstrated this: price rose from €5 (2013)
          to €105 (2023) as the cap tightened and the post-recession glut cleared. India's CCTS is at
          the €5 equivalent stage today. The trajectory, if the policy holds, points structurally upward
          — making early participation in India's carbon market an asymmetric opportunity, provided you
          price in policy risk.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip color="#059669">Supply shrinks annually (structural bull)</Chip>
          <Chip color="#DC2626">Policy reversal = biggest risk</Chip>
          <Chip color="#D97706">India CCTS: early-stage = high risk + high upside</Chip>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CCTSLearnPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':  return <LearnOverview />
      case 'workflow':  return <LearnWorkflow />
      case 'earn':      return <LearnEarn />
      case 'us-market': return <LearnUSMarket />
      case 'vs-stocks': return <LearnVsStocks />
      default:          return <LearnOverview />
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌿</span>
          <h1 className="text-xl font-bold" style={{ color: '#064E3B' }}>CCTS Learn Module</h1>
        </div>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          Carbon Credit Trading Scheme — how it works, who benefits, and how it connects to the economy
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {LEARN_TABS.map(t => {
          const isActive = activeTab === t.id
          return (
            <button key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: isActive ? '#059669' : '#ffffff',
                color: isActive ? '#ffffff' : '#6B7280',
                border: isActive ? '1px solid #059669' : '1px solid rgba(5,150,105,0.2)',
              }}>
              <span>{t.emoji}</span>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Active section content */}
      {renderContent()}
    </div>
  )
}
