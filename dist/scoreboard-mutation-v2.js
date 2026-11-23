/* Scoreboard P1 V2 foundations: Mutation Identity, Idempotency, Account Scope, Reset Epoch.
 * Client-side foundation only; server-authoritative RPC enforcement is required before integration.
 */
(function(root){
'use strict';
const PREFIX='berry-scoreboard-v2';
const STATUS={PENDING:'PENDING',UNKNOWN:'UNKNOWN',ACKNOWLEDGED:'ACKNOWLEDGED',RECOVERY_REQUIRED:'RECOVERY_REQUIRED'};
function createStore(storage){
 storage=storage||root.localStorage;
 const keyFor=u=>PREFIX+':'+encodeURIComponent(u);
 function read(u){if(!u)throw new Error('userId required');try{return JSON.parse(storage.getItem(keyFor(u))||'null')||{userId:u,epoch:0,sequence:0,mutations:[],resetIntent:null}}catch(e){throw new Error('Store corrupt; recovery required')}}
 function write(u,s){if(s.userId!==u)throw new Error('Account scope mismatch');storage.setItem(keyFor(u),JSON.stringify(s));return s}
 function createMutation(u,i){const s=read(u);if(!i||!i.operation||!i.entityType)throw new Error('operation/entityType required');const id=i.mutationId||(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():'mutation-'+Date.now());const payloadHash=JSON.stringify(i.payload??null);const old=s.mutations.find(m=>m.mutationId===id);if(old){if(old.payloadHash!==payloadHash)throw new Error('Idempotency key reused with different payload');return old}
 const m={mutationId:id,userId:u,entityType:i.entityType,entityId:i.entityId||null,operation:i.operation,payload:i.payload??null,createdAt:new Date().toISOString(),sequence:++s.sequence,baseRevision:i.baseRevision??null,resetEpoch:s.epoch,batchId:i.batchId||null,status:STATUS.PENDING,dependencyIds:Array.isArray(i.dependencyIds)?i.dependencyIds.slice():[],payloadHash};s.mutations.push(m);write(u,s);return m}
 function markUnknown(u,id){const s=read(u),m=s.mutations.find(x=>x.mutationId===id);if(!m)throw new Error('Mutation not found');if(m.status!==STATUS.ACKNOWLEDGED)m.status=STATUS.UNKNOWN;write(u,s);return m}
 function acknowledge(u,ids){const set=new Set(ids||[]),s=read(u);s.mutations.forEach(m=>{if(set.has(m.mutationId)&&m.userId===u&&m.resetEpoch===s.epoch)m.status=STATUS.ACKNOWLEDGED});write(u,s);return s}
 function startReset(u,id){const s=read(u);if(s.resetIntent&&s.resetIntent.resetStatus==='PENDING'){if(s.resetIntent.resetRequestId===id)return s.resetIntent;throw new Error('Reset already pending; reconcile existing request')}if(s.resetIntent&&s.resetIntent.resetRequestId===id)return s.resetIntent;s.resetIntent={resetRequestId:id,userId:u,previousEpoch:s.epoch,targetEpoch:s.epoch+1,createdAt:new Date().toISOString(),resetStatus:'PENDING',pendingMutationIds:s.mutations.filter(m=>m.status!==STATUS.ACKNOWLEDGED).map(m=>m.mutationId)};write(u,s);return s.resetIntent}
 function confirmReset(u,id){const s=read(u),r=s.resetIntent;if(!r||r.resetRequestId!==id)throw new Error('Reset request mismatch');if(r.resetStatus==='ACKNOWLEDGED')return s;s.epoch=r.targetEpoch;r.resetStatus='ACKNOWLEDGED';s.mutations.forEach(m=>{if(m.resetEpoch<s.epoch&&m.status!==STATUS.ACKNOWLEDGED)m.status=STATUS.RECOVERY_REQUIRED});write(u,s);return s}
 function getPending(u){const s=read(u);return s.mutations.filter(m=>m.userId===u&&m.resetEpoch===s.epoch&&m.status!==STATUS.ACKNOWLEDGED)}
 return {read,createMutation,markUnknown,acknowledge,startReset,confirmReset,getPending}
}
const api={createStore,STATUS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ScoreboardMutationV2=api;
})(typeof globalThis!=='undefined'?globalThis:this);
