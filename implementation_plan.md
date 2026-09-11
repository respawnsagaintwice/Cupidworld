# Implementation Plan: "Our Little World" — Private Couple Memory Scrapbook

"Our Little World" is an intimate, whimsical digital scrapbook and personal diary for two people to preserve memories, milestones, photos, and love notes over years. This plan establishes the end-to-end architecture, Supabase schema with rock-solid Row Level Security (RLS), design tokens, component hierarchy, and phased delivery plan.

---

## User Review Required

> [!IMPORTANT]
> **Supabase Project Credentials & Setup**:
> This project requires a Supabase project (URL and Anon key). We will provide an auto-configured `.env.example` and a production-grade SQL script ready to execute in the Supabase SQL Editor. We also support local mock/fallback mode during early UI design if credentials are not immediately provided.
>
> **Couple Membership Constraint**:
> A couple world is strictly limited to **exactly two members**. We enforce this at the database level via a Postgres trigger and unique constraint on `couple_members`.

---

## 1. Architectural Overview & Security Model

```
                    ┌────────────────────────┐
                    │      Next.js App       │
                    │   (App Router + SSR)   │
                    └───────────┬────────────┘
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
   ┌────────────────────┐               ┌────────────────────┐
   │ Client Components  │               │ Server Components  │
   │ (Framer Motion,    │               │ (Data Fetching,    │
   │  Scrapbook Canvas) │               │  Auth Validation)  │
   └─────────┬──────────┘               └──────────┬─────────┘
             │                                     │
             └──────────────────┬──────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Supabase Client /    │
                    │   SSR Auth Middleware  │
                    └───────────┬────────────┘
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
   ┌────────────────────┐               ┌────────────────────┐
   │ Postgres RLS       │               │ Supabase Storage   │
   │ - get_user_couple()│               │ - couple-memories/ │
   │ - 2-member limit   │               │   (Private bucket) │
   └────────────────────┘               └────────────────────┘
```

### Security & Row Level Security (RLS) Mechanics
1. **Helper Function (`security definer`)**:
   `get_user_couple_id(auth.uid())` looks up the active `couple_id` for the authenticated user from `couple_members`.
2. **Strict Isolation**:
   Every data table (`memories`, `memory_comments`, `memory_reactions`, `important_dates`, `love_notes`, `relationship_events`) contains `couple_id`.
   The RLS policy on all tables:
   ```sql
   USING (couple_id = get_user_couple_id(auth.uid()))
   WITH CHECK (couple_id = get_user_couple_id(auth.uid()))
   ```
3. **Storage Protection**:
   Files in the `couple-memories` bucket are structured by folder: `<couple_id>/<file_name>`. The storage RLS policy verifies that `(storage.foldername(name))[1] = get_user_couple_id(auth.uid())::text`.
4. **Couple Onboarding & Invite Link**:
   - Partner A signs up and creates a couple world. An invite code (`invite_code` with a 7-day TTL and single-use token) is generated.
   - Partner B receives a link: `/join/[inviteCode]`. When Partner B logs in / registers and accepts the invite, a transaction adds Partner B to `couple_members` and marks the invite as accepted.
   - A Postgres trigger checks `COUNT(*) FROM couple_members WHERE couple_id = NEW.couple_id` and rejects any attempt to insert a 3rd member.

---

## 2. Proposed Supabase Database Schema

```sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  nickname text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. COUPLES
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Little World',
  anniversary_date date,
  cover_image_url text,
  theme_preference text default 'classic_cream',
  created_at timestamptz default now() not null
);

-- 3. COUPLE MEMBERS (Max 2 members per couple)
create table public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'partner' check (role in ('creator', 'partner')),
  joined_at timestamptz default now() not null,
  unique (couple_id, user_id),
  unique (user_id) -- A user belongs to one couple world at a time
);

-- 4. COUPLE INVITES
create table public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  invite_code text unique not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now() not null
);

-- 5. MEMORIES (Polaroid / Scrapbook items)
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete set null,
  image_url text not null,
  thumbnail_url text,
  title text not null,
  caption text,
  memory_date date not null default current_date,
  location text,
  mood text, -- e.g. 'cozy', 'magical', 'silly', 'romantic'
  rotation_deg numeric(4,2) default 0, -- Stable aesthetic Polaroid tilt: -3.5 to +3.5 deg
  tape_style text default 'washi-pink', -- 'washi-pink', 'washi-lavender', 'corner-gold', etc.
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 6. MEMORY COMMENTS (Sticky note thoughts)
create table public.memory_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  created_at timestamptz default now() not null
);

-- 7. MEMORY REACTIONS
create table public.memory_reactions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('heart', 'sparkle', 'hug', 'kiss', 'cry_happy', 'laugh')),
  created_at timestamptz default now() not null,
  unique (memory_id, user_id, reaction)
);

-- 8. IMPORTANT DATES (Scrapbook Calendar)
create table public.important_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  date date not null,
  description text,
  type text not null default 'special', -- 'anniversary', 'birthday', 'trip', 'first_date', 'first_home', 'special', 'custom'
  icon text default 'heart',
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- 9. LOVE NOTES (Stationery letters & notes)
create table public.love_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  paper_style text default 'cream-ruled', -- 'cream-ruled', 'pink-blush', 'lavender-grid', 'kraft-vintage'
  sticker text default 'heart',
  is_pinned boolean default false,
  created_at timestamptz default now() not null
);

-- 10. RELATIONSHIP EVENTS (Our Story Timeline)
create table public.relationship_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  event_type text not null default 'milestone', -- 'first_met', 'first_date', 'first_kiss', 'trip', 'moved_in', 'engagement', 'custom'
  icon text default 'sparkle',
  associated_memory_id uuid references public.memories(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- INDEXES for fast retrieval
create index idx_couple_members_user on public.couple_members(user_id);
create index idx_couple_members_couple on public.couple_members(couple_id);
create index idx_memories_couple_date on public.memories(couple_id, memory_date desc);
create index idx_comments_memory on public.memory_comments(memory_id);
create index idx_reactions_memory on public.memory_reactions(memory_id);
create index idx_important_dates_couple on public.important_dates(couple_id, date asc);
create index idx_love_notes_couple on public.love_notes(couple_id, created_at desc);
create index idx_relationship_events_date on public.relationship_events(couple_id, event_date asc);

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

-- TRIGGER TO ENFORCE 2-MEMBER MAXIMUM
create or replace function public.check_couple_member_limit()
returns trigger
language plpgsql
as $$
declare
  member_count int;
begin
  select count(*) into member_count from public.couple_members where couple_id = NEW.couple_id;
  if member_count >= 2 then
    raise exception 'This couple world already has 2 members.';
  end if;
  return NEW;
end;
$$;

create trigger trg_check_couple_member_limit
before insert on public.couple_members
for each row
execute function public.check_couple_member_limit();

-- ENABLE RLS ON ALL TABLES
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

-- ROW LEVEL SECURITY POLICIES
-- Profiles: Any authenticated user can view partner profile; users can update only their own profile
create policy "Users can view members of their couple or self" on public.profiles
  for select using (
    id = auth.uid() or 
    id in (select user_id from public.couple_members where couple_id = public.get_user_couple_id(auth.uid()))
  );
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());
create policy "Users can insert own profile" on public.profiles
  for insert with check (id = auth.uid());

-- Couples: Couple members can view & update their couple
create policy "Couple members can view their couple" on public.couples
  for select using (id = public.get_user_couple_id(auth.uid()));
create policy "Couple members can update their couple" on public.couples
  for update using (id = public.get_user_couple_id(auth.uid()));
create policy "Authenticated users can create couples" on public.couples
  for insert with check (auth.role() = 'authenticated');

-- Couple Members:
create policy "View couple members" on public.couple_members
  for select using (couple_id = public.get_user_couple_id(auth.uid()) or user_id = auth.uid());
create policy "Insert couple member" on public.couple_members
  for insert with check (user_id = auth.uid());

-- Memories:
create policy "Memories select" on public.memories
  for select using (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Memories insert" on public.memories
  for insert with check (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Memories update" on public.memories
  for update using (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Memories delete" on public.memories
  for delete using (couple_id = public.get_user_couple_id(auth.uid()));

-- Memory Comments:
create policy "Comments select" on public.memory_comments
  for select using (memory_id in (select id from public.memories where couple_id = public.get_user_couple_id(auth.uid())));
create policy "Comments insert" on public.memory_comments
  for insert with check (
    user_id = auth.uid() and 
    memory_id in (select id from public.memories where couple_id = public.get_user_couple_id(auth.uid()))
  );
create policy "Comments delete" on public.memory_comments
  for delete using (user_id = auth.uid());

-- Memory Reactions:
create policy "Reactions select" on public.memory_reactions
  for select using (memory_id in (select id from public.memories where couple_id = public.get_user_couple_id(auth.uid())));
create policy "Reactions insert" on public.memory_reactions
  for insert with check (
    user_id = auth.uid() and 
    memory_id in (select id from public.memories where couple_id = public.get_user_couple_id(auth.uid()))
  );
create policy "Reactions delete" on public.memory_reactions
  for delete using (user_id = auth.uid());

-- Important Dates:
create policy "Dates select" on public.important_dates
  for select using (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Dates insert" on public.important_dates
  for insert with check (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Dates update" on public.important_dates
  for update using (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Dates delete" on public.important_dates
  for delete using (couple_id = public.get_user_couple_id(auth.uid()));

-- Love Notes:
create policy "Notes select" on public.love_notes
  for select using (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Notes insert" on public.love_notes
  for insert with check (couple_id = public.get_user_couple_id(auth.uid()) and author_id = auth.uid());
create policy "Notes delete" on public.love_notes
  for delete using (author_id = auth.uid());

-- Relationship Events:
create policy "Events select" on public.relationship_events
  for select using (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Events insert" on public.relationship_events
  for insert with check (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Events update" on public.relationship_events
  for update using (couple_id = public.get_user_couple_id(auth.uid()));
create policy "Events delete" on public.relationship_events
  for delete using (couple_id = public.get_user_couple_id(auth.uid()));
```

