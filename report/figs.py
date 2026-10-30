"""Redraws every report figure in Calibri from the recorded experiment outputs (no values retyped by hand
except where noted as taken from the experiment logs in Section 10)."""
import json, os, sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.patches import FancyBboxPatch

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, 'experiments', 'results')
OUT = os.path.join(ROOT, 'figures'); os.makedirs(OUT, exist_ok=True)
FONT = 'DejaVu Sans'  # fallback when Calibri is not installed
for f in ['calibri.ttf', 'calibrib.ttf', 'calibrii.ttf']:
    if os.path.exists('C:/Windows/Fonts/' + f):
        fm.fontManager.addfont('C:/Windows/Fonts/' + f); FONT = 'Calibri'
plt.rcParams.update({'font.family': FONT, 'font.size': 11, 'axes.spines.top': False, 'axes.spines.right': False,
                     'axes.edgecolor': '#888888', 'axes.titleweight': 'bold', 'axes.titlesize': 13, 'axes.titlelocation': 'left',
                     'savefig.dpi': 220, 'savefig.bbox': 'tight'})
GREY, LIGHT, BLUE, RED, INK, QUIET = '#a3a39a', '#dcdcd6', '#2563a8', '#c0392b', '#1f1f1f', '#666666'

tok = json.load(open(os.path.join(S, 'tokens.json')))
esg = json.load(open(os.path.join(S, 'esg_results.json')))
rub = json.load(open(os.path.join(S, 'rubric_results.json')))
T = {r['prompt']: r for r in tok}

def save(fig, name):
    fig.savefig(os.path.join(OUT, name)); plt.close(fig)

# F2 token budget vs Groq TPM
rows = [('Full rubric (research page)', T['T&F Analysis (full)']['cl100k']),
        ('Compressed, no live data', T['T&F Analysis (Groq-compressed, no live data)']['cl100k']),
        ('Compressed + Gemini live data', T['T&F Analysis (Groq-compressed + Gemini live data)']['cl100k'])]
fig, ax = plt.subplots(figsize=(8, 2.8))
for i, (n, v) in enumerate(rows[::-1]):
    tot = v + 2500
    ax.barh(i, v, color=GREY, height=0.55)
    ax.barh(i, 2500, left=v, color=LIGHT, height=0.55)
    if tot > 6000: ax.barh(i, tot - 6000, left=6000, color=RED, height=0.55)
    ax.text(tot + 60, i, f'{tot:,}', va='center', fontweight='bold' if tot > 6000 else 'normal')
ax.set_yticks(range(3)); ax.set_yticklabels([r[0] for r in rows[::-1]])
ax.axvline(6000, color='#444', ls='--', lw=1.2); ax.text(5950, 2.45, 'Groq free tier: 6,000 TPM', ha='right', fontsize=10)
ax.set_xlim(0, 7000); ax.set_xlabel('Tokens booked per call (prompt tokens + 2,500 output reservation)')
ax.set_title('Only the compressed rubric fits the 6,000 tokens-per-minute free tier')
from matplotlib.patches import Patch
ax.legend(handles=[Patch(color=GREY, label='prompt tokens (cl100k)'), Patch(color=LIGHT, label='output reservation'), Patch(color=RED, label='over the limit')],
          loc='lower right', frameon=False, fontsize=9)
save(fig, 'f_tpm.png')

# F3 chars per token
lab = {'T&F Analysis (Groq-compressed, no live data)': 'T&F compressed rubric', 'T&F Analysis (Groq-compressed + Gemini live data)': 'T&F compressed + live data',
       'T&F Analysis (full)': 'T&F full rubric', 'ESG score (screener)': 'Screener ESG score', 'Global assistant (system)': 'Global assistant (system)'}
cpt = sorted([(lab.get(r['prompt'], r['prompt']), r['chars'] / r['cl100k']) for r in tok], key=lambda x: x[1], reverse=True)
fig, ax = plt.subplots(figsize=(8, 4.6))
for i, (n, v) in enumerate(cpt):
    c = BLUE if v < 3 else GREY
    ax.hlines(i, 2, v, color='#e6e6e6'); ax.plot(v, i, 'o', color=c, ms=7)
    ax.text(v + 0.04, i, f'{v:.2f}', va='center', fontsize=9, color=QUIET)
