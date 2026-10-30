# Literature review

A condensed version of Chapter 2 of the [research report](research-report.pdf). The abstracts used for the similarity self-check are in [`data/raw/literature-abstracts.json`](../data/raw/literature-abstracts.json).

| Theme | Key finding | Limitation for Indian retail use | DhanVeda response |
|-------|-------------|----------------------------------|-------------------|
| Domain-specific LLMs | BloombergGPT (50B parameters, 363B financial + 345B general tokens) beats general models on financial benchmarks [3] | Training budget far beyond a retail platform | Prompt a general model with an explicit rubric |
| Prompted general LLMs | GPT-4 reported to beat analysts at predicting earnings direction [4]; **the paper was later withdrawn** | Shows that claims about LLMs in finance need independent replication | All claims here are backed by reproducible scripts |
| Retrieval and hallucination | FinanceBench: GPT-4-Turbo with retrieval got 81% of questions wrong or refused them [5] | Getting the right figure is harder than reasoning about it | Two-stage retrieve-then-score pipeline (Tier 0) |
| Non-determinism | Outputs at "temperature 0" swing by up to 15% in accuracy across runs [6] | A single score is one sample from a distribution | Temperature 0, a 12-hour cache and a planned repeated-run trial (P1) |
| Cost-aware routing | FrugalGPT matches the best model at up to 98% lower cost [7]; RouteLLM halves cost [8] | Both need learned quality estimators | Failure-driven cascade that needs no training data |
| Prompt compression | LLMLingua compresses prompts up to 20× [9] | Statistical pruning can remove rules | Rule-preserving manual compression (−56.9%) |
| Tokenization of numbers | Digit grouping changes GPT-4 addition accuracy from 84.4% to 98.9% [10] | Rubrics are number-dense | Measured characters/token for all 13 prompts |
| ESG rating divergence | Six agencies correlate only 0.38–0.71 with each other; 56% of the divergence comes from measurement [11] | Thin coverage of Indian mid- and small-caps | Rule-based E/S/G from sector priors plus SEBI pledge and BRSR data |

## Research gaps

| Gap | Status in DhanVeda |
|-----|--------------------|
| Benchmarks calibrated to US or global norms | Implemented: India-only rubric with sector medians, a G-Sec anchor and SEBI pledge thresholds |
| Fabricated live figures | Implemented, but not yet measured |
| Fragility and cost of relying on one provider | Implemented: a five-tier cascade |
| Opaque ESG ratings | Implemented: a transparent rule-based engine |
| Reproducibility of LLM scores | Partial: temperature 0, caching and a versioned rubric |
| **Validation against market outcomes** | **Open.** This is the main item of future work |

## References

1. Business Today, "NSE trading accounts cross 25 crore; unique investors at 12.7 crore," 13 Feb. 2026.
2. SEBI, "Updated SEBI study reveals 93% of individual traders incurred losses in equity F&O between FY22 and FY24," PR No. 22/2024, 23 Sep. 2024.
3. S. Wu et al., "BloombergGPT: A large language model for finance," arXiv:2303.17564, 2023.
4. A. Kim, M. Muhn, V. Nikolaev, "Financial statement analysis with large language models," arXiv:2407.17866, 2024 (withdrawn Feb. 2025).
5. P. Islam et al., "FinanceBench: A new benchmark for financial question answering," arXiv:2311.11944, 2023.
6. B. Atil et al., "Non-determinism of 'deterministic' LLM settings," arXiv:2408.04667, 2024.
7. L. Chen, M. Zaharia, J. Zou, "FrugalGPT," arXiv:2305.05176, 2023.
8. I. Ong et al., "RouteLLM: Learning to route LLMs with preference data," ICLR 2025; arXiv:2406.18665.
9. H. Jiang et al., "LLMLingua: Compressing prompts for accelerated inference of LLMs," EMNLP 2023; arXiv:2310.05736.
10. A. K. Singh, D. J. Strouse, "Tokenization counts: The impact of tokenization on arithmetic in frontier LLMs," arXiv:2402.14903, 2024.
11. F. Berg, J. F. Koelbel, R. Rigobon, "Aggregate confusion: The divergence of ESG ratings," *Review of Finance* 26(6), 2022.
12. Groq, "Rate limits," GroqCloud documentation, accessed 25 Oct. 2026.
13. OpenAI, *tiktoken* v0.14.0, https://github.com/openai/tiktoken