---

## 3. Design Tokens & Visual Aesthetics

### Color Palette (Tailwind & CSS Variables)
```css
:root {
  --color-cream: #FFF9F2;       /* Base background */
  --color-cream-subtle: #FFF3E6;/* Card / paper sheet layer */
  --color-soft-pink: #FFDDE8;   /* Romantic pastel accent */
  --color-rose: #F59BB5;        /* Deep romantic highlight */
  --color-lavender: #E8DFFF;    /* Calming pastel */
  --color-baby-blue: #DDF1FF;   /* Dreamy accent */
  --color-butter-yellow: #FFF1B8; /* Warm sunshine & post-it notes */
  --color-dark-brown: #594A4A;  /* High readability warm text */
  --color-warm-gray: #8F8282;   /* Secondary metadata text */
  --color-washi-tape: rgba(245, 155, 181, 0.45);
}
```

### Typography (Google Fonts via `next/font/google`)
- **Primary Rounded UI**: `Quicksand` or `Nunito` (warm, soft, legible rounded sans)
- **Handwritten Scrapbook Accent**: `Caveat` or `Kalam` (organic, handwritten strokes for captions, notes, stickers, tape text, and love letters)

### Decorative UI Components
- `PaperCard.tsx`: Deckle-edge, soft paper grain, subtle elevation.
- `PolaroidCard.tsx`: Classic photo frame with bottom caption area, subtle deterministic tilt angle based on memory ID hash, taped top edge.
- `WashiTape.tsx`: Translucent pastel tape with jagged edges (`mask-image` or SVG jagged ends).
- `Sticker.tsx`: Heart, star, doodle, flower, postage stamp badges with glossy peel effect.
- `Doodles.tsx`: SVG hand-drawn arrows, swirls, tiny stars, floating clouds, and hearts.

---

## 4. Proposed Folder Structure