ax.set_yticks(range(len(cpt))); ax.set_yticklabels([c[0] for c in cpt])
ax.axvline(4, color='#444', ls='--', lw=1.2); ax.text(4.03, len(cpt) - 0.4, '4.0 = estimate used in /api/claude', fontsize=9.5)
ax.set_xlim(2, 5); ax.set_xlabel('Characters per cl100k token')
ax.set_title('Number-dense rubric prompts pack about 2.6 characters into a token, not 4')
save(fig, 'f_cpt.png')

# F4 noise -> band flip
n = rub['noise']
fig, ax = plt.subplots(figsize=(8, 3.6))
xs = [r['rel'] * 100 for r in n]; ys = [r['bandFlipShare'] * 100 for r in n]
ax.plot(xs, ys, '-o', color=BLUE, lw=2)
for x, y, r in zip(xs, ys, n):
    if x: ax.text(x, y + 3.5, f'{y:.1f}%', ha='center', fontsize=9.5, fontweight='bold' if x == 10 else 'normal')
ax.axhline(10, color='#444', ls='--', lw=1.2); ax.text(30, 12, 'H3 limit: at most 10% of companies change band', ha='right', fontsize=9.5)
ax.set_ylim(0, 100); ax.set_xticks(xs); ax.set_xticklabels([f'{int(x)}%' for x in xs])
ax.set_xlabel('Relative error injected into each retrieved metric'); ax.set_ylabel('Companies changing band (%)')
ax.set_title('At 10% data noise, 62.4% of companies change verdict band within 10 runs')
save(fig, 'f_noise.png')

# F4b SD and CI vs noise
fig, ax = plt.subplots(figsize=(8, 3.2))
sd = [r['meanSD'] for r in n]; ci = [r['ci95half'] for r in n]
ax.bar([x - 0.9 for x in xs], sd, width=1.8, color=BLUE, label='mean within-company SD')
ax.bar([x + 0.9 for x in xs], ci, width=1.8, color=GREY, label='mean 95% CI half-width (n = 10)')
for x, a, b in zip(xs, sd, ci):
    if x: ax.text(x - 0.9, a + 0.12, f'{a:.2f}', ha='center', fontsize=8.5); ax.text(x + 0.9, b + 0.12, f'{b:.2f}', ha='center', fontsize=8.5)
ax.axhline(2, color='#444', ls='--', lw=1.2); ax.text(30.5, 2.15, 'H3 limit: SD 2 points', ha='right', fontsize=9.5)
ax.set_xticks(xs); ax.set_xticklabels([f'{int(x)}%' for x in xs]); ax.set_ylabel('DV Score points')
ax.set_xlabel('Relative error injected into each retrieved metric'); ax.legend(frameon=False, fontsize=9, loc='upper left')
ax.set_title('Run-to-run spread already exceeds the 2-point limit at 5% noise')
save(fig, 'f_sd.png')

# F5 ESG tiers baseline vs MC
mc = esg['mc']
fig, ax = plt.subplots(figsize=(8, 3.8))
for i, r in enumerate(mc):
    ax.bar(i - 0.17, r['baseline'], width=0.3, color=GREY)
    ax.text(i - 0.17, r['baseline'] + 3, str(r['baseline']), ha='center', fontsize=9, color=QUIET)
    ax.errorbar(i + 0.17, r['mean'], yerr=[[r['mean'] - r['p025']], [r['p975'] - r['mean']]], fmt='o', color=BLUE, capsize=4, lw=1.8)
    ax.text(i + 0.3, r['mean'], f"{r['mean']:.1f}", va='center', fontsize=9, fontweight='bold')
ax.set_xticks(range(6)); ax.set_xticklabels([r['tier'] for r in mc], fontweight='bold'); ax.set_ylabel('Securities (of 532)')
ax.legend(handles=[Patch(color=GREY, label='no BSE data (sector priors only)'), plt.Line2D([], [], color=BLUE, marker='o', label='Monte Carlo mean, 95% interval (10,000 draws)')],
          frameon=False, fontsize=9, loc='upper left')
