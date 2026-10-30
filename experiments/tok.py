# E1 step 2: tokenizes each prompt with tiktoken (cl100k_base, o200k_base) and compares with the chars/4 estimate.
# Usage: python experiments/tok.py data/processed/prompts.json experiments/results/tokens.json
import json,sys,re,tiktoken
p=json.load(open(sys.argv[1],encoding='utf8'))
c=tiktoken.get_encoding('cl100k_base'); o=tiktoken.get_encoding('o200k_base')
budgets={'T&F Analysis (full)':2500,'ESG Deep Dive':2000,'Transcript Analyser':1200,'Thesis Tester':1400,'Bias Checker':1000,'Conviction Journal':600,'Carbon & RECs':1100,'REIT Intelligence':1100,'ESG score (screener)':250,'T&F Analysis (Groq-compressed, no live data)':2500,'T&F Analysis (Groq-compressed + Gemini live data)':2500,'Gemini live-data fetch':1200,'Global assistant (system)':420}
rows=[]
for k,v in p.items():
  nc=len(c.encode(v)); no=len(o.encode(v)); est=round(len(v)/4)
  nonascii=[ch for ch in v if ord(ch)>127]
  na_tok=sum(len(c.encode(ch)) for ch in nonascii)
  # decorative-stripped variant
  strip=re.sub(r'[━【】]','',v).replace('—','-').replace('→','->').replace('≥','>=').replace('≤','<=').replace('×','x').replace('±','+/-')
  ns=len(c.encode(strip))
  rows.append(dict(prompt=k,chars=len(v),words=len(v.split()),est_chars4=est,cl100k=nc,o200k=no,nonascii_chars=len(nonascii),nonascii_tokens_cl100k=na_tok,ascii_normalised_cl100k=ns,max_out=budgets.get(k),code_logged=est+budgets.get(k,0)))
for r in rows: print(r)
json.dump(rows,open(sys.argv[2],'w'),indent=1)
