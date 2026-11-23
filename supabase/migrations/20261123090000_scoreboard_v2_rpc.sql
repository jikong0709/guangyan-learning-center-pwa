-- Draft only. Never apply to production during Batch 2.
create extension if not exists pgcrypto;
create table if not exists public.scoreboard_v2_head(user_id uuid primary key references auth.users(id) on delete cascade, revision bigint not null default 0, reset_epoch bigint not null default 0);
create table if not exists public.scoreboard_v2_mutation(user_id uuid not null references auth.users(id) on delete cascade, mutation_id text not null, payload_hash text not null, payload jsonb, mutation jsonb not null, reset_epoch bigint not null, accepted_revision bigint not null, primary key(user_id,mutation_id));
create table if not exists public.scoreboard_v2_batch_receipt(user_id uuid not null references auth.users(id) on delete cascade,batch_id text not null,receipt jsonb not null,primary key(user_id,batch_id));
create table if not exists public.scoreboard_v2_reset_receipt(user_id uuid not null references auth.users(id) on delete cascade,reset_request_id text not null,receipt jsonb not null,primary key(user_id,reset_request_id));
alter table public.scoreboard_v2_head enable row level security;
alter table public.scoreboard_v2_mutation enable row level security;
alter table public.scoreboard_v2_batch_receipt enable row level security;
alter table public.scoreboard_v2_reset_receipt enable row level security;
create or replace function public.scoreboard_get_head(p_user_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare h public.scoreboard_v2_head%rowtype; begin
 if auth.uid() is null or auth.uid()<>p_user_id then raise exception 'ACCOUNT_SCOPE'; end if;
 insert into scoreboard_v2_head(user_id) values(p_user_id) on conflict do nothing;
 select * into h from scoreboard_v2_head where user_id=p_user_id;
 return jsonb_build_object('revision',h.revision,'reset_epoch',h.reset_epoch,'user_id',h.user_id);
end $$;
create or replace function public.scoreboard_mutation_batch(p_user_id uuid,p_batch_id text,p_base_revision bigint,p_reset_epoch bigint,p_mutations jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare h public.scoreboard_v2_head%rowtype; prior jsonb; item jsonb; mid text; ph text; old public.scoreboard_v2_mutation%rowtype; newrev bigint; ids jsonb:='[]'; count_new integer:=0;
begin
 if auth.uid() is null or auth.uid()<>p_user_id then raise exception 'ACCOUNT_SCOPE'; end if;
 if p_batch_id is null or jsonb_typeof(p_mutations)<>'array' then raise exception 'BAD_BATCH'; end if;
 insert into scoreboard_v2_head(user_id) values(p_user_id) on conflict do nothing;
 select * into h from scoreboard_v2_head where user_id=p_user_id for update;
 select receipt into prior from scoreboard_v2_batch_receipt where user_id=p_user_id and batch_id=p_batch_id; if prior is not null then return prior; end if;
 if p_reset_epoch<>h.reset_epoch then return jsonb_build_object('status','REJECTED','reason','RESET_EPOCH_MISMATCH','accepted_mutation_ids',ids,'revision',h.revision,'reset_epoch',h.reset_epoch); end if;
 if p_base_revision<>h.revision then return jsonb_build_object('status','CONFLICT','reason','REVISION_CONFLICT','accepted_mutation_ids',ids,'revision',h.revision,'reset_epoch',h.reset_epoch); end if;
 -- Validation pass: exceptions roll back all writes.
 for item in select value from jsonb_array_elements(p_mutations) loop
  mid:=item->>'mutation_id'; if mid is null or mid='' then raise exception 'MUTATION_ID_REQUIRED'; end if;
  ph:=encode(digest(coalesce(item->'payload','null'::jsonb)::text,'sha256'),'hex');
  select * into old from scoreboard_v2_mutation where user_id=p_user_id and mutation_id=mid;
  if found then if old.payload_hash<>ph then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  else count_new:=count_new+1; end if;
 end loop;
 newrev:=h.revision+case when count_new>0 then 1 else 0 end;
 for item in select value from jsonb_array_elements(p_mutations) loop
  mid:=item->>'mutation_id'; ph:=encode(digest(coalesce(item->'payload','null'::jsonb)::text,'sha256'),'hex');
  if not exists(select 1 from scoreboard_v2_mutation where user_id=p_user_id and mutation_id=mid) then
   insert into scoreboard_v2_mutation(user_id,mutation_id,payload_hash,payload,mutation,reset_epoch,accepted_revision) values(p_user_id,mid,ph,item->'payload',item,h.reset_epoch,newrev);
  end if; ids:=ids||jsonb_build_array(mid);
 end loop;
 if count_new>0 then update scoreboard_v2_head set revision=newrev where user_id=p_user_id; end if;
 prior:=jsonb_build_object('status','OK','batch_id',p_batch_id,'accepted_mutation_ids',ids,'revision',newrev,'reset_epoch',h.reset_epoch);
 insert into scoreboard_v2_batch_receipt(user_id,batch_id,receipt) values(p_user_id,p_batch_id,prior);return prior;
end $$;
create or replace function public.scoreboard_mutation_reconcile(p_user_id uuid,p_ids text[]) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare h public.scoreboard_v2_head%rowtype; begin
 if auth.uid() is null or auth.uid()<>p_user_id then raise exception 'ACCOUNT_SCOPE'; end if;
 select * into h from scoreboard_v2_head where user_id=p_user_id;
 return jsonb_build_object('revision',coalesce(h.revision,0),'reset_epoch',coalesce(h.reset_epoch,0),'results',(select coalesce(jsonb_agg(jsonb_build_object('mutation_id',i,'accepted',m.mutation_id is not null,'accepted_revision',m.accepted_revision,'reset_epoch',m.reset_epoch)),'[]') from unnest(p_ids)i left join scoreboard_v2_mutation m on m.user_id=p_user_id and m.mutation_id=i));
end $$;
create or replace function public.scoreboard_reset(p_user_id uuid,p_reset_request_id text,p_expected_epoch bigint) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare h public.scoreboard_v2_head%rowtype; prior jsonb; begin
 if auth.uid() is null or auth.uid()<>p_user_id then raise exception 'ACCOUNT_SCOPE'; end if;
 select receipt into prior from scoreboard_v2_reset_receipt where user_id=p_user_id and reset_request_id=p_reset_request_id; if prior is not null then return prior; end if;
 select * into h from scoreboard_v2_head where user_id=p_user_id for update;
 if h.reset_epoch<>p_expected_epoch then return jsonb_build_object('status','CONFLICT','reason','RESET_EPOCH_MISMATCH','revision',h.revision,'reset_epoch',h.reset_epoch); end if;
 update scoreboard_v2_head set revision=revision+1,reset_epoch=reset_epoch+1 where user_id=p_user_id returning * into h;
 prior:=jsonb_build_object('status','OK','reset_request_id',p_reset_request_id,'revision',h.revision,'reset_epoch',h.reset_epoch);
 insert into scoreboard_v2_reset_receipt(user_id,reset_request_id,receipt) values(p_user_id,p_reset_request_id,prior);return prior;
end $$;
revoke all on function public.scoreboard_get_head(uuid) from public;
revoke all on function public.scoreboard_mutation_batch(uuid,text,bigint,bigint,jsonb) from public;
revoke all on function public.scoreboard_mutation_reconcile(uuid,text[]) from public;
revoke all on function public.scoreboard_reset(uuid,text,bigint) from public;
grant execute on function public.scoreboard_get_head(uuid) to authenticated;
grant execute on function public.scoreboard_mutation_batch(uuid,text,bigint,bigint,jsonb) to authenticated;
grant execute on function public.scoreboard_mutation_reconcile(uuid,text[]) to authenticated;
grant execute on function public.scoreboard_reset(uuid,text,bigint) to authenticated;
