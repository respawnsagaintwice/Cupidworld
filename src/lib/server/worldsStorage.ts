import fs from 'fs';
import path from 'path';
import { StoredWorld, StoredInvite } from '../store/memoryStore';
import { Couple, CoupleMember, Memory, LoveNote, ImportantDate, RelationshipEvent } from '../types/database';

interface ServerDb {
  worlds: Record<string, StoredWorld>;
  invites: Record<string, StoredInvite>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'worlds.json');

// Default pre-seeded world for code WORLD-MM085D
const DEFAULT_PRESEEDED_WORLD_ID = 'world-mm085d';
const DEFAULT_PRESEEDED_CREATOR_ID = 'user-creator-mm085d';
const DEFAULT_PRESEEDED_CODE = 'WORLD-MM085D';

const INITIAL_DB: ServerDb = {
  worlds: {
    [DEFAULT_PRESEEDED_WORLD_ID]: {
      couple: {
        id: DEFAULT_PRESEEDED_WORLD_ID,
        name: 'Our Little World',
        anniversary_date: '2024-01-01',
        invite_code: DEFAULT_PRESEEDED_CODE,
        creator_id: DEFAULT_PRESEEDED_CREATOR_ID,
        member_count: 1,
        is_full: false,
        cover_image_url: '/images/cute_home_bg.jpg',
        created_at: new Date().toISOString(),
      },
      members: [
        {
          id: 'm-creator-mm085d',
          couple_id: DEFAULT_PRESEEDED_WORLD_ID,
          user_id: DEFAULT_PRESEEDED_CREATOR_ID,
          role: 'creator',
          joined_at: new Date().toISOString(),
          profile: {
            id: DEFAULT_PRESEEDED_CREATOR_ID,
            display_name: 'My Person',
            nickname: 'My Person ♡',
            created_at: new Date().toISOString(),
          },
        },
      ],
      memories: [],
      dates: [],
      notes: [],
      events: [],
    },
  },
  invites: {
    [DEFAULT_PRESEEDED_CODE]: {
      code: DEFAULT_PRESEEDED_CODE,
      couple_id: DEFAULT_PRESEEDED_WORLD_ID,
      created_by: DEFAULT_PRESEEDED_CREATOR_ID,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
  },
};

// In-memory cache
let inMemoryDb: ServerDb | null = null;

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create .data directory:', err);
  }
}

export function getServerDb(): ServerDb {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  ensureDataDir();

  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(content) as ServerDb;
      // Ensure pre-seeded code is always available
      if (!inMemoryDb.invites[DEFAULT_PRESEEDED_CODE]) {
        inMemoryDb.invites[DEFAULT_PRESEEDED_CODE] = INITIAL_DB.invites[DEFAULT_PRESEEDED_CODE];
      }
      if (!inMemoryDb.worlds[DEFAULT_PRESEEDED_WORLD_ID]) {
        inMemoryDb.worlds[DEFAULT_PRESEEDED_WORLD_ID] = INITIAL_DB.worlds[DEFAULT_PRESEEDED_WORLD_ID];
      }
      return inMemoryDb;
    }
  } catch (err) {
    console.warn('Error reading server worlds DB, using initial:', err);
  }

  inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DB));
  saveServerDb(inMemoryDb!);
  return inMemoryDb!;
}

export function saveServerDb(db: ServerDb): void {
  inMemoryDb = db;
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error persisting server worlds DB:', err);
  }
}

/**
 * Normalizes an invite code for flexible matching.
 * e.g., "WORLD-MM085D" -> "WORLD-MM085D", "MM085D" -> "WORLD-MM085D"
 */
export function normalizeInviteCode(code: string): {
  clean: string;
  withPrefix: string;
  withoutPrefix: string;
} {
  const clean = code.trim().toUpperCase();
  const withoutPrefix = clean.replace(/^WORLD-/, '');
  const withPrefix = clean.startsWith('WORLD-') ? clean : `WORLD-${clean}`;
  return { clean, withPrefix, withoutPrefix };
}

/**
 * Finds a world and invite by code in the server database.
 */
export function findServerWorldByCode(code: string): {
  world: StoredWorld | null;
  invite: StoredInvite | null;
} {
  const db = getServerDb();
  const { clean, withPrefix, withoutPrefix } = normalizeInviteCode(code);

  // 1. Direct match in invites
  const invite =
    db.invites[clean] ||
    db.invites[withPrefix] ||
    db.invites[withoutPrefix] ||
    null;

  if (invite && db.worlds[invite.couple_id]) {
    return { world: db.worlds[invite.couple_id], invite };
  }

  // 2. Scan worlds by couple.invite_code
  for (const worldId of Object.keys(db.worlds)) {
    const w = db.worlds[worldId];
    const wCode = (w.couple.invite_code || '').trim().toUpperCase();
    if (
      wCode === clean ||
      wCode === withPrefix ||
      wCode === withoutPrefix ||
      wCode.replace(/^WORLD-/, '') === withoutPrefix
    ) {
      const generatedInvite: StoredInvite = invite || {
        code: wCode || withPrefix,
        couple_id: w.couple.id,
        created_by: w.couple.creator_id || 'user-creator',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: w.couple.created_at || new Date().toISOString(),
      };
      return { world: w, invite: generatedInvite };
    }
  }

  return { world: null, invite: null };
}

/**
 * Find world by ID in server DB
 */
