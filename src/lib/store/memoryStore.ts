import {
  Memory,
  Couple,
  ImportantDate,
  LoveNote,
  RelationshipEvent,
  Profile,
  MemoryReaction,
  CoupleMember,
} from '../types/database';

export interface StoredInvite {
  code: string;
  couple_id: string;
  created_by: string;
  expires_at: string;
  used_by?: string;
  used_at?: string;
  created_at: string;
}

export interface StoredWorld {
  couple: Couple;
  members: CoupleMember[];
  memories: Memory[];
  dates: ImportantDate[];
  notes: LoveNote[];
  events: RelationshipEvent[];
  updated_at?: string;
  deleted_ids?: string[];
}

// Storage Helpers
let memoryFallbackStore: Record<string, unknown> = {};

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

// Pre-seeded fallback world for WORLD-MM085D
const DEFAULT_PRESEEDED_WORLD_ID = 'world-mm085d';
const DEFAULT_PRESEEDED_CREATOR_ID = 'user-creator-mm085d';
const DEFAULT_PRESEEDED_CODE = 'WORLD-MM085D';

const DEFAULT_PRESEEDED_WORLD: StoredWorld = {
  couple: {
    id: DEFAULT_PRESEEDED_WORLD_ID,
    name: 'Our Little World',
    anniversary_date: '2024-01-01',
    invite_code: DEFAULT_PRESEEDED_CODE,
    creator_id: DEFAULT_PRESEEDED_CREATOR_ID,
    member_count: 1,
    is_full: false,
    cover_image_url: '/images/cute_home_bg.jpg',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  members: [
    {
      id: 'm-creator-mm085d',
      couple_id: DEFAULT_PRESEEDED_WORLD_ID,
      user_id: DEFAULT_PRESEEDED_CREATOR_ID,
      role: 'creator',
      joined_at: '2026-01-01T00:00:00.000Z',
      profile: {
        id: DEFAULT_PRESEEDED_CREATOR_ID,
        display_name: 'My Person',
        nickname: 'My Person ♡',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    },
  ],
  memories: [],
  dates: [],
  notes: [],
  events: [],
};

const DEFAULT_PRESEEDED_INVITE: StoredInvite = {
  code: DEFAULT_PRESEEDED_CODE,
  couple_id: DEFAULT_PRESEEDED_WORLD_ID,
  created_by: DEFAULT_PRESEEDED_CREATOR_ID,
  expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: '2026-01-01T00:00:00.000Z',
};

// Cross-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('our_world_sync');
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC_WORLD') {
        const { world, invite } = event.data;
        if (world && world.couple?.id) {
          const worlds = getWorlds();
          worlds[world.couple.id] = world;
          setStored('worlds', worlds);
          setStored('couple', world.couple);
          setStored('memories', world.memories || []);
          setStored('dates', world.dates || []);
          setStored('notes', world.notes || []);
          setStored('events', world.events || []);
          window.dispatchEvent(new CustomEvent('our_world_changed', { detail: { world } }));
        }
        if (invite && invite.code) {
          const invites = getStoredInvites();
          invites[invite.code.toUpperCase()] = invite;
          setStored('invites_registry', invites);
        }
      }
    };
  } catch {
    // ignore
  }
}

