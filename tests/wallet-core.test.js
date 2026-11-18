'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Wallet = require('../dist/wallet-core');

function op(overrides) {
  return Object.assign({
    type: 'income', amount: 100, entries: [{ fundType: 'allowance', delta: 100 }],
    note: '測試收入', idempotencyKey: 'request-1'
  }, overrides || {});
}

test('額外現金收入只能入零用金', () => {
  const wallet = Wallet.createWalletEngine({ userId: 'u1' });
  const result = wallet.apply(op());
  assert.equal(result.summary.balances.allowance, 100);
  assert.equal(result.summary.totalAssets, 100);
  assert.throws(() => Wallet.validateOperation(op({ entries: [{ fundType: 'snack', delta: 100 }] })), { code: 'INVALID_INCOME' });
});

test('零食飲料只能由零食金與零用金支付', () => {
  const wallet = Wallet.createWalletEngine({ userId: 'u1' });
  wallet.apply(op({ type: 'initial_funding', amount: 100, entries: [{ fundType: 'allowance', delta: 100 }] }));
  assert.throws(() => wallet.apply(op({ type: 'expense', amount: 20, category: 'snack_food', entries: [{ fundType: 'general', delta: -20 }], idempotencyKey: 'food-1' })), { code: 'FUND_NOT_ALLOWED' });
  const paid = wallet.apply(op({ type: 'expense', amount: 20, category: 'snack_food', entries: [{ fundType: 'allowance', delta: -20 }], idempotencyKey: 'food-2' }));
  assert.equal(paid.summary.balances.allowance, 80);
});

test('非食品可由三種資金支付，且不得超支', () => {
  const wallet = Wallet.createWalletEngine({ userId: 'u1' });
  wallet.apply(op({ type: 'initial_funding', amount: 100, entries: [{ fundType: 'allowance', delta: 100 }] }));
  wallet.apply(op({ type: 'transfer', amount: 30, entries: [{ fundType: 'allowance', delta: -30 }, { fundType: 'general', delta: 30 }], idempotencyKey: 'transfer-1' }));
  const paid = wallet.apply(op({ type: 'expense', amount: 20, category: 'non_food', entries: [{ fundType: 'general', delta: -20 }], idempotencyKey: 'nonfood-1' }));
  assert.equal(paid.summary.balances.general, 10);
  assert.equal(paid.summary.totalAssets, 80);
  assert.throws(() => wallet.apply(op({ type: 'expense', amount: 11, category: 'non_food', entries: [{ fundType: 'general', delta: -11 }], idempotencyKey: 'nonfood-2' })), { code: 'INSUFFICIENT_FUNDS' });
});

test('資金用途轉換不改變總資產，並保留交易前後餘額', () => {
  const wallet = Wallet.createWalletEngine({ userId: 'u1' });
  wallet.apply(op({ type: 'initial_funding', amount: 100, entries: [{ fundType: 'allowance', delta: 100 }] }));
  const result = wallet.apply(op({ type: 'transfer', amount: 25, entries: [{ fundType: 'allowance', delta: -25 }, { fundType: 'snack', delta: 25 }], idempotencyKey: 'transfer-1' }));
  assert.equal(result.summary.totalAssets, 100);
  const byFund = Object.fromEntries(result.transaction.entries.map(x => [x.fundType, [x.balanceBefore, x.balanceAfter]]));
  assert.deepEqual(byFund.snack, [0, 25]);
  assert.deepEqual(byFund.allowance, [100, 75]);
});

test('初始建帳只能執行一次', () => {
  const wallet = Wallet.createWalletEngine({ userId: 'u1' });
  wallet.apply(op({ type: 'initial_funding', amount: 0, entries: [], idempotencyKey: 'initial-1' }));
  assert.throws(() => wallet.apply(op({ type: 'initial_funding', amount: 10, entries: [{ fundType: 'allowance', delta: 10 }], idempotencyKey: 'initial-2' })), { code: 'INITIAL_FUNDING_EXISTS' });
});

test('請求識別碼與來源識別均可防止重複入帳', () => {
  const wallet = Wallet.createWalletEngine({ userId: 'u1' });
  const first = wallet.apply(op({ sourceType: 'cash_income', sourceId: 'gift-1' }));
  const retry = wallet.apply(op({ sourceType: 'cash_income', sourceId: 'gift-1' }));
  const sourceRetry = wallet.apply(op({ idempotencyKey: 'request-2', sourceType: 'cash_income', sourceId: 'gift-1' }));
  assert.equal(first.duplicate, false);
  assert.equal(retry.duplicate, true);
  assert.equal(sourceRetry.duplicate, true);
  assert.equal(wallet.summary().totalAssets, 100);
});

