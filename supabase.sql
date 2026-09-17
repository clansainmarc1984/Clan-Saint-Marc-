-- BASE DE DONNEES DU SITE CLAN SAINT MARC
-- A executer une seule fois dans Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date,
  text text not null,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists public.birthdays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  promo text,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  image text not null,
  date date,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  year text not null,
  text text,
  created_at timestamptz not null default now()
);

alter table public.news enable row level security;
alter table public.birthdays enable row level security;
alter table public.gallery enable row level security;
alter table public.videos enable row level security;
alter table public.promotions enable row level security;

-- Lecture publique du contenu.
create policy "public read news" on public.news for select using (true);
create policy "public read birthdays" on public.birthdays for select using (true);
create policy "public read gallery" on public.gallery for select using (true);
create policy "public read videos" on public.videos for select using (true);
create policy "public read promotions" on public.promotions for select using (true);

-- Seuls les utilisateurs connectes peuvent modifier.
create policy "auth insert news" on public.news for insert to authenticated with check (true);
create policy "auth update news" on public.news for update to authenticated using (true) with check (true);
create policy "auth delete news" on public.news for delete to authenticated using (true);

create policy "auth insert birthdays" on public.birthdays for insert to authenticated with check (true);
create policy "auth update birthdays" on public.birthdays for update to authenticated using (true) with check (true);
create policy "auth delete birthdays" on public.birthdays for delete to authenticated using (true);

create policy "auth insert gallery" on public.gallery for insert to authenticated with check (true);
create policy "auth update gallery" on public.gallery for update to authenticated using (true) with check (true);
create policy "auth delete gallery" on public.gallery for delete to authenticated using (true);

create policy "auth insert videos" on public.videos for insert to authenticated with check (true);
create policy "auth update videos" on public.videos for update to authenticated using (true) with check (true);
create policy "auth delete videos" on public.videos for delete to authenticated using (true);

create policy "auth insert promotions" on public.promotions for insert to authenticated with check (true);
create policy "auth update promotions" on public.promotions for update to authenticated using (true) with check (true);
create policy "auth delete promotions" on public.promotions for delete to authenticated using (true);
