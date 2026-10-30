// E5-E6. Usage: node experiments/rubric_exp.js experiments/results/rubric_results.json
// Deterministic re-implementation of the compressed DV-Score rubric (lib/claude.ts buildGroqPrompt)
const fs=require('fs');
let seed=7;const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296};
const N=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const logn=(mu,s)=>Math.exp(Math.log(mu)+s*N());
let gaps={pe:0,rsi:0,pledge:0,w52:0,total:0};
function score(m,track){
 let A=0,B=0,C=0,D=0,E=0;
 A+= m.roe>=20?7:m.roe>=15?5:m.roe>=10?3:m.roe>=5?1:0;
 A+= m.roce>=20?7:m.roce>=15?5:m.roce>=12?3:m.roce>=8?1:0;
 A+= m.npm>18?6:m.npm>=10?4:m.npm>=4?2:0; if(m.opmChg<-150)A-=2;
 const r=m.peRel; // P/E / sector median
 let pe; if(r<0.75)pe=8; else if(r>=0.85&&r<=1.15)pe=5; else if(r>1.15&&r<=1.35)pe=0; else if(r>1.35&&r<=1.6)pe=-4; else if(r>2)pe=-6; else {pe=0; if(track)gaps.pe++;}
 B+=pe;
 B+= (m.pb<=2&&m.roe>=18)?6:(m.pb<=4&&m.roe>=15)?4:(m.pb<=4&&m.roe>=10)?1:(m.pb>6&&m.roe<12)?-3:0;
 B+= m.ev<10?6:m.ev<=18?3:m.ev<=28?0:-4;
 C+= m.de<0.25?8:m.de<=0.75?5:m.de<=1.5?2:m.de<=3?-4:-8;
 C+= m.ic>8?7:m.ic>=4?5:m.ic>=2?2:m.ic>=1?-5:-8;
 C+= m.cr>2?5:m.cr>=1.5?3:m.cr>=1?1:-4;
 D+= m.rev<0?-3:m.rev>20?8:m.rev>=12?5:m.rev>=8?2:0;
 D+= (m.eps<0&&m.rev>0)?-4:m.eps>20?7:m.eps>=12?5:m.eps>=8?2:0;
 D+= m.fcf===2?5:m.fcf===1?2:m.fcf===-1?-3:0;
 E+= m.above200?5:-5; E+= m.golden?3:-3;
 if(m.rsi>=40&&m.rsi<=65)E+=3; else if(m.rsi>75)E-=3; else if(m.rsi<30)E-=2; else if(track)gaps.rsi++;
 if(m.w52==='high')E+=3; else if(m.w52==='low')E-=2; else if(track)gaps.w52++;
 let pl; if(m.pledge===0&&m.hold>=40)pl=4; else if(m.pledge<5)pl=2; else if(m.pledge>=10&&m.pledge<=25)pl=-3; else if(m.pledge>25&&m.pledge<=50)pl=-6; else if(m.pledge>50)pl=-8; else {pl=0; if(track)gaps.pledge++;}
 E+=pl; E+= m.adverse?-3:(m.brsr?2:0);
 let ded=0; if(m.adverse)ded-=12; if(m.auditor)ded-=10; if(m.pledge>35)ded-=6; if(m.ic<1.5)ded-=5; if(m.threeDecl)ded-=7;
 const raw=A+B+C+D+E+ded; return {raw,score:Math.min(95,Math.max(5,raw)),A,B,C,D,E,ded};
}
const band=s=>s>=83?'Exceptional':s>=73?'Good':s>=61?'Moderate':s>=46?'Neutral':s>=31?'Weak':'Avoid';
function company(){ // ASSUMED NSE-500-like distributions
 const roe=15+7*N();return {roe,roce:roe+1+4*N(),npm:10+7*N(),opmChg:150*N(),peRel:logn(1.05,0.4),pb:logn(3,0.6),ev:logn(17,0.5),de:logn(0.45,1.0),ic:logn(7,0.9),cr:Math.max(0.3,1.6+0.5*N()),rev:12+10*N(),eps:13+15*N(),fcf:rnd()<0.45?2:rnd()<0.6?1:-1,above200:rnd()<0.55,golden:rnd()<0.5,rsi:52+12*N(),w52:rnd()<0.2?'high':rnd()<0.15?'low':'mid',pledge:rnd()<0.72?0:rnd()*45,hold:20+rnd()*55,adverse:rnd()<0.03,auditor:rnd()<0.02,threeDecl:rnd()<0.05,brsr:rnd()<0.85};
}
function perturb(m,rel){ // retrieval noise: relative error on each continuous metric
 const p=x=>x*(1+rel*N()); const n={...m};
 for(const k of ['roe','roce','npm','peRel','pb','ev','de','ic','cr'])n[k]=p(m[k]);
 n.rev=m.rev+rel*Math.abs(m.rev)*N(); n.eps=m.eps+rel*Math.abs(m.eps)*N(); n.opmChg=m.opmChg+rel*150*N(); n.rsi=m.rsi*(1+rel*N()); n.pledge=Math.max(0,m.pledge===0?0:p(m.pledge));
 return n;
}
const NC=20000; const cos=[];const scores=[];const bands={};
for(let i=0;i<NC;i++){const c=company();cos.push(c);const s=score(c,true);scores.push(s);bands[band(s.score)]=(bands[band(s.score)]||0)+1;}
const vals=scores.map(s=>s.score).sort((a,b)=>a-b);const med=vals[NC/2];const mean=vals.reduce((a,b)=>a+b,0)/NC;
const sd=Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/(NC-1));
// histogram 5-pt bins
console.log("medCI",vals[9861],vals[10139],"p25",vals[5000],"p75",vals[15000],"p05",vals[1000],"p95",vals[19000],"min",vals[0],"max",vals[NC-1]);const hist=[];for(let b=0;b<=95;b+=5)hist.push({bin:b,n:vals.filter(v=>v>=b&&v<b+5).length});
console.log('NC',NC,'median',med,'mean',mean.toFixed(2),'sd',sd.toFixed(2),'bands',bands,'gaps',gaps, 'gap share', ((gaps.pe+gaps.rsi+gaps.pledge)/NC).toFixed(3));
// repeated-run noise experiment: 1000 companies x 10 runs per noise level
const levels=[0,0.05,0.10,0.15,0.20,0.30];const noise=[];
const sub=cos.slice(0,1000);
for(const rel of levels){
 let sumSD=0,flip=0,absd=[];let ci=[];
 for(const c of sub){const base=score(c).score;const runs=[];for(let k=0;k<10;k++)runs.push(score(perturb(c,rel)).score);
  const m=runs.reduce((a,b)=>a+b,0)/10;const s=Math.sqrt(runs.reduce((a,b)=>a+(b-m)**2,0)/9);sumSD+=s;ci.push(2.262*s/Math.sqrt(10));
  const bs=new Set(runs.map(band));if(bs.size>1)flip++;absd.push(...runs.map(r=>Math.abs(r-base)));}
 absd.sort((a,b)=>a-b);
 noise.push({rel,meanSD:+(sumSD/sub.length).toFixed(2),ci95half:+(ci.reduce((a,b)=>a+b,0)/ci.length).toFixed(2),bandFlipShare:+(flip/sub.length).toFixed(3),medAbsDev:absd[Math.floor(absd.length/2)],p90AbsDev:absd[Math.floor(absd.length*0.9)]});
}
console.log(noise);
// category contribution means
const cat=k=>(scores.reduce((a,s)=>a+s[k],0)/NC).toFixed(2);
console.log('cat means',{A:cat('A'),B:cat('B'),C:cat('C'),D:cat('D'),E:cat('E'),ded:cat('ded')});
// verdict consistency rule check: score<46 cannot be Buy -> trivially enforced; skip
fs.writeFileSync(process.argv[2],JSON.stringify({NC,median:med,mean,sd,bands,hist,gaps,noise,cat:{A:cat('A'),B:cat('B'),C:cat('C'),D:cat('D'),E:cat('E'),ded:cat('ded')}},null,1));