```
c:/Users/djrob/OneDrive/Desktop/AWSREK/
├── public/
│   ├── doodles/          # Custom SVG doodles & stickers
│   ├── textures/         # Subtle paper noise SVG pattern
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/
│   │   │   ├── home/
│   │   │   │   └── page.tsx           # Heart of the app: days together, latest memory, on-this-day
│   │   │   ├── memories/
│   │   │   │   ├── page.tsx           # Polaroid scrapbook gallery
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # + Add memory flow
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Memory detail & sticky comments
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx           # Scrapbook calendar & date detail
│   │   │   ├── story/
│   │   │   │   └── page.tsx           # Chronological relationship ribbon timeline
│   │   │   ├── notes/
│   │   │   │   └── page.tsx           # Love notes stationery board
│   │   │   ├── settings/
│   │   │   │   └── page.tsx           # Couple info, anniversary, preferences
│   │   │   └── layout.tsx             # Cute romantic navbar + mobile bottom navigation
│   │   ├── onboarding/
│   │   │   ├── create/
│   │   │   │   └── page.tsx           # "Let's make your little world ♡"
│   │   │   └── join/[code]/
│   │   │       └── page.tsx           # "Join your person ♡"
│   │   ├── api/                       # API route handlers if needed
│   │   ├── layout.tsx                 # Root layout with fonts & providers
│   │   ├── page.tsx                   # Romantic landing page ("our little world ♡")
│   │   └── globals.css                # CSS variables, paper textures, animations
│   ├── components/
│   │   ├── decorative/
│   │   │   ├── PolaroidCard.tsx
│   │   │   ├── WashiTape.tsx
│   │   │   ├── Sticker.tsx
│   │   │   ├── PaperCard.tsx
│   │   │   ├── HeartDoodle.tsx
│   │   │   ├── StarDoodle.tsx
│   │   │   ├── FlowerDoodle.tsx
│   │   │   └── FloatingCloud.tsx
│   │   ├── navigation/
│   │   │   ├── Navbar.tsx             # Romantic top nav for tablet/desktop
│   │   │   └── BottomNav.tsx          # Mobile cute bottom tab bar
│   │   ├── memories/
│   │   │   ├── MemoryGrid.tsx
│   │   │   ├── MemoryUploadModal.tsx
│   │   │   ├── MemoryCard.tsx
│   │   │   └── MemoryComments.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarMonth.tsx
│   │   │   └── DateDetailModal.tsx
│   │   ├── story/
│   │   │   ├── StoryTimeline.tsx
│   │   │   └── AddEventModal.tsx
│   │   ├── notes/
│   │   │   ├── NoteCard.tsx
│   │   │   └── CreateNoteModal.tsx
│   │   └── ui/                        # Accessible buttons, inputs with scrapbook styling
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   ├── server.ts              # Server-side Supabase client (cookies)
│   │   │   └── middleware.ts          # Auth session refresh
│   │   ├── hooks/
│   │   │   ├── useCouple.ts
│   │   │   └── useMemories.ts
│   │   ├── utils/
│   │   │   ├── date.ts                # Duration calculators (e.g., "842 days together")
│   │   │   └── hashRotation.ts        # Stable deterministic tilt angle generator
│   │   └── types/
│   │       └── database.ts            # Supabase TypeScript schema definitions
│   └── middleware.ts                  # Route protection & onboarding redirection
├── supabase/
│   ├── schema.sql                     # Full PostgreSQL setup script
│   └── storage.sql                    # Storage bucket policies
├── .env.example
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── next.config.ts
```

---

## 5. Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Service Role Key for Admin triggers (if needed)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL (for invite links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 6. Required Dependencies (`package.json`)