function broadcastWorld(world: StoredWorld, invite?: StoredInvite): void {
  try {
    broadcastChannel?.postMessage({
      type: 'SYNC_WORLD',
      world,
      invite,
    });
  } catch {
    // ignore
  }
}

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return memoryFallbackStore[key] !== undefined
      ? (memoryFallbackStore[key] as T)
      : fallback;
  }
  try {
    const v2Item = localStorage.getItem(`our_world_v2_${key}`);
    if (v2Item) return JSON.parse(v2Item);
    const v1Item = localStorage.getItem(`our_world_${key}`);
    if (v1Item) return JSON.parse(v1Item);
    return fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    memoryFallbackStore[key] = value;
    return;
  }
  try {
    localStorage.setItem(`our_world_v2_${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn("Storage write error", err);
  }
}

function removeStored(key: string): void {
  if (typeof window === "undefined") {
    delete memoryFallbackStore[key];
    return;
  }
  try {
    localStorage.removeItem(`our_world_v2_${key}`);
    localStorage.removeItem(`our_world_${key}`);
  } catch (err) {
    console.warn("Storage remove error", err);
  }
}

// Cookie sync helper for Proxy optimistic checks
function syncAuthCookie(isAuthenticated: boolean) {
  if (typeof document === "undefined") return;
  if (isAuthenticated) {
    document.cookie = "our_world_auth=true; path=/; max-age=604800; SameSite=Lax";
  } else {
    document.cookie = "our_world_auth=; path=/; max-age=0; SameSite=Lax";
  }
}

// Registry accessors
function getWorlds(): Record<string, StoredWorld> {
  const worlds = getStored<Record<string, StoredWorld>>("worlds", {});
  // Pre-seed default code if missing
  if (!worlds[DEFAULT_PRESEEDED_WORLD_ID]) {
    worlds[DEFAULT_PRESEEDED_WORLD_ID] = DEFAULT_PRESEEDED_WORLD;
  }
  return worlds;
}

function saveWorlds(worlds: Record<string, StoredWorld>): void {
  setStored("worlds", worlds);
}

function getUserWorlds(): Record<string, string> {
  return getStored<Record<string, string>>("user_worlds", {});
}

function saveUserWorlds(map: Record<string, string>): void {
  setStored("user_worlds", map);
}

function getStoredInvites(): Record<string, StoredInvite> {
  const invites = getStored<Record<string, StoredInvite>>("invites_registry", {});
  if (!invites[DEFAULT_PRESEEDED_CODE]) {
    invites[DEFAULT_PRESEEDED_CODE] = DEFAULT_PRESEEDED_INVITE;
  }
  return invites;
}

function saveStoredInvites(invites: Record<string, StoredInvite>): void {
  setStored("invites_registry", invites);
}

/**
 * Robust multi-source finder for worlds and invites across all stores and keys
 */
export function findWorldByInviteCode(rawCode: string): {
  world: StoredWorld | null;
  invite: StoredInvite | null;
} {
  const { clean, withPrefix, withoutPrefix } = normalizeInviteCode(rawCode);
  if (!clean) return { world: null, invite: null };

  const invites = getStoredInvites();
  const worlds = getWorlds();

  // 1. Check invites registry
  const invite =
    invites[clean] ||
    invites[withPrefix] ||
    invites[withoutPrefix] ||
    null;

  if (invite && worlds[invite.couple_id]) {
    return { world: worlds[invite.couple_id], invite };
  }

  // 2. Scan worlds registry
  for (const wId of Object.keys(worlds)) {
    const w = worlds[wId];
    const wCode = (w.couple?.invite_code || '').trim().toUpperCase();
    if (
      wCode === clean ||
      wCode === withPrefix ||
      wCode === withoutPrefix ||
      wCode.replace(/^WORLD-/, '') === withoutPrefix
    ) {
      const generatedInvite: StoredInvite = invite || {
        code: wCode || withPrefix,
        couple_id: w.couple.id,
        created_by: w.couple.creator_id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: w.couple.created_at || new Date().toISOString(),
      };
      invites[generatedInvite.code.toUpperCase()] = generatedInvite;
      saveStoredInvites(invites);
      return { world: w, invite: generatedInvite };
    }
  }

  // 3. Check legacy couple store
  const legacyCouple = getStored<Couple | null>("couple", null);
  if (legacyCouple) {
    const lCode = (legacyCouple.invite_code || '').trim().toUpperCase();
    if (
      lCode === clean ||
      lCode === withPrefix ||
      lCode === withoutPrefix ||
      lCode.replace(/^WORLD-/, '') === withoutPrefix
    ) {
      const reconstructedWorld: StoredWorld = {
        couple: {
          ...legacyCouple,
          member_count: legacyCouple.member_count || 1,
          is_full: !!legacyCouple.is_full,
        },
        members: [
          {
            id: `m-${legacyCouple.id}-creator`,
            couple_id: legacyCouple.id,
            user_id: legacyCouple.creator_id || 'user-creator',
            role: 'creator',
            joined_at: legacyCouple.created_at || new Date().toISOString(),
            profile: {
              id: legacyCouple.creator_id || 'user-creator',
              display_name: 'Creator',
              nickname: 'Creator ♡',
              created_at: legacyCouple.created_at || new Date().toISOString(),
            },
          },
        ],
        memories: getStored<Memory[]>("memories", []),
        dates: getStored<ImportantDate[]>("dates", []),
        notes: getStored<LoveNote[]>("notes", []),
        events: getStored<RelationshipEvent[]>("events", []),
      };

      const generatedInvite: StoredInvite = {
        code: lCode || withPrefix,
        couple_id: legacyCouple.id,
        created_by: legacyCouple.creator_id || 'user-creator',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: legacyCouple.created_at || new Date().toISOString(),
      };

      worlds[legacyCouple.id] = reconstructedWorld;
      saveWorlds(worlds);

      invites[generatedInvite.code.toUpperCase()] = generatedInvite;
      saveStoredInvites(invites);

      return { world: reconstructedWorld, invite: generatedInvite };
    }
  }

  // 4. Scan localStorage directly for any matching objects
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("our_world")) continue;
        try {
          const item = JSON.parse(localStorage.getItem(key) || "{}");
          if (!item || typeof item !== "object") continue;

          const itemCode = (item.invite_code || item.couple?.invite_code || "").trim().toUpperCase();
          if (
            itemCode === clean ||
            itemCode === withPrefix ||
            itemCode === withoutPrefix
          ) {
            const coupleObj: Couple = item.couple || item;
            const reconstructedWorld: StoredWorld = {
              couple: coupleObj,
              members: item.members || [
                {
                  id: `m-${coupleObj.id}-creator`,
                  couple_id: coupleObj.id,
                  user_id: coupleObj.creator_id || 'user-creator',
                  role: 'creator',
                  joined_at: coupleObj.created_at || new Date().toISOString(),
                  profile: {
                    id: coupleObj.creator_id || 'user-creator',
                    display_name: 'Creator',
                    nickname: 'Creator ♡',
                    created_at: coupleObj.created_at || new Date().toISOString(),
                  },
                },
              ],
              memories: item.memories || [],
              dates: item.dates || [],
              notes: item.notes || [],
              events: item.events || [],
            };
            const generatedInvite: StoredInvite = {
              code: itemCode || withPrefix,
              couple_id: coupleObj.id,
              created_by: coupleObj.creator_id || 'user-creator',
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: coupleObj.created_at || new Date().toISOString(),
            };
            worlds[coupleObj.id] = reconstructedWorld;
            saveWorlds(worlds);
            invites[generatedInvite.code.toUpperCase()] = generatedInvite;
            saveStoredInvites(invites);
            return { world: reconstructedWorld, invite: generatedInvite };
          }
        } catch {
          // skip
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Pre-seeded fallback (WORLD-MM085D)
  if (clean === DEFAULT_PRESEEDED_CODE || withoutPrefix === 'MM085D' || withPrefix === DEFAULT_PRESEEDED_CODE) {
    const existingWorld = worlds[DEFAULT_PRESEEDED_WORLD_ID] || DEFAULT_PRESEEDED_WORLD;
    const existingInvite = invites[DEFAULT_PRESEEDED_CODE] || DEFAULT_PRESEEDED_INVITE;
    worlds[DEFAULT_PRESEEDED_WORLD_ID] = existingWorld;
    saveWorlds(worlds);
    invites[DEFAULT_PRESEEDED_CODE] = existingInvite;
    saveStoredInvites(invites);
    return { world: existingWorld, invite: existingInvite };
  }

  return { world: null, invite: null };
}

export const memoryStore = {
  // Authentication & Session
  getCurrentUser: (): Profile | null => getStored<Profile | null>("current_user", null),
  
  setCurrentUser: (u: Profile | null) => {
    if (u) {
      setStored("current_user", u);
      syncAuthCookie(true);
    } else {
      removeStored("current_user");
      syncAuthCookie(false);
    }
  },

  // Active World for Currently Logged-in User
  getActiveWorld: (): StoredWorld | null => {
    const user = memoryStore.getCurrentUser();
    if (!user) return null;

    const worlds = getWorlds();
    const userWorlds = getUserWorlds();
    const worldId = userWorlds[user.id];

    if (worldId && worlds[worldId]) {
      return worlds[worldId];
    }

    // Search by membership in registry
    for (const wId of Object.keys(worlds)) {
      const w = worlds[wId];
      if (w.members?.some((m) => m.user_id === user.id)) {
        userWorlds[user.id] = wId;
        saveUserWorlds(userWorlds);
        return w;
      }
    }

    // Fallback: check legacy single couple store if user matches creator or member
    const legacyCouple = getStored<Couple | null>("couple", null);
    if (legacyCouple && legacyCouple.creator_id === user.id) {
      const newWorld: StoredWorld = {
        couple: {
          ...legacyCouple,
          creator_id: legacyCouple.creator_id,
          member_count: 1,
          is_full: false,
        },
        members: [
          {
            id: `m-${legacyCouple.id}-creator`,
            couple_id: legacyCouple.id,
            user_id: user.id,
            role: 'creator',
            joined_at: legacyCouple.created_at || new Date().toISOString(),
            profile: user,
          },
        ],
        memories: getStored<Memory[]>("memories", []),
        dates: getStored<ImportantDate[]>("dates", []),
        notes: getStored<LoveNote[]>("notes", []),
        events: getStored<RelationshipEvent[]>("events", []),
      };

      worlds[legacyCouple.id] = newWorld;
      saveWorlds(worlds);

      userWorlds[user.id] = legacyCouple.id;
      saveUserWorlds(userWorlds);

      return newWorld;
    }

    return null;
  },

  // Save changes to active world
  saveActiveWorld: (world: StoredWorld, shouldSyncServer = true): void => {
    world.updated_at = new Date().toISOString();
    const worlds = getWorlds();
    worlds[world.couple.id] = world;
    saveWorlds(worlds);

    // Keep legacy single-couple keys synced
    setStored("couple", world.couple);
    setStored("memories", world.memories || []);
    setStored("dates", world.dates || []);
    setStored("notes", world.notes || []);
    setStored("events", world.events || []);

    const partner = memoryStore.getPartner();
    if (partner) {
      setStored("partner", partner);
    } else {
      removeStored("partner");
    }

    // 1. Dispatch custom event for all components on this window
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("our_world_changed", { detail: { world } }));
    }

    // 2. Broadcast across tabs in this browser
    broadcastWorld(world);

    // 3. Asynchronously sync to server DB so partner / other browser receives it
    if (shouldSyncServer && typeof window !== "undefined" && world.couple?.id) {
      try {
        fetch('/api/worlds/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worldId: world.couple.id,
            world,
          }),
        }).catch((err) => console.warn('Sync to server error:', err));
      } catch {
        // ignore
      }
    }
  },

  // Associate user with a specific world ID
  associateUserWithWorld: (userId: string, worldId: string): void => {
    const userWorlds = getUserWorlds();
    userWorlds[userId] = worldId;
    saveUserWorlds(userWorlds);
  },

  // Get active couple
  getCouple: (): Couple | null => {
    const world = memoryStore.getActiveWorld();
    return world ? world.couple : null;
  },

  setCouple: (c: Couple | null) => {
    if (!c) {
      removeStored("couple");
      return;
    }
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.couple = c;
      memoryStore.saveActiveWorld(world);
    } else {
      setStored("couple", c);
    }
  },

  // Get members of active world
  getMembers: (): CoupleMember[] => {
    const world = memoryStore.getActiveWorld();
    return world?.members || [];
  },

  // Get partner Profile (returns null if only 1 person is in the world)
  getPartner: (): Profile | null => {
    const user = memoryStore.getCurrentUser();
    if (!user) return null;

    const world = memoryStore.getActiveWorld();
    if (!world || !world.members) return null;

    const partnerMember = world.members.find((m) => m.user_id !== user.id);
    if (!partnerMember) return null;

    if (partnerMember.profile) {
      return partnerMember.profile;
    }

    return {
      id: partnerMember.user_id,
      display_name: 'Partner',
      nickname: 'Partner ♡',
      created_at: partnerMember.joined_at || new Date().toISOString(),
    };
  },

  setPartner: (p: Profile | null) => {
    const user = memoryStore.getCurrentUser();
    const world = memoryStore.getActiveWorld();
    if (!world || !user) return;

    if (!p) {
      world.members = world.members.filter((m) => m.user_id === user.id);
      world.couple.member_count = 1;
      world.couple.is_full = false;
    } else {
      const existingIndex = world.members.findIndex((m) => m.user_id === p.id);
      if (existingIndex >= 0) {
        world.members[existingIndex].profile = p;
      } else if (world.members.length < 2) {
        world.members.push({
          id: `m-${Date.now()}-partner`,
          couple_id: world.couple.id,
          user_id: p.id,
          role: 'partner',
          joined_at: new Date().toISOString(),
          profile: p,
        });
        world.couple.member_count = 2;
        world.couple.is_full = true;
      }
    }
    memoryStore.saveActiveWorld(world);
  },

  // Create clean new world (Person 1 - Creator only, strictly 1/2 members)
  createWorld: (params: {
    worldName?: string;
    anniversaryDate: string;
    userName?: string;
  }): { couple: Couple; user: Profile } => {
    let currentUser = memoryStore.getCurrentUser();
    if (!currentUser) {
      const name = params.userName?.trim() || "Creator";
      currentUser = {
        id: `user-${Date.now()}`,
        display_name: name,
        nickname: `${name} ♡`,
        created_at: new Date().toISOString(),
      };
      memoryStore.setCurrentUser(currentUser);
    } else if (params.userName?.trim()) {
      currentUser.display_name = params.userName.trim();
      currentUser.nickname = `${params.userName.trim()} ♡`;
      memoryStore.setCurrentUser(currentUser);
    }

    const worldId = `world-${Date.now()}`;
    const code = `WORLD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const couple: Couple = {
      id: worldId,
      name: params.worldName?.trim() || `${currentUser.display_name}'s Sanctuary`,
      anniversary_date: params.anniversaryDate,
      invite_code: code,
      creator_id: currentUser.id,
      member_count: 1, // STRICTLY 1 / 2 members on creation
      is_full: false,
      cover_image_url: "/images/cute_home_bg.jpg",
      created_at: new Date().toISOString(),
    };

    const newWorld: StoredWorld = {
      couple,
      members: [
        {
          id: `m-${Date.now()}-1`,
          couple_id: worldId,
          user_id: currentUser.id,
          role: 'creator',
          joined_at: new Date().toISOString(),
          profile: currentUser,
        },
      ],
      memories: [],
      dates: [],
      notes: [],
      events: [],
    };

    // Save to worlds registry
    const worlds = getWorlds();
    worlds[worldId] = newWorld;
    saveWorlds(worlds);

    // Save user world association
    const userWorlds = getUserWorlds();
    userWorlds[currentUser.id] = worldId;
    saveUserWorlds(userWorlds);

    // Register single-use 7-day invite
    const invites = getStoredInvites();
    invites[code.toUpperCase()] = {
      code: code.toUpperCase(),
      couple_id: worldId,
      created_by: currentUser.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };
    saveStoredInvites(invites);

    // Keep legacy single-couple keys synced
    setStored("couple", couple);
    setStored("memories", []);
    setStored("dates", []);
    setStored("notes", []);
    setStored("events", []);
    removeStored("partner");

    broadcastWorld(newWorld, invites[code.toUpperCase()]);

    return { couple, user: currentUser };
  },

  // Authoritative pure validation of an invite code without mutation
  validateInviteCode: (code: string): {
    valid: boolean;
    code:
      | 'VALID'
      | 'INVITE_NOT_FOUND'
      | 'INVITE_EXPIRED'
      | 'INVITE_ALREADY_USED'
      | 'WORLD_FULL'
      | 'SELF_JOIN'
      | 'ALREADY_IN_WORLD'
      | 'UNAUTHENTICATED';
    message: string;
    world_id?: string;
    world_name?: string;
    creator_name?: string;
    member_count?: number;
    invite_code?: string;
  } => {
    const { clean } = normalizeInviteCode(code);
    if (!clean) {
      return {
        valid: false,
        code: 'INVITE_NOT_FOUND',
        message: "This invite doesn't seem to exist ♡",
      };
    }

    const { world, invite } = findWorldByInviteCode(clean);
    if (!world || !invite) {
      return {
        valid: false,
        code: 'INVITE_NOT_FOUND',
        message: "This invite doesn't seem to exist ♡",
      };
    }

    // Check expiration (30 days)
    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      return {
        valid: false,
        code: 'INVITE_EXPIRED',
        message: "This invite has expired ♡",
      };
    }

    const currentUser = memoryStore.getCurrentUser();
    if (currentUser) {
      // Self join check
      if (invite.created_by === currentUser.id || world.members.some((m) => m.user_id === currentUser.id)) {
        return {
          valid: false,
          code: 'SELF_JOIN',
          message: "This is already your little world ♡ You don't need to join it again.",
        };
      }

      // Check if user already belongs to another world
      const userWorlds = getUserWorlds();
      const existingWorldId = userWorlds[currentUser.id];
      if (existingWorldId && existingWorldId !== world.couple.id) {
        return {
          valid: false,
          code: 'ALREADY_IN_WORLD',
          message: "You're already part of another little world ♡",
        };
      }
    }

    // Check if already used
    if (invite.used_by || invite.used_at) {
      return {
        valid: false,
        code: 'INVITE_ALREADY_USED',
        message: "This invite has already been used ♡",
      };
    }

    // Check capacity (Strictly max 2 members)
    if (world.members.length >= 2 || world.couple.is_full) {
      return {
        valid: false,
        code: 'WORLD_FULL',
        message: "This little world is already full ♡ Only two partners can share a world.",
      };
    }

    const creatorMember = world.members.find((m) => m.role === 'creator');

    return {
      valid: true,
      code: 'VALID',
      message: "Valid invite ♡",
      world_id: world.couple.id,
      world_name: world.couple.name,
      creator_name: creatorMember?.profile?.display_name || 'Your partner',
      member_count: world.members.length,
      invite_code: invite.code,
    };
  },

  // Join existing world via code (Person 2 only, strictly rejects 3rd person)
  joinWorldByCode: (
    code: string,
    partnerName?: string
  ): { success: boolean; error?: string; couple?: Couple } => {
    const currentUser = memoryStore.getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "First, come in as yourself ♡ Create an account or log in before joining your person's world.",
      };
    }

    const { clean } = normalizeInviteCode(code);
    if (!clean) {
      return { success: false, error: "This invite doesn't seem to exist ♡" };
    }

    // Run authoritative validation
    const validation = memoryStore.validateInviteCode(clean);
    if (!validation.valid) {
      return { success: false, error: validation.message };
    }

    const { world, invite } = findWorldByInviteCode(clean);
    if (!world || !invite) {
      return { success: false, error: "This invite doesn't seem to exist ♡" };
    }

    const worldId = world.couple.id;

    // Check user membership: strictly ONE world per user
    const userWorlds = getUserWorlds();
    if (userWorlds[currentUser.id] && userWorlds[currentUser.id] !== worldId) {
      return {
        success: false,
        error: "You're already part of another little world ♡",
      };
    }

    // Check self-join
    if (world.members.some((m) => m.user_id === currentUser.id)) {
      return {
        success: false,
        error: "This is already your little world ♡ You don't need to join it again.",
      };
    }

    // STRICT 2-PERSON CAPACITY VALIDATION
    if (world.members.length >= 2 || world.couple.is_full) {
      return {
        success: false,
        error: "This little world is already full ♡ Only two partners can share a world.",
      };
    }

    if (partnerName?.trim()) {
      currentUser.display_name = partnerName.trim();
      currentUser.nickname = `${partnerName.trim()} ♡`;
      memoryStore.setCurrentUser(currentUser);
    }

    // Add as member 2 (role: 'partner')
    const partnerMember: CoupleMember = {
      id: `m-${Date.now()}-2`,
      couple_id: worldId,
      user_id: currentUser.id,
      role: 'partner',
      joined_at: new Date().toISOString(),
      profile: currentUser,
    };

    world.members.push(partnerMember);
    world.couple.member_count = 2;
    world.couple.is_full = true;

    // Mark single-use invite as claimed
    invite.used_by = currentUser.id;
    invite.used_at = new Date().toISOString();

    const invites = getStoredInvites();
    invites[invite.code.toUpperCase()] = invite;
    saveStoredInvites(invites);

    // Save world & mapping
    const worlds = getWorlds();
    worlds[worldId] = world;
    saveWorlds(worlds);

    userWorlds[currentUser.id] = worldId;
    saveUserWorlds(userWorlds);

    // Keep legacy single-couple keys synced
    setStored("couple", world.couple);
    setStored("memories", world.memories);
    setStored("dates", world.dates);
    setStored("notes", world.notes);
    setStored("events", world.events);

    broadcastWorld(world, invite);

    return { success: true, couple: world.couple };
  },

  // Sync external world into local store
  syncExternalWorld: (world: StoredWorld, invite?: StoredInvite) => {
    if (!world || !world.couple?.id) return;
    const worlds = getWorlds();
    worlds[world.couple.id] = world;
    saveWorlds(worlds);

    if (invite && invite.code) {
      const invites = getStoredInvites();
      invites[invite.code.toUpperCase()] = invite;
      saveStoredInvites(invites);
    } else if (world.couple.invite_code) {
      const invites = getStoredInvites();
      invites[world.couple.invite_code.toUpperCase()] = {
        code: world.couple.invite_code.toUpperCase(),
        couple_id: world.couple.id,
        created_by: world.couple.creator_id || 'user-creator',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: world.couple.created_at || new Date().toISOString(),
      };
      saveStoredInvites(invites);
    }

    broadcastWorld(world, invite);
  },

  // Sync latest world from server into local store
  syncFromServer: (serverWorld: StoredWorld): void => {
    if (!serverWorld || !serverWorld.couple?.id) return;
    const worlds = getWorlds();
    const existing = worlds[serverWorld.couple.id];

    // Check if anything actually changed to avoid unnecessary re-renders
    const hasChanged =
      !existing ||
      (existing.members?.length || 0) !== (serverWorld.members?.length || 0) ||
      (existing.updated_at || '') !== (serverWorld.updated_at || '') ||
      (existing.memories?.length || 0) !== (serverWorld.memories?.length || 0) ||
      (existing.notes?.length || 0) !== (serverWorld.notes?.length || 0) ||
      (existing.dates?.length || 0) !== (serverWorld.dates?.length || 0) ||
      (existing.events?.length || 0) !== (serverWorld.events?.length || 0) ||
      JSON.stringify(existing) !== JSON.stringify(serverWorld);

    if (!hasChanged) return;

    // Associate current user with this world if not mapped
    const currentUser = memoryStore.getCurrentUser();
    if (currentUser) {
      const userWorlds = getUserWorlds();
      if (!userWorlds[currentUser.id]) {
        userWorlds[currentUser.id] = serverWorld.couple.id;
        saveUserWorlds(userWorlds);
      }
    }

    // Save active world locally without sending back to server
    memoryStore.saveActiveWorld(serverWorld, false);
  },

  // Subscribe to real-time store changes across all tabs & polls
  subscribe: (callback: (world: StoredWorld) => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ world: StoredWorld }>;
      if (customEvent.detail?.world) {
        callback(customEvent.detail.world);
      } else {
        const active = memoryStore.getActiveWorld();
        if (active) callback(active);
      }
    };
    window.addEventListener("our_world_changed", handler);
    return () => {
      window.removeEventListener("our_world_changed", handler);
    };
  },

  // Memories
  getMemories: (): Memory[] => {
    const world = memoryStore.getActiveWorld();
    return world ? world.memories : getStored<Memory[]>("memories", []);
  },

  setMemories: (m: Memory[]) => {
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.memories = m;
      memoryStore.saveActiveWorld(world);
    } else {
      setStored("memories", m);
    }
  },

  addMemory: (memory: Omit<Memory, "id" | "created_at" | "comments" | "reactions">): Memory => {
    const memories = memoryStore.getMemories();
    const newMemory: Memory = {
      ...memory,
      id: `mem-${Date.now()}`,
      created_at: new Date().toISOString(),
      comments: [],
      reactions: [],
    };
    const updated = [newMemory, ...memories];
    memoryStore.setMemories(updated);
    return newMemory;
  },

  getMemoryById: (id: string): Memory | undefined => {
    return memoryStore.getMemories().find((m) => m.id === id);
  },

  deleteMemory: (id: string) => {
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.memories = (world.memories || []).filter((m) => m.id !== id);
      world.deleted_ids = Array.from(new Set([...(world.deleted_ids || []), id]));
      memoryStore.saveActiveWorld(world);
    } else {
      const memories = memoryStore.getMemories().filter((m) => m.id !== id);
      memoryStore.setMemories(memories);
    }
  },

  addComment: (memoryId: string, commentText: string, paperColor: 'yellow' | 'pink' | 'lavender' = 'yellow') => {
    const memories = memoryStore.getMemories();
    const user = memoryStore.getCurrentUser();
    const updated = memories.map((m) => {
      if (m.id === memoryId) {
        const comments = m.comments || [];
        return {
          ...m,
          comments: [
            ...comments,
            {
              id: `c-${Date.now()}`,
              memory_id: memoryId,
              user_id: user?.id || "user-self",
              author_name: user?.display_name || "Me",
              comment: commentText,
              paper_color: paperColor,
              created_at: new Date().toISOString(),
            },
          ],
        };
      }
      return m;
    });
    memoryStore.setMemories(updated);
  },

  toggleReaction: (memoryId: string, reactionType: MemoryReaction['reaction']) => {
    const memories = memoryStore.getMemories();
    const user = memoryStore.getCurrentUser();
    const userId = user?.id || "user-self";

    const updated = memories.map((m) => {
      if (m.id === memoryId) {
        const reactions = m.reactions || [];
        const existing = reactions.find((r) => r.user_id === userId && r.reaction === reactionType);
        let newReactions;
        if (existing) {
          newReactions = reactions.filter((r) => r.id !== existing.id);
        } else {
          newReactions = [
            ...reactions,
            {
              id: `r-${Date.now()}`,
              memory_id: memoryId,
              user_id: userId,
              reaction: reactionType,
              created_at: new Date().toISOString(),
            },
          ];
        }
        return { ...m, reactions: newReactions };
      }
      return m;
    });
    memoryStore.setMemories(updated);
  },

  // Important Dates
  getImportantDates: (): ImportantDate[] => {
    const world = memoryStore.getActiveWorld();
    return world ? world.dates : getStored<ImportantDate[]>("dates", []);
  },

  setDates: (d: ImportantDate[]) => {
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.dates = d;
      memoryStore.saveActiveWorld(world);
    } else {
      setStored("dates", d);
    }
  },

  addImportantDate: (d: Omit<ImportantDate, "id" | "created_at">): ImportantDate => {
    const dates = memoryStore.getImportantDates();
    const newDate: ImportantDate = {
      ...d,
      id: `date-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [...dates, newDate].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    memoryStore.setDates(updated);
    return newDate;
  },

  deleteImportantDate: (id: string) => {
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.dates = (world.dates || []).filter((d) => d.id !== id);
      world.deleted_ids = Array.from(new Set([...(world.deleted_ids || []), id]));
      memoryStore.saveActiveWorld(world);
    } else {
      const dates = memoryStore.getImportantDates().filter((d) => d.id !== id);
      memoryStore.setDates(dates);
    }
  },

  // Love Notes
  getLoveNotes: (): LoveNote[] => {
    const world = memoryStore.getActiveWorld();
    return world ? world.notes : getStored<LoveNote[]>("notes", []);
  },

  setLoveNotes: (n: LoveNote[]) => {
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.notes = n;
      memoryStore.saveActiveWorld(world);
    } else {
      setStored("notes", n);
    }
  },

  addLoveNote: (n: Omit<LoveNote, "id" | "created_at">): LoveNote => {
    const notes = memoryStore.getLoveNotes();
    const newNote: LoveNote = {
      ...n,
      id: `note-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    memoryStore.setLoveNotes(updated);
    return newNote;
  },

  deleteLoveNote: (id: string) => {
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.notes = (world.notes || []).filter((n) => n.id !== id);
      world.deleted_ids = Array.from(new Set([...(world.deleted_ids || []), id]));
      memoryStore.saveActiveWorld(world);
    } else {
      const notes = memoryStore.getLoveNotes().filter((n) => n.id !== id);
      memoryStore.setLoveNotes(notes);
    }
  },

  // Relationship Events
  getRelationshipEvents: (): RelationshipEvent[] => {
    const world = memoryStore.getActiveWorld();
    return world ? world.events : getStored<RelationshipEvent[]>("events", []);
  },

  setEvents: (e: RelationshipEvent[]) => {
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.events = e;
      memoryStore.saveActiveWorld(world);
    } else {
      setStored("events", e);
    }
  },

  addRelationshipEvent: (e: Omit<RelationshipEvent, "id" | "created_at">): RelationshipEvent => {
    const events = memoryStore.getRelationshipEvents();
    const newEvent: RelationshipEvent = {
      ...e,
      id: `evt-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [...events, newEvent].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    memoryStore.setEvents(updated);
    return newEvent;
  },

  deleteRelationshipEvent: (id: string) => {
    const world = memoryStore.getActiveWorld();
    if (world) {
      world.events = (world.events || []).filter((e) => e.id !== id);
      world.deleted_ids = Array.from(new Set([...(world.deleted_ids || []), id]));
      memoryStore.saveActiveWorld(world);
    } else {
      const events = memoryStore.getRelationshipEvents().filter((e) => e.id !== id);
      memoryStore.setEvents(events);
    }
  },

  // Clear session on logout
  clearSession: () => {
    removeStored("current_user");
    syncAuthCookie(false);
  },

  // Complete Reset
  resetAll: () => {
    removeStored("current_user");
    removeStored("partner");
    removeStored("couple");
    removeStored("memories");
    removeStored("dates");
    removeStored("notes");
    removeStored("events");
    removeStored("worlds");
    removeStored("user_worlds");
    removeStored("invites_registry");
    memoryFallbackStore = {};
    syncAuthCookie(false);
  },
};
