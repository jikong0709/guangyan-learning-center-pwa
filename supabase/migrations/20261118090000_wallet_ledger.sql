-- P1｜許願達成錢包與資金帳本
-- 僅建立遷移檔；未經明確授權不得套用至正式資料庫。

create table if not exists public.wallet_accounts (
  user_id uuid not null references auth.users(id) on delete cascade,
  fund_type text not null check (fund_type in ('snack','general','allowance')),
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, fund_type)
);
comment on table public.wallet_accounts is '三種資金分類即時餘額；僅由帳務 RPC 更新。';

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('initial_funding','income','expense','transfer','refund','correction','scoreboard_snack')),
  amount bigint not null check (amount >= 0),
  category text null check (category is null or category in ('snack_food','non_food')),
  note text not null check (char_length(btrim(note)) > 0),
  source_type text null,
  source_id text null,
  idempotency_key uuid not null,
  reversal_of uuid null references public.wallet_transactions(id),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint wallet_transactions_source_pair check ((source_type is null) = (source_id is null)),
  constraint wallet_transactions_user_idempotency unique (user_id, idempotency_key),
  constraint wallet_transactions_user_id unique (user_id, id)
);
create unique index if not exists wallet_transactions_source_once
  on public.wallet_transactions(user_id, source_type, source_id)
  where source_type is not null and source_id is not null;
create unique index if not exists wallet_transactions_initial_once
  on public.wallet_transactions(user_id) where transaction_type = 'initial_funding';
comment on table public.wallet_transactions is '不可覆寫的交易主檔；退款與更正以新交易關聯原始交易。';

create table if not exists public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.wallet_transactions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  fund_type text not null check (fund_type in ('snack','general','allowance')),
  amount_delta bigint not null check (amount_delta <> 0),
  balance_before bigint not null check (balance_before >= 0),
  balance_after bigint not null check (balance_after >= 0),
  created_at timestamptz not null default now(),
  constraint wallet_entries_balance_math check (balance_after = balance_before + amount_delta),
  constraint wallet_entries_transaction_fund_once unique (transaction_id, fund_type),
  constraint wallet_entries_transaction_user_fk foreign key (user_id, transaction_id)
    references public.wallet_transactions(user_id, id) on delete restrict
);
comment on table public.wallet_entries is '不可變動的資金分錄；正數入帳、負數扣款，保存異動前後餘額。';

alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.wallet_entries enable row level security;
revoke all on table public.wallet_accounts, public.wallet_transactions, public.wallet_entries from anon, authenticated;
grant select on table public.wallet_accounts, public.wallet_transactions, public.wallet_entries to authenticated;