ax.set_title('With pledge data, the A tier doubles and the C tier shrinks by a quarter')
save(fig, 'f_esgmc.png')

# F6 tier mix by market cap
caps = ['Large', 'Mid', 'Small']; tiers = ['A+', 'A', 'B+', 'B', 'C', 'D']
shade = ['#173f6b', '#2563a8', '#5b8fc7', '#9dbbe0', '#c9c9c2', '#7a7a72']
fig, ax = plt.subplots(figsize=(8, 2.6))
for i, c in enumerate(caps):
    d = esg['byCap'][c]; tot = sum(d.values()); left = 0
    for t, col in zip(tiers, shade):
        w = d[t] / tot * 100
        if w: ax.barh(i, w, left=left, color=col, height=0.6)
        if w >= 6: ax.text(left + w / 2, i, f'{t} {w:.0f}%', ha='center', va='center', fontsize=8.5, color='white' if t in ('A+', 'A', 'B+') else INK)
        left += w
ax.set_yticks(range(3)); ax.set_yticklabels([f'{c}-cap ({sum(esg["byCap"][c].values())})' for c in caps]); ax.invert_yaxis()
ax.set_xlim(0, 100); ax.set_xlabel('Share of securities in each ESG tier (%)')
ax.set_title('Mid- and small-caps fall into tier C far more often (41% and 46% vs 25%)')
save(fig, 'f_cap.png')

# F7 sector composite
sec = esg['secStats']
fig, ax = plt.subplots(figsize=(8, 6.6))
for i, r in enumerate(sec):
    hi = i in (0, len(sec) - 1)
    ax.hlines(i, 4, r['mean'], color='#e6e6e6'); ax.plot(r['mean'], i, 'o', color=BLUE if hi else GREY, ms=6)
    if hi: ax.text(r['mean'] + 0.06, i, f"{r['mean']:.2f}", va='center', fontsize=9, fontweight='bold')
ax.set_yticks(range(len(sec))); ax.set_yticklabels([f"{r['sector']} ({r['n']})" for r in sec], fontsize=9.5); ax.invert_yaxis()
for t, at in [('C', 4.0), ('B', 5.5), ('B+', 6.5), ('A', 7.5)]:
    ax.axvline(at, color='#777', ls='--', lw=1); ax.text(at + 0.03, -1.2, f'{t} from {at}', fontsize=9, color=QUIET)
ax.set_xlim(4, 8.1); ax.set_xlabel('Mean ESG composite (E+S+G)/3, no BSE data')
ax.set_title('Sector alone explains 96.4% of ESG composite variance (eta-squared = 0.964)', pad=22)
save(fig, 'f_sector.png')

# F8 stability histogram
h = esg['hist'][1:]
fig, ax = plt.subplots(figsize=(8, 2.9))
labels = ['0.5-0.6', '0.6-0.7', '0.7-0.8', '0.8-0.9', '0.9-0.95', '0.95-1.0']
cols = [BLUE if i < 3 else GREY for i in range(6)]
ax.bar(labels, [b['n'] for b in h], color=cols)
for i, b in enumerate(h): ax.text(i, b['n'] + 5, str(b['n']), ha='center', fontsize=9.5)
ax.set_xlabel('Share of 10,000 draws landing on the security\'s most frequent tier'); ax.set_ylabel('Securities')
ax.set_title('309 of 532 securities (58%) keep their modal tier in fewer than 80% of draws')
save(fig, 'f_stab.png')

# F9 DV score histogram
hist = [b for b in rub['hist'] if 5 <= b['bin'] <= 85]
fig, ax = plt.subplots(figsize=(8, 3.8))
for a, b in [(31, 46), (61, 73), (83, 95)]: ax.axvspan(a, b, color='#f1f1ee', zorder=0)
ax.bar([b['bin'] + 2.5 for b in hist], [b['n'] for b in hist], width=4.6, color=GREY, zorder=2)
for x, lab_, st in [(39, 'Simulated median 39', '-'), (50, 'Rubric anchor 50', '--'), (68, 'All-median company 68', '--')]:
    ax.axvline(x, color=BLUE if st == '-' else '#444', ls=st, lw=2 if st == '-' else 1.2, zorder=3)
    ax.text(x + 0.7, 2780 - (0 if x == 39 else 230 if x == 50 else 460), lab_, fontsize=9.5, fontweight='bold' if x == 39 else 'normal')
