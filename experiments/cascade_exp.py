# E7: analytic availability of the provider cascade in lib/claude.ts (callClaude).
# Assumes independent per-tier failures with equal probability p.
# Usage: python experiments/cascade_exp.py experiments/results/cascade_results.json
import json, sys

RATES = [0.05, 0.10, 0.20, 0.30]
TIERS = {'general': 4, 'stock': 5}  # stock prompts add the Tier 0 collaborative route

rows = []
for p in RATES:
    row = {'p_fail': p}
    for route, n in TIERS.items():
        row[f'availability_{route}'] = 1 - p ** n
    # answered by a model other than Tier 1: Tier 1 failed and some later tier succeeded
    row['answered_by_fallback'] = p * (1 - p ** 3)
    row['h7_supported'] = row['availability_general'] >= 0.999
    rows.append(row)

for r in rows:
    print(f"p={r['p_fail']:.2f}  general={100 * r['availability_general']:.4f}%  "
          f"stock={100 * r['availability_stock']:.5f}%  fallback={100 * r['answered_by_fallback']:.1f}%")
json.dump(rows, open(sys.argv[1], 'w'), indent=1)