test('計分板週結算金額只能入零食金並要求週期來源識別', () => {
  const valid = Wallet.validateOperation(op({ type: 'scoreboard_snack', amount: 100, entries: [{ fundType: 'snack', delta: 100 }], sourceType: 'scoreboard_weekly_settlement', sourceId: '2026-11-13' }));
  assert.equal(valid.type, 'scoreboard_snack');
  assert.throws(() => Wallet.validateOperation(op({ type: 'scoreboard_snack', amount: 100, entries: [{ fundType: 'general', delta: 100 }], sourceType: 'scoreboard_weekly_settlement', sourceId: '2026-11-13' })), { code: 'INVALID_SCOREBOARD_SNACK' });
});

test('長期積分不屬於錢包金額交易類型，不得自動兌換', () => {
  assert.throws(() => Wallet.validateOperation(op({ type: 'long_term_points', amount: 50, entries: [{ fundType: 'general', delta: 50 }] })), { code: 'INVALID_TYPE' });
});

test('每筆交易必須有備註，且更正必須關聯原交易並保留分錄', () => {
  assert.throws(() => Wallet.validateOperation(op({ note: '  ' })), { code: 'NOTE_REQUIRED' });
  assert.throws(() => Wallet.validateOperation(op({ type: 'correction', amount: 10, entries: [{ fundType: 'snack', delta: -10 }] })), { code: 'INVALID_CORRECTION' });
  const wallet = Wallet.createWalletEngine({ userId: 'u1' });
  const original = wallet.apply(op({ type: 'initial_funding', amount: 100, entries: [{ fundType: 'allowance', delta: 100 }], idempotencyKey: 'initial-1' }));
  assert.throws(() => wallet.apply(op({ type: 'correction', amount: 10, entries: [{ fundType: 'allowance', delta: -10 }], reversalOf: original.transaction.id, idempotencyKey: 'correction-legacy' })), { code: 'USE_CORRECTION_EVENT' });
  const correction = wallet.correct({
    targetTransactionId: original.transaction.id,
    correctionType: 'financial',
    reason: '初始建帳金額修正',
    changes: { amount: 90, fundAllocations: { allowance: 90 } },
    idempotencyKey: 'correction-1'
  });
  assert.equal(correction.summary.balances.allowance, 90);
  assert.equal(correction.transaction.reversalOf, original.transaction.id);
});

test('退款只能退回原支出資金來源，且累計退款不可超額', () => {
  const wallet = Wallet.createWalletEngine({ userId: 'u1' });
  wallet.apply(op({ type: 'initial_funding', amount: 100, entries: [{ fundType: 'allowance', delta: 100 }], idempotencyKey: 'initial-refund' }));
  const expense = wallet.apply(op({ type: 'expense', amount: 50, category: 'non_food', entries: [{ fundType: 'allowance', delta: -50 }], idempotencyKey: 'expense-refund' }));
  wallet.apply(op({ type: 'refund', amount: 30, entries: [{ fundType: 'allowance', delta: 30 }], reversalOf: expense.transaction.id, idempotencyKey: 'refund-1' }));
  assert.throws(() => wallet.apply(op({ type: 'refund', amount: 21, entries: [{ fundType: 'allowance', delta: 21 }], reversalOf: expense.transaction.id, idempotencyKey: 'refund-2' })), { code: 'REFUND_EXCEEDS_ORIGINAL' });
  assert.throws(() => wallet.apply(op({ type: 'refund', amount: 1, entries: [{ fundType: 'snack', delta: 1 }], reversalOf: expense.transaction.id, idempotencyKey: 'refund-3' })), { code: 'REFUND_FUND_MISMATCH' });
});

function fundedWallet(amount) {
  const wallet = Wallet.createWalletEngine({ userId: 'child-1' });
  wallet.apply(op({ type: 'initial_funding', amount, entries: [{ fundType: 'allowance', delta: amount }], idempotencyKey: 'seed-' + amount }));
  return wallet;
}
function transfer(wallet, fundType, amount, key) {
  return wallet.apply(op({ type: 'transfer', amount, entries: [
    { fundType: 'allowance', delta: -amount }, { fundType, delta: amount }
  ], idempotencyKey: key }));
}

