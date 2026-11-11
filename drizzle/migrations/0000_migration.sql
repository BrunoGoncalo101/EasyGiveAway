create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  slug text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,10),
  title text not null check (char_length(title) between 1 and 150),
  description text not null default '',
  rules text not null default '',
  closes_at timestamptz,
  status text not null default 'active' check (status in ('active','closed','completed')),
  fields jsonb not null default '["name","email"]'::jsonb,
  winner_entry_id uuid,
  created_at timestamptz not null default now()
);
grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "Anyone can view events" on public.events for select to anon, authenticated using (true);
create policy "Owners insert events" on public.events for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners update events" on public.events for update to authenticated using (auth.uid() = owner_id);
create policy "Owners delete events" on public.events for delete to authenticated using (auth.uid() = owner_id);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text,
  email text,
  instagram text,
  tiktok text,
  other_social text,
  status text not null default 'valid' check (status in ('valid','disqualified','winner')),
  created_at timestamptz not null default now()
);
create unique index entries_email_uniq on public.entries (event_id, lower(email)) where email is not null;
create unique index entries_ig_uniq on public.entries (event_id, lower(instagram)) where instagram is not null;
create unique index entries_tt_uniq on public.entries (event_id, lower(tiktok)) where tiktok is not null;
create unique index entries_other_uniq on public.entries (event_id, lower(other_social)) where other_social is not null;
grant select, update on public.entries to authenticated;
grant all on public.entries to service_role;
alter table public.entries enable row level security;
create policy "Owners view entries" on public.entries for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
create policy "Owners update entries" on public.entries for update to authenticated
  using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));

create or replace function public.entry_count(_event_id uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.entries where event_id = _event_id
$$;

create or replace function public.submit_entry(_slug text, _name text, _email text, _instagram text, _tiktok text, _other text)
returns text language plpgsql security definer set search_path = public as $$
declare ev public.events; f jsonb;
  n text := nullif(trim(_name),''); em text := nullif(lower(trim(_email)),'');
  ig text := nullif(lower(trim(both '@ ' from coalesce(_instagram,''))),'');
  tt text := nullif(lower(trim(both '@ ' from coalesce(_tiktok,''))),'');
  ot text := nullif(trim(_other),'');
begin
  select * into ev from public.events where slug = _slug;
  if not found then return 'not_found'; end if;
  if ev.status <> 'active' or (ev.closes_at is not null and ev.closes_at <= now()) then return 'closed'; end if;
  f := ev.fields;
  if (f ? 'name' and n is null) or (f ? 'email' and em is null) or (f ? 'instagram' and ig is null)
     or (f ? 'tiktok' and tt is null) or (f ? 'other' and ot is null) then return 'missing'; end if;
  if em is not null and em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return 'invalid_email'; end if;
  if char_length(coalesce(n,'')) > 100 or char_length(coalesce(em,'')) > 255 or char_length(coalesce(ig,'')) > 60
     or char_length(coalesce(tt,'')) > 60 or char_length(coalesce(ot,'')) > 120 then return 'too_long'; end if;
  begin
    insert into public.entries(event_id,name,email,instagram,tiktok,other_social)
    values (ev.id,
      case when f ? 'name' then n end, case when f ? 'email' then em end,
      case when f ? 'instagram' then ig end, case when f ? 'tiktok' then tt end,
      case when f ? 'other' then ot end);
  exception when unique_violation then return 'duplicate';
  end;
  return 'ok';
end $$;
grant execute on function public.entry_count(uuid) to anon, authenticated;
grant execute on function public.submit_entry(text,text,text,text,text,text) to anon, authenticated;

alter publication supabase_realtime add table public.entries;