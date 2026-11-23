/* Scoreboard V2 journal adapter. Client-side queue only; no cloud writes. */
(function(root){
'use strict';
const API=root.ScoreboardMutationV2;
const STORE=API.createStore(root.localStorage);
let account='guest',activeBatch=null;
const clone=x=>JSON.parse(JSON.stringify(x));
function setAccount(userId){account=userId||'guest';activeBatch=null;return account}
function enqueue(op,type,id,payload,dependencies){return STORE.createMutation(account,{entityType:type,entityId:id,operation:op,payload:clone(payload),dependencyIds:dependencies||[]})}
function batch(){if(activeBatch)return activeBatch;const pending=STORE.getPending(account).slice().sort((a,b)=>a.sequence-b.sequence);if(!pending.length)return null;const batchId='batch-'+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now());activeBatch={userId:account,batchId,resetEpoch:STORE.read(account).epoch,mutationIds:pending.map(x=>x.mutationId),mutations:clone(pending),createdAt:new Date().toISOString()};return activeBatch}
function acknowledge(ids){if(!activeBatch)throw new Error('No active batch');const accepted=(ids||[]).filter(id=>activeBatch.mutationIds.includes(id));STORE.acknowledge(account,accepted);if(accepted.length===activeBatch.mutationIds.length)activeBatch=null;return accepted}
function markUnknown(ids){(ids||[]).forEach(id=>STORE.markUnknown(account,id))}
function retryUnknown(ids){const s=STORE.read(account),wanted=new Set(ids||[]);return s.mutations.filter(m=>wanted.has(m.mutationId)&&m.userId===account&&m.resetEpoch===s.epoch&&m.status==='UNKNOWN')}
function resetIntent(){const id='reset-'+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now());return STORE.startReset(account,id)}
function confirmReset(id){activeBatch=null;return STORE.confirmReset(account,id)}
function pending(){return STORE.getPending(account)}
root.ScoreboardV2Sync={setAccount,enqueue,batch,acknowledge,markUnknown,retryUnknown,resetIntent,confirmReset,pending,read:()=>STORE.read(account),getAccount:()=>account};
})(typeof globalThis!=='undefined'?globalThis:this);
