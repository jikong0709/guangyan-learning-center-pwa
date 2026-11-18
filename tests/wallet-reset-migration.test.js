'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const ledger = read('supabase/migrations/20261118090000_wallet_ledger.sql');
const corrections = read('supabase/migrations/20261118140000_wallet_correction_events.sql');
const reset = read('supabase/migrations/20261118170000_wallet_reset_to_zero.sql');

test('所有錢包寫入 RPC 與重置共用同一使用者層級鎖', () => {
  const lock = "hashtextextended(v_user_id::text || '|wallet-global', 0)";
  assert.ok(ledger.includes(lock), '一般交易 RPC 缺少全域錢包鎖');
  assert.equal((corrections.match(new RegExp(lock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 2,
    '退款及更正 RPC 都必須取得全域錢包鎖');
  assert.ok(reset.includes(lock), '重置 RPC 缺少全域錢包鎖');
});

test('重置 RPC 僅操作 auth.uid() 本人的錢包資料並保留登入帳號', () => {
  assert.match(reset, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(reset, /if v_user_id is null then[\s\S]*?authentication required/);
  assert.match(reset, /security definer/);
  assert.match(reset, /where user_id = v_user_id/);
  assert.match(reset, /'auth_user_preserved', true/);
  assert.doesNotMatch(reset, /delete\s+from\s+auth\.users/i);
  assert.doesNotMatch(reset, /truncate\s+/i);
});

test('重置依照更正事件、分錄、交易、餘額順序清除', () => {
  const events = reset.indexOf('delete from public.wallet_correction_events');
  const entries = reset.indexOf('delete from public.wallet_entries');
  const transactions = reset.indexOf('delete from public.wallet_transactions');
  const balances = reset.indexOf('set balance = 0, updated_at = now()');
  assert.ok(events >= 0 && entries > events && transactions > entries && balances > transactions);
});

test('更正事件仍維持 append-only，僅允許受控重置刪除本人事件', () => {
  assert.match(reset, /tg_op = 'DELETE'[\s\S]*?app\.wallet_reset[\s\S]*?old\.user_id = auth\.uid\(\)/);
  assert.match(reset, /raise exception 'wallet correction events are append-only'/);
  assert.match(corrections, /before update or delete on public\.wallet_correction_events/);
});

test('重置 RPC 僅授權 authenticated 呼叫', () => {
  assert.match(reset, /revoke all on function public\.wallet_reset_account\(\) from public, anon/);
  assert.match(reset, /grant execute on function public\.wallet_reset_account\(\) to authenticated/);
});

test('更正事件 Migration 必須只有一份完整更正 RPC，且不得殘留截斷 SQL', () => {
  assert.equal(corrections.split('create or replace function public.wallet_apply_correction(').length - 1, 1);
  assert.equal(corrections.split('create or replace function public.wallet_apply_refund(').length - 1, 1);
  assert.ok(corrections.includes("if coalesce(v_after->'fund_allocations'->>v_key,'') !~ '^-?[0-9]+$' then raise exception 'fund allocation must be integer'; end if;"));
  assert.equal(corrections.split('\n').filter(line => line.trimStart().startsWith('then raise exception')).length, 0);
  assert.equal(corrections.split('grant execute on function public.wallet_apply_correction').length - 1, 1);
  assert.equal(corrections.split('grant execute on function public.wallet_apply_refund').length - 1, 1);
  assert.equal((corrections.split('$$').length - 1) % 2, 0);
});