drop policy if exists wallet_accounts_select_own on public.wallet_accounts;
create policy wallet_accounts_select_own on public.wallet_accounts for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists wallet_transactions_select_own on public.wallet_transactions;
create policy wallet_transactions_select_own on public.wallet_transactions for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists wallet_entries_select_own on public.wallet_entries;
create policy wallet_entries_select_own on public.wallet_entries for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.wallet_apply_transaction(
  p_idempotency_key uuid,
  p_transaction_type text,
  p_amount bigint,
  p_entries jsonb,
  p_category text default null,
  p_note text default null,
  p_occurred_at timestamptz default now(),
  p_source_type text default null,
  p_source_id text default null,
  p_reversal_of uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_id uuid;
  v_transaction_id uuid;
  v_entry jsonb;
  v_fund_type text;
  v_delta bigint;
  v_before bigint;
  v_after bigint;
  v_count integer;
  v_distinct integer;
  v_positive_count integer;
  v_negative_count integer;
  v_positive bigint;
  v_negative bigint;
  v_net bigint;
  v_refunded bigint;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  -- 所有錢包寫入與重置共用使用者層級鎖，確保重置與交易完全序列化。
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text || '|wallet-global', 0));
  if p_idempotency_key is null then raise exception 'idempotency key required'; end if;
  if p_transaction_type is null or p_transaction_type not in ('initial_funding','income','expense','transfer','refund','correction','scoreboard_snack') then
    raise exception 'unsupported transaction type';
  end if;
  if p_amount is null or p_amount < 0 then raise exception 'amount must be non-negative'; end if;
  if p_note is null or char_length(btrim(p_note)) = 0 then raise exception 'note required'; end if;
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then raise exception 'metadata must be an object'; end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then raise exception 'entries must be an array'; end if;
  if (p_source_type is null) <> (p_source_id is null) then raise exception 'source identity must be supplied as a pair'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text || '|idem|' || p_idempotency_key::text, 0));
  select id into v_existing_id from public.wallet_transactions where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if v_existing_id is not null then return jsonb_build_object('transaction_id',v_existing_id,'duplicate',true); end if;

  if p_source_type is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text || '|source|' || p_source_type || '|' || p_source_id, 0));
    select id into v_existing_id from public.wallet_transactions
      where user_id = v_user_id and source_type = p_source_type and source_id = p_source_id;
    if v_existing_id is not null then return jsonb_build_object('transaction_id',v_existing_id,'duplicate',true); end if;
  end if;

  if p_transaction_type = 'initial_funding' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text || '|initial', 0));
    if exists(select 1 from public.wallet_transactions where user_id=v_user_id and transaction_type='initial_funding') then
      raise exception 'initial funding already exists';
    end if;
  end if;

  select count(*), count(distinct item->>'fund_type'),
    count(*) filter(where (item->>'amount_delta')::bigint > 0),
    count(*) filter(where (item->>'amount_delta')::bigint < 0),
    coalesce(sum((item->>'amount_delta')::bigint) filter(where (item->>'amount_delta')::bigint > 0),0),
    coalesce(sum(-((item->>'amount_delta')::bigint)) filter(where (item->>'amount_delta')::bigint < 0),0),
    coalesce(sum((item->>'amount_delta')::bigint),0)
  into v_count,v_distinct,v_positive_count,v_negative_count,v_positive,v_negative,v_net
  from jsonb_array_elements(p_entries) as e(item);

  if v_count <> v_distinct then raise exception 'duplicate fund entry'; end if;
  if exists(select 1 from jsonb_array_elements(p_entries) as e(item)
    where coalesce(item->>'fund_type','') not in ('snack','general','allowance')
       or coalesce(item->>'amount_delta','') !~ '^-?[0-9]+$'
       or (item->>'amount_delta')::bigint = 0) then
    raise exception 'invalid fund entry';
  end if;

  if p_transaction_type = 'initial_funding' then
    if p_category is not null then raise exception 'initial funding category must be null'; end if;
    if p_amount = 0 then
      if v_count <> 0 then raise exception 'zero initial funding cannot have entries'; end if;
    elsif not (v_count=1 and v_positive_count=1 and v_negative_count=0 and v_positive=p_amount and (p_entries->0->>'fund_type')='allowance') then
      raise exception 'initial funding must credit allowance only';
    end if;
  elsif p_transaction_type = 'income' then
    if not (p_amount>0 and v_count=1 and v_positive_count=1 and v_negative_count=0 and v_positive=p_amount
      and (p_entries->0->>'fund_type')='allowance' and p_category is null) then
      raise exception 'income must credit allowance only';
    end if;
  elsif p_transaction_type = 'scoreboard_snack' then
    if not (p_amount>0 and v_count=1 and v_positive_count=1 and v_negative_count=0 and v_positive=p_amount
      and (p_entries->0->>'fund_type')='snack' and p_category is null
      and p_source_type='scoreboard_weekly_settlement' and p_source_id is not null) then
      raise exception 'weekly snackMoney must credit snack fund with source identity';
    end if;
  elsif p_transaction_type = 'expense' then
    if not (p_amount>0 and v_count>0 and v_positive_count=0 and v_negative=p_amount)
       or p_category is null or p_category not in ('snack_food','non_food') then
      raise exception 'invalid expense entries or category';
    end if;
    if exists(select 1 from jsonb_array_elements(p_entries) as e(item)
      where (p_category='snack_food' and item->>'fund_type' not in ('snack','allowance'))
         or (p_category='non_food' and item->>'fund_type' not in ('snack','general','allowance'))) then
      raise exception 'fund not allowed for category';
    end if;
  elsif p_transaction_type = 'transfer' then
    if not (p_amount>0 and v_count=2 and v_positive_count=1 and v_negative_count=1
      and v_positive=p_amount and v_negative=p_amount and v_net=0 and p_category is null) then
      raise exception 'transfer must be equal debit and credit';
    end if;
  elsif p_transaction_type = 'refund' then
    if not (p_amount>0 and p_reversal_of is not null and v_count>0 and v_positive_count=v_count
      and v_positive=p_amount) or (p_category is not null and p_category not in ('snack_food','non_food')) then
      raise exception 'refund must credit funds and reference original expense';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text || '|reversal|' || p_reversal_of::text, 0));
    if not exists(select 1 from public.wallet_transactions where id=p_reversal_of and user_id=v_user_id and transaction_type='expense') then
      raise exception 'original expense not found';
    end if;
    select coalesce(sum(amount),0) into v_refunded from public.wallet_transactions
      where user_id=v_user_id and reversal_of=p_reversal_of and transaction_type='refund';
    if v_refunded+p_amount > (select amount from public.wallet_transactions where id=p_reversal_of) then
      raise exception 'refund amount exceeds original expense';
    end if;
    if exists(
      select 1 from jsonb_array_elements(p_entries) as new_entry(item)
      left join public.wallet_entries original_entry
        on original_entry.transaction_id=p_reversal_of and original_entry.user_id=v_user_id
       and original_entry.fund_type=new_entry.item->>'fund_type' and original_entry.amount_delta<0
      where original_entry.id is null or
        (select coalesce(sum(previous_entry.amount_delta),0)
         from public.wallet_entries previous_entry
         join public.wallet_transactions previous_tx on previous_tx.id=previous_entry.transaction_id
         where previous_tx.user_id=v_user_id and previous_tx.transaction_type='refund'
           and previous_tx.reversal_of=p_reversal_of
           and previous_entry.fund_type=new_entry.item->>'fund_type')
        + (new_entry.item->>'amount_delta')::bigint > -original_entry.amount_delta
    ) then raise exception 'refund must return to original fund allocations'; end if;
  elsif p_transaction_type = 'correction' then
    if not (p_amount>0 and p_reversal_of is not null and v_count>0 and v_positive+v_negative=p_amount and p_category is null) then
      raise exception 'correction must reference original transaction and amount must equal absolute entry total';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text || '|reversal|' || p_reversal_of::text, 0));
    if not exists(select 1 from public.wallet_transactions where id=p_reversal_of and user_id=v_user_id) then
      raise exception 'original transaction not found';
    end if;
  end if;

  insert into public.wallet_accounts(user_id,fund_type,balance)
    values(v_user_id,'snack',0),(v_user_id,'general',0),(v_user_id,'allowance',0)
    on conflict(user_id,fund_type) do nothing;
  insert into public.wallet_transactions(user_id,transaction_type,amount,category,note,source_type,source_id,idempotency_key,reversal_of,occurred_at,metadata)
    values(v_user_id,p_transaction_type,p_amount,p_category,btrim(p_note),p_source_type,p_source_id,p_idempotency_key,p_reversal_of,coalesce(p_occurred_at,now()),p_metadata)
    returning id into v_transaction_id;

  for v_entry in select item from jsonb_array_elements(p_entries) as e(item) order by item->>'fund_type'
  loop
    v_fund_type := v_entry->>'fund_type';
    v_delta := (v_entry->>'amount_delta')::bigint;
    select balance into v_before from public.wallet_accounts where user_id=v_user_id and fund_type=v_fund_type for update;
    v_after := v_before + v_delta;
    if v_after < 0 then raise exception 'insufficient funds in %',v_fund_type; end if;
    update public.wallet_accounts set balance=v_after,updated_at=now() where user_id=v_user_id and fund_type=v_fund_type;
    insert into public.wallet_entries(transaction_id,user_id,fund_type,amount_delta,balance_before,balance_after)
      values(v_transaction_id,v_user_id,v_fund_type,v_delta,v_before,v_after);
  end loop;
  return jsonb_build_object('transaction_id',v_transaction_id,'duplicate',false);
end;
$$;

revoke all on function public.wallet_apply_transaction(uuid,text,bigint,jsonb,text,text,timestamptz,text,text,uuid,jsonb) from public,anon;
grant execute on function public.wallet_apply_transaction(uuid,text,bigint,jsonb,text,text,timestamptz,text,text,uuid,jsonb) to authenticated;
