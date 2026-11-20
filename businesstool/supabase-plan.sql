-- Heat · plan de afaceri (businesstool.heatcertifried.ro)
-- Rulează o singură dată în Supabase → SQL Editor → New query → Run (sau e aplicat deja ca migrație).
-- Creează echipa cu acces, numele utilizatorilor, documentele planului și regulile de acces.

-- ── Echipa: doar emailurile de aici pot deschide și modifica planul ──
create table if not exists public.plan_members (
  email      text primary key check (email = lower(email)),
  name       text not null,
  role       text not null default 'Echipa Heat',
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.plan_is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.plan_members
                 where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

create or replace function public.plan_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.plan_members
                 where email = lower(coalesce(auth.jwt() ->> 'email', '')) and is_admin);
$$;

-- ── Numele celor care au intrat (pentru „modificat de …”) ──
create table if not exists public.plan_users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null default '',
  updated_at timestamptz not null default now()
);

-- ── Documentele planului: o colecție + un id + conținutul (JSON) ──
-- Colecțiile: plan, settings, segments, competitors, products, milestones, risks, costs, captable,
-- roles, tov, moments, kpis, sops, content, checklist, swot, journey, raci și private (id = utilizatorul).
create table if not exists public.plan_docs (
  coll       text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text not null default '',
  primary key (coll, id)
);

-- ── Reguli de acces (Row Level Security) ──
alter table public.plan_members enable row level security;
alter table public.plan_users   enable row level security;
alter table public.plan_docs    enable row level security;

drop policy if exists "echipa vede echipa" on public.plan_members;
create policy "echipa vede echipa" on public.plan_members
  for select to authenticated using (public.plan_is_member());
drop policy if exists "adminul gestioneaza echipa" on public.plan_members;
create policy "adminul gestioneaza echipa" on public.plan_members
  for all to authenticated using (public.plan_is_admin()) with check (public.plan_is_admin());

drop policy if exists "echipa vede numele" on public.plan_users;
create policy "echipa vede numele" on public.plan_users
  for select to authenticated using (public.plan_is_member());
drop policy if exists "fiecare isi scrie profilul" on public.plan_users;
create policy "fiecare isi scrie profilul" on public.plan_users
  for insert to authenticated with check (id = auth.uid() and public.plan_is_member());
drop policy if exists "fiecare isi actualizeaza profilul" on public.plan_users;
create policy "fiecare isi actualizeaza profilul" on public.plan_users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "echipa citeste planul" on public.plan_docs;
create policy "echipa citeste planul" on public.plan_docs
  for select to authenticated
  using (public.plan_is_member() and (coll <> 'private' or id = auth.uid()::text));
drop policy if exists "echipa adauga in plan" on public.plan_docs;
create policy "echipa adauga in plan" on public.plan_docs
  for insert to authenticated
  with check (public.plan_is_member() and (coll <> 'private' or id = auth.uid()::text));
drop policy if exists "echipa modifica planul" on public.plan_docs;
create policy "echipa modifica planul" on public.plan_docs
  for update to authenticated
  using (public.plan_is_member() and (coll <> 'private' or id = auth.uid()::text))
  with check (public.plan_is_member() and (coll <> 'private' or id = auth.uid()::text));
drop policy if exists "echipa sterge din plan" on public.plan_docs;
create policy "echipa sterge din plan" on public.plan_docs
  for delete to authenticated
  using (public.plan_is_member() and (coll <> 'private' or id = auth.uid()::text));

-- ── Actualizări live între dispozitivele echipei ──
do $$ begin
  alter publication supabase_realtime add table public.plan_docs;
exception when duplicate_object then null; end $$;

-- ── Primul administrator (se adaugă colegii din pagină, butonul „Echipa”) ──
-- insert into public.plan_members (email, name, role, is_admin)
-- values (lower('admin@exemplu.ro'), 'Nume Admin', 'ATC', true) on conflict (email) do nothing;
