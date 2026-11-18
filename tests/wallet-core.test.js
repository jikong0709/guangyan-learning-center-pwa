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
  const correction = wallet.apply(op({ type: 'correction', amount: 10, entries: [{ fundType: 'allowance', delta: -10 }], reversalOf: original.transaction.id, idempotencyKey: 'correction-1' }));
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
