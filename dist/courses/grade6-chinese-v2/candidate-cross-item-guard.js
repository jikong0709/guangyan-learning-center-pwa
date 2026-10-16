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
module.exports={collisions,guardedBuildExam};
