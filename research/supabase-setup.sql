-- Heat · jurnal de bonuri (research.heatcertifried.ro)
-- Rulează o singură dată în Supabase → SQL Editor → New query → Run.
-- Creează echipa (lista de emailuri cu acces), jurnalul de bonuri și regulile de acces.

-- ── Echipa: doar emailurile de aici pot citi și scrie în jurnal ──
create table if not exists public.research_members (
  email      text primary key check (email = lower(email)),
  name       text not null,
  role       text not null default 'Research',
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.research_is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.research_members
                 where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

create or replace function public.research_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.research_members
                 where email = lower(coalesce(auth.jwt() ->> 'email', '')) and is_admin);
$$;

-- ── Bonurile de la concurență ──
create table if not exists public.research_receipts (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  by_name    text not null default '',
  ts         bigint not null,                 -- data + ora de pe bon, ms (pentru ordonare)
  date       text not null check (date ~ '^\d{4}-\d{2}-\d{2}$'),
  time       text not null check (time ~ '^\d{2}:\d{2}$'),
  comp       text not null,                   -- concurent
  loc        text not null,                   -- locație
  reg        text not null default '',        -- casa de marcat
  nr         integer not null check (nr >= 0),-- nr. bon
  z          integer,                         -- nr. raport Z
  total      numeric(10, 2),
  pay        text not null default '',
  items      jsonb not null default '[]'::jsonb, -- [{n, q, p}]
  open       text not null default '',
  close      text not null default '',
  numbering  text not null default 'auto' check (numbering in ('auto', 'reset', 'cont')),
  queue      smallint,
  people     integer,
  rating     smallint check (rating between 1 and 5),
  wait       integer,
  notes      text not null default ''
);
create index if not exists research_receipts_ts on public.research_receipts (ts desc);

-- ── Reguli de acces (Row Level Security) ──
alter table public.research_members  enable row level security;
alter table public.research_receipts enable row level security;

drop policy if exists "echipa vede echipa" on public.research_members;
create policy "echipa vede echipa" on public.research_members
  for select to authenticated using (public.research_is_member());
drop policy if exists "adminul gestioneaza echipa" on public.research_members;
create policy "adminul gestioneaza echipa" on public.research_members
  for all to authenticated using (public.research_is_admin()) with check (public.research_is_admin());

drop policy if exists "echipa citeste bonurile" on public.research_receipts;
create policy "echipa citeste bonurile" on public.research_receipts
  for select to authenticated using (public.research_is_member());
drop policy if exists "echipa adauga bonuri" on public.research_receipts;
create policy "echipa adauga bonuri" on public.research_receipts
  for insert to authenticated with check (public.research_is_member() and created_by = auth.uid());
drop policy if exists "autorul sau adminul sterge" on public.research_receipts;
create policy "autorul sau adminul sterge" on public.research_receipts
  for delete to authenticated using (created_by = auth.uid() or public.research_is_admin());

-- ── Actualizări live între telefoanele echipei ──
do $$ begin
  alter publication supabase_realtime add table public.research_receipts;
exception when duplicate_object then null; end $$;

-- ── Primul administrator: înlocuiește emailul și numele, apoi rulează ──
insert into public.research_members (email, name, role, is_admin)
values (lower('admin@exemplu.ro'), 'Nume Admin', 'Manager', true)
on conflict (email) do nothing;
