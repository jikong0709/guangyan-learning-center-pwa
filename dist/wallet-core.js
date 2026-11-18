(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MeihaoWalletCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FUND_TYPES = Object.freeze(['snack', 'general', 'allowance']);
  const FUND_LABELS = Object.freeze({ snack: '零食金', general: '一般累積金', allowance: '零用金' });
  const TRANSACTION_TYPES = Object.freeze(['initial_funding', 'income', 'expense', 'transfer', 'refund', 'correction', 'scoreboard_snack']);
  const CATEGORIES = Object.freeze(['snack_food', 'non_food']);
  const ALLOWED_FUNDS = Object.freeze({ snack_food: ['snack', 'allowance'], non_food: ['snack', 'general', 'allowance'] });
  const RECORD_FIELDS = Object.freeze(['note', 'occurredAt', 'productName', 'storeName', 'sourceLabel', 'productUrl', 'description']);
  function fail(code, message) { const e = new Error(message); e.code = code; throw e; }
  function assert(ok, code, message) { if (!ok) fail(code, message); }
  function money(v, field) {
    const n = Number(v);
    assert(Number.isSafeInteger(n), 'INVALID_AMOUNT', (field || '金額') + '必須是安全整數（新臺幣元）。');
    return n;
  }
  function plainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function allocationFromEntries(entries) {
    const out = {};
    FUND_TYPES.forEach(f => { out[f] = 0; });
    (entries || []).forEach(e => { out[e.fundType] = (out[e.fundType] || 0) + e.delta; });
    return out;
  }
  function normalizeAllocation(value, type) {
    assert(plainObject(value), 'INVALID_ALLOCATION', '更正必須提供完整資金分配。');
    const out = {};
    FUND_TYPES.forEach(f => {
      const n = money(value[f] == null ? 0 : value[f], '資金分配');
      if (n !== 0) out[f] = n;
    });
    Object.keys(value).forEach(f => assert(FUND_TYPES.includes(f), 'INVALID_FUND', '不支援的資金分類。'));
    if (type === 'expense') Object.values(out).forEach(n => assert(n < 0, 'INVALID_ALLOCATION', '支出分配必須使用負數帳務分錄。'));
    if (type === 'refund') Object.values(out).forEach(n => assert(n > 0, 'INVALID_ALLOCATION', '退款分配必須使用正數帳務分錄。'));
    return out;
  }
  function allocationTotal(allocation) { return Object.values(allocation).reduce((n, v) => n + Math.abs(v), 0); }
  function validateExpenseAllocation(category, allocation) {
    assert(CATEGORIES.includes(category), 'INVALID_CATEGORY', '交易分類無效。');
    Object.keys(allocation).forEach(f => assert(ALLOWED_FUNDS[category].includes(f), 'FUND_NOT_ALLOWED', FUND_LABELS[f] + '不可用於此商品分類。'));
  }
  function validateOperation(input) {
    assert(plainObject(input), 'INVALID_OPERATION', '交易資料格式錯誤。');
    const type = String(input.type || '');
    assert(TRANSACTION_TYPES.includes(type), 'INVALID_TYPE', '不支援的帳務交易類型。');
    const amount = money(input.amount, '交易金額');
    assert(amount >= 0, 'INVALID_AMOUNT', '交易金額不可為負數。');
    const note = String(input.note || '').trim();
    assert(note.length > 0, 'NOTE_REQUIRED', '每筆帳務交易都必須填寫備註。');
    const entries = Array.isArray(input.entries) ? input.entries.map(x => {
      const fundType = String(x && x.fundType || '');
      const delta = money(x && x.delta, '資金異動');
      assert(FUND_TYPES.includes(fundType), 'INVALID_FUND', '不支援的資金分類。');
      assert(delta !== 0, 'ZERO_ENTRY', '資金異動不可為 0。');
      return { fundType, delta };
    }) : [];
    assert(new Set(entries.map(x => x.fundType)).size === entries.length, 'DUPLICATE_FUND_ENTRY', '同一筆交易不可重複列出相同資金分類。');
    const sum = entries.reduce((n, x) => n + x.delta, 0);
    const positive = entries.filter(x => x.delta > 0), negative = entries.filter(x => x.delta < 0);
    const positiveTotal = positive.reduce((n, x) => n + x.delta, 0);
    const negativeTotal = negative.reduce((n, x) => n - x.delta, 0);
    const category = input.category == null ? null : String(input.category);
    const reversalOf = input.reversalOf || null;
    const sourceType = input.sourceType == null ? null : String(input.sourceType);
    const sourceId = input.sourceId == null ? null : String(input.sourceId);
    if (type === 'initial_funding') {
      assert(category === null, 'INVALID_CATEGORY', '初始建帳不設定商品分類。');
      if (amount === 0) assert(entries.length === 0, 'INVALID_INITIAL_FUNDING', '零元初始建帳不可包含資金異動。');
      else assert(entries.length === 1 && entries[0].fundType === 'allowance' && entries[0].delta === amount, 'INVALID_INITIAL_FUNDING', '初始現金只能一次性建立於零用金。');
    } else if (type === 'income') {
      assert(amount > 0 && entries.length === 1 && entries[0].fundType === 'allowance' && positiveTotal === amount && negative.length === 0, 'INVALID_INCOME', '額外現金收入必須全額存入零用金。');
      assert(category === null, 'INVALID_CATEGORY', '收入不設定商品分類。');
    } else if (type === 'scoreboard_snack') {
      assert(amount > 0 && entries.length === 1 && entries[0].fundType === 'snack' && positiveTotal === amount && negative.length === 0, 'INVALID_SCOREBOARD_SNACK', '週結算 snackMoney 只能以新臺幣金額存入零食金。');
      assert(sourceType === 'scoreboard_weekly_settlement' && !!sourceId, 'SOURCE_REQUIRED', '計分板週結算入帳必須提供週期來源識別。');
      assert(category === null, 'INVALID_CATEGORY', '週結算零食金不設定商品分類。');
    } else if (type === 'expense') {
      assert(amount > 0 && entries.length > 0 && negativeTotal === amount && positive.length === 0, 'INVALID_EXPENSE', '支出資金異動總額必須等於支出金額。');
      validateExpenseAllocation(category, allocationFromEntries(entries));
    } else if (type === 'transfer') {
      assert(amount > 0 && entries.length === 2 && sum === 0 && positive.length === 1 && negative.length === 1 && positiveTotal === amount && negativeTotal === amount, 'INVALID_TRANSFER', '資金轉換必須等額轉出及轉入，且不改變總資產。');
      assert(category === null, 'INVALID_CATEGORY', '資金轉換不設定商品分類。');
    } else if (type === 'refund') {
      assert(amount > 0 && !!reversalOf && entries.length > 0 && positiveTotal === amount && negative.length === 0, 'INVALID_REFUND', '退款必須關聯原交易，並以正向資金異動返還。');
      assert(category === null || CATEGORIES.includes(category), 'INVALID_CATEGORY', '退款分類無效。');
    } else if (type === 'correction') {
      const gross = entries.reduce((n, x) => n + Math.abs(x.delta), 0);
      assert(amount > 0 && !!reversalOf && entries.length > 0 && gross === amount, 'INVALID_CORRECTION', '帳務更正必須關聯原交易，金額須等於更正分錄絕對值總和。');
      assert(category === null, 'INVALID_CATEGORY', '資金分類更正不設定商品分類。');
    }
    assert((sourceType === null) === (sourceId === null), 'INVALID_SOURCE', '來源識別必須成對提供。');
    return Object.freeze({ type, amount, category, note, entries: Object.freeze(entries.map(Object.freeze)), sourceType, sourceId,
      idempotencyKey: String(input.idempotencyKey || ''), reversalOf, occurredAt: input.occurredAt || new Date().toISOString(),
      metadata: plainObject(input.metadata) ? clone(input.metadata) : {} });
  }
  function createWalletEngine(options) {
    const userId = String(options && options.userId || 'local-user');
    const accounts = { snack: 0, general: 0, allowance: 0 }, transactions = [], correctionEvents = [];
    const byKey = new Map(), bySource = new Map();
    let initialDone = false;
    function summary() {
      const income = transactions.filter(x => ['income','initial_funding','scoreboard_snack'].includes(x.type)).reduce((n,x)=>n+x.amount,0)
        + transactions.filter(x=>x.type==='refund').reduce((n,x)=>n+effectiveTransaction(x.id).amount,0);
      const expense = transactions.filter(x=>x.type==='expense').reduce((n,x)=>n+effectiveTransaction(x.id).amount,0);
      const totalAssets = FUND_TYPES.reduce((n,k)=>n+accounts[k],0);
      return Object.freeze({ userId, totalAssets, income, expense, cumulativeSavings: totalAssets,
        balances: Object.freeze({ snack: accounts.snack, general: accounts.general, allowance: accounts.allowance }) });
    }
    function effectiveTransaction(targetId) {
      const tx = transactions.find(x => x.id === targetId);
      assert(!!tx && tx.type !== 'correction', 'ORIGINAL_NOT_FOUND', '找不到可更正的原始交易。');
      const events = correctionEvents.filter(e => e.targetTransactionId === targetId).sort((a,b)=>a.correctionNo-b.correctionNo);
      const base = { amount: tx.amount, category: tx.category, note: tx.note, occurredAt: tx.occurredAt,
        productName: null, storeName: null, sourceLabel: null, productUrl: null, description: null,
        fundAllocations: allocationFromEntries(tx.entries) };
      return events.reduce((state,e)=>Object.assign({},state,clone(e.afterSnapshot)),base);
    }
    function effectiveRefundTotal(expenseId) {
      return transactions.filter(t=>t.type==='refund' && t.reversalOf===expenseId)
        .reduce((n,t)=>n+effectiveTransaction(t.id).amount,0);
    }
    function effectiveRefundAllocations(expenseId) {
      const out = { snack:0, general:0, allowance:0 };
      transactions.filter(t=>t.type==='refund' && t.reversalOf===expenseId).forEach(t=>{
        const a=effectiveTransaction(t.id).fundAllocations;
        FUND_TYPES.forEach(f=>out[f]+=Number(a[f]||0));
      });
      return out;
    }
    function apply(input) {
      const op = validateOperation(input);
      assert(op.idempotencyKey.length > 0, 'IDEMPOTENCY_REQUIRED', '每筆帳務交易都必須提供唯一請求識別碼。');
      if (byKey.has(op.idempotencyKey)) return Object.freeze({ duplicate: true, transaction: byKey.get(op.idempotencyKey), summary: summary() });
      const sourceKey = op.sourceType && op.sourceId ? op.sourceType + ':' + op.sourceId : null;
      if (sourceKey && bySource.has(sourceKey)) return Object.freeze({ duplicate: true, transaction: bySource.get(sourceKey), summary: summary() });
      assert(!(op.type === 'initial_funding' && initialDone), 'INITIAL_FUNDING_EXISTS', '初始現金只能建立一次。');
      if (op.reversalOf) {
        const original = transactions.find(x => x.id === op.reversalOf);
        assert(!!original, 'ORIGINAL_NOT_FOUND', '找不到同一錢包內的原始交易。');
        if (op.type === 'refund') {
          assert(original.type === 'expense', 'ORIGINAL_NOT_REFUNDABLE', '退款只能關聯原始支出交易。');
          const effective = effectiveTransaction(original.id);
          const refunded = effectiveRefundTotal(original.id);
          assert(refunded + op.amount <= effective.amount, 'REFUND_EXCEEDS_ORIGINAL', '退款總額不可超過目前有效購買金額。');
          const prior = effectiveRefundAllocations(original.id);
          const allocation = allocationFromEntries(op.entries);
          op.entries.forEach(entry => {
            const originalDebit = Math.abs(Number(effective.fundAllocations[entry.fundType] || 0));
            assert(originalDebit > 0 && prior[entry.fundType] + entry.delta <= originalDebit, 'REFUND_FUND_MISMATCH', '退款必須退回目前有效購買使用的資金分類，且不可超過該分類可退上限。');
          });
          assert(allocationTotal(allocation) === op.amount, 'INVALID_REFUND', '退款資金分配總額不符。');
        }
        if (op.type === 'correction') fail('USE_CORRECTION_EVENT', '更正必須透過新增更正事件處理，不可直接建立一般 correction 交易。');
      }
      const deltas = op.entries.reduce((o,x)=>{o[x.fundType]=x.delta;return o;},{});
      FUND_TYPES.forEach(f=>assert(accounts[f]+Number(deltas[f]||0)>=0,'INSUFFICIENT_FUNDS',FUND_LABELS[f]+'餘額不足。'));
      const id = 'wallet-tx-' + (transactions.length+1);
      const rows = op.entries.map(x => { const before=accounts[x.fundType], after=before+x.delta; accounts[x.fundType]=after;
        return Object.freeze({ fundType:x.fundType, delta:x.delta, balanceBefore:before, balanceAfter:after }); });
      const tx = Object.freeze({ id, userId, type:op.type, amount:op.amount, category:op.category, note:op.note,
        sourceType:op.sourceType, sourceId:op.sourceId, reversalOf:op.reversalOf, occurredAt:op.occurredAt, entries:Object.freeze(rows), metadata:op.metadata });
      transactions.push(tx); byKey.set(op.idempotencyKey,tx); if(sourceKey)bySource.set(sourceKey,tx);
      if(op.type==='initial_funding')initialDone=true;
      return Object.freeze({ duplicate:false, transaction:tx, summary:summary() });
    }
    function correct(input) {
      assert(plainObject(input), 'INVALID_CORRECTION', '更正資料格式錯誤。');
      const key=String(input.idempotencyKey||'');
      assert(key.length>0,'IDEMPOTENCY_REQUIRED','更正必須提供唯一請求識別碼。');
      if(byKey.has(key)) return Object.freeze({duplicate:true,event:correctionEvents.find(e=>e.id===byKey.get(key).correctionEventId)||null,transaction:byKey.get(key),summary:summary()});
      const target=transactions.find(t=>t.id===input.targetTransactionId);
      assert(!!target && target.type!=='correction' && target.userId===userId,'ORIGINAL_NOT_FOUND','找不到同一孩子帳戶內可更正的原始交易。');
      const correctionType=String(input.correctionType||'');
      assert(['record_only','classification','financial'].includes(correctionType),'INVALID_CORRECTION_TYPE','更正類型無效。');
      const reason=String(input.reason||'').trim();
      assert(reason.length>0,'CORRECTION_REASON_REQUIRED','更正原因不可空白。');
      const before=effectiveTransaction(target.id);
      const after=clone(before);
      const changes=plainObject(input.changes)?clone(input.changes):{};
      assert(Object.keys(changes).length>0,'EMPTY_CORRECTION','沒有提供更正欄位。');
      const hasRefund=target.type==='expense' && transactions.some(t=>t.type==='refund'&&t.reversalOf===target.id);
      if(correctionType==='record_only'){
        Object.keys(changes).forEach(k=>assert(RECORD_FIELDS.includes(k),'IMMUTABLE_OR_FINANCIAL_FIELD','純資料更正不可修改帳務、來源識別或不可變欄位。'));
      } else if(correctionType==='classification'){
        assert(target.type==='expense','INVALID_CLASSIFICATION_TARGET','分類更正目前只適用於支出交易。');
        assert(!hasRefund,'PURCHASE_ALREADY_REFUNDED','原購買已有退款，不可再更正分類或資金分配。');
        Object.keys(changes).forEach(k=>assert(['category','fundAllocations'].includes(k),'INVALID_CLASSIFICATION_FIELD','分類更正只能修改分類及必要的資金分配。'));
      } else {
        assert(['expense','refund'].includes(target.type),'UNSUPPORTED_FINANCIAL_CORRECTION','金額更正目前只支援支出及退款交易。');
        if(target.type==='expense') assert(!hasRefund,'PURCHASE_ALREADY_REFUNDED','原購買已有退款，不可再更正金額、分類或資金分配。');
        Object.keys(changes).forEach(k=>assert(['amount','category','fundAllocations'].includes(k),'INVALID_FINANCIAL_FIELD','金額更正只能修改金額、分類及資金分配。'));
      }
      Object.assign(after,changes);
      if(after.note!=null) after.note=String(after.note).trim();
      if(Object.prototype.hasOwnProperty.call(changes,'occurredAt')) {
        assert(after.occurredAt!=null && !Number.isNaN(Date.parse(after.occurredAt)),'INVALID_DATE','更正日期格式錯誤。');
      }
      if(correctionType!=='record_only'){
        after.amount=money(after.amount,'修正後金額');
        assert(after.amount>0,'INVALID_AMOUNT','修正後金額必須大於 0。');
        after.fundAllocations=normalizeAllocation(after.fundAllocations,target.type);
        assert(allocationTotal(after.fundAllocations)===after.amount,'ALLOCATION_TOTAL_MISMATCH','修正後資金分配總額必須等於修正後金額。');
        if(target.type==='expense') validateExpenseAllocation(after.category,after.fundAllocations);
        if(target.type==='refund'){
          const original=transactions.find(t=>t.id===target.reversalOf);
          assert(!!original&&original.type==='expense','ORIGINAL_NOT_FOUND','找不到退款所屬原購買。');
          const effectivePurchase=effectiveTransaction(original.id);
          const refundedElsewhere=transactions.filter(t=>t.type==='refund'&&t.reversalOf===original.id&&t.id!==target.id).reduce((n,t)=>n+effectiveTransaction(t.id).amount,0);
          assert(refundedElsewhere+after.amount<=effectivePurchase.amount,'REFUND_EXCEEDS_ORIGINAL','更正後退款總額超過原購買有效金額。');
          const originalAlloc=effectivePurchase.fundAllocations;
          const refundOriginalAlloc=before.fundAllocations||{};
          Object.keys(after.fundAllocations).forEach(f=>{
            assert(Number(refundOriginalAlloc[f]||0)>0,'REFUND_FUND_MISMATCH','退款更正只能調整該筆退款原本入帳的資金分類。');
            assert(Number(after.fundAllocations[f])<=Math.abs(Number(originalAlloc[f]||0)),'REFUND_FUND_MISMATCH','退款更正不可超過原購買該資金分類的扣款額。');
          });
          const others=effectiveRefundAllocations(original.id);
          Object.keys(after.fundAllocations).forEach(f=>assert(Number(others[f]||0)-Number(effectiveTransaction(target.id).fundAllocations[f]||0)+Number(after.fundAllocations[f])<=Math.abs(Number(originalAlloc[f]||0)),'REFUND_FUND_MISMATCH','退款更正後超過原購買該資金分類可退上限。'));
        }
      }
      const oldAlloc=before.fundAllocations||{}, newAlloc=after.fundAllocations||oldAlloc;
      const net={};
      FUND_TYPES.forEach(f=>{const d=Number(newAlloc[f]||0)-Number(oldAlloc[f]||0);if(d!==0)net[f]=d;});
      const hasFinancialDelta=Object.keys(net).length>0;
      if(correctionType==='record_only') assert(!hasFinancialDelta,'INVALID_RECORD_ONLY','純資料更正不得產生帳務異動。');
      if(correctionType==='classification' && hasFinancialDelta) assert(!hasRefund,'PURCHASE_ALREADY_REFUNDED','原購買已有退款，不可更正資金分配。');
      const balancesBefore=clone(accounts);
      FUND_TYPES.forEach(f=>assert(accounts[f]+Number(net[f]||0)>=0,'INSUFFICIENT_FUNDS',FUND_LABELS[f]+'餘額不足，更正整筆取消。'));
      const correctionNo=correctionEvents.filter(e=>e.targetTransactionId===target.id).length+1;
      const previous=correctionEvents.filter(e=>e.targetTransactionId===target.id).sort((a,b)=>b.correctionNo-a.correctionNo)[0]||null;
      const eventId='wallet-correction-'+(correctionEvents.length+1);
      let correctionTx=null;
      if(hasFinancialDelta){
        const entries=FUND_TYPES.filter(f=>net[f]).map(f=>({fundType:f,delta:net[f],balanceBefore:accounts[f],balanceAfter:accounts[f]+net[f]}));
        entries.forEach(e=>{accounts[e.fundType]=e.balanceAfter;});
        const gross=entries.reduce((n,e)=>n+Math.abs(e.delta),0);
        correctionTx=Object.freeze({id:'wallet-tx-'+(transactions.length+1),userId,type:'correction',amount:gross,category:null,note:reason,
          sourceType:null,sourceId:null,reversalOf:target.id,correctionEventId:eventId,occurredAt:new Date().toISOString(),entries:Object.freeze(entries.map(Object.freeze)),
          metadata:Object.freeze({correctionEventId:eventId,revisionNo:correctionNo,beforeAllocation:oldAlloc,afterAllocation:newAlloc})});
        transactions.push(correctionTx);
      }
      const fieldChanges={};
      Object.keys(changes).forEach(k=>{fieldChanges[k]={before:clone(before[k]),after:clone(after[k])};});
      const event=Object.freeze({id:eventId,userId,targetTransactionId:target.id,correctionNo,correctionType,reason,
        beforeSnapshot:Object.freeze(clone(before)),afterSnapshot:Object.freeze(clone(after)),fieldChanges:Object.freeze(fieldChanges),
        correctionTransactionId:correctionTx?correctionTx.id:null,idempotencyKey:key,createdBy:userId,createdAt:new Date().toISOString(),
        previousCorrectionEventId:previous?previous.id:null});
      correctionEvents.push(event);
      const resultTx=correctionTx||Object.freeze({id:eventId,type:'correction_event',userId,correctionEventId:eventId,reversalOf:target.id,entries:Object.freeze([])});
      byKey.set(key,resultTx);
      return Object.freeze({duplicate:false,event,transaction:correctionTx,summary:summary(),balancesBefore:Object.freeze(balancesBefore)});
    }
    return Object.freeze({ userId, apply, correct, summary, listTransactions:()=>transactions.slice(),
      listCorrectionEvents:()=>correctionEvents.slice(), getEffectiveTransaction:effectiveTransaction });
  }
  function createWalletService(supabase) {
    if (!supabase || typeof supabase.rpc!=='function' || typeof supabase.from!=='function') fail('INVALID_SUPABASE_CLIENT','請提供已登入的 Supabase client。');
    return Object.freeze({
      async getAccounts() { const r=await supabase.from('wallet_accounts').select('fund_type,balance,updated_at').order('fund_type'); if(r.error)throw r.error; return r.data||[]; },
      async getTransactions(limit) { const r=await supabase.from('wallet_transactions').select('id,transaction_type,amount,category,note,source_type,source_id,reversal_of,occurred_at,created_at,metadata').order('occurred_at',{ascending:false}).limit(Math.min(Math.max(Number(limit)||50,1),200)); if(r.error)throw r.error; return r.data||[]; },
      async getEntries(ids) { const keys=Array.isArray(ids)?ids.filter(Boolean):[]; if(!keys.length)return []; const r=await supabase.from('wallet_entries').select('transaction_id,fund_type,amount_delta,balance_before,balance_after,created_at').in('transaction_id',keys); if(r.error)throw r.error; return r.data||[]; },
      async getCorrectionEvents(ids) {
        const keys=Array.isArray(ids)?ids.filter(Boolean):[];
        let q=supabase.from('wallet_correction_events').select('*').order('correction_no',{ascending:true});
        if(keys.length)q=q.in('target_transaction_id',keys);
        const r=await q; if(r.error)throw r.error;
        const normalizeSnapshot=s=>{
          const out=Object.assign({},s||{});
          if(Object.prototype.hasOwnProperty.call(out,'occurred_at')){out.occurredAt=out.occurred_at;delete out.occurred_at;}
          if(Object.prototype.hasOwnProperty.call(out,'fund_allocations')){out.fundAllocations=out.fund_allocations;delete out.fund_allocations;}
          return out;
        };
        return (r.data||[]).map(row=>({
          id:row.id,userId:row.user_id,targetTransactionId:row.target_transaction_id,correctionNo:row.correction_no,
          correctionType:row.correction_type,reason:row.reason,beforeSnapshot:normalizeSnapshot(row.before_snapshot),
          afterSnapshot:normalizeSnapshot(row.after_snapshot),fieldChanges:row.field_changes,
          correctionTransactionId:row.correction_transaction_id,idempotencyKey:row.idempotency_key,
          createdBy:row.created_by,createdAt:row.created_at,previousCorrectionEventId:row.previous_correction_event_id
        }));
      },
      async getEffectiveTransaction(id) {
        const r=await supabase.from('wallet_transactions').select('*').eq('id',id).single();
        if(r.error)throw r.error;
        const entries=await this.getEntries([id]);
        const allocations={};
        entries.forEach(e=>{allocations[e.fund_type]=Number(e.amount_delta);});
        const effective={amount:Number(r.data.amount),category:r.data.category,note:r.data.note,
          occurredAt:r.data.occurred_at,fundAllocations:allocations};
        const events=await this.getCorrectionEvents([id]);
        events.forEach(e=>Object.assign(effective,e.afterSnapshot));
        return {transaction:r.data,effective,correctionEvents:events};
      },
      async post(input) {
        const op=validateOperation(input);
        assert(op.type!=='refund'&&op.type!=='correction','USE_SPECIALIZED_RPC','退款與更正必須使用專用原子 RPC。');
        assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(op.idempotencyKey),'INVALID_IDEMPOTENCY_UUID','送往資料庫的請求識別碼必須使用 UUID。');
        const r=await supabase.rpc('wallet_apply_transaction',{p_idempotency_key:op.idempotencyKey,p_transaction_type:op.type,p_amount:op.amount,
          p_entries:op.entries.map(x=>({fund_type:x.fundType,amount_delta:x.delta})),p_category:op.category,p_note:op.note,p_occurred_at:op.occurredAt,
          p_source_type:op.sourceType,p_source_id:op.sourceId,p_reversal_of:op.reversalOf,p_metadata:op.metadata});
        if(r.error)throw r.error; return r.data;
      },
      async refund(input) {
        const op=validateOperation(Object.assign({},input,{type:'refund'}));
        assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(op.idempotencyKey),'INVALID_IDEMPOTENCY_UUID','退款請求識別碼必須使用 UUID。');
        const r=await supabase.rpc('wallet_apply_refund',{p_idempotency_key:op.idempotencyKey,p_original_transaction_id:op.reversalOf,p_amount:op.amount,
          p_entries:op.entries.map(x=>({fund_type:x.fundType,amount_delta:x.delta})),p_note:op.note,p_occurred_at:op.occurredAt,p_source_type:op.sourceType,p_source_id:op.sourceId});
        if(r.error)throw r.error; return r.data;
      },
      async correct(input) {
        assert(plainObject(input)&&plainObject(input.changes),'INVALID_CORRECTION','更正資料格式錯誤。');
        const idempotencyKey=String(input.idempotencyKey||'');
        assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey),'INVALID_IDEMPOTENCY_UUID','更正請求識別碼必須使用 UUID。');
        const keyMap={fundAllocations:'fund_allocations',occurredAt:'occurred_at'};
        const databaseChanges={};
        Object.keys(input.changes).forEach(k=>{databaseChanges[keyMap[k]||k]=input.changes[k];});
        const r=await supabase.rpc('wallet_apply_correction',{p_idempotency_key:idempotencyKey,p_target_transaction_id:input.targetTransactionId,
          p_correction_type:input.correctionType,p_reason:input.reason,p_changes:databaseChanges});
        if(r.error)throw r.error; return r.data;
      }
    });
  }
  return Object.freeze({ FUND_TYPES, FUND_LABELS, TRANSACTION_TYPES, CATEGORIES, ALLOWED_FUNDS, validateOperation, createWalletEngine, createWalletService });
});
