-- =====================================================================
-- Torneo Balilla - schema Supabase
-- Incolla tutto in Supabase > SQL Editor > New query > Run
-- =====================================================================

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nickname text,
  role text not null check (role in ('ATT','DIF')),
  level int not null check (level between 1 and 3),   -- 1 forte, 2 intermedio, 3 principiante
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short text,
  crest jsonb,                -- stemma generato (forma, colori, motivo)
  attacker_id uuid references public.players(id) on delete set null,
  defender_id uuid references public.players(id) on delete set null,
  seed int,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null default 'group' check (stage in ('group','sf','final')),
  round int,
  slot text,                  -- 'sf1','sf2','final' per la fase finale
  home_id uuid references public.teams(id) on delete cascade,
  away_id uuid references public.teams(id) on delete cascade,
  scheduled_at timestamptz,
  location text,
  home_score int,
  away_score int,
  played boolean not null default false,
  scorers jsonb default '{}'::jsonb,   -- { "<player_id>": gol }
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  name text,
  location text,
  finalists int default 4
);
insert into public.settings (id, name, location) values (1, 'Torneo di Calcio Balilla', 'Calcetto')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Sicurezza: tutti leggono, solo gli utenti loggati (tu) scrivono.
-- Disattiva le iscrizioni pubbliche: Authentication > Sign In / Providers >
-- "Allow new users to sign up" = OFF, poi crea il tuo utente da Authentication > Users.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['players','teams','matches','settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "lettura pubblica" on public.%I', t);
    execute format('drop policy if exists "scrittura admin" on public.%I', t);
    execute format('create policy "lettura pubblica" on public.%I for select using (true)', t);
    execute format('create policy "scrittura admin" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Aggiornamenti in tempo reale
do $$
begin
  begin alter publication supabase_realtime add table public.players; exception when others then null; end;
  begin alter publication supabase_realtime add table public.teams; exception when others then null; end;
  begin alter publication supabase_realtime add table public.matches; exception when others then null; end;
  begin alter publication supabase_realtime add table public.settings; exception when others then null; end;
end $$;

-- Storage per le foto delle figurine (bucket pubblico)
insert into storage.buckets (id, name, public) values ('figurine', 'figurine', true)
on conflict (id) do nothing;

drop policy if exists "figurine lettura" on storage.objects;
drop policy if exists "figurine scrittura" on storage.objects;
drop policy if exists "figurine modifica" on storage.objects;
create policy "figurine lettura" on storage.objects for select using (bucket_id = 'figurine');
create policy "figurine scrittura" on storage.objects for insert to authenticated with check (bucket_id = 'figurine');
create policy "figurine modifica" on storage.objects for delete to authenticated using (bucket_id = 'figurine');
