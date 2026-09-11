-- TEMPLATE OS room realtime schema
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null check (room_id in ('sli', 'work', 'lab')),
  sender_id uuid references auth.users(id) on delete set null,
  client_id text,
  author text not null default 'คุณ',
  initials text not null default 'G',
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  created_at timestamptz not null default now()
);

create index if not exists room_messages_room_created_idx
  on public.room_messages (room_id, created_at);

alter table public.room_messages enable row level security;

drop policy if exists "room messages are readable" on public.room_messages;
create policy "room messages are readable"
  on public.room_messages for select
  to anon, authenticated
  using (true);

drop policy if exists "room messages can be inserted" on public.room_messages;
create policy "room messages can be inserted"
  on public.room_messages for insert
  to anon, authenticated
  with check (role in ('user', 'assistant'));

-- Enable Supabase Realtime for this table without failing if it is already enabled.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_messages'
  ) then
    alter publication supabase_realtime add table public.room_messages;
  end if;
end
$$;
