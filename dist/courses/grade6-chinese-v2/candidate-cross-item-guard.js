"use strict";
/* Candidate-only cross-item leak guard prototype. No production hook.
 * Mirrors verify-batch-leaks.js exactly for the relevant term categories.
 * Evaluate whole papers before enabling the guarded builder in the UI.
 */
function clean(s){return String(s==null?"":s).normalize("NFKC").replace(/[\s，、。．；：！？!?「」『』（）(),.]/g,"");}
function termsOf(spec){
 const terms=(spec.leakTerms||[]).slice();
 if(spec.type==="charphonetic"&&spec.direction==="h")terms.push(spec.factChar);
 if(spec.type==="wrongchar"||spec.type==="homophone")terms.push(spec.audit&&spec.audit.answer);
 return [...new Set(terms.map(clean).filter(Boolean))];
}
function collisions(paper,bank){
 const found=[],lookup=new Map();
 for(const q of paper.items){const s=bank.byId(q.specId);if(s)lookup.set(q,s);}
 for(const [q,s] of lookup){
  const terms=termsOf(s);if(!terms.length)continue;
  for(const [other,os] of lookup){
   if(q===other||os.type==="sentence")continue;
   const exposed=clean([other.stem,...(other.options||[])].join(""));
   const hit=terms.find(t=>exposed.includes(t));
   if(hit)found.push({source:q.specId,target:other.specId,term:hit});
  }
 }
 return found;
}
/* Fail closed: never return a candidate paper containing an identified
 * cross-question leak. A shortage is a data-quality blocker, not permission
 * to relax the verification rules.
 */
function guardedBuildExam(engine,bank,opts,attempts=16){
 if(!Number.isInteger(attempts)||attempts<1||attempts>100)throw Error("attempts must be 1..100");
 let best=Infinity,example=null;
 for(let i=0;i<attempts;i++){
  const paper=engine.buildExam(opts);
  const hits=collisions(paper,bank);
  if(hits.length===0)return {paper,attempts:i+1};
  if(hits.length<best){best=hits.length;example=hits[0];}
 }
 const err=new Error("CANDIDATE_LEAK_GUARD_BLOCKED: no safe paper within "+attempts+" attempts; best="+best);
 err.best=best;err.example=example;throw err;
}

/* Isolated experiment: prune high-conflict specs without touching the
 * shared engine, score plan, fixed lesson, or original leakage verifier.
 * This is intentionally fail closed and not wired to the student UI.
 */
function adaptiveGuardedBuildExam(config,bank,opts,{maxPrunes=18}={}){
 const excluded=new Set(),topics=(opts.units||[]).flatMap(u=>u.topics||[]);
 const original=new Map(topics.flatMap(t=>bank.specsOf(t)).map(s=>[s.id,s]));
 const sizes={};for(const s of original.values())sizes[s.type]=(sizes[s.type]||0)+1;
 const proxy={
  specsOf:t=>bank.specsOf(t).filter(s=>!excluded.has(s.id)),
  byId:id=>bank.byId(id),
  topics:()=>bank.topics()
 };
 const engine=globalThis.ExamEngine.create(config,proxy);
 let best=Infinity,example=null,attempts=0;
 for(let step=0;step<=maxPrunes;step++){
  let exam;
  try{exam=engine.buildExam(opts);attempts++;}
  catch(e){return {ok:false,reason:"POOL_OR_PLAN_BLOCKED",prunes:excluded.size,attempts,best,example,message:e.message};}
  const hits=collisions(exam,bank);
  if(!hits.length)return {ok:true,paper:exam,prunes:excluded.size,attempts};
  if(hits.length<best){best=hits.length;example=hits[0];}
  const degrees=new Map();
  for(const h of hits){degrees.set(h.source,(degrees.get(h.source)||0)+1);degrees.set(h.target,(degrees.get(h.target)||0)+1);}
  const candidates=[...degrees].filter(([id])=>{
   const sp=original.get(id);if(!sp||excluded.has(id)||sp.type==="reading")return false;
   const t=config.types.find(x=>x.key===sp.type);
   const min=Math.max(2,Math.min(t?.stdCount||2,t?.maxCount||2));
   return (sizes[sp.type]-1)>min;
  });
  if(!candidates.length)return {ok:false,reason:"NO_SAFE_PRUNE",prunes:excluded.size,attempts,best,example};
  candidates.sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  const victim=candidates[0][0];excluded.add(victim);sizes[original.get(victim).type]--;
 }
 return {ok:false,reason:"PRUNE_BUDGET_EXHAUSTED",prunes:excluded.size,attempts,best,example};
}

module.exports={collisions,guardedBuildExam,adaptiveGuardedBuildExam};
