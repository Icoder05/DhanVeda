# Data card

No production database records, user data or live LLM outputs are included in this repository. All the datasets below come either from the source code or from seeded simulation.

| ID | Dataset | Location | Origin | Size |
|----|---------|----------|--------|------|
| D1 | Production prompt corpus | [`processed/prompts.json`](processed/prompts.json) | Extracted programmatically from 9 source files by [`experiments/extract.js`](../experiments/extract.js), using the test stock "Reliance Industries" | 13 prompts |
| D2 | Stock universe | [`dhanveda-app/lib/stockSeed.ts`](../dhanveda-app/lib/stockSeed.ts) | Curated by hand: ticker, sector, industry, exchange, market-cap bucket | 532 securities (150 large, 225 mid, 157 small; 28 sectors; 4 REITs, 5 InvITs) |
| D3 | Synthetic company panel | Generated on the fly by [`experiments/rubric_exp.js`](../experiments/rubric_exp.js) (seed 7) | **Simulated.** Distributions centred on the Indian benchmarks written into the rubric | 20,000 companies |
| D4 | Literature abstracts | [`raw/literature-abstracts.json`](raw/literature-abstracts.json) | Public arXiv abstracts of the cited papers, used only for the similarity self-check in Appendix C of the report | 8 abstracts |

## D3 distributions (assumed)

| Metric | Distribution |
|--------|--------------|
| ROE (%) | N(15, 7) |
| ROCE (%) | ROE + 1 + N(0, 4) |
| Net margin (%) | N(10, 7) |
| P/E ÷ sector median | LogNormal(ln 1.05, 0.4) |
| P/B | LogNormal(ln 3, 0.6) |
| EV/EBITDA | LogNormal(ln 17, 0.5) |
| Debt/Equity | LogNormal(ln 0.45, 1.0) |
| Interest cover | LogNormal(ln 7, 0.9) |
| Revenue growth (%) | N(12, 10) |
| EPS growth (%) | N(13, 15) |
| Promoter pledge (%) | 0 with p = 0.72, otherwise U(0, 45) |
| Promoter holding (%) | U(20, 75) |

The panel exists to test the **mechanics** of the rubric, meaning its calibration and boundary sensitivity. It is not meant to describe the market. Any absolute values from E4–E6 depend on these assumptions; the structural conclusions do not.

## Processed outputs

| File | Produced by | Contents |
|------|-------------|----------|
| [`experiments/results/tokens.json`](../experiments/results/tokens.json) | `tok.py` | Per prompt: characters, words, cl100k, o200k, chars/4 estimate, non-ASCII token cost, output cap |
| [`experiments/results/esg_results.json`](../experiments/results/esg_results.json) | `esg_exp.ts` | Baseline tiers, tiers by market cap, sector means, Monte Carlo tier counts with 95% intervals, stability histogram, ±1 G flips |
| [`experiments/results/rubric_results.json`](../experiments/results/rubric_results.json) | `rubric_exp.js` | DV Score distribution, band counts, rule-gap counts, noise-trial statistics per level, category means |
| [`experiments/results/cascade_results.json`](../experiments/results/cascade_results.json) | `cascade_exp.py` | Availability and fallback share by failure rate |

## Ethics and privacy

- The experiments ran offline: no API quota was used and no user data was read.
- The live trial P1 is specified but was deliberately not run, because it would consume API quota without the owner's approval.
- The scores are for research and education. They are not SEBI-registered investment advice.