for nm, a, b in [('Avoid', 5, 31), ('Weak', 31, 46), ('Neutral', 46, 61), ('Moderate', 61, 73), ('Good', 73, 83), ('Exc.', 83, 95)]:
    ax.text((a + b) / 2, -330, nm, ha='center', fontsize=9, color=QUIET)
ax.set_xlim(5, 95); ax.set_ylim(0, 2950); ax.set_ylabel('Simulated companies'); ax.set_xlabel('DV Score (floor 5, cap 95)', labelpad=18)
ax.set_title('The rubric does not centre on its own anchor of 50 (n = 20,000)')
save(fig, 'f_dvhist.png')

# F10 cascade availability
p = [5, 10, 20, 30]
gen = [100 * (1 - (x / 100) ** 4) for x in p]; stk = [100 * (1 - (x / 100) ** 5) for x in p]; fb = [x * (1 - (x / 100) ** 3) for x in p]
fig, ax = plt.subplots(1, 2, figsize=(8, 2.8))
ax[0].plot(p, [100 - g for g in gen], '-o', color=GREY, label='general prompts (4 tiers)'); ax[0].plot(p, [100 - s for s in stk], '-o', color=BLUE, label='stock prompts (5 tiers)')
ax[0].set_yscale('log'); ax[0].set_ylabel('Requests failing (%)'); ax[0].set_xlabel('Per-tier failure rate (%)'); ax[0].axhline(0.1, color='#444', ls='--', lw=1)
ax[0].text(5, 0.13, 'H7 limit: 0.1% failing', ha='left', fontsize=9); ax[0].legend(frameon=False, fontsize=8.5); ax[0].set_title('Outright failure stays rare', fontsize=11.5)
ax[1].bar([str(x) + '%' for x in p], fb, color=BLUE)
for i, v in enumerate(fb): ax[1].text(i, v + 0.6, f'{v:.1f}%', ha='center', fontsize=9)
ax[1].set_ylabel('Answered by a fallback model (%)'); ax[1].set_xlabel('Per-tier failure rate'); ax[1].set_title('...but the answering model changes often', fontsize=11.5)
fig.tight_layout(); save(fig, 'f_cascade.png')

# F1 hierarchy diagram
def box(ax, x, y, w, h, title, lines, accent=False, edge='#888888'):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0,rounding_size=0.12', fc='#e8f0fa' if accent else 'white', ec=BLUE if accent else edge, lw=2 if accent else 1.1))
    ax.text(x + 0.18, y + h - 0.3, title, fontsize=11, fontweight='bold', va='top')
    for k, l in enumerate(lines): ax.text(x + 0.18, y + h - 0.68 - k * 0.3, l, fontsize=9.5, va='top', color=INK if accent else QUIET)
fig, ax = plt.subplots(figsize=(8, 8.4)); ax.set_xlim(0, 10); ax.set_ylim(0, 11); ax.axis('off')
ax.add_patch(FancyBboxPatch((2.2, 10.1), 5.6, 0.6, boxstyle='round,pad=0,rounding_size=0.12', fc='white', ec='#888', lw=1.1))
ax.text(5, 10.4, 'Request: POST /api/claude (session checked)', ha='center', va='center', fontweight='bold')
tiers_ = [('Tier 0 · Collaborative retrieve-then-score', ['Gemini 2.0 Flash + Google Search pulls live NSE/BSE data', 'Groq Llama-3.3-70B applies the compressed rubric -> JSON'], True),
          ('Tier 1 · Gemini 2.0 Flash, then Flash-Lite', ['Each model tried with Google Search, then without', 'temperature 0 · free tier'], False),
          ('Tier 2 · Claude 3.5 Haiku (Anthropic)', ['Paid quality fallback; optional web-search tool', 'temperature 0'], False),
          ('Tier 3 · Groq Llama-3.3-70B, then Llama-3.1-8B', ['Stock prompts swapped for the 1.6k-token compressed rubric', 'next model on 429, 413 or a decommissioned model'], False),
          ('Tier 4 · OpenRouter free pool', ['Llama-3.3-70B-instruct:free, then Qwen-2.5-72B:free', 'separate quota pool; next model on 429 or 503'], False)]
