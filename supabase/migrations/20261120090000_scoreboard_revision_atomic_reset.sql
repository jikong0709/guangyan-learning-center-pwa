-- PR #19 scoreboard: server-authoritative revision and atomic reset.
-- Additive to learning_progress; no changes to other progress_key rows' semantics.
alter table public.learning_progress
  add column if not exists revision bigint not null default 0;

create table if not exists public.scoreboard_reset_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  revision bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
alter table public.scoreboard_reset_requests enable row level security;
revoke all on table public.scoreboard_reset_requests from public, anon, authenticated;

create or replace function public.scoreboard_save(p_state jsonb, p_expected_revision bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_current bigint;
  v_new bigint;
begin
  if v_uid is null then raise exception 'authentication required'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'state must be JSON object'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':weekly-scoreboard-v1', 0));
  select revision into v_current from public.learning_progress
   where user_id=v_uid and progress_key='weekly-scoreboard-v1' for update;
  v_current := coalesce(v_current,0);
  if p_expected_revision is distinct from v_current then
    return jsonb_build_object('accepted',false,'revision',v_current);
  end if;
  v_new := v_current + 1;
  insert into public.learning_progress(user_id,progress_key,schema_version,state,revision)
  values(v_uid,'weekly-scoreboard-v1',1,p_state,v_new)
  on conflict(user_id,progress_key) do update
    set state=excluded.state,schema_version=excluded.schema_version,revision=excluded.revision;
  return jsonb_build_object('accepted',true,'revision',v_new);
end;
$$;
revoke all on function public.scoreboard_save(jsonb,bigint) from public, anon;
grant execute on function public.scoreboard_save(jsonb,bigint) to authenticated;

create or replace function public.scoreboard_reset(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing bigint;
  v_current bigint;
  v_new bigint;
  v_reset_at timestamptz := pg_catalog.clock_timestamp();
  v_state jsonb;
begin
  if v_uid is null then raise exception 'authentication required'; end if;
  if p_request_id is null then raise exception 'request id required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text || ':weekly-scoreboard-v1', 0));
  select revision into v_existing from public.scoreboard_reset_requests
   where user_id=v_uid and request_id=p_request_id;
  if v_existing is not null then
    return jsonb_build_object('accepted',true,'revision',v_existing,'duplicate',true);
  end if;
  select revision into v_current from public.learning_progress
   where user_id=v_uid and progress_key='weekly-scoreboard-v1' for update;
  v_current := coalesce(v_current,0);
  v_new := v_current + 1;
  v_state := jsonb_build_object(
    'version',1,
    'trackingStartedAt',to_char((v_reset_at::date - ((extract(dow from v_reset_at)::int + 2) % 7)), 'YYYY-MM-DD'),
    'resetAt',v_reset_at,
    'records', '{}'::jsonb,
    'settlements', '{}'::jsonb,
    'ledger', '[]'::jsonb,
    'rules', jsonb_build_array(
      '週期：每週五至下週四為一個計分週期。',
      '結算期限：每週結束後的週六12:00前完成結算。',
      '每日加扣分須經家長確認後登記。',
      '每週總分51至99分：取得零食資格，零食額度依實際分數計算。',
      '每週剛好50分：不能購買零食，50分全數轉入長期累計積分。',
      '每週100分：可兌換100元零食。',
      '每週超過100分：零食額度以100元為上限，超過100分的部分轉入長期累計積分。',
      '每週未滿50分：不具備零食購買資格。',
      '逾期至週六12:00仍未結算：該週扣20分，系統自動完成結算。',
      '家長可另外新增獎勵積分；兌換扣除時需選擇積分來源。'
    )
  );
  insert into public.learning_progress(user_id,progress_key,schema_version,state,revision)
  values(v_uid,'weekly-scoreboard-v1',1,v_state,v_new)
  on conflict(user_id,progress_key) do update
    set state=excluded.state,schema_version=excluded.schema_version,revision=excluded.revision;
  insert into public.scoreboard_reset_requests(user_id,request_id,revision)
  values(v_uid,p_request_id,v_new);
  return jsonb_build_object('accepted',true,'revision',v_new,'duplicate',false);
end;
$$;
revoke all on function public.scoreboard_reset(uuid) from public, anon;
grant execute on function public.scoreboard_reset(uuid) to authenticated;
