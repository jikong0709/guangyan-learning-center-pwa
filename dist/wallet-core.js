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
  function fail(code, message) { const e = new Error(message); e.code = code; throw e; }
  function assert(ok, code, message) { if (!ok) fail(code, message); }
  function money(v, field) {
    const n = Number(v);
    assert(Number.isSafeInteger(n), 'INVALID_AMOUNT', (field || '金額') + '必須是安全整數（新臺幣元）。');
    return n;
  }
  function validateOperation(input) {
    assert(input && typeof input === 'object', 'INVALID_OPERATION', '交易資料格式錯誤。');
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
      assert(CATEGORIES.includes(category), 'INVALID_CATEGORY', '支出必須指定零食飲料或非食品分類。');
      entries.forEach(x => assert(ALLOWED_FUNDS[category].includes(x.fundType), 'FUND_NOT_ALLOWED', FUND_LABELS[x.fundType] + '不可用於此商品分類。'));
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
    return Object.freeze({ type, amount, category, note, entries: Object.freeze(entries.map(Object.freeze)), sourceType, sourceId,
      idempotencyKey: String(input.idempotencyKey || ''), reversalOf, occurredAt: input.occurredAt || new Date().toISOString(),
      metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {} });
  }
  function createWalletEngine(options) {
    const userId = String(options && options.userId || 'local-user');
    const accounts = { snack: 0, general: 0, allowance: 0 }, transactions = [];
    const byKey = new Map(), bySource = new Map();
    let initialDone = false;
    function summary() {
      const income = transactions.filter(x => ['income','initial_funding','refund','scoreboard_snack'].includes(x.type)).reduce((n,x)=>n+x.amount,0);
      const expense = transactions.filter(x=>x.type==='expense').reduce((n,x)=>n+x.amount,0);
      const totalAssets = FUND_TYPES.reduce((n,k)=>n+accounts[k],0);
      return Object.freeze({ userId, totalAssets, income, expense, cumulativeSavings: totalAssets,
        balances: Object.freeze({ snack: accounts.snack, general: accounts.general, allowance: accounts.allowance }) });
    }
    function apply(input) {
      const op = validateOperation(input);
      assert(op.idempotencyKey.length > 0, 'IDEMPOTENCY_REQUIRED', '每筆交易都必須提供唯一請求識別碼。');
      if (byKey.has(op.idempotencyKey)) return Object.freeze({ duplicate: true, transaction: byKey.get(op.idempotencyKey), summary: summary() });
      const sourceKey = op.sourceType && op.sourceId ? op.sourceType + ':' + op.sourceId : null;
      if (sourceKey && bySource.has(sourceKey)) return Object.freeze({ duplicate: true, transaction: bySource.get(sourceKey), summary: summary() });
      assert(!(op.type === 'initial_funding' && initialDone), 'INITIAL_FUNDING_EXISTS', '初始現金只能建立一次。');
      if (op.reversalOf) {
        const original = transactions.find(x => x.id === op.reversalOf);
        assert(!!original, 'ORIGINAL_NOT_FOUND', '找不到同一錢包內的原始交易。');
        if (op.type === 'refund') {
          assert(original.type === 'expense', 'ORIGINAL_NOT_REFUNDABLE', '退款只能關聯原始支出交易。');
          const refunded = transactions.filter(x=>x.type==='refund' && x.reversalOf===op.reversalOf).reduce((n,x)=>n+x.amount,0);
          assert(refunded + op.amount <= original.amount, 'REFUND_EXCEEDS_ORIGINAL', '退款總額不可超過原始支出金額。');
          op.entries.forEach(entry => {
            const originalDebit = original.entries.filter(x=>x.fundType===entry.fundType && x.delta<0).reduce((n,x)=>n-x.delta,0);
            const prior = transactions.filter(x=>x.type==='refund' && x.reversalOf===op.reversalOf).flatMap(x=>x.entries).filter(x=>x.fundType===entry.fundType && x.delta>0).reduce((n,x)=>n+x.delta,0);
            assert(originalDebit > 0 && prior + entry.delta <= originalDebit, 'REFUND_FUND_MISMATCH', '退款必須退回原支出使用的資金分類，且不可超過該分類原扣款額。');
          });
        }
      }
      op.entries.forEach(x=>assert(accounts[x.fundType]+x.delta>=0,'INSUFFICIENT_FUNDS',FUND_LABELS[x.fundType]+'餘額不足。'));
      const id = 'wallet-tx-' + (transactions.length+1);
      const rows = op.entries.map(x => { const before=accounts[x.fundType], after=before+x.delta; accounts[x.fundType]=after;
        return Object.freeze({ fundType:x.fundType, delta:x.delta, balanceBefore:before, balanceAfter:after }); });
      const tx = Object.freeze({ id, userId, type:op.type, amount:op.amount, category:op.category, note:op.note,
        sourceType:op.sourceType, sourceId:op.sourceId, reversalOf:op.reversalOf, occurredAt:op.occurredAt, entries:Object.freeze(rows) });
      transactions.push(tx); byKey.set(op.idempotencyKey,tx); if(sourceKey)bySource.set(sourceKey,tx);
      if(op.type==='initial_funding')initialDone=true;
      return Object.freeze({ duplicate:false, transaction:tx, summary:summary() });
    }
    return Object.freeze({ userId, apply, summary, listTransactions:()=>transactions.slice() });
  }
  function createWalletService(supabase) {
    if (!supabase || typeof supabase.rpc!=='function' || typeof supabase.from!=='function') fail('INVALID_SUPABASE_CLIENT','請提供已登入的 Supabase client。');
    return Object.freeze({
      async getAccounts() { const r=await supabase.from('wallet_accounts').select('fund_type,balance,updated_at').order('fund_type'); if(r.error)throw r.error; return r.data||[]; },
      async getTransactions(limit) { const r=await supabase.from('wallet_transactions').select('id,transaction_type,amount,category,note,source_type,source_id,reversal_of,occurred_at,created_at').order('occurred_at',{ascending:false}).limit(Math.min(Math.max(Number(limit)||50,1),200)); if(r.error)throw r.error; return r.data||[]; },
      async getEntries(ids) { const keys=Array.isArray(ids)?ids.filter(Boolean):[]; if(!keys.length)return []; const r=await supabase.from('wallet_entries').select('transaction_id,fund_type,amount_delta,balance_before,balance_after,created_at').in('transaction_id',keys); if(r.error)throw r.error; return r.data||[]; },
      async post(input) {
        const op=validateOperation(input);
        assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(op.idempotencyKey),'INVALID_IDEMPOTENCY_UUID','送往資料庫的請求識別碼必須使用 UUID。');
        const r=await supabase.rpc('wallet_apply_transaction',{p_idempotency_key:op.idempotencyKey,p_transaction_type:op.type,p_amount:op.amount,
          p_entries:op.entries.map(x=>({fund_type:x.fundType,amount_delta:x.delta})),p_category:op.category,p_note:op.note,p_occurred_at:op.occurredAt,
          p_source_type:op.sourceType,p_source_id:op.sourceId,p_reversal_of:op.reversalOf,p_metadata:op.metadata});
        if(r.error)throw r.error; return r.data;
      }
    });
  }
  return Object.freeze({ FUND_TYPES, FUND_LABELS, TRANSACTION_TYPES, CATEGORIES, ALLOWED_FUNDS, validateOperation, createWalletEngine, createWalletService });
});