export function findServerWorldById(worldId: string): StoredWorld | null {
  const db = getServerDb();
  return db.worlds[worldId] || null;
}

/**
 * Find world by a user's ID in server DB
 */
export function findServerWorldByUserId(userId: string): StoredWorld | null {
  const db = getServerDb();
  for (const wId of Object.keys(db.worlds)) {
    const w = db.worlds[wId];
    if (
      w.couple.creator_id === userId ||
      w.members?.some((m) => m.user_id === userId)
    ) {
      return w;
    }
  }
  return null;
}

/**
 * Merges incoming world changes into server DB.
 * Guarantees members are never downgraded and all memories, notes, dates, and events are preserved.
 */
export function mergeAndSaveServerWorld(
  worldId: string,
  incoming: StoredWorld
): StoredWorld {
  const db = getServerDb();
  const existing = db.worlds[worldId];

  if (!existing) {
    incoming.updated_at = new Date().toISOString();
    db.worlds[worldId] = incoming;
    if (incoming.couple.invite_code) {
      const { withPrefix, clean } = normalizeInviteCode(incoming.couple.invite_code);
      const invite: StoredInvite = {
        code: withPrefix,
        couple_id: incoming.couple.id,
        created_by: incoming.couple.creator_id || 'user-creator',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: incoming.couple.created_at || new Date().toISOString(),
      };
      db.invites[clean] = invite;
      db.invites[withPrefix] = invite;
    }
    saveServerDb(db);
    return incoming;
  }

  // 1. Members merge: NEVER downgrade member count!
  const memberMap = new Map<string, CoupleMember>();
  // Add existing members first
  for (const m of existing.members || []) {
    memberMap.set(m.user_id, m);
  }
  // Add incoming members (or update profile)
  for (const m of incoming.members || []) {
    const existingM = memberMap.get(m.user_id);
    if (existingM) {
      memberMap.set(m.user_id, {
        ...existingM,
        profile: m.profile || existingM.profile,
      });
    } else if (memberMap.size < 2) {
      memberMap.set(m.user_id, m);
    }
  }
  const mergedMembers = Array.from(memberMap.values());

  // 2. Couple merge
  const mergedCouple: Couple = {
    ...existing.couple,
    ...incoming.couple,
    member_count: Math.max(existing.couple.member_count || 1, mergedMembers.length),
    is_full: mergedMembers.length >= 2,
  };

  // Collect all deleted IDs across existing and incoming
  const allDeletedIds = new Set<string>([
    ...(existing.deleted_ids || []),
    ...(incoming.deleted_ids || []),
  ]);

  // 3. Memories merge by ID (preserving new ones and edits, filtering out deleted)
  const memoryMap = new Map<string, Memory>();
  for (const mem of existing.memories || []) {
    if (!allDeletedIds.has(mem.id)) {
      memoryMap.set(mem.id, mem);
    }
  }
  for (const mem of incoming.memories || []) {
    if (allDeletedIds.has(mem.id)) continue;
    const prev = memoryMap.get(mem.id);
    if (!prev) {
      memoryMap.set(mem.id, mem);
    } else {
      // Merge comments by ID
      const commentMap = new Map<string, any>();
      for (const c of prev.comments || []) commentMap.set(c.id, c);
      for (const c of mem.comments || []) commentMap.set(c.id, c);
      memoryMap.set(mem.id, {
        ...prev,
        ...mem,
        comments: Array.from(commentMap.values()).sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      });
    }
  }
  const mergedMemories = Array.from(memoryMap.values()).sort(
    (a, b) => new Date(b.created_at || b.memory_date).getTime() - new Date(a.created_at || a.memory_date).getTime()
  );

  // 4. Notes merge by ID
  const notesMap = new Map<string, LoveNote>();
  for (const note of existing.notes || []) {
    if (!allDeletedIds.has(note.id)) {
      notesMap.set(note.id, note);
    }
  }
  for (const note of incoming.notes || []) {
    if (!allDeletedIds.has(note.id)) {
      notesMap.set(note.id, note);
    }
  }
  const mergedNotes = Array.from(notesMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 5. Dates merge by ID
  const datesMap = new Map<string, ImportantDate>();
  for (const d of existing.dates || []) {
    if (!allDeletedIds.has(d.id)) {
      datesMap.set(d.id, d);
    }
  }
  for (const d of incoming.dates || []) {
    if (!allDeletedIds.has(d.id)) {
      datesMap.set(d.id, d);
    }
  }
  const mergedDates = Array.from(datesMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 6. Events merge by ID
  const eventsMap = new Map<string, RelationshipEvent>();
  for (const e of existing.events || []) {
    if (!allDeletedIds.has(e.id)) {
      eventsMap.set(e.id, e);
    }
  }
  for (const e of incoming.events || []) {
    if (!allDeletedIds.has(e.id)) {
      eventsMap.set(e.id, e);
    }
  }
  const mergedEvents = Array.from(eventsMap.values()).sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  const updatedWorld: StoredWorld = {
    couple: mergedCouple,
    members: mergedMembers,
    memories: mergedMemories,
    notes: mergedNotes,
    dates: mergedDates,
    events: mergedEvents,
    deleted_ids: Array.from(allDeletedIds),
    updated_at: new Date().toISOString(),
  };

  db.worlds[worldId] = updatedWorld;
  saveServerDb(db);
  return updatedWorld;
}