test('純資料更正只新增事件與快照，不改變資金、資產或原交易', () => {
  const wallet = fundedWallet(100);
  const expense = wallet.apply(op({ type: 'expense', amount: 20, category: 'non_food',
    entries: [{ fundType: 'allowance', delta: -20 }], idempotencyKey: 'meta-expense' }));
  const before = wallet.summary();
  const result = wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'record_only',
    reason: '修正店家顯示名稱', changes: { storeName: '正確店名', note: '修正後備註' }, idempotencyKey: 'meta-correction' });
  assert.equal(result.transaction, null);
  assert.equal(result.event.correctionNo, 1);
  assert.equal(result.event.beforeSnapshot.note, '測試收入');
  assert.equal(result.event.afterSnapshot.storeName, '正確店名');
  assert.deepEqual(wallet.summary(), before);
  assert.equal(wallet.listTransactions().length, 2);
  assert.equal(wallet.getEffectiveTransaction(expense.transaction.id).storeName, '正確店名');
});

test('純資料更正不得改動金額、分類、資金分配或來源防重識別', () => {
  const wallet = fundedWallet(100);
  const expense = wallet.apply(op({ type: 'expense', amount: 20, category: 'non_food',
    entries: [{ fundType: 'allowance', delta: -20 }], idempotencyKey: 'meta-guard' }));
  assert.throws(() => wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'record_only',
    reason: '錯誤操作', changes: { amount: 10 }, idempotencyKey: 'meta-guard-2' }), { code: 'IMMUTABLE_OR_FINANCIAL_FIELD' });
  assert.equal(wallet.listCorrectionEvents().length, 0);
});

test('分類更正重新驗證資金用途，並可透過淨差額重新分配', () => {
  const wallet = fundedWallet(100);
  transfer(wallet, 'general', 30, 'class-transfer');
  const expense = wallet.apply(op({ type: 'expense', amount: 20, category: 'non_food',
    entries: [{ fundType: 'general', delta: -10 }, { fundType: 'allowance', delta: -10 }], idempotencyKey: 'class-expense' }));
  assert.throws(() => wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'classification',
    reason: '改為零食分類', changes: { category: 'snack_food' }, idempotencyKey: 'class-invalid' }), { code: 'FUND_NOT_ALLOWED' });
  const result = wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'classification',
    reason: '改為零食分類並調整資金', changes: { category: 'snack_food', fundAllocations: { allowance: -20 } }, idempotencyKey: 'class-valid' });
  assert.equal(result.transaction.entries[0].delta, 10);
  assert.equal(result.transaction.entries[1].delta, -10);
  assert.equal(wallet.getEffectiveTransaction(expense.transaction.id).category, 'snack_food');
});

test('混合資金金額更正可同時補回一種資金並扣除另一種資金', () => {
  const wallet = fundedWallet(100);
  transfer(wallet, 'general', 30, 'mix-general');
  transfer(wallet, 'snack', 20, 'mix-snack');
  const expense = wallet.apply(op({ type: 'expense', amount: 40, category: 'non_food',
    entries: [{ fundType: 'snack', delta: -10 }, { fundType: 'general', delta: -20 }, { fundType: 'allowance', delta: -10 }],
    idempotencyKey: 'mix-expense' }));
  const result = wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'financial',
    reason: '修正各資金實際扣款', changes: { amount: 35, fundAllocations: { snack: -15, general: -10, allowance: -10 } },
    idempotencyKey: 'mix-financial' });
  const deltas = Object.fromEntries(result.transaction.entries.map(e => [e.fundType, e.delta]));
  assert.deepEqual(deltas, { snack: -5, general: 10 });
  assert.equal(result.transaction.amount, 15);
  assert.equal(wallet.summary().balances.snack, 5);
  assert.equal(wallet.summary().balances.general, 20);
  assert.equal(wallet.getEffectiveTransaction(expense.transaction.id).amount, 35);
});

test('金額更正任一資金不足時整筆回滾，不留下更正事件或部分分錄', () => {
  const wallet = fundedWallet(50);
  const expense = wallet.apply(op({ type: 'expense', amount: 40, category: 'non_food',
    entries: [{ fundType: 'allowance', delta: -40 }], idempotencyKey: 'atomic-expense' }));
  const before = wallet.summary();
  assert.throws(() => wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'financial',
    reason: '增加實際金額', changes: { amount: 60, fundAllocations: { allowance: -60 } },
    idempotencyKey: 'atomic-fail' }), { code: 'INSUFFICIENT_FUNDS' });
  assert.deepEqual(wallet.summary(), before);
  assert.equal(wallet.listCorrectionEvents().length, 0);
  assert.equal(wallet.listTransactions().length, 2);
});

