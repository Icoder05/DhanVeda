'use client'
import { useState } from 'react'

/* ── Topic catalogue ──────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'stocks',
    label: 'Stock Investing',
    icon: '📈',
    color: '#059669',
    topics: [
      {
        id: 'pe', label: 'P/E Ratio',
        prompt: 'Explain P/E ratio for Indian retail investor beginners. Cover: what P/E means, how to read it (high vs low), when P/E is misleading (cyclicals, loss-making companies), sector-specific benchmarks (FMCG 40-50x vs PSU banks 5-10x), forward P/E, and practical examples using Reliance, TCS, and Infosys.',
      },
      {
        id: 'roe', label: 'ROE vs ROCE',
        prompt: 'Explain ROE and ROCE for Indian investors. Cover: the exact formulas, why ROCE matters more for capital-intensive businesses (steel, power), why ROE can be inflated by debt, typical benchmarks by sector, and examples from Tata Steel, HDFC Bank, and Asian Paints.',
      },
      {
        id: 'financial_statements', label: 'Reading Balance Sheets',
        prompt: 'Teach how to read a basic Balance Sheet and P&L for Indian retail investors. Cover: what assets/liabilities/equity mean, how the income statement flows to balance sheet, what "other income" hides, and red flags like rising receivables or falling margins. Use a simple hypothetical Indian company with ₹ figures.',
      },
      {
        id: 'promoter', label: 'Promoter Pledging',
        prompt: 'Explain promoter holding and promoter pledging for Indian investors. Cover: what promoter pledging is, why it is dangerous (margin calls, forced selling), SEBI rules on disclosure, threshold levels to watch (>20% pledging is risky), and examples of Indian companies that collapsed due to promoter pledging like DHFL, Zee.',
      },
      {
        id: 'dcf', label: 'DCF Valuation',
        prompt: 'Explain DCF (Discounted Cash Flow) valuation for Indian investors in simple terms. Cover: the core idea (a rupee today vs future), free cash flow, discount rate (WACC), terminal value, and a worked example with a hypothetical Indian business earning ₹100 crore free cash flow per year.',
      },
      {
        id: 'debt', label: 'Debt & Leverage',
        prompt: 'Explain debt/equity ratio, interest coverage ratio, and current ratio for Indian investors. Cover: when debt is acceptable (infrastructure vs FMCG), the danger zone thresholds, how to find these numbers in screener.in, and examples comparing a healthy vs overleveraged Indian company.',
      },
      {
        id: 'dividends', label: 'Dividend Investing',
        prompt: 'Explain dividend investing for Indian retail investors. Cover: dividend yield vs dividend payout ratio, the difference between special and regular dividends, dividend-paying PSUs (ONGC, Coal India), how dividends are taxed in India (flat 20% TDS above ₹5000), and how to build a dividend income portfolio in India.',
      },
      {
        id: 'mistakes', label: 'Common Mistakes',
        prompt: 'Explain the 6 most common investing mistakes made by Indian retail investors with real examples: (1) buying on tips without research, (2) averaging down on bad businesses, (3) ignoring promoter pledging, (4) confusing price with value, (5) over-diversification, (6) panic selling. For each, give a real Indian market example and what to do instead.',
      },
    ],
  },
  {
    id: 'green',
    label: 'Green Finance',
    icon: '🌱',
    color: '#10B981',
    topics: [
      {
        id: 'esg', label: 'ESG Investing',
        prompt: 'Explain ESG investing for Indian retail investors. Cover: E (environmental: carbon, water), S (social: workforce safety, diversity), G (governance: board quality, pledging, BRSR disclosure), SEBI\'s top-1000 BRSR mandate, ESG mutual funds in India, and how to check a company\'s ESG score using free tools like MSCI or Sustainalytics.',
      },
      {
        id: 'recs', label: 'RECs & Carbon Credits',
        prompt: 'Explain Renewable Energy Certificates (RECs) and carbon credits for Indian investors and businesses. Cover: what a REC is (1 REC = 1 MWh renewable energy), IEX REC market (price ~₹347/MWh), BEE PAT (Perform Achieve Trade) scheme for industrial energy efficiency, Carbon Credit Certificates (CCC) under CCTS 2023, and how a solar company can earn RECs.',
      },
      {
        id: 'icm', label: 'India Carbon Market',
        prompt: 'Explain India\'s Carbon Market (ICM) under the Carbon Credit Trading Scheme (CCTS) 2023. Cover: what carbon credits are, how CCTS works, the difference between compliance and voluntary markets, India\'s net-zero 2070 target, BEE\'s role, current status (pilot phase before open trading in 2026), and which sectors are covered.',
      },
      {
        id: 'ccts_workflow', label: 'CCTS: How Cap & Trade Works',
        prompt: 'Explain exactly how the Carbon Credit Trading Scheme (CCTS) cap-and-trade mechanism works step by step for Indian investors. Cover: (1) How the government (BEE/MoEFCC) sets the annual emissions cap and distributes allowances to covered industries (cement, steel, aluminium, textiles, fertiliser), (2) What happens when a company emits LESS than its cap — it earns surplus Carbon Credit Certificates (CCCs) it can sell on IEX, earning direct revenue, (3) What happens when a company emits MORE than its cap — it must buy CCCs from the market or face penalties at 2–3× the market price, creating a strong financial incentive, (4) How CCCs trade on IEX (Indian Energy Exchange) — the same exchange where RECs and electricity futures trade, (5) The MRV (Monitor, Report, Verify) process — why BEE-empanelled third-party auditors must independently verify all emission reductions before any credit is issued, (6) How the BEE registry issues and retires credits to prevent double-counting — once a company submits CCCs for compliance they are permanently cancelled, (7) Why the cap shrinks 4–5% each year creating structural long-term upward price pressure — the supply schedule is publicly known unlike stocks where supply is variable. Use real examples from BEE PAT scheme (ESCerts) as India\'s precursor system, and explain the timeline: pilot 2023–2026, open trading 2026+.',
      },
      {
        id: 'ccts_earners', label: 'Who Earns Carbon Credits & How',
        prompt: 'Explain who is eligible to earn carbon credits in India and globally, and exactly how they earn them through the MRV process. Cover: (1) Five main categories of credit generators with Indian examples — Renewable Energy: solar and wind farms earn ~0.7–0.9 tonnes CO₂e per MWh of clean power generated (NTPC solar projects on IEX), Energy Efficiency under BEE PAT scheme: cement plants (UltraTech), steel mills (Tata Steel), aluminium smelters, and textile factories that beat their energy intensity targets earn ESCerts (the Indian precursor to CCCs), Forestry & Land Use (REDD+): afforestation and avoided deforestation projects in northeast India and Western Ghats registered under Gold Standard or Verra VCS, Industrial Process Changes: fuel switching from coal to gas or green hydrogen, CCS (carbon capture and storage) projects, Waste & Methane Capture: landfill gas capture plants, biogas digesters, (2) The 7-step MRV (Monitor, Report, Verify) process every project must follow: identify eligible project under approved methodology, calculate the emissions baseline (what would emissions have been without this project?), implement the reduction or removal measures, continuously monitor actual emissions using CEMS sensors or IoT devices, submit annual emissions report to BEE or accredited registry, get independent verification by a BEE-empanelled auditor (DNV, Bureau Veritas, SGS, KPMG), receive credits issued = baseline minus actual emissions, (3) What prevents fraud: the verifier cannot be the same entity as the project developer — mandatory independence, (4) Real numbers: a 100 MW solar farm in Rajasthan can earn approximately 175,000 CCCs per year (100 MW × 8,760 hours × 25% capacity factor × 0.8 performance ratio × 0.716 kgCO₂/kWh grid factor).',
      },
      {
        id: 'us_carbon_market', label: 'US Carbon Market — Real Examples',
        prompt: 'Explain the US Carbon Market as a real-world example of how carbon credit trading connects to the broader economy, for Indian investors who want to understand where India\'s CCTS is heading. Cover with specific numbers: (1) California Cap-and-Trade (CARB/WCI) — the most mature US compliance market since 2013, covering ~85% of California\'s emissions (utilities, large industry, fuel distributors), credit price $28–32 per tonne (California Carbon Allowances — CCAs), quarterly government auctions raise $4–5 billion per year, total revenue since 2013 exceeds $17 billion — all reinvested in electric school buses in low-income districts, zero-emission transit, wildfire prevention, and affordable housing near transit; demonstrates how a carbon price funds the clean energy transition while remaining politically viable, (2) RGGI (Regional Greenhouse Gas Initiative) — 12 Northeast US states covering only power sector generators above 25 MW, credit price $14–17 per tonne, power sector emissions in RGGI states fell over 50% from 2009 to 2021, every $1 invested in energy efficiency programs funded by RGGI generates $3–5 in avoided energy costs — a measurable economic multiplier, (3) Voluntary Carbon Market — Tesla earned $1.78 billion selling ZEV credits to GM and Fiat Chrysler in 2020–21 before EV revenues scaled, effectively funding Tesla\'s early survival and R&D; Microsoft has pre-purchased over $1 billion in carbon removal credits (direct air capture, biochar) through 2030, (4) Economic connection to everyday life: California recycles carbon auction revenue as direct consumer rebate cheques ($400–750 per household) to offset higher fuel and energy costs — making carbon pricing socially equitable, (5) India comparison: California took 5 years from legislation (2008) to active market (2013); India is on a near-identical trajectory with CCTS 2023 aiming for open trading by 2026. If India\'s CCTS price follows the California curve, early participants in 2026–2028 could see significant price appreciation as the cap tightens.',
      },
      {
        id: 'carbon_vs_stocks', label: 'Carbon Credits vs. Stock Market',
        prompt: 'Compare carbon credit trading to stock market investing for Indian retail investors who understand NSE/BSE but are new to carbon markets. Cover in plain language with Indian market analogies: (1) What you own: carbon credit = a government-issued certificate giving the right to emit 1 tonne CO₂e OR a verified proof of removing 1 tonne; stock = fractional ownership in a company with claim on its future earnings, (2) Price drivers: carbon credit price is driven primarily by POLICY (cap size, compliance deadlines, election outcomes, economic growth) rather than by any single company\'s performance; stock price driven by company earnings, sector growth, and market sentiment, (3) The critical supply difference: a government mandates that carbon credit supply shrinks 4–5% every year on a publicly-known fixed schedule — like a company that is legally required to buy back and cancel 4–5% of its shares every single year. Stock supply can grow through FPOs, rights issues, and ESOPs. This structural supply constraint is what gives carbon a long-term price floor that equities don\'t have, (4) Real price trajectory: EU ETS (European carbon market) price rose from €5 per tonne in 2013 to €105 in 2023 — a 20× rise driven primarily by supply mechanics as the cap tightened. This is why carbon is called the "world\'s fastest-appreciating major asset class" over the last decade in Europe, (5) Supply and demand scenarios like stocks — price goes UP when: government tightens cap faster than expected, cold winter spikes energy demand, new sectors added to compliance, ESG funds pre-buy forward credits; price goes DOWN when: recession cuts industrial output, government floods market with free allowances (political pressure), technology breakthrough (cheap solar) reduces compliance need, (6) Biggest unique risk: policy reversal — a government can weaken or cancel the scheme. Australia abolished its carbon tax in 2014 under political pressure, crashing the market overnight. This has no equivalent in equity markets. India\'s CCTS risk: the scheme is new (2023) and could change if political priorities shift. (7) Trading in India: both stocks (NSE/BSE) and carbon instruments (IEX — RECs and ESCerts today, CCCs from 2026) require a demat-equivalent account and trade with bids and asks in real time. The mechanics are identical; the underlying asset is different.',
      },
      {
        id: 'brsr', label: 'BRSR & ESG Reporting',
        prompt: 'Explain SEBI\'s Business Responsibility and Sustainability Reporting (BRSR) for Indian investors. Cover: what BRSR replaced (BRR), SEBI\'s top-1000 mandate since FY2022-23, what BRSR discloses (carbon intensity, water usage, employee metrics, board diversity), how to find BRSR reports on BSE/NSE, and how to use them to evaluate company ESG quality.',
      },
      {
        id: 'green_bonds', label: 'Green Bonds',
        prompt: 'Explain green bonds and sustainable finance for Indian investors. Cover: what a green bond is, how it differs from regular bonds, SEBI\'s Green Bond framework, examples (IREDA, REC Ltd, NTPC bonds), how retail investors can buy them (NSE bond platform, mutual funds), and what "greenwashing" means and how to spot it.',
      },
      {
        id: 'net_zero', label: 'Net Zero Investing',
        prompt: 'Explain net-zero investing for Indian retail investors. Cover: what net zero means (Scope 1, 2, 3 emissions), India\'s 2070 net-zero pledge, sectors at highest transition risk (coal, oil), sectors that benefit (solar, EVs, batteries), how to build a net-zero-aligned portfolio, and which Indian funds or ETFs target climate transition.',
      },
    ],
  },
  {
    id: 'reits',
    label: 'REITs',
    icon: '🏢',
    color: '#3B82F6',
    topics: [
      {
        id: 'reits_intro', label: 'Indian REITs Guide',
        prompt: 'Explain Indian REITs for complete beginners. Cover: what a REIT is (real estate trust that rents offices/malls, pays 90% income as dividend), India\'s 5 REITs (Embassy, Mindspace, Brookfield, Nexus, Knowledge Realty), minimum investment, how to buy through NSE/BSE, and the typical yield range (6-8% in India).',
      },
      {
        id: 'reit_yield', label: 'REIT Yield vs Dividend',
        prompt: 'Explain the difference between REIT distribution yield and stock dividend yield for Indian investors. Cover: how REIT distributions are calculated (NOI → distributable income), the three components (interest income, dividend, return of capital), tax treatment of each (interest income is taxed as per slab), and how to compare a 7% REIT yield to an 8% FD on after-tax basis.',
      },
      {
        id: 'wale', label: 'WALE & Occupancy',
        prompt: 'Explain WALE (Weighted Average Lease Expiry) and occupancy rate for Indian REIT investors. Cover: what WALE means (the average remaining time on leases, weighted by rental income), why high WALE (>4 years) is safer, Embassy\'s WALE vs Nexus Mall\'s WALE, what occupancy rate tells you (92%+ is healthy for office REITs), and how lease expiry risk affects distribution.',
      },
      {
        id: 'reit_vs_re', label: 'REIT vs Direct Real Estate',
        prompt: 'Compare REIT investing vs direct real estate investment for Indian investors. Cover: liquidity (REIT traded daily vs property takes months to sell), entry ticket (REIT minimum ~₹300 vs property ₹50 lakh+), diversification (one REIT owns 30+ buildings), rental yield (REIT 6-8% vs residential 2-3%), and tax (LTCG on REIT vs stamp duty + registration for property).',
      },
      {
        id: 'reit_nav', label: 'NAV & Premium/Discount',
        prompt: 'Explain Net Asset Value (NAV) for Indian REITs and why REITs trade at a premium or discount. Cover: how NAV is calculated for REITs (independent valuers, twice per year), what premium/discount to NAV means, how Embassy and Mindspace have historically traded, and whether buying at a discount is always better (quality of underlying assets matters more).',
      },
    ],
  },
  {
    id: 'solar',
    label: 'Solar & Energy',
    icon: '☀️',
    color: '#F59E0B',
    topics: [
      {
        id: 'solar_roi', label: 'How Solar ROI Works',
        prompt: 'Explain how ArthaSift\'s Solar ROI Calculator computes returns. Cover: (1) Annual generation = System size (kW) × Peak Sun Hours × 365 × Performance Ratio (0.80) × (1 − 0.7% annual degradation), (2) Bill savings = Units generated × DISCOM tariff, (3) NPV using 8% discount rate over 25 years, (4) IRR calculated by bisection method, (5) CO2 savings using CEA factor 0.716 kgCO2/kWh. Use a 3 kW example with ₹ figures.',
      },
      {
        id: 'pm_surya', label: 'PM Surya Ghar Scheme',
        prompt: 'Explain the PM Surya Ghar Muft Bijli Yojana for Indian households. Cover: eligibility (residential consumers), subsidy structure (₹30,000/kW for up to 2 kW, ₹18,000/kW for 2-3 kW, 40% of benchmark for 3kW+), maximum subsidy ₹78,000, how to apply (pmsuryaghar.gov.in), which DISCOMs are empanelled, and timeline from application to installation.',
      },
      {
        id: 'net_metering', label: 'Net Metering Explained',
        prompt: 'Explain net metering for Indian solar panel owners. Cover: what net metering means (grid export vs import), how the meter works (bidirectional), typical rates paid for export vs import (export is paid at lower rate, varies by state), states with best net metering policies (Maharashtra, Gujarat, Rajasthan), and how the ArthaSift calculator accounts for export vs self-consumption.',
      },
      {
        id: 'irr_npv', label: 'IRR & NPV for Solar',
        prompt: 'Explain IRR and NPV specifically in the context of rooftop solar investment for Indian homeowners. Cover: why IRR matters for solar (compares to FD/SIP returns), what a 12% IRR means vs 7% FD, how NPV tells you the total ₹ profit in today\'s money, the payback period concept, and what inputs most affect the calculation (tariff rate, system cost, degradation rate).',
      },
      {
        id: 'solar_recs', label: 'Solar + REC Income',
        prompt: 'Explain how rooftop solar owners can earn Renewable Energy Certificate (REC) income in India. Cover: eligibility (systems registered with SECI/SNA), one REC per MWh of solar generation, IEX REC price (~₹347/MWh as of 2024), who buys RECs (companies meeting RPO targets), approximate extra income for a 5 kW system per year, and how ArthaSift\'s calculator projects REC income.',
      },
    ],
  },
  {
    id: 'methodology',
    label: 'How ArthaSift Scores',
    icon: '🎯',
    color: '#7C3AED',
    topics: [
      {
        id: 'scoring_overview', label: 'The Scoring System',
        prompt: 'Explain the ArthaSift stock scoring system (0-100 scale) to Indian retail investors in simple language. Cover: (1) Why a score is useful — it converts complex financial data into one number so investors can quickly compare stocks. (2) The 5 categories with 20 points each: A) Profitability, B) Valuation, C) Financial Health, D) Growth Quality, E) Technical + Governance. (3) What the score bands mean: 83-95 Exceptional (Nifty-50 compounder quality, very rare), 73-82 Good (sector leader, invest-worthy), 61-72 Moderate (decent company, selective buy), 46-60 Neutral (average NSE-listed company), 31-45 Weak (structural issues), 5-30 Avoid (loss-making or governance risk). (4) Why most stocks score 40-65 — that is the honest reality of Indian markets. (5) Why a 70+ score is meaningful and not given lightly. Use TCS, HDFC Bank, and a hypothetical weak stock as examples. Keep language very simple with analogies.',
      },
      {
        id: 'profitability_score', label: 'Profitability Score (A)',
        prompt: 'Explain how ArthaSift scores Profitability (20 points out of 100) for Indian stocks, benchmarked against Nifty 50 averages. Cover: (1) ROE sub-score out of 7 — the Nifty 50 average ROE is 14-16%; a company with ROE above 20% gets full 7 points because it is in the top quartile of Indian listed companies; below 5% gets 0. (2) ROCE sub-score out of 7 — compared against the Indian cost of capital (WACC) of 12-14%; ROCE above 20% shows the company creates real value; below 8% destroys it. (3) Net Margin sub-score out of 6 — Nifty 50 aggregate net margin is 12-14%; IT and FMCG companies tend to be above 18%; trading/distribution companies at 2-4% is acceptable for their sector. (4) OPM contraction penalty: if operating margin contracted by more than 150 basis points year-on-year, 2 points are deducted as a warning signal. Use Asian Paints (high ROE) vs a PSU commodity company (low ROE) as contrasting examples. Explain in plain language with ₹ examples.',
      },
      {
        id: 'valuation_score', label: 'Valuation Score (B)',
        prompt: 'Explain how ArthaSift scores Valuation (20 points out of 100) for Indian stocks using only Indian sector benchmarks — not global. Cover: (1) P/E vs NSE sector median — the key idea is that a stock should be compared to its own industry, not to a universal number; Indian sector P/E medians are: IT 25-30x, FMCG 45-55x, Banks 15-25x, Pharma 28-35x, Auto 18-25x, Energy 10-15x, Capital Goods 40-65x, Metals 8-12x, Realty 25-40x. A stock trading 25% below its sector median is cheap (8 points); 2x above its sector median is speculative (-6 points). (2) P/B vs ROE — high P/B is justified only if ROE is high; P/B of 3x is fine for a company with ROE of 20% but dangerous for one with ROE of 8%. (3) EV/EBITDA — Indian quality names typically trade 15-30x; below 10x is genuinely cheap, above 28x is stretched. Why global comparison fails: a P/E of 25x is expensive for a US utility but cheap for an Indian FMCG brand. Use Nestle India vs HEG Limited as a valuation contrast.',
      },
      {
        id: 'financial_health_score', label: 'Financial Health Score (C)',
        prompt: 'Explain how ArthaSift scores Financial Health (20 points out of 100) for Indian stocks using Indian debt and liquidity norms. Cover: (1) Debt/Equity: Indian companies historically carry more leverage than Western peers because Indian interest rates are higher (~9-11%) and capital markets are shallower. D/E below 0.25 is exceptional and gets full 8 points. D/E above 3x is distressed and gets -8 points. Banks and NBFCs are excluded from D/E scoring because they use leverage by design — they are scored on Capital Adequacy Ratio (CAR) instead. (2) Interest Coverage: in India the 10-year government bond yield is ~7%; safe interest coverage is 4x or more (not 8x as in low-rate Western markets). Coverage below 1x means the company cannot pay its interest from operations — this is serious. (3) Current Ratio: below 1.0x means current liabilities exceed current assets — a liquidity warning. (4) Why this matters for Indian investors: India has seen multiple debt-driven collapses — IL&FS, DHFL, Jet Airways — all had warning signs in these three ratios. Explain with simple ₹ examples.',
      },
      {
        id: 'growth_score', label: 'Growth Quality Score (D)',
        prompt: 'Explain how ArthaSift scores Growth Quality (20 points out of 100) for Indian stocks, benchmarked against India\'s nominal GDP growth of 10-12% per year. Cover: (1) Why India\'s 10-12% nominal GDP is the minimum bar — if a company is growing slower than the overall economy, it is losing market share in real terms; this is the starting question. (2) Revenue growth sub-score out of 8 — above 20% CAGR gets full marks (well above the economy); 8-11% just paces the economy and gets only 2 points; declining revenue in a 10-12% nominal growth economy is a serious red flag. (3) EPS growth sub-score out of 7 — EPS should grow faster than revenue (operating leverage); if EPS is falling despite revenue growth, something is wrong: margin compression, equity dilution, or rising taxes. (4) Free Cash Flow sub-score out of 5 — FCF is the most honest measure of a business; accounting profit can be massaged but FCF cannot; positive and growing FCF gets full 5 points. (5) Why just revenue growth is not enough — give an example of a company with 25% revenue growth but declining EPS (e.g., due to heavy dilution). Use Bajaj Finance vs a PSU bank as a growth quality contrast.',
      },
      {
        id: 'technical_governance_score', label: 'Technical & Governance Score (E)',
        prompt: 'Explain how ArthaSift scores Technical Analysis + Governance (20 points out of 100) specifically for Indian market conditions. Cover: (1) 200-day Moving Average (DMA): the single most important technical signal; price above 200DMA means institutional investors are buying and holding; below 200DMA means they are selling. In India, NSE circuit breakers mean stocks can fall 5-10-20% in a day, so trend matters a lot. Price above 200DMA gets +5 points, below gets -5. (2) Golden Cross vs Death Cross: when 50DMA crosses above 200DMA it is a golden cross (momentum confirmed, +3 points); when it crosses below it is a death cross (momentum broken, -3 points). (3) RSI-14: measures whether a stock is overbought or oversold. RSI 40-65 is healthy. RSI above 75 means the stock has run up too fast and is at correction risk. RSI below 30 means panic selling. (4) Promoter Pledging: this is India\'s most common governance failure. When promoters pledge shares as collateral for loans, if the stock falls, lenders do forced selling which crashes the price further — this is what happened with Zee Entertainment, ADAG group stocks, and DHFL. Zero pledge with high promoter holding is the strongest governance signal (+4 points). Pledge above 50% is extreme danger (-8 points). (5) SEBI and BRSR: SEBI show-cause notices are deducted 3 points. BRSR compliance adds 2 points for transparency. Use Zee Entertainment\'s pledge crisis and TCS\'s clean governance as contrasting examples.',
      },
      {
        id: 'red_flags', label: 'Red Flags & Deductions',
        prompt: 'Explain the mandatory deduction red flags in ArthaSift\'s stock scoring system for Indian investors. These are penalties applied on top of the 5-category scores when serious risks are detected. Cover each with a real or hypothetical Indian example: (1) SEBI enforcement action: -12 points. Any active SEBI show-cause notice, NCLT insolvency, or CBI/ED investigation. Example: companies in SEBI\'s watchlist for insider trading or fraud. (2) Auditor red flags: -10 points. Auditor resignation, forensic audit, or qualified opinion on accounts. Example: CARE Ratings, Coffee Day — auditor resignations were early warning signs. (3) Receivables manipulation: -8 points. When accounts receivable (money owed to the company) grows more than twice as fast as revenue for 3+ quarters, it often means revenue is being booked but not actually collected — a classic revenue inflation tactic. (4) Consecutive revenue + margin decline: -7 points. Three straight quarters of both falling revenue and falling margins in a 10-12% nominal growth economy is a serious structural warning. (5) Promoter pledge >35%: -6 points. Threshold where forced selling risk becomes material. (6) Interest coverage < 1.5x: -5 points. Near-default territory. (7) Wealth extraction: -4 points. When promoter salary or related-party payments exceed 15% of net profit. Summarise: these deductions explain why a company can score well in some categories but still get a low total score — the red flags override.',
      },
      {
        id: 'reading_verdict', label: 'Reading the Verdict',
        prompt: 'Explain how Indian retail investors should read and use the ArthaSift verdict and score, and what its limitations are. Cover: (1) The five verdict labels and what they mean: Strong Buy (score 83+, high conviction), Buy (73-82, worth buying with known risks), Hold (61-72, decent but not compelling), Avoid (46-60, not worth fresh capital), Strong Avoid (below 46, stay out). (2) Confidence levels: High Confidence means most data was verified from live sources; Medium means some estimates were used; Low means data was limited or conflicting — treat Low Confidence verdicts as directional only. (3) What the score does NOT tell you: it does not tell you the right entry price, it does not account for macro shocks (interest rate hikes, RBI policy, global recession), and it is a point-in-time snapshot — re-check after every quarterly result. (4) How to use it: do not rely on the score alone; use it to shortlist; then check screener.in, Trendlyne, or Moneycontrol for confirmation; and always check the latest quarterly earnings call transcript. (5) Risk disclosure: ArthaSift is an educational tool, not SEBI-registered investment advice. Use it as a starting point for your own research, not as the final word. Keep it very simple and add a note that investing always carries risk.',
      },
    ],
  },
  {
    id: 'venture_frameworks',
    label: 'Business Frameworks',
    icon: '🚀',
    color: '#8B5CF6',
    topics: [
      {
        id: 'yc_sequoia', label: 'YC / Sequoia Framework',
        prompt: 'Explain the Y Combinator and Sequoia Capital investment evaluation framework for entrepreneurs and investors in simple language. Cover: (1) The three pillars YC uses to screen every startup: Team (35% weight), Market (40% weight), Product (25% weight). (2) Why MARKET is the most important — a mediocre team in a huge market beats a great team in a tiny one (Paul Graham). The market must be large enough that even 1% of it is a big business. How to estimate TAM: top-down (total industry size × addressable %) vs bottom-up (target customers × price per customer). (3) What YC means by TEAM — not degrees, but evidence: have you shipped something people use? Do you have a technical co-founder? Are the founders complementary (not three engineers with no salesperson)? YC invests in people who build fast, talk to users, and iterate. (4) PRODUCT: does it solve a real, painful problem — not a nice-to-have? Would even 100 people love it, or do millions merely like it? The "1,000 true fans" principle. (5) How ArthaSift applies this: Team score (founder experience + skill gap + team size), Market score (market size + growth rate + competitive density), Product score (problem clarity + differentiation + customer validation). Use an Indian B2B SaaS startup and a D2C food brand as contrasting examples to illustrate how each framework maps to real businesses.',
      },
      {
        id: 'thiel_zero_to_one', label: "Thiel's Zero to One",
        prompt: "Explain Peter Thiel's Zero to One framework for building monopoly businesses, as used in ArthaSift's VentureIQ scoring. Cover: (1) The core idea: competition is for losers. Zero to One means creating something genuinely new — going from 0 to 1 — rather than copying what already exists (1 to n). Thiel argues that the best businesses are monopolies disguised as competitive markets (Google calls itself a tech company, not an ad monopoly). (2) The four characteristics of a Thiel monopoly — Proprietary Technology (10x better than competition, not just better), Network Effects (the product becomes more valuable with more users — WhatsApp, Ola, Zepto), Economies of Scale (unit costs fall as volume rises — SaaS with near-zero marginal cost per customer), and Strong Brand (a brand that cannot be easily copied — Zomato's cultural embeddedness). (3) The 'Last Mover Advantage' — being first is less important than being the last and best in a category. Give an example of a late mover who won by being definitively better (Jio disrupting telecom by making data essentially free). (4) 'The Secrets' — Thiel says great companies are built on a secret the world hasn't yet recognized. Ask: what do you know about your market or customer that competitors don't believe? (5) How ArthaSift scores this: Technology score (does the business have a 10x advantage?), Network Effects (does growth compound through users?), Scalability (can it serve 10x customers without 10x costs?), Brand (is the brand defensible?). Use Byju's (apparent monopoly that collapsed due to poor unit economics) vs Zerodha (quiet monopoly with network effects and zero marketing) as contrasting Indian examples.",
      },
      {
        id: 'unit_economics', label: 'Unit Economics 101',
        prompt: 'Explain unit economics for entrepreneurs and investors in simple, practical language. Cover: (1) What unit economics means — understanding the economics of ONE unit of your business (one customer, one order, one subscription) before scaling. If the unit economics are broken, scaling makes you lose money faster. (2) The three most important unit economics metrics: CAC (Customer Acquisition Cost) = total sales & marketing spend ÷ new customers acquired; LTV (Lifetime Value) = average revenue per customer × gross margin % × average customer lifespan; LTV:CAC ratio = the single most important number — below 3x is broken, 3-6x is healthy, above 10x is exceptional. (3) Payback Period = CAC ÷ monthly gross profit per customer. This is how many months until you recover the cost of acquiring a customer. Best-in-class SaaS has <12 months; consumer apps need <6 months. (4) Gross Margin vs Net Margin: unit economics is about GROSS margin (after COGS only), not net margin. A SaaS business with 80% gross margin and 25% net margin is healthy. A food delivery business with 10% gross margin will never be profitable at scale regardless of revenue. (5) The "Burn Multiple" — for every ₹1 of new ARR you add, how many ₹ of cash do you burn? Below 1x is efficient, above 2x is expensive growth. (6) How ArthaSift scores unit economics: Capital Efficiency (startup cost vs revenue potential), Revenue Quality (recurring vs one-time), Payback Period (how fast capital returns). Use a quick-commerce startup vs a B2B SaaS company to show contrasting unit economics with ₹ examples.',
      },
      {
        id: 'blue_ocean_jtbd', label: 'Blue Ocean & JTBD',
        prompt: "Explain Blue Ocean Strategy and Jobs-to-be-Done (JTBD) theory for entrepreneurs evaluating business ideas in simple language. Cover: (1) Blue Ocean vs Red Ocean: Red Ocean = competing in existing markets with existing rules (fighting for the same customers as competitors — price wars, feature wars). Blue Ocean = creating uncontested new market space where competition is irrelevant. Example: Jio didn't compete with Airtel on price — it redefined the market by making data a utility. (2) The Blue Ocean Strategy Canvas and the 4-action framework: Eliminate (which factors does the industry take for granted that should be removed?), Reduce (which factors should be reduced well below industry standard?), Raise (which factors should be raised well above industry standard?), Create (which factors should be created that the industry has never offered?). Apply this to a new Indian fintech idea. (3) Value Innovation — the cornerstone of Blue Ocean: instead of making a tradeoff between differentiation and low cost, pursue both simultaneously. Companies that do this don't fight competition — they make it irrelevant. (4) Jobs-to-be-Done: People don't buy products — they 'hire' them to do a job. Clayton Christensen's example: people buying milkshakes in the morning weren't buying a beverage — they were hiring it to make a boring commute more interesting and stave off hunger until lunch. The JTBD question: what JOB does your customer hire your product to do? (5) How ArthaSift uses these: Market Novelty score (is this Blue Ocean or Red Ocean?), Problem Clarity (is the customer's job clearly defined?), Customer Clarity (does the founder deeply understand who has this problem and how urgently?). Use a new D2C brand entering the crowded Indian FMCG space vs a SaaS tool creating a new category as contrasting examples.",
      },
      {
        id: 'venture_scoring_methodology', label: 'How VentureIQ Scores',
        prompt: 'Explain exactly how ArthaSift VentureIQ calculates its business investment score (0-100) for a new business idea, so that entrepreneurs understand every point they are scored on. Cover: (1) The 8 scoring categories and their weight in the organic (new business) score: Market Opportunity (25 pts), Founder & Team Fit (20 pts), Financial Viability (15 pts), Execution Readiness (10 pts), Competitive Moat (10 pts), Revenue Model Quality (10 pts), Risk & Resilience (5 pts), Customer Clarity (5 pts). (2) Score thresholds and what they mean: 62+ = GO (strong enough to build on), 35-61 = PIVOT (real potential, but specific gaps need addressing), below 35 = NO-GO (fundamental assumptions need revisiting). (3) The 4 framework overlays — after computing the base score, ArthaSift then re-evaluates the business through 4 additional lenses: YC/Sequoia (Team + Market + Product composite, weighted 35%), Peter Thiel Zero-to-One (Technology × Network × Scale × Brand, weighted 25%), Unit Economics (Capital Efficiency + Revenue Quality + Payback, weighted 25%), Blue Ocean/JTBD (Market Novelty + Problem Clarity + Customer Clarity, weighted 15%). Each lens gives an independent perspective and specific insights. (4) The composite score formula: Base Score (60% of final) + Framework Composite (40% of final, where framework composite = YC×0.35 + Thiel×0.25 + Unit×0.25 + BlueOcean×0.15). (5) What the score does NOT measure: execution quality after launch, actual market feedback, macroeconomic conditions, and founder grit. The score is a structured pre-launch risk assessment, not a guarantee of success. Remind the entrepreneur that the world\'s most successful companies often scored low on traditional frameworks before they proved their model (Airbnb was rejected by multiple VCs, Zerodha had no funding). Use ₹ examples where possible.',
      },
      {
        id: 'entrepreneurial_guide', label: 'The Entrepreneurial Guide',
        prompt: "Give a comprehensive entrepreneurial guide covering the mental models and frameworks that every serious business builder should know — beyond just evaluation scores. Cover: (1) The Steve Blank Customer Development Process — before writing code or making a product, you must validate 4 hypotheses: Customer (does this person exist?), Problem (do they have the pain you think they have?), Solution (does your solution solve it?), Business Model (can you make money doing this?). Most startups fail at step 1 — they build for a customer who doesn't exist. (2) The Lean Startup methodology — Build → Measure → Learn in the smallest possible loop. The Minimum Viable Product (MVP) is not a beta version of your product — it is the smallest experiment that tests your riskiest assumption. Give an Indian example: a food startup that validates by selling homemade food in a WhatsApp group before renting a kitchen. (3) The Mom Test — how to have customer conversations that don't lie to you. Ask about their life, not your idea. 'Would you pay for this?' is a useless question — of course they'll say yes to be polite. 'Tell me about the last time you had this problem — what did you do to solve it?' reveals truth. (4) The Power Law in venture — most returns come from a tiny number of investments. This means: concentrate your bets on the biggest opportunities, not average opportunities. A mediocre business in a huge market is better than an excellent business in a tiny market. (5) The Founder's Dilemma — control vs wealth: every time you raise money or hire senior people, you trade some control for resources. There is no right answer — Zerodha bootstrapped to a $2B valuation with full control; Zomato raised ₹9,000 crore to capture market share fast. Know which path you're on. (6) First Principles Thinking (Elon Musk) — question every assumption. Don't reason by analogy ('all restaurants need a dine-in space'). Break the problem to fundamentals and rebuild from scratch. (7) The Indian business context: India's advantage is its massive domestic market, young population, rising internet penetration, and improving startup infrastructure (DPIIT, Startup India, VC ecosystem from Bengaluru to Hyderabad). India-specific challenges: price sensitivity, regulatory complexity, logistics fragmentation, and trust deficit in new products. The best Indian entrepreneurs solve for Bharat (Tier 2+ consumers) not just for Bengaluru.",
      },
    ],
  },
  {
    id: 'esg_screener',
    label: 'ESG Screener Guide',
    icon: '🌿',
    color: '#059669',
    topics: [
      {
        id: 'screener_intro', label: 'What is the ESG Screener?',
        prompt: 'Explain the ArthaSift ESG Stock Screener for Indian retail investors in simple language. Cover: (1) What the screener does — it shows all 430+ NSE-listed stocks with an ESG priority matrix pre-built from sector research, so every stock already has an ESG Tier (A+ to D), Environmental score (0-10), Social score (0-10), Governance score (0-10), Transition Risk level, and BRSR status. No live financial data is fetched — the focus is purely on ESG quality and sustainability. Compare this to a financial screener like Screener.in: ArthaSift ESG Screener is an ESG-first tool — you start by understanding how sustainable a company is, THEN do your financial research in the Full Analysis page. (2) Why an ESG-first screener matters for India — SEBI now mandates BRSR (Business Responsibility and Sustainability Reporting) for top-1000 listed companies; ESG mutual funds in India have crossed ₹12,000 crore AUM; global FIIs screen for ESG before investing. (3) The data model — ESG scores are pre-seeded from a sector matrix (22 sectors with calibrated E/S/G scores) with company-specific adjustments for well-known companies. On-demand AI analysis refines individual company scores with current BRSR disclosures and ESG news. (4) Three ways to use the screener: (a) Browse 430+ stocks filtered by ESG tier using the preset buttons, (b) Narrow down by sector, market cap, or transition risk, (c) Click any stock row to expand ESG details and run an AI company-specific score update.',
      },
      {
        id: 'esg_tiers', label: 'Understanding ESG Tiers (A+ to D)',
        prompt: 'Explain the ArthaSift ESG Tier classification system for Indian stocks in simple language. Cover each tier with real Indian examples: (1) Tier A+ — Green Leaders: Companies whose core business IS the green transition. Examples: Adani Green Energy (pure-play solar/wind), Sterling and Wilson Renewable Energy (solar EPC). These score E=10, and are the cleanest on carbon. (2) Tier A — Low Carbon / Digital: IT companies (very low physical footprint, high G scores from BRSR disclosure), clean power transmission utilities. Examples: TCS (net-zero pledge, G=10), Infosys (carbon neutral since 2020, E=9, G=9), NTPC (transitioning to renewables, grid-scale power). (3) Tier B+ — Finance and Healthcare: Banks and NBFCs score well on Social (financial inclusion, rural lending) and Governance (board quality). Pharma scores high on Social (healthcare access). Examples: HDFC Bank (G=9), Cipla (S=9), Sun Pharma (S=9). (4) Tier B — FMCG, Telecom, Agri: Moderate environmental footprint, generally good governance. Examples: Hindustan Unilever (E=7, S=8), Bharti Airtel (S=8). (5) Tier C — Developing: Auto, chemicals, cement, capital goods — significant emissions but transition plans underway. Examples: Maruti (E=5, transitioning to EVs), UltraTech Cement (investing in green cement, G=8). (6) Tier D — Laggards: Fossil fuel extraction and bulk metals face the highest stranded-asset risk. Examples: Coal India (E=1, Very High risk), ONGC (E=2, Very High risk). The tier is primarily sector-driven because sector determines structural ESG risk — but company-specific AI scoring can upgrade or downgrade individual stocks.',
      },
      {
        id: 'esg_subscores', label: 'E, S, G Sub-scores Explained',
        prompt: 'Explain what the three ESG sub-scores mean in the ArthaSift ESG Screener for Indian retail investors. Each score is on a 0-10 scale. (1) Environmental score (E) — measures how much physical impact the company has on the natural environment. Key factors: carbon emissions intensity (tonnes of CO₂ per crore revenue), water withdrawal and recycling rates, hazardous waste management, land use and biodiversity impact. Scoring guide: 1-3 = fossil fuel extraction or bulk mining (Coal India, NMDC); 4-5 = heavy industry with moderate emissions (cement, steel, chemicals); 6-7 = services or transitioning industries (auto switching to EV, power with some renewable mix); 8-10 = green or digital business (IT, pure solar/wind). (2) Social score (S) — measures how well the company treats its employees, customers, and communities. Key factors: ESIC coverage and workforce safety record, gender diversity and fair wages, healthcare and financial inclusion impact (for banks/pharma), supply chain labor standards, CSR quality (not just quantity). Scoring guide: 8-10 = pharma/healthcare, banks with rural reach, FMCG with supply chain standards; 5-7 = IT (good wages but limited social externality), telecom (connectivity access); 3-4 = mining with labor safety issues. (3) Governance score (G) — measures board quality, ownership transparency, and integrity. Key factors: promoter pledging (>20% is alarming), independent director ratio, auditor qualifications or SEBI notices, BRSR disclosure quality, related-party transactions, succession planning. Scoring guide: 9-10 = TCS (impeccable board), HDFC Bank (gold standard Indian governance); 7-8 = most large private sector companies; 4-6 = PSUs with complex political ownership; 2-3 = high promoter pledging, audit qualifications, or pending SEBI cases. Teach investors to look at G first — poor governance destroys even strong E and S scores.',
      },
      {
        id: 'transition_risk', label: 'Transition Risk & BRSR',
        prompt: 'Explain Transition Risk and BRSR status in the ArthaSift ESG Screener for Indian retail investors. (1) What is Transition Risk? As India accelerates its energy transition (500 GW renewable energy target by 2030), some businesses face the risk of losing value because their core products or services become obsolete or heavily regulated. Transition risk is NOT about near-term financial performance — a coal company can report great profits today but faces terminal structural risk over a 5-10 year horizon. ArthaSift classifies transition risk as: Very Low (IT, digital, solar — their business BENEFITS from the transition); Low (banks, pharma, FMCG — low carbon exposure, indifferent to energy transition); Medium (auto, capital goods, telecom — moderate operational emissions, manageable with adaptation); High (chemicals, cement, metals — significant process emissions requiring expensive decarbonisation); Very High (coal mining, oil exploration, gas distribution — structural demand destruction risk as renewables scale). (2) How to use Transition Risk in portfolio construction — an investor with a 10+ year horizon should reduce exposure to Very High transition risk stocks even if they look cheap today. A short-term trader may ignore transition risk entirely. Use the Transition Risk filter on the left sidebar to show only Very Low or Low risk stocks. (3) BRSR Mandate — SEBI mandates Business Responsibility and Sustainability Reporting for top-1000 listed companies (by market cap) since FY2022-23. In ArthaSift, "BRSR: Yes" means the company is large-cap (top-1000) and is LEGALLY REQUIRED to disclose detailed sustainability data annually. This means: (a) their ESG disclosures are auditable, (b) their E/S/G scores can be verified independently, (c) their transition plans are documented. BRSR companies have higher data reliability — prefer them when doing serious ESG research.',
      },
      {
        id: 'ai_scoring', label: 'AI On-Demand ESG Analysis',
        prompt: 'Explain how the AI ESG analysis feature works in the ArthaSift ESG Screener for Indian retail investors. (1) The base ESG matrix — when you first open the screener, all 430+ stocks already have pre-assigned ESG scores. These come from a sector-calibrated matrix: each of 22 sectors has researched baseline E, S, and G scores that reflect the structural characteristics of that industry. Well-known companies (like TCS, Infosys, Coal India, Adani Green) have company-specific adjustments applied on top. This means you can immediately filter, compare, and sort all stocks without waiting for any data to load. (2) What "AI Score" does — for any stock, click the green "AI Score" button in the last column. This triggers a company-specific AI analysis using the latest SEBI BRSR disclosures, carbon commitment announcements, governance controversies, and sustainability awards. The AI returns refined E, S, G scores, tier, transition risk, and a one-sentence ESG insight. The updated scores replace the sector baseline for that company. (3) The 7-day cache — once a company is AI-scored, the result is stored and reused for 7 days. The freshness indicator on each row shows "AI scored" (green, within 7 days) or "Xd old" (amber/red, stale). The screener automatically re-scores up to 2 stale stocks per page load in the background — you do not need to click anything for this to happen. (4) When to use "Re-score" — after a major ESG event (company announces net-zero pledge, SEBI investigation, new factory controversy), click "↻ Re-score" to force-refresh that company immediately, bypassing the 7-day cache. (5) Full Analysis — click the "Full Analysis" button next to any stock to go to the ArthaSift Research page where the AI does a complete fundamental + ESG deep-dive with a Buy/Sell verdict and detailed reasoning.',
      },
      {
        id: 'using_filters', label: 'Using ESG Filters Effectively',
        prompt: 'Teach Indian retail investors how to use the ArthaSift ESG Screener filters to build a sustainable portfolio shortlist. Walk through 4 practical filter combinations: (1) Green Leaders — Large Cap only: Left sidebar ESG Priority → "Leaders (A+/A)"; Market Cap → "Large". This shows IT giants (TCS, Infosys, HCLTech) and large renewable power companies — the most liquid, lowest-ESG-risk stocks in India. Perfect for a conservative ESG portfolio core. Sort by G score descending to see the best-governed green companies. (2) High-Social, Low-Risk Mid-caps: ESG Priority → "Positive (B+/B)"; Transition Risk → "Very Low" and "Low"; Market Cap → "Mid". This surfaces quality mid-cap banks, pharma companies, and FMCG companies with good social scores and clean governance — the sweet spot for mid-cap ESG investing. (3) BRSR-mandated companies only: Tick "Top-1000 mandated only" in the BRSR filter. This narrows the universe to ~200 large-cap companies whose ESG data is legally required to be disclosed and audited — the highest data quality. Sort by ESG Tier ascending (A+ first) and E score descending to find the best-governed large-cap green companies. (4) Sector deep-dive: Select only "IT" in the Sectors panel, sort by G score descending. This instantly shows all IT stocks ranked by governance quality — useful for comparing mid-cap IT companies on ESG before doing fundamental analysis. (5) Saving your screen: Once you find a useful filter combination, click "+ Save Screen" at the top, give it a name like "BRSR Leaders" or "ESG Mid-caps", and it will be saved to your account. Click the saved screen tab next time to restore all filters instantly.',
      },
      {
        id: 'esg_vs_returns', label: 'ESG Scores and Long-term Investing',
        prompt: 'Explain the relationship between ESG quality and long-term investing outcomes for Indian retail investors, and how to combine ESG screening with fundamental analysis. (1) ESG is a risk filter, not a return guarantee — ESG tier A+ companies are not guaranteed to outperform. Adani Green may have a perfect E score but also trades at a very high P/E. The ESG screener helps you AVOID the worst risks (governance collapses, stranded assets, regulatory fines) rather than predict the best performers. (2) Why Governance (G) is most financially material for Indian stocks — Indian markets have been scarred by governance failures: IL&FS (accounting fraud), Yes Bank (related-party loans), DHFL (fund diversion), Zee Entertainment (pledging + related-party). Stocks with G scores below 6 should be researched very carefully before investing, regardless of how cheap they look. The G score in ArthaSift reflects: promoter pledging, auditor qualifications, SEBI orders, independent director ratios, and BRSR disclosure quality. (3) Transition risk is a long-horizon valuation tool — a coal company with a D tier and Very High transition risk should logically trade at a lower P/E multiple than an IT company, because the terminal value of a coal business is structurally declining as India scales renewables. If a D-tier company looks "cheap" on P/E, verify whether the cheapness reflects the transition discount. (4) The right workflow — use the ESG screener as Step 1: filter to your preferred ESG tier and sector, identify 10-15 companies. Step 2: click "Full Analysis" on each shortlisted stock to get the ArthaSift AI fundamental verdict with P/E, ROE, debt analysis, and buy/avoid recommendation. Step 3: cross-check on Screener.in, Trendlyne, or company BRSR report. Never invest based solely on ESG score — combine it with fundamental analysis.',
      },
    ],
  },
]

interface Lesson {
  title: string; summary: string
  sections: {heading: string; content: string}[]
  key_takeaways: string[]; common_mistake: string
  quiz_question: string; quiz_options: string[]; quiz_answer: string
}


/* ── Main Page ─────────────────────────────────────────────────────────── */
export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState('stocks')
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [quiz, setQuiz] = useState<{selected: string|null; answer: string}>({selected: null, answer: ''})

  const category = CATEGORIES.find(c => c.id === activeCategory)!

  async function loadLesson(topic: typeof CATEGORIES[0]['topics'][0]) {
    setLoadingTopic(topic.id)
    setLesson(null)
    setQuiz({selected: null, answer: ''})
    const prompt = `Expert investing teacher for Indian beginners. ${topic.prompt}\nReply ONLY with JSON (no markdown):\n{"title":"str","summary":"2 sentences","sections":[{"heading":"str","content":"3 sentences with Indian examples"},{"heading":"str","content":"3 sentences"},{"heading":"str","content":"3 sentences"}],"key_takeaways":["t1","t2","t3","t4"],"common_mistake":"1-2 sentences","quiz_question":"multiple choice question","quiz_options":["A) option","B) option","C) option","D) option"],"quiz_answer":"A"}`
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ prompt, maxTokens: 1400, feature: 'learn' }),
      })
      if (res.ok) setLesson(await res.json())
    } catch {}
    setLoadingTopic(null)
  }

  function selectQuiz(opt: string) {
    if (quiz.selected || !lesson) return
    setQuiz({selected: opt.charAt(0), answer: lesson.quiz_answer})
  }

  const accent = category.color

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Begin Your Investment Journey</h1>
        <p className="text-sm" style={{color: '#6B7280'}}>
          Structured lessons on stocks, green finance, REITs & solar — with quizzes and an AI tutor
        </p>
      </div>

      {/* ── Category tabs ── */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const isActive = cat.id === activeCategory
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setLesson(null) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: isActive ? cat.color : '#ffffff',
                color: isActive ? '#ffffff' : '#374151',
                border: `1px solid ${isActive ? cat.color : 'rgba(5,150,105,0.15)'}`,
                boxShadow: isActive ? `0 4px 14px ${cat.color}30` : 'none',
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* ── Topic grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {category.topics.map(t => {
          const isLoading = loadingTopic === t.id
          return (
            <button
              key={t.id}
              onClick={() => loadLesson(t)}
              disabled={!!loadingTopic}
              className="rounded-xl p-4 text-left transition-all disabled:opacity-50 group"
              style={{
                background: '#ffffff',
                border: `1px solid ${isLoading ? accent : 'rgba(5,150,105,0.15)'}`,
                boxShadow: isLoading ? `0 0 0 2px ${accent}22` : 'none',
              }}
            >
              <div className="text-sm font-semibold leading-tight mb-2" style={{color: '#064E3B'}}>
                {t.label}
              </div>
              {isLoading
                ? <div className="dv-spinner" style={{width: 16, height: 16, borderWidth: 2}} />
                : <div className="text-[11px]" style={{color: accent, opacity: 0.7}}>
                    Tap to learn →
                  </div>
              }
            </button>
          )
        })}
      </div>

      {/* ── Lesson content ── */}
      {lesson && !loadingTopic && (
        <div
          className="rounded-2xl p-6 anim-in"
          style={{background: '#ffffff', border: `1px solid ${accent}25`, boxShadow: `0 4px 24px ${accent}10`}}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5 pb-5" style={{borderBottom: `1px solid ${accent}15`}}>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color: accent}}>{category.icon} {category.label}</div>
              <h2 className="font-serif text-2xl font-medium" style={{color: '#064E3B'}}>{lesson.title}</h2>
              <p className="text-sm mt-1.5" style={{color: '#6B7280'}}>{lesson.summary}</p>
            </div>
            <button
              onClick={() => setLesson(null)}
              className="flex-shrink-0 ml-4 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{color: '#6B7280', border: '1px solid rgba(5,150,105,0.15)', background: '#F0FDF4'}}
            >
              Close ✕
            </button>
          </div>

          {/* Sections */}
          <div className="space-y-5 mb-6">
            {(lesson.sections ?? []).map((s, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold mb-1.5" style={{color: '#064E3B'}}>{s.heading}</h3>
                <p className="text-sm leading-relaxed" style={{color: '#374151'}}>{s.content}</p>
              </div>
            ))}
          </div>

          {/* Key takeaways */}
          {lesson.key_takeaways?.length > 0 && (
            <div className="rounded-xl p-4 mb-5" style={{background: `${accent}08`, border: `1px solid ${accent}15`}}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color: accent}}>Key Takeaways</div>
              <div className="space-y-2">
                {lesson.key_takeaways.map((t, i) => (
                  <div key={i} className="flex gap-2.5 text-sm" style={{color: '#374151'}}>
                    <span className="font-bold flex-shrink-0" style={{color: accent}}>✓</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common mistake */}
          {lesson.common_mistake && (
            <div
              className="text-sm p-4 rounded-xl mb-6"
              style={{background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)', color: '#DC2626'}}
            >
              <strong>⚠ Common Mistake: </strong>{lesson.common_mistake}
            </div>
          )}

          {/* Quiz */}
          {lesson.quiz_question && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{color: '#6B7280'}}>Quick Quiz</div>
              <p className="text-sm font-medium mb-4" style={{color: '#064E3B'}}>{lesson.quiz_question}</p>
              <div className="space-y-2">
                {(lesson.quiz_options ?? []).map((opt, i) => {
                  const letter = opt.charAt(0)
                  const isSelected = quiz.selected === letter
                  const isAnswer = quiz.answer === letter
                  const isWrong = isSelected && !isAnswer
                  return (
                    <div
                      key={i}
                      onClick={() => !quiz.selected && selectQuiz(opt)}
                      className={`quiz-opt ${quiz.selected ? 'disabled' : ''} ${isAnswer && quiz.selected ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                    >
                      {opt}
                    </div>
                  )
                })}
              </div>
              {quiz.selected && (
                <div
                  className="text-sm font-semibold mt-3"
                  style={{color: quiz.selected === quiz.answer ? '#059669' : '#DC2626'}}
                >
                  {quiz.selected === quiz.answer
                    ? '✓ Correct! Great understanding.'
                    : `✗ Not quite. The answer is ${quiz.answer}. Review the lesson above.`}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs pb-2" style={{color: '#9CA3AF'}}>
        Educational content only · Not SEBI-registered investment advice · Always do your own research
      </p>
    </div>

  )
}
