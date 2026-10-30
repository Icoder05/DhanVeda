#!/usr/bin/env bash
# Re-runs experiments E1-E7 and redraws every figure. Needs Node 23.6+ and the packages in requirements.txt.
# Outputs are deterministic: compare with `git diff experiments/results`.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p experiments/logs

node   experiments/extract.js   data/processed/prompts.json                              | tee experiments/logs/e1_extract.log
python experiments/tok.py       data/processed/prompts.json experiments/results/tokens.json > experiments/logs/e1_tokens.log
node   experiments/esg_exp.ts   experiments/results/esg_results.json                     | tee experiments/logs/e2_e4_esg.log
node   experiments/rubric_exp.js experiments/results/rubric_results.json                 | tee experiments/logs/e5_e6_rubric.log
python experiments/cascade_exp.py experiments/results/cascade_results.json               | tee experiments/logs/e7_cascade.log
python report/figs.py

echo "Done. Results in experiments/results, figures in figures/."
