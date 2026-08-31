-- DB_SCHEMA.sql

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  fivem_identifier text unique not null,
  username text unique not null,
  password_hash text not null,
  discord_id text,
  created_at timestamptz default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text,
  description text,
  status text default 'open',
  assigned_room text,
  created_at timestamptz default now()
);

create table support_queue (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id),
  position int,
  created_at timestamptz default now()
);

-- Test-Account: Verwende die API (empfohlen) um das Passwort korrekt zu hashen:
-- curl -X POST https://<DEIN_BACKEND_URL>/api/register -H "Content-Type: application/json" -d '{"identifier":"license:TEST","username":"tester","password":"TESTACC123!"}'
