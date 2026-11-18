-- P1｜更正事件、有效帳務快照與專用退款 RPC
-- 本檔僅新增於 feat/p1-wallet-ledger；不得直接套用至任何 hosted database。

create table if not exists public.wallet_correction_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_transaction_id uuid not null,
  correction_no integer not null check (correction_no > 0),
  correction_type text not null check (correction_type in ('record_only','classification','financial')),
  reason text not null check (char_length(btrim(reason)) > 0),
  before_snapshot jsonb not null check (jsonb_typeof(before_snapshot) = 'object'),
  after_snapshot jsonb not null check (jsonb_typeof(after_snapshot) = 'object'),
  field_changes jsonb not null check (jsonb_typeof(field_changes) = 'object'),
  correction_transaction_id uuid null,
  idempotency_key uuid not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  previous_correction_event_id uuid null references public.wallet_correction_events(id) on delete restrict,
  constraint wallet_correction_target_user_fk foreign key (user_id,target_transaction_id)
    references public.wallet_transactions(user_id,id) on delete restrict,
  constraint wallet_correction_transaction_user_fk foreign key (user_id,correction_transaction_id)
    references public.wallet_transactions(user_id,id) on delete restrict,
  constraint wallet_correction_revision_once unique (user_id,target_transaction_id,correction_no),
  constraint wallet_correction_idempotency_once unique (user_id,idempotency_key)
);
create index if not exists wallet_correction_target_order
  on public.wallet_correction_events(user_id,target_transaction_id,correction_no desc);
comment on table public.wallet_correction_events is '不可變更正事件；有效資料由原交易及依序套用的 after_snapshot 推導。';

alter table public.wallet_correction_events enable row level security;
revoke all on table public.wallet_correction_events from anon, authenticated;
grant select on table public.wallet_correction_events to authenticated;
drop policy if exists wallet_correction_events_select_own on public.wallet_correction_events;
create policy wallet_correction_events_select_own on public.wallet_correction_events
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.wallet_reject_correction_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'wallet correction events are append-only';
end;
$$;
drop trigger if exists wallet_correction_events_immutable on public.wallet_correction_events;
create trigger wallet_correction_events_immutable
  before update or delete on public.wallet_correction_events
  for each row execute function public.wallet_reject_correction_event_mutation();

-- 既有一般交易 RPC 不得再直接建立退款／更正；兩者必須走下方專用原子 RPC。
create or replace function public.wallet_guard_special_transaction_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.transaction_type in ('refund','correction')
     and coalesce(current_setting('app.wallet_special_write',true),'') <> 'on' then
    raise exception 'refund and correction require specialized atomic RPC';
  end if;
  return new;
end;
$$;
drop trigger if exists wallet_transactions_special_write_guard on public.wallet_transactions;
create trigger wallet_transactions_special_write_guard
  before insert on public.wallet_transactions
  for each row execute function public.wallet_guard_special_transaction_insert();

