// E1 step 1: evaluates every production prompt template with a fixed test stock.
// Usage: node experiments/extract.js data/processed/prompts.json
const fs=require('fs'),path=require('path');
const OUT=path.resolve(process.argv[2]);
process.chdir(path.join(__dirname,'..','dhanveda-app'));
const files={
 'T&F Analysis (full)':'app/(dashboard)/research/page.tsx',
 'ESG Deep Dive':'app/(dashboard)/research/esg/page.tsx',
 'Transcript Analyser':'app/(dashboard)/research/transcript/page.tsx',
 'Thesis Tester':'app/(dashboard)/decide/page.tsx',
 'Bias Checker':'app/(dashboard)/decide/bias/page.tsx',
 'Conviction Journal':'app/(dashboard)/decide/journal/page.tsx',
 'Carbon & RECs':'app/(dashboard)/green/carbon/page.tsx',
 'REIT Intelligence':'app/(dashboard)/green/reit/page.tsx',
 'ESG score (screener)':'app/api/screener/esg-score/route.ts',
};
const proxy=new Proxy({},{has:()=>true,get:(t,k)=>k===Symbol.unscopables?undefined:(k==='JSON'?JSON:(k==='Math'?Math:'Reliance Industries'))});
const out={};
for(const [name,f] of Object.entries(files)){
  const src=fs.readFileSync(f,'utf8');
  let m=src.match(/const prompt\s*=\s*(`[\s\S]*?`)\s*\n/);
  let body;
  if(m){ body=m[1]; }
  else { m=src.match(/const prompt\s*=\s*\n?([\s\S]*?Be honest[^\n]*)/); body=m?m[1]:null; }
  if(!body){out[name]=null;continue}
  try{ out[name]=new Function('scope','with(scope){return '+body+'}')(proxy);}catch(e){out[name]='ERR '+e.message}
}
// groq compressed prompt
const c=fs.readFileSync('lib/claude.ts','utf8');
const g=c.match(/function buildGroqPrompt[\s\S]*?return (`[\s\S]*?`)\n\}/);
out['T&F Analysis (Groq-compressed, no live data)']=new Function('stock','liveData','return '+g[1])('Reliance Industries','');
const live='Current NSE price: 2950\n'.repeat(1)+Array(30).fill('Metric label: value').join('\n');
out['T&F Analysis (Groq-compressed + Gemini live data)']=new Function('stock','liveData','return '+g[1])('Reliance Industries',live);
const d=c.match(/const dataFetchPrompt =([\s\S]*?)\n\n  let liveData/);
out['Gemini live-data fetch']=new Function('stock','return ('+d[1]+')')('Reliance Industries');
const gc=fs.readFileSync('components/GlobalChat.tsx','utf8');
const sys=gc.match(/const SYSTEM = (`[\s\S]*?`)\n/);
out['Global assistant (system)']=new Function('return '+sys[1])();
fs.writeFileSync(OUT,JSON.stringify(out,null,1));
for(const [k,v] of Object.entries(out)) console.log(k, v?String(v).length:'null', String(v).slice(0,60).replace(/\n/g,' '));
