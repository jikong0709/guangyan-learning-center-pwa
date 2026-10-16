create schema if not exists learning_private;

revoke all on schema learning_private from public;

create table if not exists public.learning_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  progress_key text not null,
  schema_version smallint not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, progress_key),
  constraint learning_progress_key_length check (char_length(progress_key) between 1 and 80),
  constraint learning_progress_state_object check (jsonb_typeof(state) = 'object')
);

comment on table public.learning_progress is
  '莓好學習區登入使用者的跨裝置學習進度。';

alter table public.learning_progress enable row level security;
revoke all on table public.learning_progress from anon, authenticated;
grant select, insert, update, delete on table public.learning_progress to authenticated;

drop policy if exists "learning_progress_select_own" on public.learning_progress;
create policy "learning_progress_select_own"
on public.learning_progress for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "learning_progress_insert_own" on public.learning_progress;
create policy "learning_progress_insert_own"
on public.learning_progress for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "learning_progress_update_own" on public.learning_progress;
create policy "learning_progress_update_own"
on public.learning_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "learning_progress_delete_own" on public.learning_progress;
create policy "learning_progress_delete_own"
on public.learning_progress for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function learning_private.touch_learning_progress_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function learning_private.touch_learning_progress_updated_at() from public;

drop trigger if exists learning_progress_touch_updated_at on public.learning_progress;
create trigger learning_progress_touch_updated_at
before update on public.learning_progress
for each row execute function learning_private.touch_learning_progress_updated_at();