create or replace function public.wallet_effective_transaction_snapshot(
  p_user_id uuid,
  p_transaction_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tx public.wallet_transactions%rowtype;
  v_snapshot jsonb;
  v_latest jsonb;
  v_alloc jsonb;
begin
  select * into v_tx from public.wallet_transactions
    where id=p_transaction_id and user_id=p_user_id;
  if not found then raise exception 'transaction not found'; end if;
  select coalesce(jsonb_object_agg(fund_type,amount_delta),'{}'::jsonb)
    into v_alloc
    from public.wallet_entries
    where user_id=p_user_id and transaction_id=p_transaction_id;
  v_snapshot := jsonb_build_object(
    'amount',v_tx.amount,
    'category',v_tx.category,
    'note',v_tx.note,
    'occurred_at',v_tx.occurred_at,
    'fund_allocations',v_alloc
  );
  select after_snapshot into v_latest
    from public.wallet_correction_events
    where user_id=p_user_id and target_transaction_id=p_transaction_id
    order by correction_no desc limit 1;
  if v_latest is not null then v_snapshot := v_latest; end if;
  return v_snapshot;
end;
$$;
revoke all on function public.wallet_effective_transaction_snapshot(uuid,uuid) from public,anon,authenticated;

create or replace function public.wallet_apply_refund(
  p_idempotency_key uuid,
  p_original_transaction_id uuid,
  p_amount bigint,
  p_entries jsonb,
  p_note text,
  p_occurred_at timestamptz default now(),
  p_source_type text default null,
  p_source_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_original public.wallet_transactions%rowtype;
  v_existing uuid;
  v_refund_id uuid;
  v_entry jsonb;
  v_fund text;
  v_delta bigint;
  v_before bigint;
  v_after bigint;
  v_effective jsonb;
  v_effective_amount bigint;
  v_refunded bigint := 0;
  v_fund_refunded bigint;
  v_original_fund bigint;
  v_entries_total bigint := 0;
  v_count integer := 0;
  v_distinct integer := 0;
  v_note text;
  v_refund record;
  v_refund_snapshot jsonb;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_idempotency_key is null then raise exception 'idempotency key required'; end if;
  if p_original_transaction_id is null then raise exception 'original transaction required'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'refund amount must be positive'; end if;
  v_note := btrim(coalesce(p_note,''));
  if v_note = '' then raise exception 'note required'; end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then raise exception 'entries must be an array'; end if;
  if (p_source_type is null) <> (p_source_id is null) then raise exception 'source identity must be supplied as a pair'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text||'|refund-idem|'||p_idempotency_key::text,0));
  select id into v_existing from public.wallet_transactions
    where user_id=v_user_id and idempotency_key=p_idempotency_key;
  if v_existing is not null then return jsonb_build_object('transaction_id',v_existing,'duplicate',true); end if;
  if p_source_type is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text||'|source|'||p_source_type||'|'||p_source_id,0));
    select id into v_existing from public.wallet_transactions
      where user_id=v_user_id and source_type=p_source_type and source_id=p_source_id;
    if v_existing is not null then return jsonb_build_object('transaction_id',v_existing,'duplicate',true); end if;
  end if;

  -- 目標交易先鎖定；與更正 RPC 共用同一把目標交易鎖。
  select * into v_original from public.wallet_transactions
    where id=p_original_transaction_id and user_id=v_user_id and transaction_type='expense'
    for update;
  if not found then raise exception 'original expense not found'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text||'|target|'||p_original_transaction_id::text,0));

  v_effective := public.wallet_effective_transaction_snapshot(v_user_id,p_original_transaction_id);
  v_effective_amount := (v_effective->>'amount')::bigint;

  select count(*),count(distinct item->>'fund_type'),
    coalesce(sum((item->>'amount_delta')::bigint),0)
    into v_count,v_distinct,v_entries_total
    from jsonb_array_elements(p_entries) as e(item);
  if v_count=0 or v_count<>v_distinct or v_entries_total<>p_amount then
    raise exception 'refund entries must be unique positive allocations totaling amount';
  end if;
  if exists(select 1 from jsonb_array_elements(p_entries) as e(item)
    where coalesce(item->>'fund_type','') not in ('snack','general','allowance')
      or coalesce(item->>'amount_delta','') !~ '^[0-9]+$'
      or (item->>'amount_delta')::bigint<=0) then
    raise exception 'invalid refund entry';
  end if;

  for v_refund in
    select id from public.wallet_transactions
    where user_id=v_user_id and transaction_type='refund' and reversal_of=p_original_transaction_id
  loop
    v_refund_snapshot := public.wallet_effective_transaction_snapshot(v_user_id,v_refund.id);
    v_refunded := v_refunded + (v_refund_snapshot->>'amount')::bigint;
  end loop;
  if v_refunded+p_amount>v_effective_amount then raise exception 'refund amount exceeds effective purchase amount'; end if;

  for v_entry in select item from jsonb_array_elements(p_entries) as e(item)
  loop
    v_fund := v_entry->>'fund_type';
    v_delta := (v_entry->>'amount_delta')::bigint;
    v_original_fund := coalesce((v_effective->'fund_allocations'->>v_fund)::bigint,0);
    if v_original_fund>=0 then raise exception 'refund fund was not used by original purchase'; end if;
    select coalesce(sum((snap->'fund_allocations'->>v_fund)::bigint),0)
      into v_fund_refunded
      from (
        select public.wallet_effective_transaction_snapshot(v_user_id,id) as snap
        from public.wallet_transactions
        where user_id=v_user_id and transaction_type='refund' and reversal_of=p_original_transaction_id
      ) q;
    if v_fund_refunded+v_delta > -v_original_fund then raise exception 'refund exceeds effective fund allocation'; end if;
  end loop;

  insert into public.wallet_accounts(user_id,fund_type,balance)
    values(v_user_id,'snack',0),(v_user_id,'general',0),(v_user_id,'allowance',0)
    on conflict(user_id,fund_type) do nothing;
  perform 1 from public.wallet_accounts
    where user_id=v_user_id and fund_type in ('snack','general','allowance')
    order by fund_type for update;

  perform pg_catalog.set_config('app.wallet_special_write','on',true);
  insert into public.wallet_transactions(user_id,transaction_type,amount,note,idempotency_key,reversal_of,occurred_at,source_type,source_id,metadata)
    values(v_user_id,'refund',p_amount,v_note,p_idempotency_key,p_original_transaction_id,
      coalesce(p_occurred_at,now()),p_source_type,p_source_id,
      jsonb_build_object('effective_purchase_snapshot',v_effective))
    returning id into v_refund_id;

  for v_entry in select item from jsonb_array_elements(p_entries) as e(item) order by item->>'fund_type'
  loop
    v_fund := v_entry->>'fund_type';
    v_delta := (v_entry->>'amount_delta')::bigint;
    select balance into v_before from public.wallet_accounts
      where user_id=v_user_id and fund_type=v_fund;
    v_after := v_before+v_delta;
    update public.wallet_accounts set balance=v_after,updated_at=now()
      where user_id=v_user_id and fund_type=v_fund;
    insert into public.wallet_entries(transaction_id,user_id,fund_type,amount_delta,balance_before,balance_after)
      values(v_refund_id,v_user_id,v_fund,v_delta,v_before,v_after);
  end loop;
  return jsonb_build_object('transaction_id',v_refund_id,'duplicate',false);
