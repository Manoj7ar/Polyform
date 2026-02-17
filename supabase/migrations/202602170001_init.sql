create extension if not exists "pgcrypto";

create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_language text not null default 'en',
  share_mode_default text not null default 'edit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  type text not null,
  x double precision not null default 120,
  y double precision not null default 120,
  w double precision not null default 420,
  h double precision not null default 280,
  source_language text not null default 'en',
  translation_version integer not null default 1,
  universal boolean not null default false,
  source_content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists share_links (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  mode text not null,
  token text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists space_snapshots (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists space_events (
  id bigserial primary key,
  space_id uuid not null references spaces(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_spaces_updated_at on spaces(updated_at desc);
create index if not exists idx_blocks_space_id on blocks(space_id);
create index if not exists idx_share_links_space_id on share_links(space_id);
create index if not exists idx_snapshots_space_id on space_snapshots(space_id);