test('混合資金購買可分次退款，退款更正保留原退款並重算可退上限', () => {
  const wallet = fundedWallet(100);
  transfer(wallet, 'general', 30, 'refund-general');
  transfer(wallet, 'snack', 20, 'refund-snack');
  const expense = wallet.apply(op({ type: 'expense', amount: 50, category: 'non_food',
    entries: [{ fundType: 'snack', delta: -20 }, { fundType: 'general', delta: -20 }, { fundType: 'allowance', delta: -10 }],
    idempotencyKey: 'refund-mixed-expense' }));
  const refund = wallet.apply(op({ type: 'refund', amount: 15,
    entries: [{ fundType: 'snack', delta: 10 }, { fundType: 'general', delta: 5 }],
    reversalOf: expense.transaction.id, idempotencyKey: 'refund-mixed-one' }));
  const revised = wallet.correct({ targetTransactionId: refund.transaction.id, correctionType: 'financial',
    reason: '修正退款分配', changes: { amount: 20, fundAllocations: { snack: 5, general: 15 } },
    idempotencyKey: 'refund-correction-one' });
  assert.equal(revised.transaction.type, 'correction');
  assert.equal(wallet.getEffectiveTransaction(refund.transaction.id).amount, 20);
  assert.equal(wallet.listTransactions().find(t => t.id === refund.transaction.id).type, 'refund');
  assert.equal(wallet.summary().balances.snack, 5);
  assert.equal(wallet.summary().balances.general, 25);
});

test('原購買已有退款後禁止金額或分類更正，但允許純資料更正', () => {
  const wallet = fundedWallet(100);
  const expense = wallet.apply(op({ type: 'expense', amount: 30, category: 'non_food',
    entries: [{ fundType: 'allowance', delta: -30 }], idempotencyKey: 'post-refund-expense' }));
  wallet.apply(op({ type: 'refund', amount: 10, entries: [{ fundType: 'allowance', delta: 10 }],
    reversalOf: expense.transaction.id, idempotencyKey: 'post-refund-refund' }));
  assert.throws(() => wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'financial',
    reason: '不允許', changes: { amount: 25, fundAllocations: { allowance: -25 } }, idempotencyKey: 'post-refund-block' }),
    { code: 'PURCHASE_ALREADY_REFUNDED' });
  const metadata = wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'record_only',
    reason: '修正備註', changes: { note: '備註修正' }, idempotencyKey: 'post-refund-meta' });
  assert.equal(metadata.event.correctionType, 'record_only');
});

test('同一更正請求重送回傳既有結果，不重複建立事件或扣款', () => {
  const wallet = fundedWallet(100);
  const expense = wallet.apply(op({ type: 'expense', amount: 20, category: 'non_food',
    entries: [{ fundType: 'allowance', delta: -20 }], idempotencyKey: 'dedupe-expense' }));
  const input = { targetTransactionId: expense.transaction.id, correctionType: 'financial', reason: '調整金額',
    changes: { amount: 15, fundAllocations: { allowance: -15 } }, idempotencyKey: 'dedupe-correction' };
  const first = wallet.correct(input);
  const retry = wallet.correct(input);
  assert.equal(first.duplicate, false);
  assert.equal(retry.duplicate, true);
  assert.equal(wallet.listCorrectionEvents().length, 1);
  assert.equal(wallet.summary().balances.allowance, 85);
});

test('不存在、跨帳戶或 correction 交易不得作為更正目標', () => {
  const wallet = fundedWallet(100);
  assert.throws(() => wallet.correct({ targetTransactionId: 'missing', correctionType: 'record_only',
    reason: '測試', changes: { note: 'x' }, idempotencyKey: 'wrong-target-1' }), { code: 'ORIGINAL_NOT_FOUND' });
  const expense = wallet.apply(op({ type: 'expense', amount: 10, category: 'non_food',
    entries: [{ fundType: 'allowance', delta: -10 }], idempotencyKey: 'wrong-target-expense' }));
  const correction = wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'financial',
    reason: '修正', changes: { amount: 9, fundAllocations: { allowance: -9 } }, idempotencyKey: 'wrong-target-correction' });
  assert.throws(() => wallet.correct({ targetTransactionId: correction.transaction.id, correctionType: 'record_only',
    reason: '不允許', changes: { note: 'x' }, idempotencyKey: 'correction-target-block' }), { code: 'ORIGINAL_NOT_FOUND' });
});


