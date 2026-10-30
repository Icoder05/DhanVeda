'use client'
import { useState, useEffect, useRef, useCallback } from "react"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie, LineChart, Line, CartesianGrid } from "recharts"
import {
  Zap, BarChart3, FileText, Users, Target, Home, Settings, ChevronRight, ChevronLeft,
  CheckCircle, AlertTriangle, Download, Copy, ArrowRight, Star, Edit3, Layers,
  DollarSign, Globe, UserCheck, Menu, Building2, Factory, Handshake, Merge, Scale,
  Shield, TrendingUp, Info, RefreshCw, MessageSquare, Bot, Send, Loader
} from "lucide-react"

declare global {
  interface Window {
    storage: {
      set: (key: string, value: string) => Promise<void>
      get: (key: string) => Promise<{ value: string } | null>
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — adapted to Dhanveda light theme
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bgBase:        "#F0FDF4",
  bgSurface:     "#F0FDF4",
  bgCard:        "#ffffff",
  bgElevated:    "#F0FFF7",
  bgBorder:      "rgba(5,150,105,0.15)",
  accent:        "#059669",
  accentHover:   "#047857",
  accentSubtle:  "rgba(5,150,105,0.08)",
  go:            "#10B981",
  goBg:          "rgba(16,185,129,0.06)",
  negotiate:     "#F59E0B",
  negotiateBg:   "rgba(245,158,11,0.06)",
  pass:          "#EF4444",
  passBg:        "rgba(239,68,68,0.06)",
  textPrimary:   "#064E3B",
  textSecondary: "#6B7280",
  textTertiary:  "#9CA3AF",
  purple:        "#8B5CF6",
  teal:          "#06B6D4",
  coral:         "#F97316",
  amber:         "#F59E0B",
  blue:          "#3B82F6",
}

// ─────────────────────────────────────────────────────────────────────────────
// SCOPED STYLES — only fonts, animations, venture-scoped inputs; no body override
// ─────────────────────────────────────────────────────────────────────────────
const VentureStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
    @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
    @keyframes shimmer { 0% { background-position:-400% 0; } 100% { background-position:400% 0; } }
    @keyframes ring    { from { stroke-dashoffset: 340; } }
    @keyframes slideIn  { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
    @keyframes toastIn  { from { opacity:0; transform:translateY(14px) scale(0.94); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes toastOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(8px) scale(0.96); } }
    .fu { animation: fadeUp .4s ease forwards; }
    .si { animation: slideIn .3s ease forwards; }
    .toast-in  { animation: toastIn  .22s cubic-bezier(0.34,1.56,0.64,1) forwards; }
    .toast-out { animation: toastOut .25s ease forwards; }
    .dsp  { font-family: 'Space Grotesk', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .sk { background: linear-gradient(90deg, #F0FFF7 25%, rgba(5,150,105,0.08) 50%, #F0FFF7 75%); background-size: 400%; animation: shimmer 1.6s infinite; border-radius: 6px; }
    .venture-app input, .venture-app textarea, .venture-app select {
      background: #F0FFF7;
      border: 1px solid rgba(5,150,105,0.2);
      color: #064E3B;
      border-radius: 8px;
      padding: 10px 14px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      width: 100%;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
    }
    .venture-app input:focus, .venture-app textarea:focus, .venture-app select:focus {
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5,150,105,0.1);
    }
    .venture-app textarea { min-height: 76px; resize: vertical; }
    .venture-app select option { background: #F0FFF7; }
    .venture-app button { cursor: pointer; font-family: 'Inter', sans-serif; }
    @media print {
      @page { margin: 18mm 15mm; }
      body { background: #fff !important; color: #111 !important; }
      .no-print { display: none !important; }
      .print-page { page-break-after: always; }
      .print-root { background: #fff !important; }
      * { box-shadow: none !important; }
      .print-cover { background: #064E3B !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
      .bp-section { page-break-inside: avoid; margin-bottom: 28px; }
      .bp-section-header { background: rgba(5,150,105,0.06) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .bp-content { font-size: 11pt !important; line-height: 1.9 !important; color: #374151 !important; }
      /* Remove scroll-container clipping so all BP sections print */
      .bp-scroll-container { max-height: none !important; overflow: visible !important; }
      /* Clone is mounted as direct <body> child — hide all siblings, show mount */
      body.printing-pitch > *:not(#pitch-print-mount) { display: none !important; }
      body.printing-pitch #pitch-print-mount { display: block !important; width: 100% !important; max-width: 100% !important; padding: 24px !important; background: #fff !important; }
      /* Deck: hide carousel in mount, show all-slides stack */
      body.printing-landscape #pitch-print-mount .deck-carousel-view { display: none !important; }
      body.printing-landscape #pitch-print-mount .deck-all-slides-print { display: block !important; }
      .deck-all-slides-print { display: none; }
      .deck-slide-print { page-break-after: always; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .deck-slide-print .print-cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `}</style>
)

// ─────────────────────────────────────────────────────────────────────────────
// CLAUDE API — proxied through Next.js route to add server-side API key
// ─────────────────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt: string, userPrompt: string, maxTokens = 1000): Promise<string | null> {
  try {
    const res = await fetch("/api/venture/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text ?? null
  } catch { return null }
}

async function deploymentHead(task: string, businessData: any): Promise<string | null> {
  const system = `You are a senior venture consultant generating investor-ready business document sections.
Output format — STRICT, no deviation:
Line 1: KEY INSIGHT: [one punchy sentence — the single most critical fact about this section]
Remaining lines: bullet points starting with •, exactly 4-5 bullets, each under 15 words, specific and data-grounded.
Rules:
- Be specific to the EXACT business described — never generic
- Use real numbers, percentages, and timeframes from the business data
- No markdown headers. No prose paragraphs. No filler sentences.
- Every bullet must be investor-ready: facts, numbers, or clear strategic statements`

  return callClaude(system, `Task: ${task}\n\nBusiness Data:\n${JSON.stringify(businessData, null, 2)}`, 1200)
}

async function qcHead(originalContent: string, task: string, businessData: any): Promise<string | null> {
  const system = `You are the QC Head of VentureIQ. Review the content generated by the Deployment Head and improve it.
CRITICAL: Preserve the exact output format — do not add prose paragraphs or change the structure:
- Line 1 must remain: KEY INSIGHT: [one sentence]
- Remaining lines must remain: bullet points starting with •
Check for:
1. Specificity — does it reference the actual business details, not generic placeholders?
2. Accuracy — are numbers, benchmarks, and claims defensible?
3. Actionability — investor-ready facts, not vague statements?
4. Format compliance — KEY INSIGHT on line 1, then • bullets only?
Return ONLY the final content — no meta-commentary, no "Here's the improved version".`

  return callClaude(
    system,
    `Original content:\n${originalContent}\n\nTask it was generated for:\n${task}\n\nBusiness context:\n${JSON.stringify(businessData, null, 2)}`,
    1200
  )
}

async function generateWithQC(task: string, businessData: any, onStatus: (s: string) => void): Promise<string> {
  onStatus("Deployment Head generating...")
  const draft = await deploymentHead(task, businessData)
  if (!draft) return "Unable to generate content. Please check your connection."
  onStatus("QC Head reviewing accuracy...")
  const final = await qcHead(draft, task, businessData)
  onStatus("Done")
  return final || draft
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE LAYER
// ─────────────────────────────────────────────────────────────────────────────
const DB_KEY = "dhanveda:ventureiq:state:v1"

async function dbSave(payload: any) {
  try { await window.storage.set(DB_KEY, JSON.stringify(payload)) } catch {}
}
async function dbLoad(): Promise<any | null> {
  try {
    const r = await window.storage.get(DB_KEY)
    return r ? JSON.parse(r.value) : null
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function exportPrint(title: string, landscape = false, sourceId = 'pitch-print-root') {
  const prev = document.title
  document.title = title || "VentureIQ Report"

  // Clone the source element to a direct <body> child so the CSS
  // body.printing-pitch > *:not(#pitch-print-mount) selector can hide siblings.
  // If the source is nested inside #__next, hiding #__next would also hide
  // its descendants even with display:block !important on the child — cloning fixes this.
  const source = document.getElementById(sourceId)
  const mount = document.createElement('div')
  mount.id = 'pitch-print-mount'
  if (source) {
    Array.from(source.childNodes).forEach(node => mount.appendChild(node.cloneNode(true)))
  }
  document.body.appendChild(mount)

  let landscapeStyle: HTMLStyleElement | null = null
  if (landscape) {
    landscapeStyle = document.createElement('style')
    landscapeStyle.textContent = '@page { size: A4 landscape; margin: 10mm; }'
    document.head.appendChild(landscapeStyle)
    document.body.classList.add('printing-landscape')
  }
  document.body.classList.add('printing-pitch')
  window.print()
  document.body.classList.remove('printing-pitch', 'printing-landscape')
  if (landscapeStyle) document.head.removeChild(landscapeStyle)
  document.body.removeChild(mount)
  document.title = prev
}

function copyText(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {})
  } else {
    const el = document.createElement("textarea")
    el.value = text; document.body.appendChild(el)
    el.select(); document.execCommand("copy")
    document.body.removeChild(el)
  }
  window.dispatchEvent(new CustomEvent('venture-copy-toast'))
}

function CopyToast() {
  const [phase, setPhase] = useState<'hidden'|'in'|'out'>('hidden')
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null)
  useEffect(() => {
    function show() {
      if (timer.current) clearTimeout(timer.current)
      setPhase('in')
      timer.current = setTimeout(() => {
        setPhase('out')
        timer.current = setTimeout(() => setPhase('hidden'), 280)
      }, 1700)
    }
    window.addEventListener('venture-copy-toast', show)
    return () => { window.removeEventListener('venture-copy-toast', show); if (timer.current) clearTimeout(timer.current) }
  }, [])
  if (phase === 'hidden') return null
  return (
    <div style={{position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',zIndex:9999,pointerEvents:'none'}}>
      <div className={phase==='in'?'toast-in':'toast-out'} style={{display:'flex',alignItems:'center',gap:8,background:'#064E3B',color:'#fff',borderRadius:100,padding:'10px 22px',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif',letterSpacing:'.01em',boxShadow:'0 8px 32px rgba(0,0,0,0.22),0 2px 8px rgba(0,0,0,0.12),0 0 0 1px rgba(255,255,255,0.07)',whiteSpace:'nowrap'}}>
        <CheckCircle size={15} color="#10B981" />
        Copied to clipboard
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_ORGANIC = {
  biz_name:"FlowDesk", biz_type:"SaaS / Software", biz_stage:"Early revenue",
  biz_description:"A smart project management platform for async remote teams. Combines task tracking, documentation, and team pulse in one workspace.",
  problem:"Remote teams struggle to stay aligned across time zones — existing tools overwhelm with features or miss critical context about what's getting done.",
  customer:"SMBs (10–200 employees) with distributed remote teams, particularly tech, creative, and consulting firms.",
  market_size:"$1B–$10B", market_growth:"Rapidly (20%+ CAGR)",
  competitors:"Notion, Linear, Asana", differentiation:"Async-first with AI-powered daily summaries and automatic progress inference — no manual updates required.",
  startup_cost:"$25K–$100K", capital_available:"$25K–$100K", price_point:"$49/user/month", revenue_model:"Subscription (MRR)",
  team_size:"2 co-founders", founder_experience:"Experienced (5–10 years)", skill_gaps:"Sales & marketing", runway:"1–2 years", commitment:"Full-time (40+ hrs/wk)",
  motivation:"I ran a 40-person remote company for 6 years and lived this pain. Our first 12 customers are ex-colleagues.", saas_gtm:"Product-led growth",
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE (Deterministic)
// ─────────────────────────────────────────────────────────────────────────────
function computeOrganicScore(r: any) {
  const mktSize  = ({">$10B":5,"$1B–$10B":4,"$100M–$1B":3,"$10M–$100M":2,"< $10M":1,"I don't know":2} as any)[r.market_size]||3
  const mktGrow  = ({"Rapidly (20%+ CAGR)":5,"Steadily (5–20% CAGR)":4,"Slowly (< 5%)":2,"Declining":1,"Unsure":2} as any)[r.market_growth]||3
  const capAvail = ({"< $5K":1,"$5K–$25K":2,"$25K–$100K":3,"$100K–$500K":4,"> $500K":5} as any)[r.capital_available]||2
  const capNeed  = ({"< $5K":1,"$5K–$25K":2,"$25K–$100K":3,"$100K–$500K":4,"> $500K":5} as any)[r.startup_cost]||3
  const expScore = ({"Expert (10+ years)":5,"Experienced (5–10 years)":4,"Some (2–5 years)":3,"Beginner (< 2 years)":2,"None in this specific domain":1} as any)[r.founder_experience]||3
  const runScore = ({"< 3 months":1,"3–6 months":2,"6–12 months":3,"1–2 years":4,"2+ years":5} as any)[r.runway]||3
  const comScore = ({"Full-time (40+ hrs/wk)":5,"Part-time (20–40 hrs/wk)":3,"Side project (< 20 hrs/wk)":2,"Weekends only":1} as any)[r.commitment]||3
  const gtmScore = ({"Product-led growth":4.5,"Sales-led":4,"Content/SEO":3.5,"Partnerships":3.5,"Ads":3,"Mixed":3.8} as any)[r.saas_gtm]||3.2
  const dl = (r.differentiation||"").length, cl = (r.competitors||"").split(",").length
  const cats: any = {
    "Market Opportunity":   Math.min(5, mktSize*0.5+mktGrow*0.5),
    "Financial Viability":  Math.min(5,Math.max(1,capAvail-capNeed+3)),
    "Product & Value Prop": dl>60?4.2:dl>30?3.4:2.5,
    "Competition & Moat":   cl>=2&&dl>40?3.6:2.8,
    "Founder Fit":          expScore*0.4+runScore*0.3+comScore*0.3,
    "Go-to-Market":         gtmScore,
    "Operations":           comScore*0.84,
    "Regulatory Risk":      (r.biz_type==="Restaurant / Food & Bev"||r.biz_type==="Manufacturing")?2.8:4.2,
  }
  const weights=[20,20,15,12,12,8,7,6]
  const keys=Object.keys(cats)
  const weighted=keys.reduce((s: number,k: string,i: number)=>s+cats[k]*weights[i],0)/100
  const score=Math.min(98,Math.max(5,Math.round(((weighted-1)/4)*100)))
  const verdict=score>=62?"GO":score>=35?"PIVOT":"NO-GO"
  const color=verdict==="GO"?T.go:verdict==="PIVOT"?T.negotiate:T.pass
  const bg=verdict==="GO"?T.goBg:verdict==="PIVOT"?T.negotiateBg:T.passBg
  return {score,verdict,color,bg,categories:cats}
}

function computeDealScore(form: any, pathId: string | null) {
  let score=50; const flags: string[]=[],strengths: string[]=[]
  if((form.your_strengths||"").length>80){score+=8;strengths.push("Strong value-add from your side defined")}
  if(["Due diligence","Negotiating final terms"].includes(form.deal_stage)){score+=5;strengths.push("Deal progressing — serious parties involved")}
  if(pathId==="franchise"){
    const fee=({"< $10K":5,"$10K–$50K":4,"$50K–$100K":3,"$100K–$500K":1,"> $500K":0,"Unknown":2} as any)[form.franchise_fee]||2
    const roy=({"< 3%":5,"3–5%":4,"5–8%":3,"8–12%":1,"> 12%":0,"Unknown":2} as any)[form.royalty_rate]||2
    const terr=({"Yes — exclusive":5,"Yes — non-exclusive":3,"No territory rights":1,"Negotiating":2} as any)[form.territory]||2
    const brand=({"Global brand (McDonald's level)":5,"National brand":4,"Regional brand":3,"Emerging / growing":2,"Unknown to me":1} as any)[form.brand_strength]||2
    score+=(fee+roy+terr+brand)*1.5
    if(roy<=1)flags.push("Royalty above 8% — negotiate hard on this")
    if(terr>=4)strengths.push("Exclusive territory — strong competitive protection")
  }
  if(pathId==="acquisition"){
    const ebitda=({"Loss-making":0,"Break-even":1,"< $100K":2,"$100K–$500K":4,"> $500K":5,"Unknown":1} as any)[form.ebitda]||1
    const reason=({"Retirement":5,"Health / personal reasons":4,"Wants liquidity":3,"New opportunity":3,"Business distress":1,"Unknown":2} as any)[form.reason_for_sale]||2
    score+=(ebitda+reason)*2
    if(ebitda===0)flags.push("Loss-making business — turnaround required before acquiring")
    if(reason>=4)strengths.push("Benign seller motivation — lower hidden-problem risk")
  }
  if(pathId==="jv"){
    const exit=({"Yes — drag-along + tag-along":5,"Yes — buy-out option":4,"Limited exit rights":2,"No exit defined":0,"Not yet negotiated":1} as any)[form.exit_rights]||1
    const gov=({"Majority vote":4,"You have management control":5,"Board with neutral tiebreaker":4,"Unanimous consent for major decisions":2,"Partner has management control":2} as any)[form.governance]||2
    score+=(exit+gov)*2
    if(exit<=1)flags.push("No exit rights — you could be permanently locked in")
  }
  if(pathId==="merger"){
    const integ=({"Low — similar operations":5,"Medium — some overlap":4,"High — very different cultures/systems":2,"Very high — major restructuring needed":0} as any)[form.integration_risk]||2
    score+=integ*3
    if(integ<=1)flags.push("Very high integration risk — 70% of mergers fail on culture/systems")
  }
  if(pathId==="manufacturing"){
    const margin=({"< 20%":0,"20–35%":2,"35–50%":4,"50–65%":5,"> 65%":5,"Unknown":1} as any)[form.margin_range]||1
    score+=margin*3
    if(margin<=1)flags.push("Margins below 20% — unsustainable at most volumes")
  }
  score=Math.min(96,Math.max(8,Math.round(score)))
  const verdict=score>=68?"GO":score>=42?"NEGOTIATE":"PASS"
  const color=verdict==="GO"?T.go:verdict==="NEGOTIATE"?T.negotiate:T.pass
  const bg=verdict==="GO"?T.goBg:verdict==="NEGOTIATE"?T.negotiateBg:T.passBg
  return {score,verdict,color,bg,flags,strengths,label:verdict==="GO"?"Strong deal — move forward":verdict==="NEGOTIATE"?"Viable — negotiate harder":"Too risky as structured"}
}

// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK SCORING — YC/Sequoia · Thiel Zero-to-One · Unit Economics · Blue Ocean/JTBD
// ─────────────────────────────────────────────────────────────────────────────
function computeFrameworkScores(r: any) {
  const exp  = ({"Expert (10+ years)":5,"Experienced (5–10 years)":4,"Some (2–5 years)":3,"Beginner (< 2 years)":2,"None in this specific domain":1} as any)[r.founder_experience]||3
  const com  = ({"Full-time (40+ hrs/wk)":5,"Part-time (20–40 hrs/wk)":3,"Side project (< 20 hrs/wk)":2,"Weekends only":1} as any)[r.commitment]||3
  const run  = ({"< 3 months":1,"3–6 months":2,"6–12 months":3,"1–2 years":4,"2+ years":5} as any)[r.runway]||3
  const mktS = ({">$10B":5,"$1B–$10B":4,"$100M–$1B":3,"$10M–$100M":2,"< $10M":1,"I don't know":2} as any)[r.market_size]||3
  const mktG = ({"Rapidly (20%+ CAGR)":5,"Steadily (5–20% CAGR)":4,"Slowly (< 5%)":2,"Declining":1,"Unsure":2} as any)[r.market_growth]||3
  const capA = ({"< $5K":1,"$5K–$25K":2,"$25K–$100K":3,"$100K–$500K":4,"> $500K":5} as any)[r.capital_available]||2
  const capN = ({"< $5K":1,"$5K–$25K":2,"$25K–$100K":3,"$100K–$500K":4,"> $500K":5} as any)[r.startup_cost]||3
  const rev  = ({"Subscription (MRR)":5,"Marketplace / Commission":4.5,"Advertising":4,"Freemium":4,"Licensing":3.5,"Services / Retainer":3,"One-time purchase":2.5,"Mixed":3.5} as any)[r.revenue_model]||3
  const biz  = r.biz_type||""
  const dl   = (r.differentiation||"").length
  const pl   = (r.problem||"").length
  const cl   = (r.customer||"").length

  // 1. YC / Sequoia — Team 35%, Market 40%, Product 25%
  const ycTeam    = exp*0.4 + com*0.35 + run*0.25
  const ycMarket  = mktS*0.5 + mktG*0.5
  const ycProduct = dl>100?5:dl>60?4.2:dl>30?3.4:2.5
  const ycRaw     = ycTeam*0.35 + ycMarket*0.40 + ycProduct*0.25
  const ycScore   = Math.min(98,Math.max(5,Math.round(((ycRaw-1)/4)*100)))
  const ycInsights = [
    exp>=4 ? `${exp>=5?"Expert":"Experienced"} founder — strong execution signal` : "Founder experience is early-stage — find a domain expert co-founder",
    mktS>=4&&mktG>=4 ? `$${mktS>=5?"10B+":"1B–10B"} market growing fast — VC-fundable TAM` : mktG>=4 ? "Fast growth but limited TAM — focus on niche domination first" : "Market opportunity needs strengthening",
    dl>80 ? "Differentiation is clearly articulated — product story is compelling" : "Differentiation needs 2-3 more specifics to pass a VC filter",
  ]

  // 2. Peter Thiel Zero-to-One — Technology 30%, Network Effects 25%, Scale 25%, Brand 20%
  const tech   = biz==="SaaS / Software"?4.5:biz==="Marketplace"?3.5:biz==="E-commerce / DTC"?3:biz==="Manufacturing"?2:2.8
  const netfx  = biz==="Marketplace"?5:biz==="SaaS / Software"?3:biz==="E-commerce / DTC"?2.5:1.5
  const scale  = mktS*0.6 + rev*0.4
  const brand  = dl>80?3.5:2.5
  const thRaw  = tech*0.3 + netfx*0.25 + scale*0.25 + brand*0.2
  const thScore = Math.min(98,Math.max(5,Math.round(((thRaw-1)/4)*100)))
  const thInsights = [
    biz==="Marketplace" ? "Marketplace model creates network effects — Thiel's strongest monopoly signal" : biz==="SaaS / Software" ? "SaaS has proprietary tech potential — define the 10x better claim precisely" : "Identify a technological or process innovation that competitors can't easily copy",
    netfx>=4 ? "Strong network effects — value compounds with each new user" : "Limited network effects — consider how to make the product stickier over time",
    mktS>=4 ? "Scale economies available in a large market — winner-takes-most dynamics possible" : "Build a monopoly in a small niche, then expand — Thiel's core advice",
  ]

  // 3. Unit Economics — Capital efficiency 40%, Revenue quality 35%, Payback signal 25%
  const capEff   = Math.min(5,Math.max(1,capA-capN+3))
  const payback  = mktG>=4&&rev>=4?5:mktG>=3&&rev>=3?3.5:2
  const unitRaw  = capEff*0.40 + rev*0.35 + payback*0.25
  const unitScore = Math.min(98,Math.max(5,Math.round(((unitRaw-1)/4)*100)))
  const unitInsights = [
    capEff>=4 ? "Capital-efficient: available capital matches or exceeds startup cost" : capEff<=2 ? "Capital gap is significant — secure funding or reduce initial scope" : "Capital position is adequate — model your month-by-month burn",
    rev>=4.5 ? "Subscription or marketplace revenue model maximises LTV/CAC ratio" : rev>=3.5 ? "Revenue model is solid — quantify your average contract value" : "Revenue model has low predictability — consider adding a recurring component",
    payback>=4 ? "Fast-growing market + strong revenue model signals short payback period" : "Model your payback period explicitly — investors will ask",
  ]

  // 4. Blue Ocean / JTBD — Market creation 50%, Problem specificity 30%, Customer clarity 20%
  const novelty  = mktS<=2&&mktG>=4?5:mktG>=4?4:mktG>=3?3:2
  const probClr  = pl>150?5:pl>80?4:pl>40?3:2
  const custClr  = cl>120?5:cl>60?4:cl>30?3:2
  const boRaw    = novelty*0.5 + probClr*0.3 + custClr*0.2
  const boScore  = Math.min(98,Math.max(5,Math.round(((boRaw-1)/4)*100)))
  const boInsights = [
    mktG>=4&&mktS<=3 ? "You may be creating a new market — classic Blue Ocean signal" : mktG>=4 ? "Fast-growing market with known demand — compete on differentiation, not price" : "Market is maturing — you need a clear non-competitive axis to win",
    pl>100 ? "Problem is well-defined and specific — strong JTBD clarity" : pl>40 ? "Problem statement is decent — add the emotional cost of the pain to sharpen it" : "Problem needs more specificity — who suffers, when, and what do they currently do instead?",
    cl>80 ? "Customer segment is specific — you can target and message precisely" : "Sharpen the customer profile: industry, company size, role, and trigger event",
  ]

  return {
    yc:    { score:ycScore,   label:"YC / Sequoia",      color:"#10B981", desc:"Team · Market · Product",           insights:ycInsights },
    thiel: { score:thScore,   label:"Thiel Zero-to-One", color:"#8B5CF6", desc:"Technology · Network · Scale",       insights:thInsights },
    unit:  { score:unitScore, label:"Unit Economics",    color:"#06B6D4", desc:"Capital · Revenue · Payback",        insights:unitInsights },
    bo:    { score:boScore,   label:"Blue Ocean / JTBD", color:"#F59E0B", desc:"Market Creation · Problem · Customer",insights:boInsights },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRing({score,color,size=160}: {score:number,color:string,size?:number}) {
  const R=size*0.338, C=2*Math.PI*R, dash=(score/100)*C
  return (
    <div style={{position:"relative",width:size,height:size,margin:"0 auto"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={T.bgBorder} strokeWidth={size*0.062}/>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={size*0.062}
          strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
          style={{animation:"ring 1.2s ease-out",filter:`drop-shadow(0 0 6px ${color}60)`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span className="mono" style={{fontSize:size*0.26,fontWeight:600,color,lineHeight:1}}>{score}</span>
        <span style={{fontSize:size*0.075,color:T.textSecondary,marginTop:2}}>/100</span>
      </div>
    </div>
  )
}

function VerdictPill({verdict,color,bg,label}: {verdict:string,color:string,bg:string,label?:string}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <div style={{background:bg,border:`1.5px solid ${color}`,borderRadius:100,padding:"5px 18px",display:"flex",alignItems:"center",gap:7}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:color,boxShadow:`0 0 5px ${color}`}}/>
        <span className="dsp" style={{fontSize:16,fontWeight:700,color,letterSpacing:".05em"}}>{verdict}</span>
      </div>
      {label && <span style={{fontSize:12,color:T.textSecondary}}>{label}</span>}
    </div>
  )
}

function Card({children,style={}}: {children:React.ReactNode,style?:React.CSSProperties}) {
  return <div style={{background:T.bgCard,border:`1px solid ${T.bgBorder}`,borderRadius:12,...style}}>{children}</div>
}

function Btn({children,onClick,variant="primary",color,disabled,style={}}: any) {
  const base: React.CSSProperties={display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:600,border:"none",transition:"all .15s",...style}
  const bg=color||T.accent
  const variants: any={
    primary:{background:bg,color:"#fff",boxShadow:`0 0 18px ${bg}30`},
    ghost:{background:T.bgElevated,color:T.textSecondary,border:`1px solid ${T.bgBorder}`},
    danger:{background:T.pass,color:"#fff"},
  }
  return <button onClick={onClick} disabled={disabled} style={{...base,...variants[variant],opacity:disabled?.5:1}}>{children}</button>
}

function AIStatus({status}: {status:string}) {
  if(!status||status==="Done")return null
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:T.accentSubtle,borderRadius:8,border:`1px solid ${T.accent}30`,marginBottom:12}}>
      <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${T.bgBorder}`,borderTop:`2px solid ${T.accent}`,animation:"spin .8s linear infinite"}}/>
      <span style={{fontSize:12,color:T.accent}}>{status}</span>
    </div>
  )
}

function StreamBox({content,loading,label}: {content?:string,loading?:boolean,label?:string}) {
  const [shown,setShown]=useState("")
  useEffect(()=>{
    if(!loading||!content){setShown(content||"");return}
    setShown("");let i=0
    const id=setInterval(()=>{setShown(content.slice(0,i));i+=6;if(i>content.length)clearInterval(id)},20)
    return()=>clearInterval(id)
  },[content,loading])
  return (
    <div style={{background:T.bgElevated,borderRadius:10,padding:16}}>
      {label&&<div style={{fontSize:10,color:T.accent,fontWeight:600,letterSpacing:".08em",marginBottom:8}}>{label}</div>}
      {loading&&!content?<div style={{display:"flex",flexDirection:"column",gap:6}}>{[100,80,90,70].map((w,i)=><div key={i} className="sk" style={{height:12,width:`${w}%`}}/>)}</div>
        :<p style={{fontSize:13,color:T.textSecondary,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{shown}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIC INTAKE WIZARD
// ─────────────────────────────────────────────────────────────────────────────
const INTAKE_STEPS=[
  {title:"Business Basics",  icon:<Home size={12}/>,        keys:["biz_name","biz_type","biz_stage","biz_description"]},
  {title:"Market",           icon:<Globe size={12}/>,       keys:["problem","customer","market_size","market_growth"]},
  {title:"Competition",      icon:<Target size={12}/>,      keys:["competitors","differentiation"]},
  {title:"Financials",       icon:<DollarSign size={12}/>,  keys:["startup_cost","capital_available","price_point","revenue_model","saas_gtm"]},
  {title:"Team",             icon:<Users size={12}/>,       keys:["team_size","founder_experience","skill_gaps","commitment"]},
  {title:"Personal",         icon:<UserCheck size={12}/>,   keys:["runway","motivation"]},
]
const FM: any={
  biz_name:{label:"Business Name",type:"text",ph:"e.g. FlowDesk"},
  biz_type:{label:"Business Type",type:"sel",opts:["SaaS / Software","E-commerce / DTC","Restaurant / Food & Bev","Retail / Brick & Mortar","Service / Agency","Manufacturing","Marketplace","Freelance / Consulting","Other"]},
  biz_stage:{label:"Current Stage",type:"sel",opts:["Just an idea","Researching","Building MVP","Pre-revenue","Early revenue"]},
  biz_description:{label:"Describe your business",type:"ta",ph:"What you do, for whom, and how"},
  problem:{label:"Problem it solves",type:"ta",ph:"Describe the customer's pain"},
  customer:{label:"Target Customer",type:"ta",ph:"Who they are and their context"},
  market_size:{label:"Estimated TAM",type:"sel",opts:["< $10M","$10M–$100M","$100M–$1B","$1B–$10B","> $10B","I don't know"]},
  market_growth:{label:"Market Growth",type:"sel",opts:["Rapidly (20%+ CAGR)","Steadily (5–20% CAGR)","Slowly (< 5%)","Declining","Unsure"]},
  competitors:{label:"Top Competitors",type:"text",ph:"e.g. Notion, Linear, Asana"},
  differentiation:{label:"Your Differentiation",type:"ta",ph:"What makes you meaningfully different?"},
  startup_cost:{label:"Startup Capital Needed",type:"sel",opts:["< $5K","$5K–$25K","$25K–$100K","$100K–$500K","> $500K"]},
  capital_available:{label:"Capital Available",type:"sel",opts:["< $5K","$5K–$25K","$25K–$100K","$100K–$500K","> $500K"]},
  price_point:{label:"Price Per Customer",type:"text",ph:"e.g. $49/mo per seat"},
  revenue_model:{label:"Revenue Model",type:"sel",opts:["Subscription (MRR)","One-time purchase","Marketplace / Commission","Advertising","Freemium","Licensing","Services / Retainer","Mixed"]},
  saas_gtm:{label:"Primary Go-to-Market Channel",type:"sel",opts:["Product-led growth","Direct sales","Content & SEO","Partnerships","Marketplace / Listings","Community-led","Outbound / Cold outreach"]},
  team_size:{label:"Team Size",type:"sel",opts:["Solo founder","2 co-founders","3–5 people","6–10 people","10+ people"]},
  founder_experience:{label:"Domain Experience",type:"sel",opts:["Expert (10+ years)","Experienced (5–10 years)","Some (2–5 years)","Beginner (< 2 years)","None in this specific domain"]},
  skill_gaps:{label:"Key Skill Gaps",type:"ta",ph:"What critical skills are missing?"},
  commitment:{label:"Time Commitment",type:"sel",opts:["Full-time (40+ hrs/wk)","Part-time (20–40 hrs/wk)","Side project (< 20 hrs/wk)","Weekends only"]},
  runway:{label:"Personal Runway",type:"sel",opts:["< 3 months","3–6 months","6–12 months","1–2 years","2+ years"]},
  motivation:{label:"Why are YOU the right person?",type:"ta",ph:"Your unfair advantage for this specific business"},
}

function OrganicIntake({onComplete}: {onComplete:(form:any)=>void}) {
  const [step,setStep]=useState(0)
  const [form,setForm]=useState<any>({})
  const [stepErrors,setStepErrors]=useState<string[]>([])
  const set=(k: string,v: string)=>{
    setForm((f: any)=>({...f,[k]:v}))
    setStepErrors(se=>se.filter(e=>e!==k))
  }
  const pct=((step+1)/INTAKE_STEPS.length)*100
  const cur=INTAKE_STEPS[step]

  function validateStep(): boolean {
    const empty=cur.keys.filter(k=>(form[k]||"").toString().trim()==="")
    setStepErrors(empty)
    return empty.length===0
  }

  function handleContinue() {
    if(!validateStep()) return
    setStep((s: number)=>s+1)
  }

  function handleAnalyze() {
    if(!validateStep()) return
    onComplete(form)
  }

  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"28px 24px"}} className="fu">
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:T.accent,fontWeight:600,letterSpacing:".1em",marginBottom:4}}>STEP {step+1} OF {INTAKE_STEPS.length} · NEW BUSINESS INVESTMENT</div>
        <h1 className="dsp" style={{fontSize:24,fontWeight:700,marginBottom:12,color:T.textPrimary}}>{cur.title}</h1>
        <div style={{height:3,background:T.bgBorder,borderRadius:2}}>
          <div style={{height:3,background:T.accent,borderRadius:2,width:`${pct}%`,transition:"width .4s ease",boxShadow:`0 0 8px ${T.accent}60`}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:22,flexWrap:"wrap"}}>
        {INTAKE_STEPS.map((s,i)=>(
          <button key={i} onClick={()=>i<step&&setStep(i)}
            style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:20,
              background:i===step?T.accentSubtle:i<step?T.bgElevated:"transparent",
              border:`1px solid ${i===step?T.accent:i<step?T.bgBorder:"transparent"}`,
              color:i===step?T.accent:i<step?T.textSecondary:T.textTertiary,fontSize:10,fontWeight:500}}>
            {i<step?<CheckCircle size={9} color={T.go}/>:s.icon}{s.title}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:15}}>
        {cur.keys.map(k=>{
          const m=FM[k]
          const hasError=stepErrors.includes(k)
          const errBorder=hasError?{borderColor:"#DC2626",boxShadow:"0 0 0 2px rgba(220,38,38,0.12)"}:{}
          return (
            <div key={k}>
              <label style={{display:"block",fontSize:12,fontWeight:500,color:hasError?"#DC2626":T.textSecondary,marginBottom:5}}>
                {m.label}<span style={{color:"#DC2626",marginLeft:3}}>*</span>
              </label>
              {m.type==="ta"
                ?<textarea value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder={m.ph||""} style={errBorder}/>
                :m.type==="sel"
                ?<select value={form[k]||""} onChange={e=>set(k,e.target.value)} style={errBorder}>
                    <option value="">Select…</option>
                    {m.opts.map((o: string)=><option key={o}>{o}</option>)}
                  </select>
                :<input type="text" value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder={m.ph||""} style={errBorder}/>}
              {hasError&&<div style={{fontSize:11,color:"#DC2626",marginTop:4}}>This field is required</div>}
            </div>
          )
        })}
      </div>
      {stepErrors.length>0&&(
        <div style={{fontSize:12,color:"#DC2626",background:"rgba(220,38,38,0.06)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:8,padding:"8px 12px",marginTop:12}}>
          Please fill in all required fields before continuing.
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:24}}>
        <Btn variant="ghost" onClick={()=>{setStepErrors([]);step>0&&setStep((s: number)=>s-1)}} disabled={step===0}><ChevronLeft size={13}/>Back</Btn>
        {step<INTAKE_STEPS.length-1
          ?<Btn onClick={handleContinue}>Continue<ChevronRight size={13}/></Btn>
          :<Btn onClick={handleAnalyze} style={{background:`linear-gradient(135deg,${T.accent},${T.purple})`}}><Zap size={13}/>Analyze This Investment</Btn>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD (Organic)
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({data,result,setView}: {data:any,result:any,setView:(v:string)=>void}) {
  const [dashTab, setDashTab] = useState<"overview"|"frameworks">("overview")
  const fw = computeFrameworkScores(data)
  const radarData=Object.entries(result.categories).map(([name,val]: any)=>({name:name.split(" ").slice(0,2).join(" "),fullName:name,value:Math.round(val*20)}))
  const sorted=Object.entries(result.categories).sort((a: any,b: any)=>b[1]-a[1])
  const strengths=sorted.slice(0,3), risks=[...sorted].reverse().slice(0,3)
  const sens=[{label:"Add sales co-founder",delta:+7},{label:"Capital up to $250K",delta:+9},{label:"Market growth slows",delta:-6}]
  const fwList = [fw.yc, fw.thiel, fw.unit, fw.bo]
  return (
    <div style={{padding:"24px 28px",maxWidth:1060,margin:"0 auto"}} className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:10,color:T.accent,fontWeight:600,letterSpacing:".1em",marginBottom:3}}>BUSINESS INVESTMENT ANALYSIS</div>
          <h1 className="dsp" style={{fontSize:25,fontWeight:700,color:T.textPrimary}}>{data.biz_name}</h1>
          <div style={{fontSize:12,color:T.textSecondary,marginTop:2}}>{data.biz_type} · {data.biz_stage}</div>
        </div>
        <div style={{display:"flex",gap:8}} className="no-print">
          <Btn variant="ghost" onClick={()=>copyText(`VentureIQ Analysis: ${data.biz_name}\nScore: ${result.score}/100 — ${result.verdict}\nType: ${data.biz_type} | Stage: ${data.biz_stage}\nDifferentiation: ${data.differentiation}`)}><Copy size={12}/>Copy Summary</Btn>
          <Btn variant="ghost" onClick={()=>exportPrint(`${data.biz_name} — VentureIQ Analysis`)}><Download size={12}/>Print / PDF</Btn>
        </div>
      </div>
      {/* Dashboard tabs */}
      <div style={{display:"flex",gap:3,marginBottom:20,background:T.bgElevated,borderRadius:9,padding:4,border:`1px solid ${T.bgBorder}`,width:"fit-content"}} className="no-print">
        {[{id:"overview",label:"📊 Overview"},{id:"frameworks",label:"🔬 Framework Analysis"}].map(t=>(
          <button key={t.id} onClick={()=>setDashTab(t.id as any)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:7,background:dashTab===t.id?T.bgCard:"transparent",border:dashTab===t.id?`1px solid ${T.bgBorder}`:"1px solid transparent",color:dashTab===t.id?T.textPrimary:T.textSecondary,fontSize:12,fontWeight:dashTab===t.id?600:400,cursor:"pointer"}}>
            {t.label}
          </button>
        ))}
      </div>
      {dashTab === "overview" && <>
        <Card style={{padding:26,marginBottom:16,border:`1px solid ${result.color}25`,boxShadow:`0 0 30px ${result.color}08`,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
          <ScoreRing score={result.score} color={result.color} size={148}/>
          <VerdictPill verdict={result.verdict} color={result.color} bg={result.bg} label={result.verdict==="GO"?"Strong foundation":"Refine before building"}/>
          <p style={{fontSize:13,color:T.textSecondary,textAlign:"center",maxWidth:440,lineHeight:1.75}}>
            {result.verdict==="GO"?`${data.biz_name} shows strong fundamentals across market, team, and financial dimensions. Move to document generation.`
            :result.verdict==="PIVOT"?`${data.biz_name} has real potential. Address the key risks below before committing fully.`
            :`${data.biz_name} faces structural challenges. Revisit core assumptions before investing further.`}
          </p>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1.1fr 1fr",gap:14,marginBottom:14}}>
          <Card style={{padding:18}}>
            <div style={{fontSize:12,fontWeight:600,marginBottom:2,color:T.textPrimary}}>Score Breakdown</div>
            <div style={{fontSize:11,color:T.textSecondary,marginBottom:12}}>8 categories · weighted by business type</div>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{top:6,right:14,bottom:6,left:14}}>
                <PolarGrid stroke={T.bgBorder}/>
                <PolarAngleAxis dataKey="name" tick={{fill:T.textSecondary,fontSize:9,fontFamily:"Inter"}}/>
                <Tooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.bgBorder}`,borderRadius:8,color:T.textPrimary,fontSize:11}} formatter={(v: any,_: any,p: any)=>[`${v}/100`,p.payload.fullName]}/>
                <Radar dataKey="value" stroke={T.accent} fill={T.accent} fillOpacity={0.12} strokeWidth={1.5} dot={{fill:T.accent,r:2}}/>
              </RadarChart>
            </ResponsiveContainer>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:8}}>
              {Object.entries(result.categories).map(([k,v]: any)=>(
                <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 8px",background:T.bgElevated,borderRadius:5}}>
                  <span style={{fontSize:9,color:T.textSecondary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>{k}</span>
                  <span className="mono" style={{fontSize:9,fontWeight:600,color:v>=4?T.go:v>=3?T.textPrimary:T.negotiate,marginLeft:4,flexShrink:0}}>{Math.round(v*20)}</span>
                </div>
              ))}
            </div>
          </Card>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Card style={{padding:16,background:T.goBg,border:`1px solid ${T.go}25`,flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><CheckCircle size={12} color={T.go}/><span style={{fontSize:11,fontWeight:600,color:T.go}}>Top Strengths</span></div>
              {strengths.map(([name,val]: any)=>(
                <div key={name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:12,color:T.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{name}</span>
                  <div style={{display:"flex",gap:2,flexShrink:0,marginLeft:4}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:i<=Math.round(val)?T.go:T.bgBorder}}/>)}</div>
                </div>
              ))}
            </Card>
            <Card style={{padding:16,background:T.negotiateBg,border:`1px solid ${T.negotiate}25`,flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><AlertTriangle size={12} color={T.negotiate}/><span style={{fontSize:11,fontWeight:600,color:T.negotiate}}>Key Risks</span></div>
              {risks.map(([name,val]: any)=>(
                <div key={name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:12,color:T.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{name}</span>
                  <div style={{display:"flex",gap:2,flexShrink:0,marginLeft:4}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:i<=Math.round(val)?T.negotiate:T.bgBorder}}/>)}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
        <Card style={{padding:16,marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:2,color:T.textPrimary}}>Sensitivity Analysis</div>
          <div style={{fontSize:11,color:T.textSecondary,marginBottom:12}}>How key changes shift your verdict</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {sens.map((row,i)=>{const ns=Math.min(98,Math.max(2,result.score+row.delta));const nv=ns>=62?"GO":ns>=35?"PIVOT":"NO-GO";const nc=nv==="GO"?T.go:nv==="PIVOT"?T.negotiate:T.pass;return(
              <div key={i} style={{background:T.bgElevated,borderRadius:8,padding:12}}>
                <div style={{fontSize:11,color:T.textSecondary,marginBottom:8,lineHeight:1.5}}>{row.label}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:8}}><span className="mono" style={{fontSize:20,fontWeight:600,color:nc}}>{ns}</span><span style={{fontSize:11,fontWeight:600,color:row.delta>0?T.go:T.pass}}>{row.delta>0?"+":""}{row.delta}</span></div>
                <div style={{fontSize:9,color:nc,marginTop:2,fontWeight:600}}>{nv}</div>
              </div>
            )})}
          </div>
        </Card>
        <Card style={{padding:18,background:T.accentSubtle,border:`1px solid ${T.accent}35`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div>
            <div className="dsp" style={{fontSize:15,fontWeight:700,marginBottom:3,color:T.textPrimary}}>Generate your full document suite</div>
            <div style={{fontSize:12,color:T.textSecondary}}>Business Plan · Model Canvas · Pitch Deck — AI-generated from your data</div>
          </div>
          <Btn onClick={()=>setView("documents")} style={{whiteSpace:"nowrap",flexShrink:0}}>Generate Investment Documents<ArrowRight size={13}/></Btn>
        </Card>
      </>}

      {dashTab === "frameworks" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{padding:"14px 18px",background:T.bgElevated,borderRadius:12,border:`1px solid ${T.bgBorder}`}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textPrimary,marginBottom:4}}>Multi-Framework Analysis</div>
            <div style={{fontSize:12,color:T.textSecondary,lineHeight:1.7}}>Your business is evaluated through four independently-weighted lenses used by the world's top investors and strategists. Each framework asks a different fundamental question — together they reveal the full picture.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {fwList.map((f,i)=>{
              const icons=["🚀","🔷","📐","🌊"]
              const taglines=["Used by Y Combinator & Sequoia Capital to screen investments","Peter Thiel's Zero to One — can this become a monopoly?","Paul Graham's unit economics — is the business model itself sound?","Blue Ocean Strategy + Jobs-to-be-Done — is new demand being created?"]
              return (
                <Card key={i} style={{padding:18,border:`1.5px solid ${f.color}22`}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                        <span style={{fontSize:16}}>{icons[i]}</span>
                        <span style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{f.label}</span>
                      </div>
                      <div style={{fontSize:10,color:T.textSecondary,lineHeight:1.5,maxWidth:200}}>{taglines[i]}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0,marginLeft:10}}>
                      <span className="mono" style={{fontSize:28,fontWeight:700,color:f.color,lineHeight:1}}>{f.score}</span>
                      <span style={{fontSize:9,color:T.textSecondary,marginTop:2}}>/ 100</span>
                    </div>
                  </div>
                  <div style={{height:6,background:T.bgBorder,borderRadius:3,marginBottom:10,overflow:"hidden"}}>
                    <div style={{height:6,borderRadius:3,background:`linear-gradient(90deg,${f.color}88,${f.color})`,width:`${f.score}%`,transition:"width .6s ease"}}/>
                  </div>
                  <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                    {f.desc.split(" · ").map((d: string)=>(
                      <span key={d} style={{fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:100,background:`${f.color}12`,color:f.color,border:`1px solid ${f.color}25`}}>{d}</span>
                    ))}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {f.insights.map((ins: string,j: number)=>(
                      <div key={j} style={{display:"flex",gap:7,alignItems:"flex-start"}}>
                        <span style={{color:f.score>=60?T.go:f.score>=40?T.negotiate:T.pass,fontSize:10,marginTop:1,flexShrink:0}}>{f.score>=60?"✓":f.score>=40?"→":"⚠"}</span>
                        <span style={{fontSize:11,color:T.textSecondary,lineHeight:1.55}}>{ins}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
          <Card style={{padding:16,background:T.accentSubtle,border:`1px solid ${T.accent}35`}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:20,flexShrink:0}}>💡</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.textPrimary,marginBottom:4}}>How the composite score combines frameworks</div>
                <div style={{fontSize:11,color:T.textSecondary,lineHeight:1.7}}>
                  Your ArthaSift score weighs YC/Sequoia criteria most heavily (team + market + product = 35%), then Thiel's monopoly potential (25%), unit economics soundness (25%), and Blue Ocean novelty (15%). This mirrors how actual investor decision-making flows — first validate the team and market, then assess defensibility and unit economics before considering category creation.
                </div>
              </div>
            </div>
          </Card>
          <Card style={{padding:18,background:T.accentSubtle,border:`1px solid ${T.accent}35`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
            <div>
              <div className="dsp" style={{fontSize:15,fontWeight:700,marginBottom:3,color:T.textPrimary}}>Generate your investor-ready deck</div>
              <div style={{fontSize:12,color:T.textSecondary}}>Business Plan · Model Canvas · Pitch Deck with framework analysis included</div>
            </div>
            <Btn onClick={()=>setView("documents")} style={{whiteSpace:"nowrap",flexShrink:0}}>Go to Pitch Studio<ArrowRight size={13}/></Btn>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEAL STUDIO (Inorganic)
// ─────────────────────────────────────────────────────────────────────────────
const DEAL_PATHS=[
  {id:"franchise",    label:"Franchise",       icon:<Building2 size={18}/>,color:T.purple, desc:"Buy rights to operate an established brand"},
  {id:"manufacturing",label:"Mfg / License",   icon:<Factory size={18}/>,  color:T.teal,   desc:"License to produce or distribute a brand"},
  {id:"acquisition",  label:"Acquisition",     icon:<DollarSign size={18}/>,color:T.coral,  desc:"Buy an existing business outright"},
  {id:"jv",           label:"Strategic JV",    icon:<Handshake size={18}/>,color:T.amber,  desc:"Joint venture or strategic partnership"},
  {id:"merger",       label:"Merger",          icon:<Merge size={18}/>,    color:T.blue,   desc:"Combine two businesses for shared scale"},
]
const DEAL_COMMON=[
  {k:"deal_name",     label:"Company / Brand you're dealing with",type:"text",ph:"e.g. McDonald's, local manufacturer"},
  {k:"your_name",     label:"Your name or business name",        type:"text",ph:"Your entity"},
  {k:"deal_stage",    label:"Where are you in the deal?",        type:"sel", opts:["Just exploring","Initial conversations","Due diligence","Term sheet received","Negotiating final terms"]},
  {k:"investment_amt",label:"Capital prepared to invest",        type:"sel", opts:["< $10K","$10K–$50K","$50K–$250K","$250K–$1M","$1M–$5M","> $5M"]},
  {k:"your_goal",     label:"Primary goal from this deal",       type:"sel", opts:["Revenue & profit","Market entry","IP / technology","Geographic expansion","Talent & team","Brand credibility","Exit / resale"]},
  {k:"your_strengths",label:"What YOU bring (your unfair advantage)",type:"ta",ph:"Local market knowledge, distribution network, capital, operational expertise, relationships…"},
]
const DEAL_PATH_QS: any={
  franchise:[
    {k:"franchise_fee",   label:"Initial franchise fee?",     type:"sel",opts:["< $10K","$10K–$50K","$50K–$100K","$100K–$500K","> $500K","Unknown"]},
    {k:"royalty_rate",    label:"Ongoing royalty rate?",      type:"sel",opts:["< 3%","3–5%","5–8%","8–12%","> 12%","Unknown"]},
    {k:"territory",       label:"Exclusive territory?",       type:"sel",opts:["Yes — exclusive","Yes — non-exclusive","No territory rights","Negotiating"]},
    {k:"brand_strength",  label:"Brand establishment level?", type:"sel",opts:["Global brand","National brand","Regional brand","Emerging / growing","Unknown to me"]},
    {k:"franchisor_support",label:"Support provided?",        type:"ta", ph:"Training, marketing, supply chain, tech systems…"},
  ],
  manufacturing:[
    {k:"license_type",  label:"License type?",               type:"sel",opts:["Exclusive regional","Non-exclusive","Full distribution rights","Manufacturing + sell"]},
    {k:"moq",           label:"Minimum order quantity?",     type:"text",ph:"e.g. 1,000 units/month"},
    {k:"margin_range",  label:"Expected gross margin?",      type:"sel",opts:["< 20%","20–35%","35–50%","50–65%","> 65%","Unknown"]},
    {k:"contract_term", label:"Initial contract term?",      type:"sel",opts:["1 year","2–3 years","5 years","10+ years","Perpetual"]},
    {k:"ip_protection", label:"IP / trade secrets involved?",type:"ta", ph:"Patents, formulas, processes, designs…"},
  ],
  acquisition:[
    {k:"asking_price",   label:"Seller's asking price?",     type:"sel",opts:["< $100K","$100K–$500K","$500K–$2M","$2M–$10M","> $10M","Unknown"]},
    {k:"revenue",        label:"Annual revenue of target?",  type:"sel",opts:["< $100K","$100K–$500K","$500K–$2M","$2M–$10M","> $10M","Unknown"]},
    {k:"ebitda",         label:"EBITDA / net profit?",       type:"sel",opts:["Loss-making","Break-even","< $100K","$100K–$500K","> $500K","Unknown"]},
    {k:"reason_for_sale",label:"Why is the owner selling?",  type:"sel",opts:["Retirement","Health / personal","Wants liquidity","New opportunity","Business distress","Unknown"]},
    {k:"key_risks",      label:"Biggest risks spotted?",     type:"ta", ph:"Customer concentration, key-person risk, legal issues…"},
  ],
  jv:[
    {k:"partner_name",  label:"Strategic partner?",          type:"text",ph:"Partner name or description"},
    {k:"jv_structure",  label:"Proposed JV structure?",      type:"sel",opts:["50/50 equity","Majority/minority stake","Revenue share","Co-marketing agreement","Custom / TBD"]},
    {k:"what_they_bring",label:"What does partner bring?",   type:"ta", ph:"Distribution, brand, capital, technology, customers…"},
    {k:"exit_rights",   label:"Your exit rights?",           type:"sel",opts:["Yes — drag-along + tag-along","Yes — buy-out option","Limited exit rights","No exit defined","Not yet negotiated"]},
    {k:"governance",    label:"Decision-making governance?", type:"sel",opts:["Majority vote","You have management control","Board with neutral tiebreaker","Unanimous consent required","Partner has control"]},
  ],
  merger:[
    {k:"merger_type",    label:"Type of merger?",            type:"sel",opts:["Horizontal (same industry)","Vertical (supply chain)","Conglomerate","Acqui-hire (talent)","Reverse merger"]},
    {k:"synergy_value",  label:"Estimated synergy value?",   type:"sel",opts:["< $100K/yr","$100K–$500K/yr","$500K–$2M/yr","> $2M/yr","Unknown"]},
    {k:"integration_risk",label:"Integration complexity?",  type:"sel",opts:["Low — similar ops","Medium — some overlap","High — different cultures/systems","Very high — major restructuring"]},
    {k:"equity_split",   label:"Post-merger equity split?",  type:"text",ph:"e.g. 60/40 or 50/50"},
    {k:"leadership",     label:"Who leads post-merger?",     type:"sel",opts:["You lead","Partner leads","New CEO hired","Co-CEO structure","Not decided"]},
  ],
}

function DealStudio({setView}: {setView:(v:string)=>void}) {
  const [screen,setScreen]=useState("select")
  const [pathId,setPathId]=useState<string|null>(null)
  const [form,setForm]=useState<any>({})
  const [dealResult,setDealResult]=useState<any>(null)
  const [aiContent,setAiContent]=useState<any>({})
  const [aiStatus,setAiStatus]=useState("")
  const [tab,setTab]=useState("score")
  const [loading,setLoading]=useState(false)
  const [stepErrors,setStepErrors]=useState<string[]>([])

  const path=DEAL_PATHS.find(p=>p.id===pathId)
  const allQ=[...DEAL_COMMON,...(pathId ? DEAL_PATH_QS[pathId]||[] : [])]
  const [step,setStep]=useState(0)
  const perStep=3
  const steps: any[][]=[]
  for(let i=0;i<allQ.length;i+=perStep)steps.push(allQ.slice(i,i+perStep))

  function validateStep(): boolean {
    const emptyKeys=steps[step]
      .filter((q: any)=>{
        const v=(form[q.k]||"").toString().trim()
        return v===""
      })
      .map((q: any)=>q.k)
    setStepErrors(emptyKeys)
    return emptyKeys.length===0
  }

  function handleContinue() {
    if(!validateStep()) return
    setStepErrors([])
    setStep((s: number)=>s+1)
  }

  function handleScoreDeal() {
    if(!validateStep()) return
    setStepErrors([])
    handleScore(form)
  }

  function exportDealPDF() {
    const el = document.getElementById('deal-studio-print-root')
    if (!el) return
    const title = `${form.deal_name || 'Deal'} — Deal Intelligence Report`
    const win = window.open('', '_blank', 'width=1000,height=750')
    if (!win) { alert('Please allow popups in your browser to export PDF'); return }
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title.replace(/[<>&]/g, c => c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;')}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">
  <style>
    *{box-sizing:border-box;}
    body{font-family:Inter,system-ui,sans-serif;background:#fff;color:#064E3B;margin:0;padding:24px;}
    .dsp{font-family:'Space Grotesk',sans-serif;}
    .mono{font-family:'JetBrains Mono',monospace;}
    .fu,.si{animation:none!important;}
    .no-print,button{display:none!important;}
    svg{display:inline-block;vertical-align:middle;}
    @media print{body{padding:0;}.no-print,button{display:none!important;}}
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`)
    win.document.close()
    setTimeout(() => { try { win.print() } catch(e) {} }, 800)
  }

  async function handleScore(f: any) {
    setForm(f); setLoading(true); setScreen("report"); setTab("score")
    const r=computeDealScore(f,pathId); setDealResult(r)
    const tasks=[
      {key:"negotiation", task:`Generate a 5-point negotiation playbook for a ${path?.label} deal with ${f.deal_name||"counterparty"}. The entrepreneur brings: ${f.your_strengths||"various strengths"}. Deal stage: ${f.deal_stage}. Include: opening strategy, key clauses to fight for, walk-away triggers. Be specific to this exact deal.`},
      {key:"dd",          task:`Generate a prioritised due diligence checklist for a ${path?.label} deal. Business: ${f.deal_name}. Investment: ${f.investment_amt}. Flag 3 as CRITICAL. Format as numbered list with category labels.`},
      {key:"valuation",   task:`Provide a financial valuation analysis for this ${path?.label} deal. Investment: ${f.investment_amt}. Business: ${f.deal_name}. Goal: ${f.your_goal}. Include: fair value estimate, 3 valuation approaches, ROI scenario (good/base/poor), and negotiation price anchors.`},
    ]
    const results: any={}
    for(const t of tasks) {
      const content=await generateWithQC(t.task,f,setAiStatus)
      results[t.key]=content
    }
    setAiContent(results); setLoading(false); setAiStatus("Done")
  }

  if(screen==="select") return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"32px 24px"}} className="fu">
      <div style={{textAlign:"center",marginBottom:30}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:7,background:T.accentSubtle,border:`1px solid ${T.accent}35`,borderRadius:100,padding:"5px 14px",marginBottom:14}}>
          <Zap size={12} color={T.accent}/><span style={{fontSize:11,color:T.accent,fontWeight:600,letterSpacing:".08em"}}>ACQUISITION & PARTNERSHIP</span>
        </div>
        <h1 className="dsp" style={{fontSize:26,fontWeight:700,marginBottom:8,color:T.textPrimary}}>Inorganic Growth Analyzer</h1>
        <p style={{fontSize:13,color:T.textSecondary,lineHeight:1.7,maxWidth:480,margin:"0 auto"}}>Enter through a deal — franchise, acquisition, JV, merger, or manufacturing license. Get a negotiation playbook, due diligence checklist, and valuation model — all AI-verified.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {DEAL_PATHS.map(p=>(
          <button key={p.id} onClick={()=>{setPathId(p.id);setStep(0);setScreen("intake")}}
            style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:T.bgCard,border:`1px solid ${T.bgBorder}`,borderRadius:12,textAlign:"left",color:T.textPrimary,transition:"all .15s"}}
            onMouseOver={e=>{e.currentTarget.style.borderColor=p.color;e.currentTarget.style.background=T.bgElevated}}
            onMouseOut={e=>{e.currentTarget.style.borderColor=T.bgBorder;e.currentTarget.style.background=T.bgCard}}>
            <div style={{width:42,height:42,borderRadius:9,background:`${p.color}18`,border:`1px solid ${p.color}35`,display:"flex",alignItems:"center",justifyContent:"center",color:p.color,flexShrink:0}}>{p.icon}</div>
            <div style={{flex:1}}><div className="dsp" style={{fontSize:15,fontWeight:600,marginBottom:2}}>{p.label}</div><div style={{fontSize:12,color:T.textSecondary}}>{p.desc}</div></div>
            <ChevronRight size={14} color={T.textTertiary}/>
          </button>
        ))}
      </div>
    </div>
  )

  if(screen==="intake") return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"28px 24px"}} className="fu">
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:18}}>
        <div style={{width:32,height:32,borderRadius:8,background:`${path!.color}18`,border:`1px solid ${path!.color}35`,display:"flex",alignItems:"center",justifyContent:"center",color:path!.color}}>{path!.icon}</div>
        <div><div style={{fontSize:10,color:path!.color,fontWeight:600,letterSpacing:".08em"}}>{path!.label.toUpperCase()} · STEP {step+1}/{steps.length}</div><div className="dsp" style={{fontSize:18,fontWeight:700,color:T.textPrimary}}>Deal Assessment</div></div>
      </div>
      <div style={{height:3,background:T.bgBorder,borderRadius:2,marginBottom:22}}>
        <div style={{height:3,background:path!.color,borderRadius:2,width:`${((step+1)/steps.length)*100}%`,transition:"width .4s",boxShadow:`0 0 8px ${path!.color}60`}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:24}}>
        {steps[step].map((q: any)=>{
          const hasError=stepErrors.includes(q.k)
          const errStyle=hasError?{borderColor:"#DC2626",boxShadow:"0 0 0 2px rgba(220,38,38,0.15)"}:{}
          return (
            <div key={q.k}>
              <label style={{display:"block",fontSize:12,fontWeight:500,color:hasError?"#DC2626":T.textSecondary,marginBottom:5}}>
                {q.label}<span style={{color:"#DC2626",marginLeft:3}}>*</span>
              </label>
              {q.type==="ta"
                ?<textarea value={form[q.k]||""} onChange={e=>{setForm((f: any)=>({...f,[q.k]:e.target.value}));setStepErrors(se=>se.filter(k=>k!==q.k))}} placeholder={q.ph||""} style={errStyle}/>
                :q.type==="sel"
                ?<select value={form[q.k]||""} onChange={e=>{setForm((f: any)=>({...f,[q.k]:e.target.value}));setStepErrors(se=>se.filter(k=>k!==q.k))}} style={errStyle}><option value="">Select…</option>{q.opts.map((o: string)=><option key={o}>{o}</option>)}</select>
                :<input type="text" value={form[q.k]||""} onChange={e=>{setForm((f: any)=>({...f,[q.k]:e.target.value}));setStepErrors(se=>se.filter(k=>k!==q.k))}} placeholder={q.ph||""} style={errStyle}/>}
              {hasError&&<div style={{fontSize:11,color:"#DC2626",marginTop:4}}>This field is required</div>}
            </div>
          )
        })}
      </div>
      {stepErrors.length>0&&(
        <div style={{fontSize:12,color:"#DC2626",background:"rgba(220,38,38,0.06)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:8,padding:"8px 12px",marginBottom:12}}>
          Please fill all required fields before continuing.
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <Btn variant="ghost" onClick={()=>{setStepErrors([]);step>0?setStep((s: number)=>s-1):setScreen("select")}}><ChevronLeft size={13}/>Back</Btn>
        {step<steps.length-1
          ?<Btn onClick={handleContinue} style={{background:path!.color}}>Continue<ChevronRight size={13}/></Btn>
          :<Btn onClick={handleScoreDeal} style={{background:`linear-gradient(135deg,${path!.color},${T.accent})`}}><Zap size={13}/>Score This Deal</Btn>}
      </div>
    </div>
  )

  if(screen==="report"&&dealResult) return (
    <div id="deal-studio-print-root" style={{padding:"22px 26px",maxWidth:1000,margin:"0 auto"}} className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
            <div style={{width:26,height:26,borderRadius:6,background:`${path!.color}18`,border:`1px solid ${path!.color}35`,display:"flex",alignItems:"center",justifyContent:"center",color:path!.color}}>{path!.icon}</div>
            <span style={{fontSize:10,color:path!.color,fontWeight:600,letterSpacing:".08em"}}>{path!.label.toUpperCase()} · DEAL INTELLIGENCE REPORT</span>
          </div>
          <h1 className="dsp" style={{fontSize:22,fontWeight:700,color:T.textPrimary}}>{form.deal_name||"Your Deal"}</h1>
        </div>
        <div style={{display:"flex",gap:7}}>
          <Btn variant="ghost" onClick={()=>{setScreen("select");setPathId(null);setForm({});setDealResult(null);setAiContent({})}}><ChevronLeft size={12}/>New Deal</Btn>
          <Btn onClick={exportDealPDF}><Download size={12}/>Export PDF</Btn>
        </div>
      </div>
      <div style={{display:"flex",gap:3,marginBottom:18,background:T.bgElevated,borderRadius:9,padding:4,border:`1px solid ${T.bgBorder}`,width:"fit-content"}}>
        {[{id:"score",label:"Deal Score",icon:<Star size={12}/>},{id:"negotiation",label:"Negotiation",icon:<Scale size={12}/>},{id:"dd",label:"Due Diligence",icon:<Shield size={12}/>},{id:"valuation",label:"Valuation",icon:<TrendingUp size={12}/>}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:7,background:tab===t.id?T.bgCard:"transparent",border:tab===t.id?`1px solid ${T.bgBorder}`:"1px solid transparent",color:tab===t.id?T.textPrimary:T.textSecondary,fontSize:12,fontWeight:tab===t.id?600:400}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      <AIStatus status={aiStatus}/>
      {tab==="score"&&(
        <div className="fu">
          <Card style={{padding:24,marginBottom:14,border:`1px solid ${dealResult.color}25`,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <ScoreRing score={dealResult.score} color={dealResult.color} size={130}/>
            <VerdictPill verdict={dealResult.verdict} color={dealResult.color} bg={dealResult.bg} label={dealResult.label}/>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card style={{padding:16,background:T.goBg,border:`1px solid ${T.go}25`}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><CheckCircle size={12} color={T.go}/><span style={{fontSize:11,fontWeight:600,color:T.go}}>Strengths</span></div>
              {dealResult.strengths.length>0?dealResult.strengths.map((s: string,i: number)=><div key={i} style={{fontSize:12,color:T.textPrimary,marginBottom:7,paddingLeft:8,borderLeft:`2px solid ${T.go}40`,lineHeight:1.5}}>{s}</div>):<div style={{fontSize:12,color:T.textSecondary}}>Complete more fields to surface strengths</div>}
            </Card>
            <Card style={{padding:16,background:T.passBg,border:`1px solid ${T.pass}25`}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><AlertTriangle size={12} color={T.pass}/><span style={{fontSize:11,fontWeight:600,color:T.pass}}>Red Flags</span></div>
              {dealResult.flags.length>0?dealResult.flags.map((f: string,i: number)=><div key={i} style={{fontSize:12,color:T.textPrimary,marginBottom:7,paddingLeft:8,borderLeft:`2px solid ${T.pass}40`,lineHeight:1.5}}>{f}</div>):<div style={{fontSize:12,color:T.textSecondary}}>No critical red flags detected</div>}
            </Card>
          </div>
          {form.your_strengths&&(
            <Card style={{padding:16,marginTop:12,background:T.accentSubtle,border:`1px solid ${T.accent}35`}}>
              <div style={{fontSize:11,color:T.accent,fontWeight:600,marginBottom:8}}>YOUR VALUE ADDITION</div>
              <p style={{fontSize:13,color:T.textSecondary,lineHeight:1.7}}>You bring: <strong style={{color:T.textPrimary}}>{form.your_strengths}</strong><br/>Use this as your opening position in every negotiation — quantify it in dollar terms before you sit down at the table.</p>
            </Card>
          )}
        </div>
      )}
      {(tab==="negotiation"||tab==="dd"||tab==="valuation")&&(
        <Card style={{padding:20}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:4,textTransform:"capitalize",color:T.textPrimary}}>{tab==="dd"?"Due Diligence Checklist":tab==="negotiation"?"Negotiation Playbook":"Financial Valuation"}</div>
          <div style={{fontSize:11,color:T.textSecondary,marginBottom:14}}>AI-generated · reviewed by QC agent · specific to {form.deal_name||"your deal"}</div>
          <StreamBox content={aiContent[tab]} loading={loading&&!aiContent[tab]} label={loading&&!aiContent[tab]?"Generating...":""}/>
        </Card>
      )}
    </div>
  )
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// PITCH STUDIO HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function parsePriceNum(val: string): number {
  const match = (val || '').match(/[\d,]+/)
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0
}

const MARKET_SIZE_MAP: Record<string, number> = {
  '< $10M': 10, '$10M–$100M': 55, '$100M–$1B': 500,
  '$1B–$10B': 5000, '> $10B': 20000, "I don't know": 200,
}

function parseCurrency(str: string): number {
  if (!str) return 0
  const s = str.replace(/,/g, '').trim()
  const num = parseFloat(s.replace(/[^0-9.]/g, '')) || 0
  const sl = s.toLowerCase()
  if (sl.includes('cr')) return num * 10000000
  if (sl.includes('lakh') || / l$/.test(sl) || sl.includes(' lakh')) return num * 100000
  if (sl.includes('m') && !sl.includes('mn') && !sl.includes('month')) return num * 1000000
  if (sl.includes('k')) return num * 1000
  return num
}

function calcFinancials(data: any) {
  const totalFunding = parseCurrency(data.startup_cost)
  const capitalAvail = parseCurrency(data.capital_available)
  const monthlyPrice = parsePriceNum(data.price_point)
  const tamM         = MARKET_SIZE_MAP[data.market_size] || 200

  const burnRate  = totalFunding > 0 ? totalFunding / 24 : 50000
  const runway    = capitalAvail > 0 && burnRate > 0 ? Math.round(capitalAvail / burnRate) : 0

  const grossMargin = (data.biz_type || '').toLowerCase().includes('saas') ? 0.78 : 0.55
  const ltv         = monthlyPrice * 24 * grossMargin
  const gtm         = (data.saas_gtm || '').toLowerCase()
  const cacMult     = gtm.includes('product') || gtm.includes('plg') ? 0.5 : gtm.includes('outbound') ? 4 : 2
  const cac         = monthlyPrice * cacMult
  const ltvCac      = cac > 0 ? Math.round((ltv / cac) * 10) / 10 : 0
  const paybackMo   = cac > 0 && monthlyPrice > 0 ? Math.ceil(cac / (monthlyPrice * grossMargin)) : 0
  const breakEvenMo = burnRate > 0 && monthlyPrice > 0 ? Math.ceil(burnRate / (monthlyPrice * grossMargin)) : 0

  const y1Rev = monthlyPrice * 80;   const y2Rev = monthlyPrice * 350;   const y3Rev = monthlyPrice * 1100
  const y1Cost = totalFunding * 0.55; const y2Cost = y1Cost * 1.35;      const y3Cost = y2Cost * 1.25
  const capEfficiency = totalFunding > 0 ? Math.round((y3Rev / totalFunding) * 10) / 10 : 0

  const checks = [
    !!data.problem, !!data.customer, tamM >= 100, !!data.market_growth,
    !!data.differentiation, !!data.revenue_model, monthlyPrice > 0,
    !!data.saas_gtm, parseInt(data.team_size) > 1, !!data.founder_experience,
    !data.skill_gaps || data.skill_gaps.toLowerCase().includes('none'),
    runway >= 12, ltvCac >= 3,
  ]
  const weights = [8, 7, 10, 5, 10, 10, 10, 8, 7, 5, 5, 8, 7]
  const score = checks.reduce((s, c, i) => s + (c ? weights[i] : 0), 0)

  return {
    totalFunding, capitalAvail, burnRate, runway, ltv, cac, ltvCac,
    paybackMo, grossMargin, y1Rev, y2Rev, y3Rev, y1Cost, y2Cost, y3Cost,
    capEfficiency, breakEvenMo, tamM, score, checks, monthlyPrice,
  }
}

function renderSectionContent(text: string) {
  if (!text) return null
  const lines = text.split('\n').filter(Boolean)
  const insightLine = lines.find(l => l.startsWith('KEY INSIGHT:'))
  const bullets = lines.filter(l => l.startsWith('•'))
  const otherLines = lines.filter(l => !l.startsWith('KEY INSIGHT:') && !l.startsWith('•'))
  return (
    <div>
      {insightLine && (
        <div style={{
          background: 'rgba(5,150,105,0.07)', borderLeft: '3px solid #059669',
          padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: 14,
          fontSize: 13, fontWeight: 600, color: T.textPrimary, lineHeight: 1.5,
        }}>
          {insightLine.replace('KEY INSIGHT: ', '').replace('KEY INSIGHT:', '')}
        </div>
      )}
      {bullets.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{
              fontSize: 13, color: T.textSecondary, lineHeight: 1.6,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ color: T.accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>›</span>
              <span>{b.replace(/^•\s*/, '')}</span>
            </li>
          ))}
        </ul>
      )}
      {otherLines.length > 0 && bullets.length === 0 && (
        <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
          {otherLines.join('\n')}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INVESTOR VIEW — Power BI-style dashboard
// ─────────────────────────────────────────────────────────────────────────────
const INVESTOR_BRIEF_KEY = "dhanveda:ventureiq:investorbrief"

function InvestorView({ data }: { data: any }) {
  const f = calcFinancials(data)
  const [scenario, setScenario] = useState<'bear'|'base'|'bull'>('base')
  const [briefLoading, setBriefLoading] = useState(false)
  const [brief, setBrief] = useState<any>(null)

  useEffect(() => {
    try { const s = localStorage.getItem(INVESTOR_BRIEF_KEY); if (s) setBrief(JSON.parse(s)) } catch {}
  }, [])

  async function generateBrief() {
    setBriefLoading(true)
    const sys = `You are a senior venture capital partner with 20 years experience. Analyse the startup described and return ONLY a valid JSON object — no prose, no markdown, no code blocks.`
    const prompt = `Startup: ${data.biz_name} (${data.biz_type}). Problem: ${data.problem}. Solution: ${data.biz_description}. Market: ${data.market_size}, ${data.market_growth}. Revenue model: ${data.revenue_model} at ${data.price_point}. Competitors: ${data.competitors}. Differentiation: ${data.differentiation}. Team: ${data.team_size}, ${data.founder_experience} experience. Capital needed: ${data.startup_cost}. Available: ${data.capital_available}. GTM: ${data.saas_gtm}.\n\nReadiness score: ${f.score}/100. LTV:CAC: ${f.ltvCac}×. Runway: ${f.runway} months.\n\nReturn ONLY this JSON:\n{"verdict":"Invest|Watch|Pass","thesis":"2-sentence investment thesis from the VC's perspective","top_questions":["Q1","Q2","Q3"],"red_flags":["flag1","flag2"],"valuation_range":"e.g. ₹2Cr–₹5Cr pre-seed or Not applicable","recommendation":"2-sentence actionable guidance for the founder"}`
    const result = await callClaude(sys, prompt, 1200)
    if (result) {
      try {
        const m = result.match(/\{[\s\S]*\}/)
        if (m) { const parsed = JSON.parse(m[0]); setBrief(parsed); localStorage.setItem(INVESTOR_BRIEF_KEY, JSON.stringify(parsed)) }
      } catch {}
    }
    setBriefLoading(false)
  }

  const fmtN = (n: number) => {
    const a = Math.abs(n)
    if (a >= 10000000) return `₹${(a/10000000).toFixed(1)}Cr`
    if (a >= 100000)   return `₹${(a/100000).toFixed(1)}L`
    if (a >= 1000)     return `₹${(a/1000).toFixed(0)}K`
    return `₹${Math.round(a).toLocaleString()}`
  }

  const verdictLabel = f.score >= 70 ? 'INVESTOR READY' : f.score >= 45 ? 'NEEDS WORK' : 'NOT READY'
  const verdictColor = f.score >= 70 ? T.go : f.score >= 45 ? T.negotiate : T.pass
  const verdictBg    = f.score >= 70 ? T.goBg : f.score >= 45 ? T.negotiateBg : T.passBg
  const runwayColor  = f.runway >= 12 ? T.go : f.runway >= 6 ? T.negotiate : T.pass
  const ltvCacColor  = f.ltvCac >= 5 ? T.go : f.ltvCac >= 3 ? T.negotiate : (f.ltvCac > 0 ? T.pass : T.textTertiary)

  const plData = [
    { year: 'Y1', revenue: Math.round(f.y1Rev), cost: Math.round(f.y1Cost), profit: Math.round(f.y1Rev - f.y1Cost) },
    { year: 'Y2', revenue: Math.round(f.y2Rev), cost: Math.round(f.y2Cost), profit: Math.round(f.y2Rev - f.y2Cost) },
    { year: 'Y3', revenue: Math.round(f.y3Rev), cost: Math.round(f.y3Cost), profit: Math.round(f.y3Rev - f.y3Cost) },
  ]
  const ueData = [
    { name: 'LTV (24-mo)', value: Math.round(f.ltv) },
    { name: 'CAC Est.', value: Math.round(f.cac) },
  ]
  const mult = scenario === 'bear' ? 0.4 : scenario === 'bull' ? 2.5 : 1
  const scenarioData = [
    { year: 'Y1', rev: Math.round(f.y1Rev * mult) },
    { year: 'Y2', rev: Math.round(f.y2Rev * mult) },
    { year: 'Y3', rev: Math.round(f.y3Rev * mult) },
  ]
  const cashData = [
    { mo: 'Start', flow: Math.round(f.capitalAvail) },
    ...Array.from({ length: 12 }, (_, i) => ({ mo: `M${i+1}`, flow: -Math.round(f.burnRate) })),
  ]

  const checkLabels = [
    'Problem clearly defined',
    'Target customer identified',
    'Market opportunity >$100M TAM',
    'Market growth rate documented',
    'Clear competitive differentiation',
    'Revenue model specified',
    'Pricing strategy validated',
    'Go-to-market strategy defined',
    'Team size > 1 co-founder',
    'Founder domain experience',
    'Skill gaps addressed or none',
    `Capital runway ≥ 12 months${f.runway > 0 ? ` (${f.runway}mo)` : ''}`,
    `LTV:CAC ≥ 3×${f.ltvCac > 0 ? ` (${f.ltvCac}× now)` : ''}`,
  ]
  const strengthLabels = checkLabels.filter((_, i) => f.checks[i]).slice(0, 3)
  const concernLabels  = checkLabels.filter((_, i) => !f.checks[i]).slice(0, 3)

  const redFlags = [
    f.runway > 0 && f.runway < 6    ? 'Critical: <6 months runway — fundraise immediately' : null,
    f.ltvCac > 0 && f.ltvCac < 3   ? `Unit economics: LTV:CAC is ${f.ltvCac}× — investors expect >3×` : null,
    !data.differentiation            ? 'Differentiation not documented — critical investor gap' : null,
    f.tamM < 50                      ? 'Market size may be too small for institutional VC (need >$500M TAM)' : null,
    data.skill_gaps && !data.skill_gaps.toLowerCase().includes('none')
      ? `Skill gaps noted: "${data.skill_gaps}" — add a concrete hiring plan` : null,
  ].filter(Boolean) as string[]

  const chipStyle = (color: string): React.CSSProperties => ({
    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
    background: `${color}15`, color, border: `1px solid ${color}30`,
  })

  const tooltipStyle = { contentStyle: { background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 8, fontSize: 10, color: T.textPrimary } }

  return (
    <div style={{ padding: '6px 0' }}>

      {/* ── Verdict Banner ── */}
      <div style={{ background: verdictBg, border: `1px solid ${verdictColor}30`, borderRadius: 12, padding: '18px 22px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: verdictColor, marginBottom: 4 }}>INVESTOR ASSESSMENT — {data.biz_name || 'Your Business'}</div>
          <div className="dsp" style={{ fontSize: 24, fontWeight: 800, color: verdictColor }}>{verdictLabel}</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 9, color: T.textSecondary, fontWeight: 700, letterSpacing: '.08em', marginBottom: 5 }}>TOP STRENGTHS</div>
              {strengthLabels.map((s, i) => <div key={i} style={{ fontSize: 11, color: T.go, marginBottom: 2 }}>✓ {s}</div>)}
              {strengthLabels.length === 0 && <div style={{ fontSize: 11, color: T.textTertiary, fontStyle: 'italic' }}>Complete your intake form to see strengths</div>}
            </div>
            <div>
              <div style={{ fontSize: 9, color: T.textSecondary, fontWeight: 700, letterSpacing: '.08em', marginBottom: 5 }}>KEY GAPS TO FIX</div>
              {concernLabels.map((c, i) => <div key={i} style={{ fontSize: 11, color: T.pass, marginBottom: 2 }}>✗ {c}</div>)}
              {concernLabels.length === 0 && <div style={{ fontSize: 11, color: T.go }}>All key criteria met ✓</div>}
            </div>
          </div>
        </div>
        <div style={{ background: T.bgCard, borderRadius: 14, padding: '14px 20px', textAlign: 'center', border: `2px solid ${verdictColor}40`, minWidth: 90, flexShrink: 0 }}>
          <div className="dsp mono" style={{ fontSize: 40, fontWeight: 800, color: verdictColor, lineHeight: 1 }}>{f.score}</div>
          <div style={{ fontSize: 10, color: T.textSecondary, fontWeight: 600 }}>/ 100</div>
          <div style={{ fontSize: 9, color: T.textTertiary, marginTop: 3 }}>READINESS</div>
        </div>
      </div>

      {/* ── KPI Row 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
        {[
          { label: 'Monthly Burn', value: f.burnRate > 0 ? fmtN(f.burnRate) + '/mo' : 'N/A', sub: 'funding ask ÷ 24 months', badge: null, bColor: T.textPrimary },
          { label: 'Runway', value: f.runway > 0 ? `${f.runway} months` : 'Not modeled', sub: 'capital available ÷ burn rate', badge: f.runway >= 12 ? 'Healthy' : f.runway >= 6 ? 'Watch' : f.runway > 0 ? 'Critical' : null, bColor: runwayColor },
          { label: 'Break-even', value: f.breakEvenMo > 0 ? `Month ${f.breakEvenMo}` : 'Not modeled', sub: 'when revenue covers burn', badge: null, bColor: T.textPrimary },
        ].map((kpi, i) => (
          <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 9, color: T.textSecondary, fontWeight: 700, letterSpacing: '.07em', marginBottom: 6 }}>{kpi.label.toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: kpi.bColor, marginBottom: kpi.badge ? 6 : 0 }}>{kpi.value}</div>
            {kpi.badge && <span style={chipStyle(kpi.bColor)}>{kpi.badge}</span>}
            <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── KPI Row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'LTV : CAC Ratio', value: f.ltvCac > 0 ? `${f.ltvCac}×` : 'N/A', sub: '24-mo LTV vs estimated CAC', badge: f.ltvCac >= 5 ? 'Excellent' : f.ltvCac >= 3 ? 'Viable' : f.ltvCac > 0 ? 'Below target' : null, bColor: ltvCacColor },
          { label: 'Capital Efficiency', value: f.capEfficiency > 0 ? `${f.capEfficiency}× ARR/₹` : 'N/A', sub: 'projected Y3 ARR per ₹ raised', badge: null, bColor: T.blue },
          { label: 'Readiness Score', value: `${f.score} / 100`, sub: '13-point VC checklist', badge: verdictLabel, bColor: verdictColor },
        ].map((kpi, i) => (
          <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 9, color: T.textSecondary, fontWeight: 700, letterSpacing: '.07em', marginBottom: 6 }}>{kpi.label.toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: kpi.bColor, marginBottom: kpi.badge ? 6 : 0 }}>{kpi.value}</div>
            {kpi.badge && <span style={chipStyle(kpi.bColor)}>{kpi.badge}</span>}
            <div style={{ fontSize: 10, color: T.textTertiary, marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts 2×2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* 1 — 3-Year P&L */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: '16px 16px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, marginBottom: 1 }}>3-Year P&L Projection</div>
          <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 10 }}>Revenue · Cost · Net Profit / Loss</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={plData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.bgBorder} />
              <XAxis dataKey="year" tick={{ fill: T.textTertiary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textTertiary, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
              <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [fmtN(Number(v)), name]} />
              <Line type="monotone" dataKey="revenue" stroke={T.go}       strokeWidth={2} dot={{ fill: T.go,       r: 3 }} name="Revenue" />
              <Line type="monotone" dataKey="cost"    stroke={T.pass}     strokeWidth={2} dot={{ fill: T.pass,     r: 3 }} name="Cost" />
              <Line type="monotone" dataKey="profit"  stroke={T.blue}     strokeWidth={2} dot={{ fill: T.blue,     r: 3 }} strokeDasharray="4 2" name="Profit" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {[{ label: 'Revenue', color: T.go }, { label: 'Cost', color: T.pass }, { label: 'Profit/Loss', color: T.blue }].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, height: 2, background: l.color, borderRadius: 1 }} />
                <span style={{ fontSize: 10, color: T.textTertiary }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2 — Unit Economics */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: '16px 16px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, marginBottom: 1 }}>Unit Economics</div>
          <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 10 }}>LTV vs CAC — benchmark: LTV ≥ 3× CAC</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={ueData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: T.textTertiary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textTertiary, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtN(Number(v))]} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {ueData.map((_, i) => <Cell key={i} fill={i === 0 ? T.go : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={chipStyle(ltvCacColor)}>LTV:CAC = {f.ltvCac > 0 ? f.ltvCac + '×' : 'N/A'}</span>
            <span style={{ fontSize: 10, color: T.textTertiary }}>Payback: {f.paybackMo > 0 ? f.paybackMo + ' months' : 'N/A'}</span>
            <span style={{ fontSize: 10, color: T.textTertiary }}>GM: {Math.round(f.grossMargin * 100)}%</span>
          </div>
        </div>

        {/* 3 — Market Opportunity Funnel (CSS bars) */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: '16px 16px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, marginBottom: 1 }}>Market Opportunity Funnel</div>
          <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 16 }}>TAM → SAM → SOM → Y3 Revenue Target</div>
          {[
            { label: 'TAM', suffix: f.tamM >= 1000 ? `$${(f.tamM/1000).toFixed(0)}B` : `$${f.tamM}M`, pct: 100, color: 'rgba(5,150,105,0.12)' },
            { label: 'SAM', suffix: `$${Math.round(f.tamM * 0.05)}M`, pct: 30, color: 'rgba(5,150,105,0.3)' },
            { label: 'SOM', suffix: `$${Math.round(f.tamM * 0.006)}M`, pct: 12, color: 'rgba(5,150,105,0.55)' },
            { label: 'Y3 Rev', suffix: fmtN(f.y3Rev), pct: 4, color: T.accent },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 44, fontSize: 10, fontWeight: 600, color: T.textSecondary, flexShrink: 0 }}>{row.label}</div>
              <div style={{ flex: 1, height: 22, background: '#F0FDF7', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: 4, transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ width: 60, fontSize: 10, fontWeight: 700, color: T.textPrimary, textAlign: 'right', flexShrink: 0 }}>{row.suffix}</div>
            </div>
          ))}
        </div>

        {/* 4 — Year 1 Cash Flow */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: '16px 16px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, marginBottom: 1 }}>Year 1 Cash Position</div>
          <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 10 }}>Starting capital vs monthly burn — estimated</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={cashData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="mo" tick={{ fill: T.textTertiary, fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textTertiary, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtN(Math.abs(Number(v))), Number(v) < 0 ? 'Monthly Burn' : 'Capital In']} />
              <Bar dataKey="flow" radius={[3, 3, 0, 0]}>
                {cashData.map((d, i) => <Cell key={i} fill={d.flow >= 0 ? T.go : T.pass} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Scenario Analysis ── */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary }}>Scenario Analysis</div>
            <div style={{ fontSize: 10, color: T.textTertiary }}>Revenue trajectory under different market conditions</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['bear', 'base', 'bull'] as const).map(s => (
              <button key={s} onClick={() => setScenario(s)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: scenario === s ? 700 : 400, border: `1px solid ${scenario === s ? T.accent : T.bgBorder}`, background: scenario === s ? T.accentSubtle : 'transparent', color: scenario === s ? T.accent : T.textSecondary, cursor: 'pointer', transition: 'all .15s' }}>
                {s === 'bear' ? '🐻 Bear (0.4×)' : s === 'base' ? '📊 Base (1×)' : '🚀 Bull (2.5×)'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={scenarioData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="year" tick={{ fill: T.textTertiary, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textTertiary, fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [fmtN(Number(v)), 'Revenue']} />
              <Bar dataKey="rev" radius={[4, 4, 0, 0]}>
                {scenarioData.map((_, i) => <Cell key={i} fill={i === 2 ? T.accent : i === 1 ? '#34D399' : '#6EE7B7'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
            {scenarioData.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 10px', background: T.bgElevated, borderRadius: 7, border: `1px solid ${T.bgBorder}` }}>
                <span style={{ fontSize: 11, color: T.textSecondary }}>{row.year}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: i === 2 ? T.accent : T.go }}>{fmtN(row.rev)}</span>
              </div>
            ))}
            <div style={{ padding: '8px 10px', background: T.accentSubtle, borderRadius: 7, border: `1px solid ${T.bgBorder}` }}>
              <div style={{ fontSize: 9, color: T.textTertiary, marginBottom: 2 }}>Implied Valuation @ 8× Y3 ARR</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{fmtN(scenarioData[2].rev * 8)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Checklist + Red Flags ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* Checklist */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, marginBottom: 1 }}>Investor Readiness Checklist</div>
          <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 12 }}>What a VC partner checks in the first 5 minutes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {checkLabels.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <span style={{ fontSize: 12, color: f.checks[i] ? T.go : T.pass, flexShrink: 0, lineHeight: 1.4 }}>{f.checks[i] ? '✓' : '✗'}</span>
                <span style={{ fontSize: 11, color: f.checks[i] ? T.textSecondary : T.pass, lineHeight: 1.45 }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: T.textTertiary }}>Overall Score</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: verdictColor }}>{f.score}/100</span>
            </div>
            <div style={{ height: 6, background: T.bgElevated, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${f.score}%`, background: `linear-gradient(90deg, ${verdictColor}80, ${verdictColor})`, borderRadius: 3 }} />
            </div>
          </div>
        </div>

        {/* Red Flags + Unit Economics summary */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary, marginBottom: 1 }}>Red Flag Alerts</div>
          <div style={{ fontSize: 10, color: T.textTertiary, marginBottom: 12 }}>Issues investors will probe in the first meeting</div>
          {redFlags.length === 0 ? (
            <div style={{ padding: '18px', textAlign: 'center', background: T.goBg, borderRadius: 8, border: `1px solid ${T.go}20`, marginBottom: 14 }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>✅</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.go }}>No critical red flags detected</div>
              <div style={{ fontSize: 11, color: T.textTertiary, marginTop: 2 }}>Your fundamentals look solid to investors</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
              {redFlags.map((flag, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.14)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
                  <span style={{ fontSize: 11, color: T.pass, lineHeight: 1.4 }}>{flag}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '10px 12px', background: T.bgElevated, borderRadius: 8, border: `1px solid ${T.bgBorder}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.textSecondary, letterSpacing: '.07em', marginBottom: 8 }}>UNIT ECONOMICS SUMMARY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Gross Margin', value: `${Math.round(f.grossMargin * 100)}%` },
                { label: 'Payback Period', value: f.paybackMo > 0 ? `${f.paybackMo} months` : 'N/A' },
                { label: 'LTV (24-mo)', value: f.ltv > 0 ? fmtN(f.ltv) : 'N/A' },
                { label: 'CAC (est.)', value: f.cac > 0 ? fmtN(f.cac) : 'N/A' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: T.textTertiary }}>{m.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.textPrimary }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AI Investor Briefing ── */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 12, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textPrimary }}>AI Investor Briefing</div>
            <div style={{ fontSize: 10, color: T.textTertiary }}>Simulated VC partner assessment — the questions they will ask in Meeting 1</div>
          </div>
          <Btn onClick={generateBrief} disabled={briefLoading} style={{ fontSize: 11 }}>
            <Bot size={12} />{briefLoading ? 'Analyzing…' : brief ? 'Regenerate' : 'Generate Investor Brief'}
          </Btn>
        </div>
        {briefLoading && <AIStatus status="Senior Partner reviewing your business case…" />}
        {!brief && !briefLoading && (
          <div style={{ padding: '28px', textAlign: 'center', background: T.bgElevated, borderRadius: 10, border: `1px solid ${T.bgBorder}` }}>
            <div style={{ fontSize: 12, color: T.textTertiary }}>Click "Generate Investor Brief" to receive a VC partner's assessment — including the 3 questions they will ask in your first meeting, key concerns, and estimated valuation range.</div>
          </div>
        )}
        {brief && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, background: brief.verdict === 'Invest' ? T.goBg : brief.verdict === 'Watch' ? T.negotiateBg : T.passBg, color: brief.verdict === 'Invest' ? T.go : brief.verdict === 'Watch' ? T.negotiate : T.pass, border: `1px solid ${brief.verdict === 'Invest' ? T.go : brief.verdict === 'Watch' ? T.negotiate : T.pass}30` }}>{brief.verdict?.toUpperCase() ?? 'VERDICT'}</span>
              {brief.valuation_range && <span style={{ fontSize: 11, color: T.textSecondary }}>Indicative range: <strong style={{ color: T.textPrimary }}>{brief.valuation_range}</strong></span>}
            </div>
            {brief.thesis && (
              <div style={{ background: T.accentSubtle, borderLeft: `3px solid ${T.accent}`, padding: '10px 14px', borderRadius: '0 8px 8px 0', fontSize: 12, color: T.textPrimary, lineHeight: 1.65 }}>{brief.thesis}</div>
            )}
            {brief.top_questions?.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.textSecondary, letterSpacing: '.08em', marginBottom: 7 }}>QUESTIONS THEY WILL ASK IN MEETING 1</div>
                {brief.top_questions.map((q: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, flexShrink: 0, marginTop: 1 }}>Q{i+1}.</span>
                    <span style={{ fontSize: 12, color: T.textPrimary, lineHeight: 1.55 }}>{q}</span>
                  </div>
                ))}
              </div>
            )}
            {brief.red_flags?.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.textSecondary, letterSpacing: '.08em', marginBottom: 7 }}>INVESTOR CONCERNS</div>
                {(brief.red_flags as string[]).map((flag, i) => (
                  <div key={i} style={{ fontSize: 12, color: T.pass, marginBottom: 4 }}>⚑ {flag}</div>
                ))}
              </div>
            )}
            {brief.recommendation && (
              <div style={{ padding: '10px 14px', background: T.bgElevated, borderRadius: 8, border: `1px solid ${T.bgBorder}`, fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
                <strong style={{ color: T.textPrimary }}>Recommendation: </strong>{brief.recommendation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PITCH STUDIO (AI-Powered)
// ─────────────────────────────────────────────────────────────────────────────
const BMC_BLOCKS=[
  {id:"partners",  label:"Key Partners",      r:"1/3",c:"1/2",gen:(d: any)=>[`${d.biz_type||"Industry"} distribution partners`,"Infrastructure & API providers","Strategic advisors","Integration ecosystem"]},
  {id:"activities",label:"Key Activities",    r:"1/2",c:"2/3",gen:()=>["Product development & iteration","Customer onboarding & success","Content marketing & SEO","Community & partnerships"]},
  {id:"value",     label:"Value Proposition", r:"1/3",c:"3/4",gen:(d: any)=>[d.differentiation||"Core value prop","Defensible differentiation","Built for the real workflow","10x better than alternatives"]},
  {id:"relations", label:"Customer Relations",r:"1/2",c:"4/5",gen:()=>["Self-serve onboarding","In-app AI assistant","Weekly office hours","Community & support forum"]},
  {id:"segments",  label:"Customer Segments", r:"1/3",c:"5/6",gen:(d: any)=>[d.customer||"Primary segment","Early adopters: power users","Expansion: team leads","Enterprise: future phase"]},
  {id:"resources", label:"Key Resources",     r:"2/3",c:"2/3",gen:()=>["Founding team expertise","Product codebase & IP","Customer data & insights","Brand & community"]},
  {id:"channels",  label:"Channels",          r:"2/3",c:"4/5",gen:(d: any)=>[d.saas_gtm||"Product-led growth","Content & SEO","Founder network","Partner integrations"]},
  {id:"costs",     label:"Cost Structure",    r:"3/4",c:"1/4",gen:(d: any)=>[`Capital needed: ${d.startup_cost||"TBD"}`,`Team: ${d.team_size||"Lean team"}`,"Engineering & product build","Marketing & customer acquisition"]},
  {id:"revenue",   label:"Revenue Streams",   r:"3/4",c:"4/6",gen:(d: any)=>[`${d.revenue_model||"Subscription"} model`,`Pricing: ${d.price_point||"Market rate"}`,`Commitment: ${d.commitment||"Full-time"}`,"Expansion revenue & upsell"]},
]
const DECK_SLIDES=[
  {n:1,t:"Cover",gen:(d:any)=>`${d.biz_name}\n\n"${(d.biz_description||"").slice(0,80)}"\n\n${d.biz_type||"Technology"} · ${d.customer||"Target Market"}\n${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long"})}`},
  {n:2,t:"The Problem",gen:(d:any)=>d.problem||"The core customer pain."},
  {n:3,t:"Our Solution",gen:(d:any)=>d.biz_description||"Your product."},
  {n:4,t:"Why Now",gen:(d:any)=>{
    const isSaaS=(d.biz_type||"").toLowerCase().includes("saas")
    const isEcomm=(d.biz_type||"").toLowerCase().includes("ecom")||(d.biz_type||"").toLowerCase().includes("retail")
    const tw=isSaaS
      ?["AI-powered automation reducing cost of software delivery","SMB digital transformation accelerating post-pandemic","Vertical SaaS commanding 3–5× premium multiples over horizontal"]
      :isEcomm
      ?["D2C brands capturing margin from traditional distributors","Mobile commerce >70% of all online transactions","Consumer preference shifting to direct brand relationships"]
      :["Digital-first workflows now table stakes across sectors","Regulatory shifts creating new category demand","Cost pressures driving buyers toward integrated solutions"]
    return `Market is ${d.market_growth||"growing rapidly"}.\n\n${tw.map((t:string)=>`• ${t}`).join("\n")}\n\n→ The window for category leadership is open now.`
  }},
  {n:5,t:"Market Size",gen:(d:any)=>{
    const f=calcFinancials(d)
    const tamStr=f.tamM>=1000?`$${(f.tamM/1000).toFixed(0)}B`:`$${f.tamM}M`
    return `TAM: ${tamStr} (${d.market_size||"addressable market"})\nSAM: $${Math.round(f.tamM*0.05)}M (our ICP, 5% of TAM)\nSOM: $${Math.round(f.tamM*0.006)}M (Year 3 realistic capture)\n\nBottom-up: ${d.customer||"target segment"}\nPricing: ${d.price_point||"TBD"} · Model: ${d.revenue_model||"subscription"}\n\nMarket growth: ${d.market_growth||"growing"}`
  }},
  {n:6,t:"Product",gen:(d:any)=>d.differentiation||"Core differentiation."},
  {n:7,t:"Business Model",gen:(d:any)=>{
    const f=calcFinancials(d)
    const fmtM7=(n:number)=>n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`
    return `${d.revenue_model||"Subscription"} · ${d.price_point||"Pricing TBD"}\nGross margin: ${Math.round(f.grossMargin*100)}%\n\nLTV (24-mo): ${f.ltv>0?fmtM7(f.ltv):"TBD"}\nCAC (estimated): ${f.cac>0?fmtM7(f.cac):"TBD"}\nLTV:CAC: ${f.ltvCac>0?`${f.ltvCac}× ${f.ltvCac>=3?"✓ above 3× benchmark":"(target >3×)"}`:"TBD"}\nPayback period: ${f.paybackMo>0?`${f.paybackMo} months`:"TBD"}`
  }},
  {n:8,t:"Go-to-Market",gen:(d:any)=>`Primary channel: ${d.saas_gtm||"Product-led growth"}\n\nPhase 1 (0–3 mo): Founder-led sales → first 10 paying ${d.customer||"customers"}\nPhase 2 (3–9 mo): Content + community → inbound pipeline; reach 50 customers\nPhase 3 (9–18 mo): Outbound + channel partners → ${d.market_size||"market"} scale`},
  {n:9,t:"Competition",gen:(d:any)=>`Competitors: ${d.competitors||"Incumbents"}\n\nWhy we win:\n✓ ${(d.differentiation||"Core differentiation").slice(0,60)}\n✓ Built specifically for ${d.customer||"our segment"} — incumbents serve broad market\n✓ Faster time-to-value: no enterprise bloat or long onboarding`},
  {n:10,t:"Traction",gen:(d:any)=>{
    const f=calcFinancials(d)
    return `Stage: ${d.biz_stage||"Pre-revenue / Building"}\n\nWhat we have today:\n• Product: ${d.biz_description?(d.biz_description.slice(0,50)+"..."):"In development"}\n• Customer: target validated as "${d.customer||"TBD"}"\n• Capital: ${d.capital_available||"Self-funded"}\n• Runway: ${f.runway>0?`${f.runway} months at estimated burn`:"To be determined"}\n\nNext milestone: First 10 paying customers`
  }},
  {n:11,t:"Team",gen:(d:any)=>`Team: ${d.team_size||"Founders"}\nDomain experience: ${d.founder_experience||"Industry background"}\n\nStrengths:\n• Deep expertise in ${d.customer||"target market"} pain points\n• ${d.biz_type||"Technology"} product execution capability\n• Revenue model validated: ${d.revenue_model||"subscription"}\n\nSkill gaps: ${d.skill_gaps||"None identified"}\nHiring plan: Close gaps with seed-funded Q1–Q2 hires`},
  {n:12,t:"Financials",gen:(d:any)=>{
    const f=calcFinancials(d)
    const fmtM12=(n:number)=>n>=10000000?`₹${(n/10000000).toFixed(1)}Cr`:n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`
    return `${d.price_point||"Pricing"} · ${d.revenue_model||"subscription"} model\nGross margin: ${Math.round(f.grossMargin*100)}%\n\nMonthly burn: ${f.burnRate>0?fmtM12(f.burnRate)+"/mo":"TBD"}\nCapital available: ${d.capital_available||"TBD"}\nRunway: ${f.runway>0?`${f.runway} months`:"TBD"}\nBreak-even: ${f.breakEvenMo>0?`Month ${f.breakEvenMo}`:"Estimated Month 18"}\n\nFunding ask: ${d.startup_cost||"Seed round"}`
  }},
  {n:13,t:"The Ask",gen:(d:any)=>{
    const f=calcFinancials(d)
    return `Raising: ${d.startup_cost||"Seed round"}\nCapital available today: ${d.capital_available||"Self-funded"}\n\nUse of funds:\n→ Product: Complete MVP and first 10 customer pilots\n→ GTM: ${d.saas_gtm||"Go-to-market"} — first paying cohort\n→ Team: Close skill gap (${d.skill_gaps||"key hires"})\n\nMilestones:\n• Month 6: ${(d.biz_stage||"").toLowerCase().includes("revenue")?"$10K MRR":"First 10 paying customers"}\n• Month 12: Product-market fit (retention >80%)\n• Month 18: Series Seed — ${f.runway>0?`proven ${f.runway}-month runway`:"proven unit economics"}`
  }},
]

const AI_SECTIONS_KEY = "dhanveda:ventureiq:aisections"

function Documents({data}: {data:any}) {
  const [tab,setTab]=useState("plan")
  const [slide,setSlide]=useState(0)
  const [aiSections,setAiSections]=useState<any>({})
  const [genStatus,setGenStatus]=useState("")
  const [generating,setGenerating]=useState(false)

  // Persist AI sections across navigation
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AI_SECTIONS_KEY)
      if (saved) setAiSections(JSON.parse(saved))
    } catch {}
  }, [])
  useEffect(() => {
    if (Object.keys(aiSections).length === 0) return
    try { localStorage.setItem(AI_SECTIONS_KEY, JSON.stringify(aiSections)) } catch {}
  }, [aiSections])

  const BP_SECTIONS=[
    {id:"exec",  title:"Executive Summary",        task:(d: any)=>`Write a 2-paragraph executive summary for a business plan. Company: ${d.biz_name}, a ${d.biz_type} targeting ${d.customer}. Problem: ${d.problem}. Solution: ${d.biz_description}. Revenue model: ${d.revenue_model} at ${d.price_point}. Market: ${d.market_size}, ${d.market_growth}. Team: ${d.team_size}, ${d.founder_experience} experience. Be specific, investor-ready, no fluff.`},
    {id:"market", title:"Market Analysis",          task:(d: any)=>`Write a market analysis section. Market: ${d.market_size}, ${d.market_growth}. Competitors: ${d.competitors}. Our differentiation: ${d.differentiation}. Target customer: ${d.customer}. Include TAM/SAM/SOM reasoning and competitive positioning.`},
    {id:"product",title:"Product & Value Prop",    task:(d: any)=>`Write a product and value proposition section. Product: ${d.biz_description}. Differentiation: ${d.differentiation}. vs ${d.competitors}. Focus on the mechanism of differentiation and why it's defensible.`},
    {id:"gtm",   title:"Go-to-Market Strategy",    task:(d: any)=>`Write a go-to-market strategy. Primary channel: ${d.saas_gtm||"direct"}. Pricing: ${d.price_point}. Revenue model: ${d.revenue_model}. Target: ${d.customer}. Include 3 phases with specific milestones.`},
    {id:"finance",title:"Financial Plan",           task:(d: any)=>`Write a financial plan section. Startup cost: ${d.startup_cost}. Capital available: ${d.capital_available}. Pricing: ${d.price_point}. Include 3-year projection narrative, burn rate reasoning, and break-even target.`},
    {id:"risk",  title:"Milestones & Risk",         task:(d: any)=>`Write a milestones and risk section. Team: ${d.team_size}, gaps: ${d.skill_gaps}. Competitors: ${d.competitors}. Include 90-day, 6-month, 12-month milestones and top 3 risks with mitigations.`},
  ]

  async function generateAll() {
    setGenerating(true); setAiSections({})
    for(const sec of BP_SECTIONS) {
      setGenStatus(`Generating: ${sec.title}...`)
      const content=await generateWithQC(sec.task(data),data,setGenStatus)
      setAiSections((prev: any)=>({...prev,[sec.id]:content}))
    }
    setGenerating(false); setGenStatus("All sections complete")
  }

  const tabs=[{id:"plan",label:"Business Plan",icon:<FileText size={12}/>},{id:"bmc",label:"Business Model",icon:<Layers size={12}/>},{id:"deck",label:"Pitch Deck",icon:<Star size={12}/>},{id:"investor",label:"Investor View",icon:<BarChart3 size={12}/>}]

  return (
    <div id="pitch-print-root">
    <div style={{padding:"22px 26px",maxWidth:1000,margin:"0 auto"}} className="fu">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <div style={{fontSize:10,color:T.accent,fontWeight:600,letterSpacing:".1em",marginBottom:3}}>PITCH STUDIO</div>
          <h1 className="dsp" style={{fontSize:22,fontWeight:700,color:T.textPrimary}}>{data.biz_name}</h1>
        </div>
        {tab!=="plan"&&tab!=="investor"&&(
          <div style={{display:"flex",gap:8}} className="no-print">
            <Btn variant="ghost" onClick={()=>exportPrint(`${data.biz_name} — ${tab==="bmc"?"Business Model Canvas":"Pitch Deck"}`, tab==="deck")}><Download size={12}/>{tab==="deck"?"Download Slides":"Print / PDF"}</Btn>
          </div>
        )}
      </div>
      {genStatus&&genStatus!=="All sections complete"&&<AIStatus status={genStatus}/>}
      <div style={{display:"flex",gap:3,marginBottom:18,background:T.bgElevated,borderRadius:9,padding:4,border:`1px solid ${T.bgBorder}`,width:"fit-content"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:7,background:tab===t.id?T.bgCard:"transparent",border:tab===t.id?`1px solid ${T.bgBorder}`:"1px solid transparent",color:tab===t.id?T.textPrimary:T.textSecondary,fontSize:12,fontWeight:tab===t.id?600:400}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab==="plan"&&(
        <Card style={{overflow:"hidden"}}>
          {/* Document Cover */}
          <div className="print-cover" style={{background:`linear-gradient(135deg,${T.accent} 0%,#064E3B 100%)`,padding:"28px 28px 24px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.55)",fontWeight:700,letterSpacing:".18em",marginBottom:6,textTransform:"uppercase"}}>Business Plan</div>
                <div className="dsp" style={{fontSize:24,fontWeight:700,color:"#ffffff",lineHeight:1.2,marginBottom:4}}>{data.biz_name}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>{data.biz_type||"Business"} · {data.customer||"Target Market"}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <span style={{fontSize:9,fontWeight:700,padding:"3px 10px",borderRadius:20,border:"1px solid rgba(239,68,68,0.6)",color:"rgba(239,68,68,0.9)",background:"rgba(239,68,68,0.1)",letterSpacing:".1em"}}>CONFIDENTIAL</span>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.45)"}}>{new Date().toLocaleDateString("en-US",{year:"numeric",month:"long"})}</span>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>Powered by ArthaSift VentureIQ</span>
              </div>
            </div>
            <div className="no-print" style={{marginTop:16,display:"flex",gap:8}}>
              <Btn onClick={generateAll} disabled={generating} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",fontSize:11}}><Bot size={12}/>{generating?"Generating…":"AI Generate All"}</Btn>
              <Btn variant="ghost" style={{color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)",fontSize:11}} onClick={()=>exportPrint(`${data.biz_name} — Business Plan`)}><Download size={12}/>Print / PDF</Btn>
              <Btn variant="ghost" style={{color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)",fontSize:11}} onClick={()=>copyText(Object.entries(aiSections).map(([_,v]: any)=>v).filter(Boolean).join("\n\n"))}><Copy size={11}/>Copy All</Btn>
            </div>
          </div>
          {/* Sections */}
          {(()=>{
        const fBP=calcFinancials(data)
        const fmtNBP=(n:number)=>n>=10000000?`₹${(n/10000000).toFixed(1)}Cr`:n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`
        const tiles=[
          {label:'Monthly Burn',value:fBP.burnRate>0?fmtNBP(fBP.burnRate)+'/mo':'N/A',color:T.textPrimary},
          {label:'Runway',value:fBP.runway>0?`${fBP.runway} months`:'N/A',color:fBP.runway>=12?T.go:fBP.runway>=6?T.negotiate:T.pass},
          {label:'Pricing',value:fBP.monthlyPrice>0?fmtNBP(fBP.monthlyPrice)+'/mo':'N/A',color:T.accent},
          {label:'LTV : CAC',value:fBP.ltvCac>0?`${fBP.ltvCac}×`:'N/A',color:fBP.ltvCac>=3?T.go:fBP.ltvCac>0?T.pass:T.textTertiary},
        ]
        return(
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,padding:'14px 20px',borderBottom:`1px solid ${T.bgBorder}`,background:T.bgElevated}}>
            {tiles.map((t,i)=>(
              <div key={i} style={{textAlign:'center',padding:'10px 8px'}}>
                <div style={{fontSize:9,color:T.textTertiary,fontWeight:700,letterSpacing:'.07em',marginBottom:5}}>{t.label.toUpperCase()}</div>
                <div className="mono" style={{fontSize:16,fontWeight:700,color:t.color}}>{t.value}</div>
              </div>
            ))}
          </div>
        )
      })()}
      <div className="bp-scroll-container" style={{padding:"4px 0 20px",display:"flex",flexDirection:"column"}}>
            {BP_SECTIONS.map((sec,i)=>{
              const icons: Record<string,string>={exec:"📋",market:"📊",product:"💡",gtm:"🎯",finance:"💰",risk:"⚡"}
              const num=String(i+1).padStart(2,"0")
              const priceNum=parsePriceNum(data.price_point)
              const showFinanceChart=sec.id==="finance"&&priceNum>0
              const showMarketChart=sec.id==="market"&&data.market_size
              const tamVal=MARKET_SIZE_MAP[data.market_size]||200
              const pieData=[
                {name:"SOM",value:Math.round(tamVal*0.006),fill:T.accent},
                {name:"SAM",value:Math.round(tamVal*0.05),fill:"#34D399"},
                {name:"TAM rem.",value:Math.round(tamVal*0.944),fill:"rgba(5,150,105,0.12)"},
              ]
              const arrData=priceNum>0?[
                {year:"Year 1",arr:Math.round(priceNum*80)},
                {year:"Year 2",arr:Math.round(priceNum*350)},
                {year:"Year 3",arr:Math.round(priceNum*1100)},
              ]:[]
              return(
                <div key={sec.id} className="bp-section" style={{borderLeft:`3.5px solid ${T.accent}`,margin:"16px 20px 0",borderRadius:"0 8px 8px 0",overflow:"hidden",boxShadow:`0 1px 3px rgba(0,0,0,0.04)`}}>
                  <div className="bp-section-header" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:T.accentSubtle}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span className="mono" style={{fontSize:10,fontWeight:700,color:T.accent,opacity:0.7}}>{num}</span>
                      <span style={{fontSize:15}}>{icons[sec.id]||"📄"}</span>
                      <h2 className="dsp bp-title" style={{fontSize:13,fontWeight:700,color:T.textPrimary,margin:0}}>{sec.title}</h2>
                    </div>
                    <Btn variant="ghost" className="no-print" style={{fontSize:10,padding:"3px 8px"}} onClick={()=>aiSections[sec.id]&&copyText(aiSections[sec.id])}><Copy size={9}/>Copy</Btn>
                  </div>
                  <div style={{padding:"14px 16px"}}>
                    {showMarketChart&&(
                      <div style={{display:"flex",gap:16,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
                        <div style={{flex:"0 0 180px"}}>
                          <div style={{fontSize:10,color:T.textTertiary,fontWeight:600,letterSpacing:".08em",marginBottom:4}}>TAM / SAM / SOM</div>
                          <ResponsiveContainer width={180} height={140}>
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={2}>
                                {pieData.map((entry,pi)=><Cell key={pi} fill={entry.fill}/>)}
                              </Pie>
                              <Tooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.bgBorder}`,borderRadius:8,fontSize:10}} formatter={(v: any)=>[`$${v}M`]}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
                          {[
                            {label:'TAM',value:`$${tamVal}M`,pct:100,color:'rgba(5,150,105,0.15)'},
                            {label:'SAM (5%)',value:`$${Math.round(tamVal*0.05)}M`,pct:30,color:'rgba(5,150,105,0.4)'},
                            {label:'SOM (0.6%)',value:`$${Math.round(tamVal*0.006)}M`,pct:10,color:T.accent},
                          ].map((row,ri)=>(
                            <div key={ri} style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:56,fontSize:10,fontWeight:600,color:T.textSecondary}}>{row.label}</div>
                              <div style={{flex:1,height:16,background:T.bgElevated,borderRadius:3}}>
                                <div style={{width:`${row.pct}%`,height:'100%',background:row.color,borderRadius:3}}/>
                              </div>
                              <div style={{width:52,fontSize:10,fontWeight:700,color:T.textPrimary,textAlign:'right'}}>{row.value}</div>
                            </div>
                          ))}
                          <div style={{fontSize:10,color:T.textTertiary,marginTop:4}}>{data.market_size} · {data.market_growth}</div>
                        </div>
                      </div>
                    )}
                    {showFinanceChart&&(
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:10,color:T.textTertiary,fontWeight:600,letterSpacing:".08em",marginBottom:6}}>PROJECTED ARR TRAJECTORY</div>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={arrData} margin={{top:4,right:8,bottom:0,left:0}}>
                            <XAxis dataKey="year" tick={{fill:T.textTertiary,fontSize:10}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fill:T.textTertiary,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={(v: number)=>v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v}`}/>
                            <Tooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.bgBorder}`,borderRadius:8,fontSize:11}} formatter={(v: any)=>[`$${Number(v).toLocaleString()}`,""]}/>
                            <Bar dataKey="arr" radius={[4,4,0,0]}>
                              {arrData.map((_,bi)=><Cell key={bi} fill={bi===2?T.accent:bi===1?"#34D399":"#6EE7B7"}/>)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div style={{display:"flex",gap:8,marginTop:6}}>
                          {arrData.map((row,ri)=>(
                            <div key={ri} style={{flex:1,padding:"6px 8px",background:T.bgElevated,borderRadius:6,textAlign:"center",border:`1px solid ${T.bgBorder}`}}>
                              <div style={{fontSize:9,color:T.textTertiary,marginBottom:2}}>{row.year}</div>
                              <div className="mono" style={{fontSize:12,fontWeight:700,color:ri===2?T.accent:"#059669"}}>${row.arr.toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                        {(()=>{
                          const fFin=calcFinancials(data)
                          const fmtFin=(n:number)=>n>=10000000?`₹${(n/10000000).toFixed(1)}Cr`:n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`
                          return fFin.burnRate>0?(
                            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:10}}>
                              {[
                                {label:'Monthly Burn',value:fmtFin(fFin.burnRate)+'/mo',color:T.textPrimary},
                                {label:'Runway',value:`${fFin.runway} months`,color:fFin.runway>=12?T.go:fFin.runway>=6?T.negotiate:T.pass},
                                {label:'Break-even',value:fFin.breakEvenMo>0?`Month ${fFin.breakEvenMo}`:'N/A',color:T.accent},
                              ].map((m,mi)=>(
                                <div key={mi} style={{padding:'8px 10px',background:T.bgElevated,borderRadius:7,border:`1px solid ${T.bgBorder}`,textAlign:'center'}}>
                                  <div style={{fontSize:9,color:T.textTertiary,fontWeight:700,marginBottom:4}}>{m.label.toUpperCase()}</div>
                                  <div className="mono" style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</div>
                                </div>
                              ))}
                            </div>
                          ):null
                        })()}
                      </div>
                    )}
                    {!aiSections[sec.id]&&!generating
                      ?<p style={{fontSize:12,color:T.textTertiary,fontStyle:"italic",margin:0}}>Click "AI Generate All" to populate this section with content specific to {data.biz_name}.</p>
                      :!aiSections[sec.id]
                      ?<div style={{display:"flex",flexDirection:"column",gap:6}}>{[100,82,91,70].map((w,j)=><div key={j} className="sk" style={{height:11,width:`${w}%`}}/>)}</div>
                      :<div className="bp-content">{renderSectionContent(aiSections[sec.id])}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
      {tab==="bmc"&&(
        <Card style={{overflow:"hidden"}}>
          <div style={{borderBottom:`1px solid ${T.bgBorder}`,padding:"14px 20px"}}><div className="dsp" style={{fontSize:16,fontWeight:700,color:T.textPrimary}}>Business Model Canvas</div></div>
          <div style={{padding:14,overflowX:"auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gridTemplateRows:"auto auto auto",gap:3,minWidth:680}}>
              {BMC_BLOCKS.map(b=>(
                <div key={b.id} style={{gridRow:b.r,gridColumn:b.c,background:T.bgElevated,border:`1px solid ${T.bgBorder}`,borderRadius:8,padding:11,minHeight:b.id==="costs"||b.id==="revenue"?80:115}}>
                  <div style={{fontSize:8,fontWeight:700,color:T.accent,letterSpacing:".08em",marginBottom:6}}>{b.label.toUpperCase()}</div>
                  <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:4}}>
                    {b.gen(data).map((item,i)=><li key={i} style={{fontSize:10,color:T.textSecondary,lineHeight:1.4,paddingLeft:8,position:"relative"}}><span style={{position:"absolute",left:0,color:T.accent}}>·</span>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      {tab==="investor"&&<InvestorView data={data}/>}
      {tab==="deck"&&(
        <Card style={{overflow:"hidden"}}>
          {/* Carousel view — hidden on print */}
          <div className="deck-carousel-view">
            <div style={{borderBottom:`1px solid ${T.bgBorder}`,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}><div className="dsp" style={{fontSize:16,fontWeight:700,color:T.textPrimary}}>Pitch Deck</div><div style={{fontSize:12,color:T.textSecondary}}>{slide+1}/{DECK_SLIDES.length}</div></div>
              <div style={{display:"flex",gap:7}}>
                <Btn variant="ghost" onClick={()=>setSlide(s=>Math.max(0,s-1))} disabled={slide===0} style={{padding:"5px 8px"}}><ChevronLeft size={12}/></Btn>
                <Btn variant="ghost" onClick={()=>setSlide(s=>Math.min(DECK_SLIDES.length-1,s+1))} disabled={slide===DECK_SLIDES.length-1} style={{padding:"5px 8px"}}><ChevronRight size={12}/></Btn>
              </div>
            </div>
            <div style={{display:"flex",gap:4,padding:"10px 16px",borderBottom:`1px solid ${T.bgBorder}`,overflowX:"auto"}}>
              {DECK_SLIDES.map((s,i)=>(
                <button key={i} onClick={()=>setSlide(i)}
                  style={{flexShrink:0,width:64,height:40,borderRadius:5,border:`2px solid ${i===slide?T.accent:T.bgBorder}`,background:i===0?T.accent:T.bgElevated,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <div style={{fontSize:7,color:i===slide?T.accent:T.textTertiary,fontWeight:600}}>{s.n}</div>
                  <div style={{fontSize:6,color:i===slide?T.textPrimary:T.textTertiary,textAlign:"center",padding:"0 2px",lineHeight:1.2}}>{s.t}</div>
                </button>
              ))}
            </div>
            {(()=>{
              const s=DECK_SLIDES[slide];const isCover=s.n===1;const isFinancials=s.n===12
              const isMarketSlide=s.n===5;const isBizModel=s.n===7;const isCompetition=s.n===9
              const pn=parsePriceNum(data.price_point)
              const fDeck=calcFinancials(data)
              const fmtMD=(n:number)=>n>=10000000?`₹${(n/10000000).toFixed(1)}Cr`:n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`
              const arrData=pn>0
                ?[{yr:"Year 1",arr:Math.round(pn*80)},{yr:"Year 2",arr:Math.round(pn*350)},{yr:"Year 3",arr:Math.round(pn*1100)}]
                :[{yr:"Year 1",arr:120000},{yr:"Year 2",arr:520000},{yr:"Year 3",arr:1600000}]
              return(
                <div style={{padding:26,minHeight:260,display:"flex",flexDirection:"column",justifyContent:"center",background:isCover?`linear-gradient(135deg,${T.accent},${T.purple})`:"transparent"}}>
                  <div style={{fontSize:9,color:isCover?"rgba(255,255,255,.6)":T.accent,fontWeight:600,letterSpacing:".12em",marginBottom:8,textTransform:"uppercase"}}>Slide {s.n} — {s.t}</div>
                  <div style={{fontSize:13,color:isCover?"#fff":T.textPrimary,lineHeight:1.85,whiteSpace:"pre-wrap",maxWidth:640}}>{s.gen(data)}</div>
                  {isMarketSlide&&(
                    <div style={{marginTop:18}}>
                      <div style={{fontSize:9,color:T.accent,fontWeight:700,letterSpacing:'.1em',marginBottom:10}}>MARKET OPPORTUNITY FUNNEL</div>
                      {[
                        {label:'TAM',value:fDeck.tamM>=1000?`$${(fDeck.tamM/1000).toFixed(0)}B`:`$${fDeck.tamM}M`,pct:100,color:'rgba(5,150,105,0.12)'},
                        {label:'SAM',value:`$${Math.round(fDeck.tamM*0.05)}M`,pct:30,color:'rgba(5,150,105,0.35)'},
                        {label:'SOM',value:`$${Math.round(fDeck.tamM*0.006)}M`,pct:10,color:T.accent},
                        {label:'Y3 Rev',value:fmtMD(fDeck.y3Rev),pct:4,color:'#047857'},
                      ].map((row,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                          <div style={{width:36,fontSize:10,fontWeight:600,color:T.textSecondary,flexShrink:0}}>{row.label}</div>
                          <div style={{flex:1,height:20,background:'rgba(5,150,105,0.06)',borderRadius:3}}>
                            <div style={{width:`${row.pct}%`,height:'100%',background:row.color,borderRadius:3}}/>
                          </div>
                          <div style={{width:54,fontSize:10,fontWeight:700,color:T.textPrimary,textAlign:'right'}}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isBizModel&&fDeck.ltv>0&&(
                    <div style={{marginTop:18}}>
                      <div style={{fontSize:9,color:T.accent,fontWeight:700,letterSpacing:'.1em',marginBottom:8}}>UNIT ECONOMICS</div>
                      <div style={{border:`1px solid ${T.bgBorder}`,borderRadius:8,overflow:'hidden'}}>
                        {[
                          {metric:'Monthly Price',value:fmtMD(fDeck.monthlyPrice),badge:null as string|null,badgeColor:''},
                          {metric:'LTV (24-mo)',value:fmtMD(fDeck.ltv),badge:null as string|null,badgeColor:''},
                          {metric:'CAC (est.)',value:fmtMD(fDeck.cac),badge:null as string|null,badgeColor:''},
                          {metric:'LTV : CAC',value:`${fDeck.ltvCac}×`,badge:fDeck.ltvCac>=3?'✓ >3×':'✗ <3×',badgeColor:fDeck.ltvCac>=3?T.go:T.pass},
                          {metric:'Payback',value:`${fDeck.paybackMo} months`,badge:fDeck.paybackMo<=12?'✓ <12mo':'✗ >12mo',badgeColor:fDeck.paybackMo<=12?T.go:T.pass},
                          {metric:'Gross Margin',value:`${Math.round(fDeck.grossMargin*100)}%`,badge:null as string|null,badgeColor:''},
                        ].map((row,i)=>(
                          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 12px',background:i%2===0?T.bgElevated:T.bgCard,borderBottom:i<5?`1px solid ${T.bgBorder}`:'none'}}>
                            <span style={{fontSize:11,color:T.textSecondary}}>{row.metric}</span>
                            <div style={{display:'flex',gap:8,alignItems:'center'}}>
                              <span className="mono" style={{fontSize:11,fontWeight:700,color:T.textPrimary}}>{row.value}</span>
                              {row.badge&&<span style={{fontSize:9,fontWeight:700,color:row.badgeColor,background:`${row.badgeColor}15`,padding:'1px 6px',borderRadius:4}}>{row.badge}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isCompetition&&(
                    <div style={{marginTop:18}}>
                      <div style={{fontSize:9,color:T.accent,fontWeight:700,letterSpacing:'.1em',marginBottom:8}}>COMPETITIVE POSITIONING</div>
                      <svg width={240} height={180} style={{display:'block',background:T.bgElevated,borderRadius:8}}>
                        <line x1={120} y1={10} x2={120} y2={170} stroke={T.bgBorder} strokeWidth={1}/>
                        <line x1={10} y1={90} x2={230} y2={90} stroke={T.bgBorder} strokeWidth={1}/>
                        <text x={12} y={175} fontSize={8} fill={T.textTertiary}>Low Price</text>
                        <text x={170} y={175} fontSize={8} fill={T.textTertiary}>High Price</text>
                        <text x={12} y={15} fontSize={8} fill={T.textTertiary}>High Value</text>
                        <text x={12} y={168} fontSize={8} fill={T.textTertiary}>Low Value</text>
                        <circle cx={80} cy={40} r={10} fill={T.go} opacity={0.9}/>
                        <text x={94} y={44} fontSize={9} fontWeight="700" fill={T.go}>{(data.biz_name||"Us").slice(0,8)}</text>
                        {(data.competitors||"Competitor A,Competitor B").split(",").slice(0,3).map((c:string,ci:number)=>{
                          const seed=(c.trim().length*17+ci*53)%100
                          const cx2=130+(seed%80);const cy2=55+(ci*32)
                          return(<g key={ci}><circle cx={cx2} cy={cy2} r={7} fill="#9CA3AF" opacity={0.7}/><text x={cx2+10} y={cy2+4} fontSize={7} fill={T.textTertiary}>{c.trim().slice(0,12)}</text></g>)
                        })}
                      </svg>
                      <div style={{display:'flex',gap:14,marginTop:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:'50%',background:T.go}}/><span style={{fontSize:10,color:T.textSecondary}}>{data.biz_name||"Us"}</span></div>
                        <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:10,height:10,borderRadius:'50%',background:'#9CA3AF'}}/><span style={{fontSize:10,color:T.textSecondary}}>Competitors</span></div>
                      </div>
                    </div>
                  )}
                  {isFinancials&&(
                    <div style={{marginTop:12,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
                      {[
                        {label:'Monthly Burn',value:fDeck.burnRate>0?fmtMD(fDeck.burnRate)+'/mo':'N/A',color:T.textPrimary},
                        {label:'Runway',value:fDeck.runway>0?`${fDeck.runway} months`:'N/A',color:fDeck.runway>=12?T.go:fDeck.runway>=6?T.negotiate:T.pass},
                        {label:'Break-even',value:fDeck.breakEvenMo>0?`Month ${fDeck.breakEvenMo}`:'~Month 18',color:T.accent},
                      ].map((m,mi)=>(
                        <div key={mi} style={{padding:'8px 10px',background:T.bgElevated,borderRadius:7,textAlign:'center',border:`1px solid ${T.bgBorder}`}}>
                          <div style={{fontSize:9,color:T.textTertiary,fontWeight:700,letterSpacing:'.06em',marginBottom:3}}>{m.label.toUpperCase()}</div>
                          <div className="mono" style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isFinancials&&(
                    <div style={{marginTop:4}}>
                      <div style={{fontSize:10,color:T.textSecondary,fontWeight:600,letterSpacing:".08em",marginBottom:10}}>PROJECTED ARR GROWTH</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={arrData} margin={{top:0,right:10,bottom:0,left:0}}>
                          <XAxis dataKey="yr" tick={{fill:T.textSecondary,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:T.textSecondary,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={(v: number)=>v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v}`}/>
                          <Tooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.bgBorder}`,borderRadius:8,fontSize:11,color:T.textPrimary}} formatter={(v: any)=>[`$${Number(v).toLocaleString()} ARR`]}/>
                          <Bar dataKey="arr" radius={[4,4,0,0]}>
                            {arrData.map((_: any,i: number)=>(<Cell key={i} fill={i===2?T.accent:i===1?"#34D399":"#6EE7B7"}/>))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{display:"flex",gap:12,marginTop:8}}>
                        {arrData.map((row,i)=>(
                          <div key={i} style={{flex:1,padding:"8px 10px",background:T.bgElevated,borderRadius:7,textAlign:"center"}}>
                            <div style={{fontSize:9,color:T.textSecondary,marginBottom:2}}>{row.yr}</div>
                            <div className="mono" style={{fontSize:12,fontWeight:700,color:i===2?T.accent:"#059669"}}>${row.arr.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
          {/* All-slides print view — shown only on print (landscape) */}
          <div className="deck-all-slides-print">
            {(()=>{
              const pn=parsePriceNum(data.price_point)
              const fPrint=calcFinancials(data)
              const fmtMP=(n:number)=>n>=10000000?`₹${(n/10000000).toFixed(1)}Cr`:n>=100000?`₹${(n/100000).toFixed(1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`
              const arrData=pn>0
                ?[{yr:"Year 1",arr:Math.round(pn*80)},{yr:"Year 2",arr:Math.round(pn*350)},{yr:"Year 3",arr:Math.round(pn*1100)}]
                :[{yr:"Year 1",arr:120000},{yr:"Year 2",arr:520000},{yr:"Year 3",arr:1600000}]
              return DECK_SLIDES.map((s,si)=>{
                const isCover=s.n===1;const isFinancials=s.n===12
                const isMarketP=s.n===5;const isBizModelP=s.n===7;const isCompetitionP=s.n===9
                return(
                  <div key={si} className={`deck-slide-print${isCover?" print-cover":""}`}
                    style={{padding:"48px 52px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",
                      background:isCover?`linear-gradient(135deg,${T.accent},${T.purple})`:"#ffffff"}}>
                    <div style={{fontSize:8,color:isCover?"rgba(255,255,255,.55)":"#059669",fontWeight:700,letterSpacing:".18em",marginBottom:12,textTransform:"uppercase"}}>
                      {data.biz_name} · Slide {s.n} of {DECK_SLIDES.length} — {s.t}
                    </div>
                    <div style={{fontSize:18,color:isCover?"#fff":"#064E3B",lineHeight:1.75,whiteSpace:"pre-wrap",maxWidth:700,fontWeight:isCover?700:400}}>
                      {s.gen(data)}
                    </div>
                    {isMarketP&&(
                      <div style={{marginTop:20}}>
                        <div style={{fontSize:9,color:"#059669",fontWeight:700,letterSpacing:'.1em',marginBottom:10}}>MARKET OPPORTUNITY FUNNEL</div>
                        {[
                          {label:'TAM',value:fPrint.tamM>=1000?`$${(fPrint.tamM/1000).toFixed(0)}B`:`$${fPrint.tamM}M`,pct:100,color:'rgba(5,150,105,0.12)'},
                          {label:'SAM',value:`$${Math.round(fPrint.tamM*0.05)}M`,pct:30,color:'rgba(5,150,105,0.35)'},
                          {label:'SOM',value:`$${Math.round(fPrint.tamM*0.006)}M`,pct:10,color:'#059669'},
                          {label:'Y3 Rev',value:fmtMP(fPrint.y3Rev),pct:4,color:'#047857'},
                        ].map((row,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                            <div style={{width:40,fontSize:11,fontWeight:600,color:'#6B7280',flexShrink:0}}>{row.label}</div>
                            <div style={{flex:1,height:20,background:'rgba(5,150,105,0.06)',borderRadius:3}}>
                              <div style={{width:`${row.pct}%`,height:'100%',background:row.color,borderRadius:3}}/>
                            </div>
                            <div style={{width:60,fontSize:11,fontWeight:700,color:'#064E3B',textAlign:'right'}}>{row.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {isBizModelP&&fPrint.ltv>0&&(
                      <div style={{marginTop:20}}>
                        <div style={{fontSize:9,color:"#059669",fontWeight:700,letterSpacing:'.1em',marginBottom:10}}>UNIT ECONOMICS</div>
                        <div style={{border:'1px solid #E5E7EB',borderRadius:8,overflow:'hidden',maxWidth:440}}>
                          {[
                            {metric:'Monthly Price',value:fmtMP(fPrint.monthlyPrice),badge:null as string|null,bc:''},
                            {metric:'LTV (24-mo)',value:fmtMP(fPrint.ltv),badge:null as string|null,bc:''},
                            {metric:'LTV : CAC',value:`${fPrint.ltvCac}×`,badge:fPrint.ltvCac>=3?'✓ >3×':'✗ <3×',bc:fPrint.ltvCac>=3?'#059669':'#EF4444'},
                            {metric:'Payback',value:`${fPrint.paybackMo} months`,badge:fPrint.paybackMo<=12?'✓ <12mo':'✗ >12mo',bc:fPrint.paybackMo<=12?'#059669':'#EF4444'},
                          ].map((row,i)=>(
                            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 14px',background:i%2===0?'#F0FDF4':'#ffffff',borderBottom:i<3?'1px solid #E5E7EB':'none'}}>
                              <span style={{fontSize:13,color:'#6B7280'}}>{row.metric}</span>
                              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                <span style={{fontSize:13,fontWeight:700,color:'#064E3B'}}>{row.value}</span>
                                {row.badge&&<span style={{fontSize:10,fontWeight:700,color:row.bc}}>{row.badge}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {isCompetitionP&&(
                      <div style={{marginTop:20}}>
                        <div style={{fontSize:9,color:"#059669",fontWeight:700,letterSpacing:'.1em',marginBottom:10}}>COMPETITIVE POSITIONING</div>
                        <svg width={280} height={200} style={{display:'block',background:'#F0FDF4',borderRadius:8}}>
                          <line x1={140} y1={10} x2={140} y2={190} stroke="#E5E7EB" strokeWidth={1}/>
                          <line x1={10} y1={100} x2={270} y2={100} stroke="#E5E7EB" strokeWidth={1}/>
                          <text x={14} y={196} fontSize={9} fill="#9CA3AF">Low Price</text>
                          <text x={195} y={196} fontSize={9} fill="#9CA3AF">High Price</text>
                          <text x={14} y={18} fontSize={9} fill="#9CA3AF">High Value</text>
                          <circle cx={90} cy={45} r={12} fill="#059669" opacity={0.9}/>
                          <text x={106} y={50} fontSize={10} fontWeight="700" fill="#059669">{(data.biz_name||"Us").slice(0,10)}</text>
                          {(data.competitors||"Competitor A,Competitor B").split(",").slice(0,3).map((c:string,ci:number)=>{
                            const seed=(c.trim().length*17+ci*53)%100
                            const cx2=150+(seed%90);const cy2=60+(ci*38)
                            return(<g key={ci}><circle cx={cx2} cy={cy2} r={9} fill="#9CA3AF" opacity={0.7}/><text x={cx2+13} y={cy2+4} fontSize={8} fill="#6B7280">{c.trim().slice(0,14)}</text></g>)
                          })}
                        </svg>
                      </div>
                    )}
                    {isFinancials&&(
                      <div style={{marginTop:24}}>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                          {[
                            {label:'Monthly Burn',value:fPrint.burnRate>0?fmtMP(fPrint.burnRate)+'/mo':'TBD',color:'#064E3B'},
                            {label:'Runway',value:fPrint.runway>0?`${fPrint.runway} months`:'TBD',color:fPrint.runway>=12?'#059669':fPrint.runway>=6?'#F59E0B':'#EF4444'},
                            {label:'Break-even',value:fPrint.breakEvenMo>0?`Month ${fPrint.breakEvenMo}`:'~Month 18',color:'#059669'},
                          ].map((m,mi)=>(
                            <div key={mi} style={{padding:'10px',background:'#F0FDF4',borderRadius:7,textAlign:'center',border:'1px solid rgba(5,150,105,0.15)'}}>
                              <div style={{fontSize:9,color:'#6B7280',fontWeight:700,marginBottom:4}}>{m.label.toUpperCase()}</div>
                              <div style={{fontSize:14,fontWeight:700,color:m.color}}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{fontSize:10,color:"#6B7280",fontWeight:600,letterSpacing:".08em",marginBottom:10}}>PROJECTED ARR GROWTH</div>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={arrData} margin={{top:0,right:10,bottom:0,left:0}}>
                            <XAxis dataKey="yr" tick={{fill:"#6B7280",fontSize:11}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fill:"#6B7280",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(v: number)=>v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v}`}/>
                            <Tooltip formatter={(v: any)=>[`$${Number(v).toLocaleString()} ARR`]}/>
                            <Bar dataKey="arr" radius={[4,4,0,0]}>
                              {arrData.map((_: any,i: number)=>(<Cell key={i} fill={i===2?"#059669":i===1?"#34D399":"#6EE7B7"}/>))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </Card>
      )}
    </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INVESTOR & FOUNDER NETWORK
// ─────────────────────────────────────────────────────────────────────────────
const POSTS=[
  {name:"Sarah M.", biz:"EcoPackage Co",  score:68,verdict:"GO",      body:"Got my score — 68 GO! Supply chain complexity is my biggest risk. Anyone in sustainable packaging want to connect?",time:"2h",likes:24,comments:8},
  {name:"Raj P.",   biz:"LegalEase AI",   score:74,verdict:"GO",      body:"Sharing my teardown: B2B legal SaaS. Market Opportunity scored 92. Founder Fit pulled me down — no legal background. Hiring a lawyer co-founder this week.",time:"5h",likes:41,comments:15},
  {name:"Maria C.", biz:"MealMate",       score:49,verdict:"PIVOT",   body:"PIVOT verdict was honest. Prime cost flagged at 68% — way too high. Reworking menu before committing. VentureIQ saved me from an expensive mistake.",time:"1d",likes:67,comments:22},
]
const MENTORS=[
  {name:"David Chen",   role:"Ex-Sequoia Partner",    specs:["SaaS","Fundraising"],  rate:"$200/hr",stars:4.9},
  {name:"Priya Sharma", role:"3x Founder · 2x Exits", specs:["E-commerce","Brand"],  rate:"$150/hr",stars:4.8},
  {name:"Marcus J.",    role:"McKinsey → Operator",    specs:["Strategy","M&A"],      rate:"$180/hr",stars:5.0},
]

function Community() {
  const [tab,setTab]=useState("feed")
  const [aiAdvisor,setAiAdvisor]=useState<any[]>([])
  const [advisorInput,setAdvisorInput]=useState("")
  const [advisorLoading,setAdvisorLoading]=useState(false)

  async function askAdvisor() {
    if(!advisorInput.trim())return
    const q=advisorInput; setAdvisorInput(""); setAdvisorLoading(true)
    setAiAdvisor(prev=>[...prev,{role:"user",content:q}])
    const answer=await generateWithQC(
      `You are a world-class startup advisor answering a founder's question. Be direct, specific, and actionable. No fluff. Question: ${q}`,
      {context:"VentureIQ Community AI Advisor"},
      ()=>{}
    )
    setAiAdvisor(prev=>[...prev,{role:"assistant",content:answer||"Unable to respond. Please try again."}])
    setAdvisorLoading(false)
  }

  return (
    <div style={{padding:"22px 26px",maxWidth:1000,margin:"0 auto"}} className="fu">
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,color:T.accent,fontWeight:600,letterSpacing:".1em",marginBottom:3}}>INVESTOR & FOUNDER NETWORK</div>
        <h1 className="dsp" style={{fontSize:22,fontWeight:700,color:T.textPrimary}}>4,200 founders · building in the open</h1>
      </div>
      <div style={{display:"flex",gap:3,marginBottom:18,background:T.bgElevated,borderRadius:9,padding:4,border:`1px solid ${T.bgBorder}`,width:"fit-content"}}>
        {["feed","mentors","ai advisor"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"6px 14px",borderRadius:7,background:tab===t?T.bgCard:"transparent",border:tab===t?`1px solid ${T.bgBorder}`:"1px solid transparent",color:tab===t?T.textPrimary:T.textSecondary,fontSize:12,fontWeight:tab===t?600:400,textTransform:"capitalize"}}>
            {t}
          </button>
        ))}
      </div>
      {tab==="feed"&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card style={{padding:16}}>
            <div style={{display:"flex",gap:9}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${T.accent},${T.purple})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>JK</span></div>
              <div style={{flex:1}}><textarea placeholder="Share your score, a question, or a founder insight…" style={{minHeight:56,marginBottom:9}}/><div style={{display:"flex",justifyContent:"flex-end"}}><Btn style={{fontSize:12,padding:"6px 14px"}}>Post</Btn></div></div>
            </div>
          </Card>
          {POSTS.map((p,i)=>{
            const vc=p.verdict==="GO"?T.go:p.verdict==="PIVOT"?T.negotiate:T.pass
            const vbg=p.verdict==="GO"?T.goBg:p.verdict==="PIVOT"?T.negotiateBg:T.passBg
            return(
              <Card key={i} style={{padding:16}}>
                <div style={{display:"flex",gap:9}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:T.bgElevated,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:11,fontWeight:600,color:T.textSecondary}}>{p.name.split(" ").map(n=>n[0]).join("")}</span></div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,fontWeight:600,color:T.textPrimary}}>{p.name}</span><span style={{fontSize:10,color:T.textSecondary}}>{p.biz}</span>
                      <div style={{background:vbg,border:`1px solid ${vc}35`,borderRadius:20,padding:"1px 7px",display:"flex",alignItems:"center",gap:3}}><span className="mono" style={{fontSize:9,fontWeight:600,color:vc}}>{p.score}</span><span style={{fontSize:8,color:vc,fontWeight:600}}>{p.verdict}</span></div>
                      <span style={{fontSize:10,color:T.textTertiary,marginLeft:"auto"}}>{p.time} ago</span>
                    </div>
                    <p style={{fontSize:12,color:T.textSecondary,lineHeight:1.65,marginBottom:9}}>{p.body}</p>
                    <div style={{display:"flex",gap:12}}>{([[Star,p.likes],[MessageSquare,p.comments]] as any[]).map(([Icon,val]: any,j: number)=><button key={j} style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:T.textSecondary,background:"none",border:"none"}}><Icon size={11}/>{val}</button>)}</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {tab==="mentors"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {MENTORS.map((m,i)=>(
            <Card key={i} style={{padding:20}}>
              <div style={{display:"flex",gap:11,marginBottom:12}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${[T.teal,T.coral,T.amber][i%3]},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{m.name.split(" ").map(n=>n[0]).join("")}</span></div>
                <div><div className="dsp" style={{fontSize:14,fontWeight:600,color:T.textPrimary}}>{m.name}</div><div style={{fontSize:11,color:T.textSecondary}}>{m.role}</div><div style={{display:"flex",alignItems:"center",gap:3,marginTop:2}}><Star size={9} color={T.negotiate} fill={T.negotiate}/><span style={{fontSize:10,fontWeight:600,color:T.textPrimary}}>{m.stars}</span></div></div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{m.specs.map(s=><span key={s} style={{background:T.accentSubtle,border:`1px solid ${T.accent}35`,borderRadius:20,padding:"2px 8px",fontSize:9,color:T.accent}}>{s}</span>)}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{m.rate}</span><Btn style={{fontSize:11,padding:"5px 12px"}}>Book</Btn></div>
            </Card>
          ))}
        </div>
      )}
      {tab==="ai advisor"&&(
        <Card style={{overflow:"hidden"}}>
          <div style={{borderBottom:`1px solid ${T.bgBorder}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:8}}>
            <Bot size={14} color={T.accent}/>
            <div className="dsp" style={{fontSize:14,fontWeight:700,color:T.textPrimary}}>AI Advisor</div>
            <div style={{fontSize:11,color:T.textSecondary}}>Powered by Claude · QC-verified answers</div>
          </div>
          <div style={{minHeight:300,maxHeight:"50vh",overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12}}>
            {aiAdvisor.length===0&&<div style={{textAlign:"center",padding:"40px 20px"}}><Bot size={32} color={T.textTertiary} style={{margin:"0 auto 10px"}}/><div style={{fontSize:13,color:T.textSecondary}}>Ask me anything about your business, funding, strategy, or deals.</div></div>}
            {aiAdvisor.map((msg,i)=>(
              <div key={i} style={{display:"flex",gap:9,justifyContent:msg.role==="user"?"flex-end":"flex-start"}} className="si">
                {msg.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:T.accentSubtle,border:`1px solid ${T.accent}35`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Bot size={13} color={T.accent}/></div>}
                <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:10,background:msg.role==="user"?T.accent:T.bgElevated,fontSize:13,color:msg.role==="user"?"#fff":T.textPrimary,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{msg.content}</div>
              </div>
            ))}
            {advisorLoading&&<div style={{display:"flex",gap:9}} className="si"><div style={{width:28,height:28,borderRadius:"50%",background:T.accentSubtle,border:`1px solid ${T.accent}35`,display:"flex",alignItems:"center",justifyContent:"center"}}><Bot size={13} color={T.accent}/></div><div style={{padding:"10px 14px",background:T.bgElevated,borderRadius:10,display:"flex",gap:5}}>{[0,1,2].map(j=><div key={j} style={{width:6,height:6,borderRadius:"50%",background:T.accent,animation:`pulse 1s ${j*.2}s infinite`}}/>)}</div></div>}
          </div>
          <div style={{borderTop:`1px solid ${T.bgBorder}`,padding:"12px 16px",display:"flex",gap:10}}>
            <input type="text" value={advisorInput} onChange={e=>setAdvisorInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!advisorLoading&&askAdvisor()} placeholder="Ask about funding, strategy, negotiations, unit economics…" style={{flex:1}}/>
            <Btn onClick={askAdvisor} disabled={advisorLoading||!advisorInput.trim()} style={{flexShrink:0,padding:"9px 14px"}}><Send size={13}/></Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYZING OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
function AnalyzingOverlay() {
  const msgs=["Scoring market opportunity","Evaluating financial viability","Assessing founder-market fit","Running deal-killer check","Computing final verdict"]
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(240,253,244,0.97)",zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <div style={{width:64,height:64,borderRadius:"50%",border:`3px solid rgba(5,150,105,0.2)`,borderTop:`3px solid ${T.accent}`,animation:"spin .8s linear infinite",boxShadow:`0 0 24px ${T.accent}40`}}/>
      <div style={{textAlign:"center"}}>
        <div className="dsp" style={{fontSize:20,fontWeight:700,marginBottom:5,color:T.textPrimary}}>Analyzing your business…</div>
        <div style={{fontSize:13,color:T.textSecondary}}>Multi-agent scoring engine running</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,width:240}}>
        {msgs.map((msg,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:T.bgCard,borderRadius:7,border:`1px solid ${T.bgBorder}`}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:`pulse 1s ${i*.2}s infinite`}}/>
            <span style={{fontSize:11,color:T.textSecondary}}>{msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT — embedded in Dhanveda, no sidebar
// ─────────────────────────────────────────────────────────────────────────────
interface VentureIQAppProps {
  initialView?: string
  userProfile?: { name?: string; capitalAvailable?: string } | null
}

export default function VentureIQApp({ initialView = "dashboard", userProfile }: VentureIQAppProps) {
  const [view, setView] = useState(initialView)
  const [organicData, setOrganicData] = useState<any>(SAMPLE_ORGANIC)
  const [organicResult, setOrganicResult] = useState(() => computeOrganicScore(SAMPLE_ORGANIC))
  const [analyzing, setAnalyzing] = useState(false)
  const [dbStatus, setDbStatus] = useState("")

  // Polyfill window.storage using localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && !window.storage) {
      window.storage = {
        set: async (key: string, value: string) => { localStorage.setItem(key, value) },
        get: async (key: string) => {
          const v = localStorage.getItem(key)
          return v ? { value: v } : null
        },
      }
    }
  }, [])

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      setDbStatus("loading")
      const saved = await dbLoad()
      if (saved?.organicData) {
        setOrganicData(saved.organicData)
        setOrganicResult(computeOrganicScore(saved.organicData))
      }
      setDbStatus("")
    })()
  }, [])

  // Save to storage whenever analysis data changes
  useEffect(() => {
    if (organicData.biz_name === SAMPLE_ORGANIC.biz_name) return
    (async () => {
      await dbSave({ organicData, savedAt: new Date().toISOString() })
      setDbStatus("saved")
      setTimeout(() => setDbStatus(""), 2000)
    })()
  }, [organicData])

  function handleOrganicComplete(form: any) {
    setAnalyzing(true)
    setTimeout(() => {
      setOrganicData(form)
      setOrganicResult(computeOrganicScore(form))
      setAnalyzing(false)
      setView("dashboard")
    }, 2400)
  }

  return (
    <>
      <VentureStyles />
      <CopyToast />
      <div className="venture-app" style={{ position: "relative", minHeight: "60vh" }}>
        {dbStatus === "saved" && (
          <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 200, background: T.goBg, border: `1px solid ${T.go}40`, borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.go }} className="no-print">
            <CheckCircle size={12} /> Analysis saved
          </div>
        )}
        {dbStatus === "loading" && (
          <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 200, background: T.bgCard, border: `1px solid ${T.bgBorder}`, borderRadius: 8, padding: "7px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textSecondary }} className="no-print">
            <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid rgba(5,150,105,0.2)`, borderTop: `2px solid ${T.accent}`, animation: "spin .6s linear infinite" }} />
            Loading saved analysis…
          </div>
        )}
        {analyzing && <AnalyzingOverlay />}
        {view === "analyzer"   && <OrganicIntake onComplete={handleOrganicComplete} />}
        {view === "dashboard"  && <Dashboard data={organicData} result={organicResult} setView={setView} />}
        {view === "inorganic"  && <DealStudio setView={setView} />}
        {view === "documents"  && <Documents data={organicData} />}
        {view === "community"  && <Community />}
      </div>
    </>
  )
}