Minimal, tightly focused dependencies:
- **Core Framework**: `next@latest`, `react@latest`, `react-dom@latest`
- **TypeScript & Utilities**: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`
- **Styling**: `tailwindcss@^3.4.0` (or v4), `postcss`, `autoprefixer`, `tailwind-merge`, `clsx`
- **Icons**: `lucide-react`
- **Animations**: `framer-motion` (or `motion`)
- **Backend & Auth**: `@supabase/supabase-js`, `@supabase/ssr`
- **Date Utilities**: `date-fns` (lightweight, tree-shakable date formatting and interval calculation)
- **Canvas Confetti**: `canvas-confetti` (for cute celebration sparkles on milestones & note creation)

---

## 7. Phased Implementation Roadmap

### Phase 1: Project Foundation & Design System (First Implementation Phase)
- Initialize Next.js 15+ App Router project with TypeScript and Tailwind CSS.
- Configure Google Fonts (`Quicksand` + `Caveat`).
- Establish design tokens in `tailwind.config.ts` and `globals.css` (paper grain texture, cream base, pastel palette, warm typography).
- Build the core decorative component library:
  - `PolaroidCard` with realistic shadows, tape accents, and deterministic tilt.
  - `WashiTape` styles (pink, lavender, butter yellow, gold).
  - `Sticker` & hand-drawn SVG `Doodles` (heart, flower, stars, cloud, ribbons).
  - `PaperCard` with vintage subtle texture and border lines.
- Build the romantic **Landing Page** (`/`):
  - "our little world ♡" headline with floating clouds, stars, and animated Polaroid previews.
  - Value proposition and CTA buttons ("Create our little world ♡" / "Join your person").

### Phase 2: Supabase Client, Auth & Middleware
- Create `@supabase/ssr` client setup for Server Components, Client Components, and Middleware.
- Build the romantic Auth pages (`/login`, `/signup`) with soft paper card styling, warm inputs, and error states.
- Setup route protection middleware: redirect unauthenticated users to `/login`, and users without a couple to `/onboarding`.

### Phase 3: Couple Onboarding & Invite Flow
- `/onboarding/create`: Step 1 (Display names), Step 2 (World name & Anniversary date), Step 3 (Cute invite code & shareable link generator).
- `/onboarding/join/[code]`: Welcome screen for Partner B ("You've been invited by [Partner A] to join [World Name] ♡").
- Couple membership confirmation and seamless transition into the app.

### Phase 4: Couple Home (Heart of the Scrapbook)
- Relationship counter: "together for X days, Y hours" with gentle pulsing heart icon.
- Dynamic greeting based on time of day: "Good morning / evening, love ♡".
- Latest memory featured as a hero Polaroid.
- "Next little thing...": upcoming anniversary/date countdown badge.
- "A little note": pinned sticky love note.
- "On this day ♡" banner when memories from previous years exist.

### Phase 5: Memories Scrapbook & Upload
- Scrapbook masonry/grid view with Polaroid styling and filtering (by mood, year, or location).
- Floating `+ add a memory` button with upload modal.
- Image preview, title, date, location, washi tape picker, and upload progress.
- Memory detail page (`/memories/[id]`):
  - High-res photo view.
  - Little notes / comments thread with cute handwriting.
  - Real-time reaction picker (sparkles, hearts, laughs).

### Phase 6: Scrapbook Calendar
- Custom monthly calendar styled like an agenda notebook.
- Date markers with stickers/emojis for anniversaries, birthdays, dates, and trips.
- Date detail modal with associated memories.
- Add / edit important date modal.

### Phase 7: Our Story (Relationship Timeline)
- Chronological vertical ribbon timeline.
- Milestones with icons (first met, first date, moved in, travels).
- Memory linking.

### Phase 8: Love Notes (Stationery Board)
- Love notes cork/paper board.
- Colorful stationery post-it notes with stamps.
- Create note modal with stationery style choices.

### Phase 9: Polish, Micro-interactions & Responsiveness
- Sound/sparkle micro-interactions on liking/reacting (respecting `prefers-reduced-motion`).
- Mobile bottom navigation bar with responsive touch targets.
- Empty states ("Your little scrapbook is empty ♡") and whimsical error states.
- Image optimization with Next.js `Image` and BlurHash placeholders.

---

## 8. Verification Plan

### Automated Checks
- Run `npm run build` or `next build` to verify clean TypeScript compilation and zero ESLint errors.
- Validate Supabase types and schema integrity.

### Visual & Browser Verification
- Use the browser agent to test:
  1. Landing page visual appeal, responsive layout (mobile 375px, tablet 768px, desktop 1440px).
  2. Polaroid card rendering with authentic paper shadows and washi tape.
  3. Form inputs, buttons, and accessibility focus rings.
  4. Smooth page transitions with Framer Motion.
  5. Empty state visual warmth and copy.