y = 8.5
for t, l, a in tiers_:
    box(ax, 2.2, y, 5.6, 1.25, t, l, a)
    ax.annotate('', xy=(5, y + 1.25), xytext=(5, y + 1.6), arrowprops=dict(arrowstyle='-|>', color='#888'))
    y -= 1.6
ax.add_patch(FancyBboxPatch((2.2, 0.55), 5.6, 0.6, boxstyle='round,pad=0,rounding_size=0.12', fc='white', ec=RED, lw=1.3))
ax.text(5, 0.85, 'All tiers failed: HTTP 500 listing every provider error', ha='center', va='center')
ax.annotate('', xy=(5, 1.15), xytext=(5, 1.7), arrowprops=dict(arrowstyle='-|>', color='#888'))
ax.plot([2.2, 1.85, 1.85], [10.4, 10.4, 7.5], color='#888', lw=1.1); ax.annotate('', xy=(2.2, 7.5), xytext=(1.85, 7.5), arrowprops=dict(arrowstyle='-|>', color='#888'))
ax.text(1.7, 9.0, 'general and\nportfolio prompts\nskip Tier 0', ha='right', fontsize=9.5, color=QUIET)
ax.plot([8.05, 8.2, 8.2, 8.05], [9.75, 9.75, 2.1, 2.1], color='#888', lw=1.1)
ax.text(8.35, 6.2, 'Escalates on\nHTTP 429, 413,\n503, an empty\nreply or\ninvalid JSON', fontsize=9.5, va='center')
ax.set_title('Every AI request falls through up to five provider tiers before it fails', loc='left')
save(fig, 'f_hier.png')

# F11 dashboard layout
fig, ax = plt.subplots(figsize=(8, 4.4)); ax.set_xlim(0, 12); ax.set_ylim(0, 6.6); ax.axis('off')
ax.add_patch(FancyBboxPatch((0.2, 5.4), 11.6, 0.9, boxstyle='round,pad=0,rounding_size=0.1', fc='#f1f1ee', ec='#888'))
for x, t, s in [(0.5, 'Runs today', 'count, delta vs 7-day mean'), (4.4, 'Availability (24 h)', '1 - failed / total'), (8.2, 'Live-data hit rate', 'share of Tier 0 runs with data')]:
    ax.text(x, 6.0, t, fontweight='bold'); ax.text(x, 5.6, s, fontsize=9.5, color=QUIET)
panels = [('DV Score by iteration', ['line per stock, run index on x', 'band edges as reference lines', 'answers H2 and H3'], True),
          ('Run-to-run spread', ['within-stock SD and 95% CI', 'band-flip share, rolling 7 days', 'threshold line at SD 2'], False),
          ('Who answered', ['stacked share by tier and model', 'per hour, last 48 hours', 'spots free-tier exhaustion'], False),
          ('Latency distribution', ['histogram per provider', 'p50, p95 vs the 60 s limit', 'Vercel maxDuration = 60 s'], False),
          ('Tokens: estimated vs actual', ['scatter, one point per run', 'y = x line; error by feature', 'validates Section 4.3 live'], False),
          ('Errors and repairs', ['429 / 413 / 503 / bad JSON', 'per provider per day', 'JSON-repair rate per model'], False)]
for k, (t, l, a) in enumerate(panels):
    cx = 0.2 + (k % 3) * 3.95; cy = 2.75 if k < 3 else 0.1
    box(ax, cx, cy, 3.7, 2.4, t, l, a)
ax.set_title('Proposed live research dashboard: six panels over one table, ai_runs', loc='left')
save(fig, 'f_dash.png')
print(sorted(os.listdir(OUT)))
