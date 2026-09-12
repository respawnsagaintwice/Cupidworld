-- =========================================================
-- "Our Little World" — Supabase Database Schema & Security
-- Authoritative Source of Truth for Auth, Worlds & Members
-- =========================================================

-- Enable uuid generator
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  nickname text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile trigger on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, nickname, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)) || ' ♡',
    now(),
    now()
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, profiles.display_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. COUPLES (Private Worlds)
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Little World',
  anniversary_date date,
  cover_image_url text default '/images/cute_home_bg.jpg',
  theme_preference text default 'classic_cream',
  created_at timestamptz default now() not null
);

-- 3. COUPLE MEMBERS (Strictly max 2 members per couple, 1 world per user)
create table if not exists public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'partner' check (role in ('creator', 'partner')),
  joined_at timestamptz default now() not null,
  unique (couple_id, user_id),
  unique (user_id) -- A user can belong to ONLY ONE world at a time
);

-- 4. COUPLE INVITES (Single-use, 7-day expiration)
create table if not exists public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  invite_code text unique not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now() not null
);

-- 5. MEMORIES (Polaroid Scrapbook photos)
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete set null,
  image_url text not null,
  thumbnail_url text,
  title text not null,
  caption text,
  memory_date date not null default current_date,
  location text,
  mood text default 'cozy',
  rotation_deg numeric(4,2) default 0,
  tape_style text default 'washi-pink',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 6. MEMORY COMMENTS (Sticky note thoughts)
create table if not exists public.memory_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  paper_color text default 'yellow',
  created_at timestamptz default now() not null
);

-- 7. MEMORY REACTIONS
create table if not exists public.memory_reactions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('heart', 'sparkle', 'hug', 'kiss', 'cry_happy', 'laugh')),
  created_at timestamptz default now() not null,
  unique (memory_id, user_id, reaction)
);

-- 8. IMPORTANT DATES (Bedroom wall calendar)
create table if not exists public.important_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  date date not null,
  description text,
  type text not null default 'special',
  icon text default 'heart',
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 9. LOVE NOTES (Stationery notes & postcards)
create table if not exists public.love_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  paper_style text default 'cream-ruled',
  sticker text default 'heart',
  is_pinned boolean default false,
  created_at timestamptz default now() not null
);