test('退款更正不得改用原購買曾使用、但該筆退款未使用的資金分類', () => {
  const wallet = fundedWallet(100);
  transfer(wallet, 'snack', 20, 'refund-fund-snack');
  const expense = wallet.apply(op({ type: 'expense', amount: 20, category: 'non_food',
    entries: [{ fundType: 'snack', delta: -10 }, { fundType: 'allowance', delta: -10 }],
    idempotencyKey: 'refund-fund-expense' }));
  const refund = wallet.apply(op({ type: 'refund', amount: 5,
    entries: [{ fundType: 'snack', delta: 5 }], reversalOf: expense.transaction.id, idempotencyKey: 'refund-fund-original' }));
  assert.throws(() => wallet.correct({ targetTransactionId: refund.transaction.id, correctionType: 'financial',
    reason: '不可轉換退款來源', changes: { amount: 5, fundAllocations: { allowance: 5 } },
    idempotencyKey: 'refund-fund-invalid-correction' }), { code: 'REFUND_FUND_MISMATCH' });
});

test('更正原因、日期及修正後分配總額錯誤均拒絕且不留紀錄', () => {
  const wallet = fundedWallet(100);
  const expense = wallet.apply(op({ type: 'expense', amount: 20, category: 'non_food',
    entries: [{ fundType: 'allowance', delta: -20 }], idempotencyKey: 'validation-expense' }));
  assert.throws(() => wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'record_only',
    reason: ' ', changes: { note: 'x' }, idempotencyKey: 'validation-blank-reason' }), { code: 'CORRECTION_REASON_REQUIRED' });
  assert.throws(() => wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'record_only',
    reason: '日期錯誤', changes: { occurredAt: 'not-a-date' }, idempotencyKey: 'validation-date' }), { code: 'INVALID_DATE' });
  assert.throws(() => wallet.correct({ targetTransactionId: expense.transaction.id, correctionType: 'financial',
    reason: '分配總額錯誤', changes: { amount: 18, fundAllocations: { allowance: -17 } },
    idempotencyKey: 'validation-total' }), { code: 'ALLOCATION_TOTAL_MISMATCH' });
  assert.equal(wallet.listCorrectionEvents().length, 0);
});

test('其他孩子帳戶的交易識別不可作為本帳戶更正目標', () => {
  const owner = fundedWallet(100);
  const other = fundedWallet(100);
  const expense = owner.apply(op({ type: 'expense', amount: 10, category: 'non_food',
    entries: [{ fundType: 'allowance', delta: -10 }], idempotencyKey: 'isolation-expense' }));
  assert.throws(() => other.correct({ targetTransactionId: expense.transaction.id, correctionType: 'record_only',
    reason: '跨帳戶測試', changes: { note: '不應寫入' }, idempotencyKey: 'isolation-correction' }),
    { code: 'ORIGINAL_NOT_FOUND' });
});


test('一般收入更正依原規則只能調整零用金，並更新有效收入摘要', () => {
  const wallet = fundedWallet(100);
  const result = wallet.correct({ targetTransactionId: wallet.listTransactions()[0].id, correctionType: 'financial',
    reason: '初始建帳金額登錄錯誤', changes: { amount: 90, fundAllocations: { allowance: 90 } },
    idempotencyKey: 'initial-financial-correction' });
  assert.equal(result.transaction.entries[0].delta, -10);
  assert.equal(wallet.summary().balances.allowance, 90);
  assert.equal(wallet.summary().income, 90);
  assert.equal(wallet.getEffectiveTransaction(wallet.listTransactions()[0].id).amount, 90);
});

test('資金轉換更正必須等額轉出轉入，且總資產不變', () => {
  const wallet = fundedWallet(100);
  const transferResult = transfer(wallet, 'general', 20, 'transfer-to-correct');
  const corrected = wallet.correct({ targetTransactionId: transferResult.transaction.id, correctionType: 'financial',
    reason: '修正轉換金額', changes: { amount: 15, fundAllocations: { allowance: -15, general: 15 } },
    idempotencyKey: 'transfer-financial-correction' });
  const deltas = Object.fromEntries(corrected.transaction.entries.map(e => [e.fundType, e.delta]));
  assert.deepEqual(deltas, { general: -5, allowance: 5 });
  assert.equal(wallet.summary().balances.allowance, 85);
  assert.equal(wallet.summary().balances.general, 15);
  assert.equal(wallet.summary().totalAssets, 100);
});
