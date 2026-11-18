-- P1｜登入者專屬錢包重置歸零
-- 僅清除 auth.uid() 本人的錢包紀錄；保留 Supabase Auth 使用者及三種零餘額帳戶。
-- 本 migration 僅加入功能分支，未套用至任何資料庫。

create or replace function public.wallet_reject_correction_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
     and coalesce(current_setting('app.wallet_reset', true), '') = 'on'
     and old.user_id = auth.uid() then
    return old;
  end if;
  raise exception 'wallet correction events are append-only';
end;
$$;

create or replace function public.wallet_reset_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_event record;
  v_events_deleted integer := 0;
  v_entries_deleted integer := 0;
  v_transactions_deleted integer := 0;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  -- 與同一帳號的錢包寫入序列化，避免重置期間混入新交易。
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text, 0));

  -- 僅允許本 RPC 在本交易內刪除本人 append-only 更正事件。
  perform pg_catalog.set_config('app.wallet_reset', 'on', true);

  -- 自最新更正版本往前刪除，先解除 previous_correction_event_id 自我參照。
  for v_event in
    select id
    from public.wallet_correction_events
    where user_id = v_user_id
    order by target_transaction_id, correction_no desc, created_at desc
  loop
    delete from public.wallet_correction_events where id = v_event.id and user_id = v_user_id;
    v_events_deleted := v_events_deleted + 1;
  end loop;

  delete from public.wallet_entries where user_id = v_user_id;
  get diagnostics v_entries_deleted = row_count;

  delete from public.wallet_transactions where user_id = v_user_id;
  get diagnostics v_transactions_deleted = row_count;

  insert into public.wallet_accounts(user_id, fund_type, balance)
    values (v_user_id, 'snack', 0), (v_user_id, 'general', 0), (v_user_id, 'allowance', 0)
    on conflict (user_id, fund_type) do nothing;

  update public.wallet_accounts
    set balance = 0, updated_at = now()
    where user_id = v_user_id;

  return jsonb_build_object(
    'correction_events_deleted', v_events_deleted,
    'entries_deleted', v_entries_deleted,
    'transactions_deleted', v_transactions_deleted,
    'balances_reset', true,
    'auth_user_preserved', true
  );
end;
$$;

revoke all on function public.wallet_reset_account() from public, anon;
grant execute on function public.wallet_reset_account() to authenticated;