-- 10. RELATIONSHIP EVENTS (Our Story Ribbon Timeline)
create table if not exists public.relationship_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  event_type text not null default 'milestone',
  icon text default 'sparkle',
  associated_memory_id uuid references public.memories(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- INDEXES
create index if not exists idx_couple_members_user on public.couple_members(user_id);
create index if not exists idx_couple_members_couple on public.couple_members(couple_id);
create index if not exists idx_couple_invites_code on public.couple_invites(invite_code);
create index if not exists idx_memories_couple_date on public.memories(couple_id, memory_date desc);
create index if not exists idx_comments_memory on public.memory_comments(memory_id);
create index if not exists idx_reactions_memory on public.memory_reactions(memory_id);
create index if not exists idx_important_dates_couple on public.important_dates(couple_id, date asc);
create index if not exists idx_love_notes_couple on public.love_notes(couple_id, created_at desc);
create index if not exists idx_relationship_events_date on public.relationship_events(couple_id, event_date asc);

-- RLS HELPER FUNCTION
create or replace function public.get_user_couple_id(p_user_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select couple_id from public.couple_members where user_id = p_user_id limit 1;
$$;

-- TRIGGER TO ENFORCE ATOMIC 2-MEMBER MAXIMUM WITH ROW-LEVEL LOCKING
create or replace function public.check_couple_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_count int;
begin
  -- Explicitly lock parent couple row to serialize concurrent join attempts
  perform 1 from public.couples where id = NEW.couple_id for update;

  select count(*) into member_count from public.couple_members where couple_id = NEW.couple_id;
  if member_count >= 2 then
    raise exception 'This couple world already has 2 members.';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_check_couple_member_limit on public.couple_members;
create trigger trg_check_couple_member_limit
before insert on public.couple_members
for each row
execute function public.check_couple_member_limit();

-- =========================================================
-- AUTHORITATIVE RPC FUNCTIONS FOR WORLDS & INVITES
-- =========================================================

-- 1. CREATE WORLD AND INVITE CODE (Atomic for Creator)
create or replace function public.create_world_and_invite(
  p_name text,
  p_anniversary_date date,
  p_cover_image_url text default '/images/cute_home_bg.jpg'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_couple_id uuid;
  v_invite_code text;
  v_existing_world uuid;
  v_result jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to create a world.';
  end if;

  -- Ensure profile exists
  insert into public.profiles (id, display_name, nickname)
  values (v_user_id, 'Creator', 'Creator ♡')
  on conflict (id) do nothing;

  -- Check if user already belongs to a world
  select couple_id into v_existing_world from public.couple_members where user_id = v_user_id limit 1;
  if v_existing_world is not null then
    raise exception 'You already belong to a couple world.';
  end if;

  -- Create Couple
  insert into public.couples (name, anniversary_date, cover_image_url)
  values (coalesce(nullif(trim(p_name), ''), 'Our Little World'), p_anniversary_date, p_cover_image_url)
  returning id into v_couple_id;

  -- Add Creator as member 1
  insert into public.couple_members (couple_id, user_id, role, joined_at)
  values (v_couple_id, v_user_id, 'creator', now());

  -- Generate secure unpredictable 6-char code: WORLD-XXXXXX
  v_invite_code := 'WORLD-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  -- Insert single-use 7-day invite
  insert into public.couple_invites (couple_id, created_by, invite_code, expires_at)
  values (v_couple_id, v_user_id, v_invite_code, now() + interval '7 days');

  select jsonb_build_object(
    'couple_id', v_couple_id,
    'world_name', coalesce(nullif(trim(p_name), ''), 'Our Little World'),
    'anniversary_date', p_anniversary_date,
    'invite_code', v_invite_code,
    'member_count', 1,
    'role', 'creator'
  ) into v_result;

  return v_result;
end;
$$;

-- 2. VALIDATE WORLD INVITE (Pure validation without modifying state)
create or replace function public.validate_world_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_clean_code text;
  v_invite record;
  v_couple record;
  v_creator record;
  v_member_count int;
  v_existing_world uuid;
begin
  -- 1. Unauthenticated users must not see ANY world information
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object(
      'valid', false,
      'code', 'UNAUTHENTICATED',
      'message', 'First, come in as yourself ♡ Create an account or log in before joining your person''s world.'
    );
  end if;

  v_clean_code := upper(trim(p_code));

  if v_clean_code = '' then
    return jsonb_build_object('valid', false, 'code', 'INVITE_NOT_FOUND', 'message', 'This invite doesn''t seem to exist ♡');
  end if;

  if v_clean_code not like 'WORLD-%' then
    v_clean_code := 'WORLD-' || v_clean_code;
  end if;

  -- 2. Check if invite exists
  select * into v_invite from public.couple_invites where invite_code = v_clean_code;
  if not found then
    return jsonb_build_object('valid', false, 'code', 'INVITE_NOT_FOUND', 'message', 'This invite doesn''t seem to exist ♡');
  end if;

  -- 3. Check if expired (default 7 days)
  if v_invite.expires_at <= now() then
    return jsonb_build_object('valid', false, 'code', 'INVITE_EXPIRED', 'message', 'This invite has expired ♡');
  end if;

  -- 4. Check if already used
  if v_invite.used_by is not null or v_invite.used_at is not null then
    return jsonb_build_object('valid', false, 'code', 'INVITE_ALREADY_USED', 'message', 'This invite has already been used ♡');
  end if;

  -- 5. Check if world exists
  select * into v_couple from public.couples where id = v_invite.couple_id;
  if not found then
    return jsonb_build_object('valid', false, 'code', 'INVITE_NOT_FOUND', 'message', 'This invite doesn''t seem to exist ♡');
  end if;

  -- 6. Check world capacity
  select count(*) into v_member_count from public.couple_members where couple_id = v_couple.id;
  if v_member_count >= 2 then
    return jsonb_build_object('valid', false, 'code', 'WORLD_FULL', 'message', 'This little world is already full ♡ Only two partners can share a world.');
  end if;

  -- 7. Check if user is the creator
  if v_invite.created_by = v_user_id then
    return jsonb_build_object('valid', false, 'code', 'SELF_JOIN', 'message', 'This is already your little world ♡ You don''t need to join it again.');
  end if;

  -- 8. Check if user already belongs to ANY world
  select couple_id into v_existing_world from public.couple_members where user_id = v_user_id limit 1;
  if v_existing_world is not null then
    if v_existing_world = v_couple.id then
      return jsonb_build_object('valid', false, 'code', 'SELF_JOIN', 'message', 'This is already your little world ♡ You don''t need to join it again.');
    else
      return jsonb_build_object('valid', false, 'code', 'ALREADY_IN_WORLD', 'message', 'You''re already part of another little world ♡');
    end if;
  end if;

  -- 9. Creator details
  select display_name into v_creator from public.profiles where id = v_invite.created_by;

  return jsonb_build_object(
    'valid', true,
    'code', 'VALID',
    'world_id', v_couple.id,
    'world_name', v_couple.name,
    'creator_name', coalesce(v_creator.display_name, 'Your partner'),
    'member_count', v_member_count,
    'invite_code', v_clean_code
  );
end;
$$;

-- 3. JOIN WORLD WITH INVITE (Atomic join for Person 2)
create or replace function public.join_world_with_invite(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_clean_code text;
  v_invite record;
  v_couple record;
  v_member_count int;
  v_existing_world uuid;
  v_result jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'code', 'UNAUTHENTICATED', 'message', 'First, come in as yourself ♡ Create an account or log in before joining your person''s world.');
  end if;

  v_clean_code := upper(trim(p_code));
  if v_clean_code = '' then
    return jsonb_build_object('success', false, 'code', 'INVITE_NOT_FOUND', 'message', 'This invite doesn''t seem to exist ♡');
  end if;

  if v_clean_code not like 'WORLD-%' then
    v_clean_code := 'WORLD-' || v_clean_code;
  end if;

  -- Lock the invite row for update
  select * into v_invite from public.couple_invites where invite_code = v_clean_code for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'INVITE_NOT_FOUND', 'message', 'This invite doesn''t seem to exist ♡');
  end if;

  -- Check expiry
  if v_invite.expires_at <= now() then
    return jsonb_build_object('success', false, 'code', 'INVITE_EXPIRED', 'message', 'This invite has expired ♡');
  end if;

  -- Check if already used
  if v_invite.used_by is not null or v_invite.used_at is not null then
    return jsonb_build_object('success', false, 'code', 'INVITE_ALREADY_USED', 'message', 'This invite has already been used ♡');
  end if;

  -- Creator self-join rejection
  if v_invite.created_by = v_user_id then
    return jsonb_build_object('success', false, 'code', 'SELF_JOIN', 'message', 'This is already your little world ♡ You don''t need to join it again.');
  end if;

  -- Check if user already belongs to another world
  select couple_id into v_existing_world from public.couple_members where user_id = v_user_id limit 1;
  if v_existing_world is not null then
    if v_existing_world = v_invite.couple_id then
      return jsonb_build_object('success', false, 'code', 'SELF_JOIN', 'message', 'This is already your little world ♡ You don''t need to join it again.');
    else
      return jsonb_build_object('success', false, 'code', 'ALREADY_IN_WORLD', 'message', 'You''re already part of another little world ♡');
    end if;
  end if;

  -- Lock the couple row to serialize capacity checks
  select * into v_couple from public.couples where id = v_invite.couple_id for update;
  if not found then
    return jsonb_build_object('success', false, 'code', 'INVITE_NOT_FOUND', 'message', 'This invite doesn''t seem to exist ♡');
  end if;

  -- Strict 2-member capacity check
  select count(*) into v_member_count from public.couple_members where couple_id = v_couple.id;
  if v_member_count >= 2 then
    return jsonb_build_object('success', false, 'code', 'WORLD_FULL', 'message', 'This little world is already full ♡ Only two partners can share a world.');
  end if;

  -- Ensure profile exists
  insert into public.profiles (id, display_name, nickname)
  values (v_user_id, 'Partner', 'Partner ♡')
  on conflict (id) do nothing;

  -- Insert Member 2 (partner)
  insert into public.couple_members (couple_id, user_id, role, joined_at)
  values (v_couple.id, v_user_id, 'partner', now());

  -- Mark single-use invite as used
  update public.couple_invites
  set used_by = v_user_id, used_at = now()
  where id = v_invite.id;

  select jsonb_build_object(
    'success', true,
    'couple_id', v_couple.id,
    'world_name', v_couple.name,
    'anniversary_date', v_couple.anniversary_date,
    'member_count', 2,
    'role', 'partner'
  ) into v_result;

  return v_result;
end;
$$;

-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.memories enable row level security;
alter table public.memory_comments enable row level security;
alter table public.memory_reactions enable row level security;
alter table public.important_dates enable row level security;
alter table public.love_notes enable row level security;
alter table public.relationship_events enable row level security;

-- POLICIES
drop policy if exists "Profiles select" on public.profiles;
create policy "Profiles select" on public.profiles
  for select using (
    id = auth.uid() or 
    id in (select user_id from public.couple_members where couple_id = public.get_user_couple_id(auth.uid()))
  );

drop policy if exists "Profiles update" on public.profiles;
create policy "Profiles update" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "Profiles insert" on public.profiles;
create policy "Profiles insert" on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists "Couples select" on public.couples;
create policy "Couples select" on public.couples
  for select using (id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Couples update" on public.couples;
create policy "Couples update" on public.couples
  for update using (id = public.get_user_couple_id(auth.uid()));

-- Direct client inserts denied; world creation MUST go through create_world_and_invite()
drop policy if exists "Couples insert" on public.couples;
create policy "Couples insert" on public.couples
  for insert with check (false);

drop policy if exists "Members select" on public.couple_members;
create policy "Members select" on public.couple_members
  for select using (couple_id = public.get_user_couple_id(auth.uid()) or user_id = auth.uid());

-- Direct client inserts denied; world joins MUST go through join_world_with_invite()
drop policy if exists "Members insert" on public.couple_members;
create policy "Members insert" on public.couple_members
  for insert with check (false);

drop policy if exists "Invites select" on public.couple_invites;
create policy "Invites select" on public.couple_invites
  for select using (
    couple_id = public.get_user_couple_id(auth.uid()) or 
    created_by = auth.uid()
  );

-- Direct client inserts denied; invite generation MUST go through create_world_and_invite()
drop policy if exists "Invites insert" on public.couple_invites;
create policy "Invites insert" on public.couple_invites
  for insert with check (false);

drop policy if exists "Memories select" on public.memories;
create policy "Memories select" on public.memories
  for select using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Memories insert" on public.memories;
create policy "Memories insert" on public.memories
  for insert with check (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Memories update" on public.memories;
create policy "Memories update" on public.memories
  for update using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Memories delete" on public.memories;
create policy "Memories delete" on public.memories
  for delete using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Comments select" on public.memory_comments;
create policy "Comments select" on public.memory_comments
  for select using (memory_id in (select id from public.memories where couple_id = public.get_user_couple_id(auth.uid())));

drop policy if exists "Comments insert" on public.memory_comments;
create policy "Comments insert" on public.memory_comments
  for insert with check (
    user_id = auth.uid() and 
    memory_id in (select id from public.memories where couple_id = public.get_user_couple_id(auth.uid()))
  );

drop policy if exists "Comments delete" on public.memory_comments;
create policy "Comments delete" on public.memory_comments
  for delete using (user_id = auth.uid());

drop policy if exists "Reactions select" on public.memory_reactions;
create policy "Reactions select" on public.memory_reactions
  for select using (memory_id in (select id from public.memories where couple_id = public.get_user_couple_id(auth.uid())));

drop policy if exists "Reactions insert" on public.memory_reactions;
create policy "Reactions insert" on public.memory_reactions
  for insert with check (
    user_id = auth.uid() and 
    memory_id in (select id from public.memories where couple_id = public.get_user_couple_id(auth.uid()))
  );

drop policy if exists "Reactions delete" on public.memory_reactions;
create policy "Reactions delete" on public.memory_reactions
  for delete using (user_id = auth.uid());

drop policy if exists "Dates select" on public.important_dates;
create policy "Dates select" on public.important_dates
  for select using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Dates insert" on public.important_dates;
create policy "Dates insert" on public.important_dates
  for insert with check (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Dates update" on public.important_dates;
create policy "Dates update" on public.important_dates
  for update using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Dates delete" on public.important_dates;
create policy "Dates delete" on public.important_dates
  for delete using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Notes select" on public.love_notes;
create policy "Notes select" on public.love_notes
  for select using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Notes insert" on public.love_notes;
create policy "Notes insert" on public.love_notes
  for insert with check (couple_id = public.get_user_couple_id(auth.uid()) and author_id = auth.uid());

drop policy if exists "Notes delete" on public.love_notes;
create policy "Notes delete" on public.love_notes
  for delete using (author_id = auth.uid());

drop policy if exists "Events select" on public.relationship_events;
create policy "Events select" on public.relationship_events
  for select using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Events insert" on public.relationship_events;
create policy "Events insert" on public.relationship_events
  for insert with check (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Events update" on public.relationship_events;
create policy "Events update" on public.relationship_events
  for update using (couple_id = public.get_user_couple_id(auth.uid()));

drop policy if exists "Events delete" on public.relationship_events;
create policy "Events delete" on public.relationship_events
  for delete using (couple_id = public.get_user_couple_id(auth.uid()));

-- STORAGE BUCKET
insert into storage.buckets (id, name, public) 
values ('couple-memories', 'couple-memories', false)
on conflict (id) do nothing;

drop policy if exists "Couple members can view photos" on storage.objects;
create policy "Couple members can view photos"
on storage.objects for select
using (
  bucket_id = 'couple-memories' 
  and (storage.foldername(name))[1] = public.get_user_couple_id(auth.uid())::text
);

drop policy if exists "Couple members can upload photos" on storage.objects;
create policy "Couple members can upload photos"
on storage.objects for insert
with check (
  bucket_id = 'couple-memories' 
  and (storage.foldername(name))[1] = public.get_user_couple_id(auth.uid())::text
);

-- =========================================================
-- FUNCTION EXECUTION PERMISSIONS
-- =========================================================
-- Revoke execution from public and anon (anonymous users cannot call these RPCs directly)
revoke execute on function public.create_world_and_invite(text, date, text) from public, anon;
revoke execute on function public.validate_world_invite(text) from public, anon;
revoke execute on function public.join_world_with_invite(text) from public, anon;

-- Grant execution to authenticated users and service_role
grant execute on function public.create_world_and_invite(text, date, text) to authenticated, service_role;
grant execute on function public.validate_world_invite(text) to authenticated, service_role;
grant execute on function public.join_world_with_invite(text) to authenticated, service_role;
grant execute on function public.get_user_couple_id(uuid) to authenticated, service_role;
