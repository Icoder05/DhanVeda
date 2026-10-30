# Methodology

This page summarises the experimental design behind the [research report](research-report.pdf) (Chapters 5–7). Every number here comes from a script in [`experiments/`](../experiments) and can be regenerated with [`reproduce.sh`](../reproduce.sh).

## Research questions

| ID  | Theme          | Question |
|-----|----------------|----------|
| RQ1 | Efficiency     | Can a free-tier, multi-provider hierarchy serve a rubric-heavy financial analysis within published rate limits? |
| RQ2 | Tokenization   | How accurate is the platform's token accounting, and which properties of text drive token cost? |
| RQ3 | ESG validity   | Does the rule-based ESG engine discriminate between companies, or does it mainly restate sector membership? |
| RQ4 | Robustness     | How sensitive are ESG tiers and DV Score bands to small input errors? |
| RQ5 | Calibration    | Does the DV Score rubric produce the distribution its own anchors claim (50 = median NSE-500 company)? |
| RQ6 | Reliability    | How likely is a request to fail outright, and how often is it answered by a model other than the intended one? |

## Pre-registered hypotheses

The decision rules were fixed **before** any script was run and were not adjusted after the results were seen.

| ID | Hypothesis | Decision rule | Test |
|----|------------|---------------|------|
| H1 | The compressed prompt cuts input tokens by ≥ 50% and brings one call under 6,000 TPM | Reduction ≥ 50% and prompt + reservation < 6,000 | E1 |
| H2 | Compressed and full rubrics give the same DV Score on identical live data | Mean \|Δ\| ≤ 3 points; paired p > 0.05 | P1 (live) |
| H3 | Repeated runs at temperature 0 give a stable score | Within-stock SD ≤ 2; band unchanged in ≥ 90% | E6, P1 |
| H4 | The ESG composite carries company-level information beyond sector | Sector η² < 0.80 | E2 |
| H5 | ESG tiers are robust to a one-point governance error | ≤ 10% of securities change tier | E3, E4 |
| H6 | A company at the Indian median on every KPI scores about 50 | Score within 50 ± 5 | E5 |
| H7 | The cascade achieves ≥ 99.9% availability | 1 − ∏ p(fail) ≥ 0.999 at 10% per-tier failure | E7 |

## Variables and controls

| Type | Variable | Levels |
|------|----------|--------|
| Independent | Prompt variant | Full rubric · compressed · compressed + live data |
| Independent | Tokenizer | `cl100k_base`, `o200k_base` (tiktoken 0.14.0) |
| Independent | Promoter pledge / holding | Null (no BSE data) · Monte Carlo draws · ±1 G-point shock |
| Independent | Retrieval noise (relative σ) | 0, 5, 10, 15, 20, 30 % |
| Independent | Per-tier provider failure rate | 5, 10, 20, 30 % |
| Dependent | Token count, chars/token, estimator error | integer · ratio · % |
| Dependent | ESG tier, composite, transition risk | A+…D · 1–10 · Very Low…Very High |
| Dependent | DV Score, verdict band | 5–95 · six bands |
| Controlled | Scoring code | Unmodified `lib/esgScoring.ts`; rubric re-implemented rule-for-rule from `lib/claude.ts` |
| Controlled | Randomness | LCG, seeds `20261025` (ESG) and `7` (rubric) |
| Controlled | Prompt test stock | "Reliance Industries" in every template |

## Baselines

| Experiment | Baseline (control) |
|------------|--------------------|
| E1 token audit | Uncompressed rubric, and the code's own `chars / 4` estimator |
| E2–E4 ESG engine | Sector-only model (composite implied by the sector table alone) |
| E5–E6 rubric | Noise-free score of the same synthetic company |
| E7 cascade | Single provider (Gemini only) |

## Experiment register

| ID | Procedure | Iterations | Seed |
|----|-----------|-----------:|------|
| E1 | Token audit, 13 prompts × 2 tokenizers | deterministic | — |
| E2 | ESG engine over 532 securities without BSE data | deterministic | — |
| E3 | ±1 G-point shock on all 532 securities | 1,064 scorings | — |
| E4 | Monte Carlo of pledge and holding uncertainty | 10,000 × 532 = 5.32 M scorings | 20261025 |
| E5 | DV-rubric population simulation | 20,000 companies | 7 |
| E6 | Repeated-run retrieval-noise trial | 1,000 × 10 runs × 6 levels = 60,000 scorings | 7 |
| E7 | Cascade availability (analytic) | 4 failure rates × 2 routes | — |
| P1 | **Live trial (specified, not yet run):** 30 Nifty-100 stocks × 2 prompts × 5 runs × 3 days | 900 calls | — |

## Metrics

- **Token metrics:** BPE token count, characters per token, estimator error = (estimate − actual) / actual.
- **Explained variance:** η² = SS<sub>between-sector</sub> / SS<sub>total</sub> on the ESG composite.
- **Tier-flip rate:** share of securities whose tier changes under a perturbation, with a Wald 95% CI.
- **Modal-tier stability:** per security, the share of Monte Carlo draws that land on its most frequent tier.
- **Repeatability:** within-company SD, 95% CI half-width (t₉ = 2.262) and band-flip share over ten runs.
- **Availability:** 1 − ∏ p<sub>i</sub>, plus the share of requests answered by a fallback tier.

## Precision of key estimates

| Quantity | Calculation | Result |
|----------|-------------|--------|
| P1 sample size (detect 3-pt difference, α = 0.05, power 0.80, σ<sub>Δ</sub> = 5) | n = ((1.96 + 0.84) × 5 / 3)² | 22 stocks; 30 planned |
| E3 tier-flip rate (247 / 532) | Wald: 0.464 ± 1.96 √(0.464 × 0.536 / 532) | 46.4% [42.2%, 50.7%] |
| Monte Carlo error on any E4 proportion | √(0.25 / 10,000) | ≤ 0.5 pp |
| E5 median of 20,000 draws | Order-statistic CI (ranks 9,861 and 10,139) | 39 [39, 39] |

## Threats to validity

| Threat | Applies to | Mitigation |
|--------|-----------|------------|
| **Construct:** the rubric was re-implemented from the compressed prompt; undefined ranges score 0, whereas an LLM may interpolate | E5, E6 | Undefined ranges counted and reported; P1 tests the LLM directly |
| **Internal:** synthetic input distributions drive E4–E6 | E4–E6 | Centred on the rubric's own Indian benchmarks; labelled *simulated*; seeds published |
| **External:** 532 securities are not the full listed universe; no live market data | E2–E4 | Universe covers Nifty 50, Next 50, Midcap 150 and key small-caps |
| **Statistical conclusion:** multiple comparisons | All | Decision rules fixed in advance; effect sizes reported alongside tests |