end;
$$;

create or replace function public.wallet_apply_correction(
  p_idempotency_key uuid,
  p_target_transaction_id uuid,
  p_correction_type text,
  p_reason text,
  p_changes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_target public.wallet_transactions%rowtype;
  v_existing public.wallet_correction_events%rowtype;
  v_previous uuid;
  v_event_id uuid := gen_random_uuid();
  v_correction_tx uuid;
  v_revision integer;
  v_reason text;
  v_before jsonb;
  v_after jsonb;
  v_field_changes jsonb := '{}'::jsonb;
  v_key text;
  v_fund text;
  v_old bigint;
  v_new bigint;
  v_delta bigint;
  v_gross bigint := 0;
  v_net_count integer := 0;
  v_has_refund boolean := false;
  v_original_id uuid;
  v_original_snapshot jsonb;
  v_original_amount bigint;
  v_other_refund_total bigint := 0;
  v_other_refund_fund bigint;
  v_refund record;
  v_snap jsonb;
  v_amount bigint;
  v_category text;
  v_note text;
  v_occurred_at timestamptz;
  v_entry jsonb;
  v_balance bigint;
  v_after_balance bigint;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_idempotency_key is null then raise exception 'idempotency key required'; end if;
  if p_target_transaction_id is null then raise exception 'target transaction required'; end if;
  if p_correction_type not in ('record_only','classification','financial') then raise exception 'invalid correction type'; end if;
  v_reason := btrim(coalesce(p_reason,''));
  if v_reason='' then raise exception 'correction reason required'; end if;
  if p_changes is null or jsonb_typeof(p_changes)<>'object' or p_changes='{}'::jsonb then raise exception 'correction changes required'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text||'|correction-idem|'||p_idempotency_key::text,0));
  select * into v_existing from public.wallet_correction_events
    where user_id=v_user_id and idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('correction_event_id',v_existing.id,'correction_transaction_id',v_existing.correction_transaction_id,'duplicate',true); end if;

  select * into v_target from public.wallet_transactions
    where id=p_target_transaction_id and user_id=v_user_id for update;
  if not found or v_target.transaction_type='correction' then raise exception 'target transaction not found or cannot be corrected'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text||'|target|'||p_target_transaction_id::text,0));

  v_before := public.wallet_effective_transaction_snapshot(v_user_id,p_target_transaction_id);
  v_after := v_before || p_changes;
  select count(*)+1 into v_revision from public.wallet_correction_events
    where user_id=v_user_id and target_transaction_id=p_target_transaction_id;
  select id into v_previous from public.wallet_correction_events
    where user_id=v_user_id and target_transaction_id=p_target_transaction_id
    order by correction_no desc limit 1;

  for v_key in select jsonb_object_keys(p_changes)
  loop
    if p_changes->v_key is distinct from v_before->v_key then
      v_field_changes := v_field_changes || jsonb_build_object(v_key,jsonb_build_object('before',v_before->v_key,'after',p_changes->v_key));
    end if;
  end loop;
  if v_field_changes='{}'::jsonb then raise exception 'correction has no effective field changes'; end if;

  if v_target.transaction_type='expense' then
    select exists(select 1 from public.wallet_transactions
      where user_id=v_user_id and transaction_type='refund' and reversal_of=p_target_transaction_id)
      into v_has_refund;
  end if;

  if p_correction_type='record_only' then
    for v_key in select jsonb_object_keys(p_changes)
    loop
      if v_key not in ('note','occurred_at','productName','storeName','sourceLabel','productUrl','description') then
        raise exception 'record-only correction cannot change financial or immutable fields';
      end if;
    end loop;
    if v_after->>'note' is null or btrim(v_after->>'note')='' then raise exception 'note required'; end if;
    if v_after ? 'occurred_at' then perform (v_after->>'occurred_at')::timestamptz; end if;
  else
    if v_target.transaction_type not in ('expense','refund') then
      raise exception 'financial/classification correction currently supports expense and refund transactions only';
    end if;
    if v_target.transaction_type='expense' and v_has_refund then
      raise exception 'purchase with refunds cannot change amount, category or allocation';
    end if;
    if p_correction_type='classification' then
      if v_target.transaction_type<>'expense' then raise exception 'classification correction requires expense'; end if;
      for v_key in select jsonb_object_keys(p_changes)
      loop
        if v_key not in ('category','fund_allocations') then raise exception 'invalid classification correction field'; end if;
      end loop;
      if (v_after->>'amount')::bigint<>(v_before->>'amount')::bigint then raise exception 'classification correction cannot change amount'; end if;
    else
      for v_key in select jsonb_object_keys(p_changes)
      loop
        if v_key not in ('amount','category','fund_allocations') then raise exception 'invalid financial correction field'; end if;
      end loop;
    end if;

    v_amount := (v_after->>'amount')::bigint;
    v_category := v_after->>'category';
    if v_amount is null or v_amount<=0 then raise exception 'corrected amount must be positive'; end if;
    if jsonb_typeof(v_after->'fund_allocations')<>'object' then raise exception 'complete fund allocations required'; end if;
    if v_target.transaction_type='expense' then
      if v_category not in ('snack_food','non_food') then raise exception 'invalid expense category'; end if;
    end if;
    for v_key in select jsonb_object_keys(v_after->'fund_allocations')
    loop
      if v_key not in ('snack','general','allowance') then raise exception 'invalid fund type'; end if;
      if coalesce(v_after->'fund_allocations'->>v_key,'') !~ '^-?[0-9]+$' then raise exception 'fund allocation must be integer'; end if;
      v_new := (v_after->'fund_allocations'->>v_key)::bigint;
      if v_new=0 then raise exception 'zero fund allocations must be omitted'; end if;
      if v_target.transaction_type='expense' and v_new>=0 then raise exception 'expense allocations must be negative'; end if;
      if v_target.transaction_type='refund' and v_new<=0 then raise exception 'refund allocations must be positive'; end if;
      if v_target.transaction_type='expense' and
        ((v_category='snack_food' and v_key not in ('snack','allowance')) or
         (v_category='non_food' and v_key not in ('snack','general','allowance'))) then
        raise exception 'fund not allowed for corrected category';
      end if;
    end loop;
    select coalesce(sum(abs((value)::text::bigint)),0) into v_gross
      from jsonb_each(v_after->'fund_allocations');
    if v_gross<>v_amount then raise exception 'fund allocations do not equal corrected amount'; end if;

    if v_target.transaction_type='refund' then
      v_original_id := v_target.reversal_of;
      perform 1 from public.wallet_transactions
        where id=v_original_id and user_id=v_user_id and transaction_type='expense'
        for update;
      if not found then raise exception 'refund original expense not found'; end if;
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text||'|target|'||v_original_id::text,0));
      v_original_snapshot := public.wallet_effective_transaction_snapshot(v_user_id,v_original_id);
      v_original_amount := (v_original_snapshot->>'amount')::bigint;
      for v_refund in select id from public.wallet_transactions
        where user_id=v_user_id and transaction_type='refund' and reversal_of=v_original_id and id<>p_target_transaction_id
      loop
        v_snap := public.wallet_effective_transaction_snapshot(v_user_id,v_refund.id);
        v_other_refund_total := v_other_refund_total+(v_snap->>'amount')::bigint;
      end loop;
      if v_other_refund_total+v_amount>v_original_amount then raise exception 'corrected refunds exceed effective purchase amount'; end if;
      for v_key in select jsonb_object_keys(v_after->'fund_allocations')
      loop
        v_new := (v_after->'fund_allocations'->>v_key)::bigint;
        v_old := coalesce((v_original_snapshot->'fund_allocations'->>v_key)::bigint,0);
        if v_new>abs(v_old) then raise exception 'refund correction exceeds original fund allocation'; end if;
        select coalesce(sum((snap->'fund_allocations'->>v_key)::bigint),0) into v_other_refund_fund
          from (
            select public.wallet_effective_transaction_snapshot(v_user_id,id) as snap
            from public.wallet_transactions
            where user_id=v_user_id and transaction_type='refund' and reversal_of=v_original_id and id<>p_target_transaction_id
          ) q;
        if v_other_refund_fund+v_new>abs(v_old) then raise exception 'refund correction exceeds remaining fund cap'; end if;
      end loop;
    end if;
  end if;

  -- 以 signed ledger delta = corrected allocation - current effective allocation 計算每個資金淨額。
  v_gross := 0;
  if p_correction_type<>'record_only' then
    for v_fund in select unnest(array['snack','general','allowance'])
    loop
      v_old := coalesce((v_before->'fund_allocations'->>v_fund)::bigint,0);
      v_new := coalesce((v_after->'fund_allocations'->>v_fund)::bigint,0);
      v_delta := v_new-v_old;
      if v_delta<>0 then v_net_count:=v_net_count+1; v_gross:=v_gross+abs(v_delta); end if;
    end loop;
  end if;

  insert into public.wallet_accounts(user_id,fund_type,balance)
    values(v_user_id,'snack',0),(v_user_id,'general',0),(v_user_id,'allowance',0)
    on conflict(user_id,fund_type) do nothing;
  perform 1 from public.wallet_accounts
    where user_id=v_user_id and fund_type in ('snack','general','allowance')
    order by fund_type for update;

  -- 先驗證全部餘額，再寫入任何一筆分錄，確保混合資金全有或全無。
  for v_fund in select unnest(array['snack','general','allowance'])
  loop
    v_old := coalesce((v_before->'fund_allocations'->>v_fund)::bigint,0);
    v_new := coalesce((v_after->'fund_allocations'->>v_fund)::bigint,0);
    v_delta := v_new-v_old;
    select balance into v_balance from public.wallet_accounts where user_id=v_user_id and fund_type=v_fund;
    if v_balance+v_delta<0 then raise exception 'insufficient funds in % for atomic correction',v_fund; end if;
  end loop;

  if v_net_count>0 then
    perform pg_catalog.set_config('app.wallet_special_write','on',true);
    insert into public.wallet_transactions(user_id,transaction_type,amount,category,note,idempotency_key,reversal_of,occurred_at,metadata)
      values(v_user_id,'correction',v_gross,null,v_reason,p_idempotency_key,p_target_transaction_id,now(),
        jsonb_build_object('correction_event_id',v_event_id,'revision_no',v_revision,
          'before_allocation',v_before->'fund_allocations','after_allocation',v_after->'fund_allocations'))
      returning id into v_correction_tx;
    for v_fund in select unnest(array['snack','general','allowance'])
    loop
      v_old := coalesce((v_before->'fund_allocations'->>v_fund)::bigint,0);
      v_new := coalesce((v_after->'fund_allocations'->>v_fund)::bigint,0);
      v_delta := v_new-v_old;
      if v_delta<>0 then
        select balance into v_balance from public.wallet_accounts where user_id=v_user_id and fund_type=v_fund;
        v_after_balance := v_balance+v_delta;
        update public.wallet_accounts set balance=v_after_balance,updated_at=now()
          where user_id=v_user_id and fund_type=v_fund;
        insert into public.wallet_entries(transaction_id,user_id,fund_type,amount_delta,balance_before,balance_after)
          values(v_correction_tx,v_user_id,v_fund,v_delta,v_balance,v_after_balance);
      end if;
    end loop;
  end if;

  insert into public.wallet_correction_events(
    id,user_id,target_transaction_id,correction_no,correction_type,reason,before_snapshot,after_snapshot,
    field_changes,correction_transaction_id,idempotency_key,created_by,previous_correction_event_id
  ) values (
    v_event_id,v_user_id,p_target_transaction_id,v_revision,p_correction_type,v_reason,v_before,v_after,
    v_field_changes,v_correction_tx,p_idempotency_key,v_user_id,v_previous
  );

  return jsonb_build_object('correction_event_id',v_event_id,'correction_transaction_id',v_correction_tx,
    'correction_no',v_revision,'duplicate',false);
end;
$$;

revoke all on function public.wallet_apply_refund(uuid,uuid,bigint,jsonb,text,timestamptz,text,text) from public,anon;
grant execute on function public.wallet_apply_refund(uuid,uuid,bigint,jsonb,text,timestamptz,text,text) to authenticated;
revoke all on function public.wallet_apply_correction(uuid,uuid,text,text,jsonb) from public,anon;
grant execute on function public.wallet_apply_correction(uuid,uuid,text,text,jsonb) to authenticated;
