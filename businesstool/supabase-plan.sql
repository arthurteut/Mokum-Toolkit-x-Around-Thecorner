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

-- ── Activitate: vizitele fiecăruia (cine intră, cât stă, ce citește, cât modifică) ──
-- Un rând = o deschidere a paginii; pagina îl actualizează la 30 s cât e folosită.
create table if not exists public.plan_visits (
  id           text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  email        text not null default '',
  started_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  seconds      integer not null default 0,          -- timp activ (pagina în față și folosită)
  device       text not null default '',            -- telefon / desktop
  blocks       jsonb not null default '[]'::jsonb,  -- blocurile văzute
  edits        integer not null default 0           -- modificări salvate în vizită
);
create index if not exists plan_visits_user_time on public.plan_visits (user_id, last_seen_at desc);
alter table public.plan_visits enable row level security;

drop policy if exists "fiecare isi noteaza vizitele" on public.plan_visits;
create policy "fiecare isi noteaza vizitele" on public.plan_visits
  for insert to authenticated with check (user_id = auth.uid() and public.plan_is_member());
drop policy if exists "fiecare isi actualizeaza vizitele" on public.plan_visits;
create policy "fiecare isi actualizeaza vizitele" on public.plan_visits
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "adminul vede activitatea" on public.plan_visits;
create policy "adminul vede activitatea" on public.plan_visits
  for select to authenticated using (public.plan_is_admin() or user_id = auth.uid());

-- ── Notificări push + aplicația pe telefon (funcția Supabase `notify`, sursa în supabase/functions/notify) ──
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- abonările push ale dispozitivelor (una pe dispozitiv/browser)
create table if not exists public.plan_push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  email      text not null default '',
  sub        jsonb not null,
  device     text not null default '',
  ua         text not null default '',
  failed     integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.plan_push_subs enable row level security;
drop policy if exists "fiecare isi vede abonarile" on public.plan_push_subs;
create policy "fiecare isi vede abonarile" on public.plan_push_subs
  for select to authenticated using (user_id = auth.uid() or public.plan_is_admin());
drop policy if exists "fiecare isi adauga abonarile" on public.plan_push_subs;
create policy "fiecare isi adauga abonarile" on public.plan_push_subs
  for insert to authenticated with check (user_id = auth.uid() and public.plan_is_member());
drop policy if exists "fiecare isi actualizeaza abonarile" on public.plan_push_subs;
create policy "fiecare isi actualizeaza abonarile" on public.plan_push_subs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "fiecare isi sterge abonarile" on public.plan_push_subs;
create policy "fiecare isi sterge abonarile" on public.plan_push_subs
  for delete to authenticated using (user_id = auth.uid());

-- ce s-a trimis; (kind, day) unic = o notificare programată o singură dată pe zi
create table if not exists public.plan_notices (
  id         bigserial primary key,
  kind       text not null,              -- daily | milestones | weekly | message
  day        date,                       -- ziua locală pentru cele programate
  title      text not null default '',
  body       text not null default '',
  recipients integer not null default 0,
  sent       integer not null default 0,
  created_by text not null default '',
  created_at timestamptz not null default now()
);
create unique index if not exists plan_notices_once on public.plan_notices (kind, day) where day is not null;
alter table public.plan_notices enable row level security;
drop policy if exists "echipa vede ce s-a trimis" on public.plan_notices;
create policy "echipa vede ce s-a trimis" on public.plan_notices
  for select to authenticated using (public.plan_is_member());

-- secretele funcției: cheile VAPID (se generează singure la prima rulare) și secretul pentru cron; fără politici = doar service role
create table if not exists public.plan_secrets (
  key        text primary key,
  value      text not null,
  created_at timestamptz not null default now()
);
alter table public.plan_secrets enable row level security;
insert into public.plan_secrets (key, value) values ('cron', encode(extensions.gen_random_bytes(24), 'hex')) on conflict (key) do nothing;

-- o dată pe oră, funcția decide ce e de trimis la ora României (19 reminder, 9 repere, luni 9 rezumat)
-- (înlocuiește <ref> cu referința proiectului)
select cron.schedule('heat-notify-hourly', '0 * * * *', $$
  select net.http_post(
    url := 'https://tckcmfdolaickwtxglvt.supabase.co/functions/v1/notify',
    body := '{"job":"cron"}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.plan_secrets where key = 'cron')),
    timeout_milliseconds := 30000
  );
$$);

-- ── Actualizări live între dispozitivele echipei ──
do $$ begin
  alter publication supabase_realtime add table public.plan_docs;
exception when duplicate_object then null; end $$;

-- ── Primul administrator (se adaugă colegii din pagină, butonul „Echipa”) ──
-- insert into public.plan_members (email, name, role, is_admin)
-- values (lower('admin@exemplu.ro'), 'Nume Admin', 'ATC', true) on conflict (email) do nothing;
