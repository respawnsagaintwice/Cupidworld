import { createClient } from '@/lib/supabase/client';
import { memoryStore } from '@/lib/store/memoryStore';
import { Couple } from '@/lib/types/database';

export interface InviteValidationResult {
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
}

export interface JoinWorldResult {
  success: boolean;
  code?: string;
  error?: string;
  couple?: Couple;
}

export const worldService = {
  /**
   * Authoritative validation of an invite code on server / database
   */
  async validateInvite(code: string): Promise<InviteValidationResult> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return {
        valid: false,
        code: 'INVITE_NOT_FOUND',
        message: "This invite doesn't seem to exist ♡",
      };
    }

    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('validate_world_invite', {
          p_code: cleanCode,
        });

        if (error) {
          console.warn('Supabase validate_world_invite rpc error:', error);
        } else if (data) {
          return data as InviteValidationResult;
        }
      } catch (err) {
        console.warn('Supabase validate error:', err);
      }
    }

    // Mirroring authoritative database rules in memoryStore fallback
    const localResult = memoryStore.validateInviteCode(cleanCode);
    if (localResult.valid) {
      return localResult;
    }

    // If local memory store did not find it, query the server-side API (e.g. cross-browser / incognito sync)
    try {
      const user = memoryStore.getCurrentUser();
      const url = `/api/worlds?code=${encodeURIComponent(cleanCode)}${
        user ? `&userId=${encodeURIComponent(user.id)}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const serverData = await res.json();
        if (serverData.valid && serverData.world) {
          memoryStore.syncExternalWorld(serverData.world);
          return serverData as InviteValidationResult;
        } else if (serverData.code && serverData.code !== 'INVITE_NOT_FOUND') {
          return serverData as InviteValidationResult;
        }
      }
    } catch (err) {
      console.warn('Server fallback validation error:', err);
    }

    return localResult;
  },

  /**
   * Atomic joining of a world with single-use invite code
   */
  async joinWorld(code: string, partnerName?: string): Promise<JoinWorldResult> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return {
        success: false,
        code: 'INVITE_NOT_FOUND',
        error: "This invite doesn't seem to exist ♡",
      };
    }

    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('join_world_with_invite', {
          p_code: cleanCode,
        });

        if (error) {
          return {
            success: false,
            error: error.message || "Failed to join world.",
          };
        }

        if (data) {
          if (!data.success) {
            return {
              success: false,
              code: data.code,
              error: data.message || "Failed to join world.",
            };
          }

          // Fetch full couple details and sync local cache
          const { data: coupleData } = await supabase
            .from('couples')
            .select('*')
            .eq('id', data.couple_id)
            .single();

          if (coupleData) {
            memoryStore.setCouple(coupleData as Couple);
          }

          return {
            success: true,
            couple: (coupleData as Couple) || {
              id: data.couple_id,
              name: data.world_name,
              anniversary_date: data.anniversary_date,
              created_at: new Date().toISOString(),
            },
          };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Join error occurred.";
        console.warn('Supabase join error:', message);
      }
    }

    // Try server-side join first for atomic persistence across sessions
    const currentUser = memoryStore.getCurrentUser();
    try {
      const res = await fetch('/api/worlds/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          partnerName: partnerName || currentUser?.display_name,
          userId: currentUser?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.world) {
          if (currentUser) {
            memoryStore.associateUserWithWorld(currentUser.id, data.world.couple.id);
          }
          memoryStore.saveActiveWorld(data.world, false);
          return {
            success: true,
            couple: data.couple || data.world.couple,
          };
        } else if (data.error) {
          return {
            success: false,
            error: data.error,
          };
        }
      }
    } catch (err) {
      console.warn('Server join fallback error:', err);
    }

    // Mirroring authoritative database rules in memoryStore fallback
    const result = memoryStore.joinWorldByCode(cleanCode, partnerName);
    return {
      success: result.success,
      error: result.error,
      couple: result.couple,
    };
  },

  /**
   * Atomic creation of a couple world with creator membership & invite generation
   */
  async createWorld(params: {
    worldName?: string;
    anniversaryDate: string;
    userName?: string;
  }): Promise<{ success: boolean; couple: Couple; inviteCode: string }> {
    const supabase = createClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('create_world_and_invite', {
          p_name: params.worldName?.trim() || 'Our Little World',
          p_anniversary_date: params.anniversaryDate,
          p_cover_image_url: '/images/cute_home_bg.jpg',
        });

        if (error) {
          console.warn('Supabase create_world_and_invite rpc error:', error);
        } else if (data) {
          const couple: Couple = {
            id: data.couple_id,
            name: data.world_name,
            anniversary_date: data.anniversary_date,
            invite_code: data.invite_code,
            cover_image_url: '/images/cute_home_bg.jpg',
            member_count: 1,
            is_full: false,
            created_at: new Date().toISOString(),
          };

          // Sync client-side state/cache
          memoryStore.setCouple(couple);
          return {
            success: true,
            couple,
            inviteCode: data.invite_code,
          };
        }
      } catch (err) {
        console.warn('Supabase create error:', err);
      }
    }

    // Mirroring authoritative database rules in memoryStore fallback
    const { couple } = memoryStore.createWorld({
      worldName: params.worldName,
      anniversaryDate: params.anniversaryDate,
      userName: params.userName,
    });

    const activeWorld = memoryStore.getActiveWorld();
    if (activeWorld) {
      try {
        await fetch('/api/worlds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            world: activeWorld,
            invite: {
              code: couple.invite_code,
              couple_id: couple.id,
              created_by: couple.creator_id,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: couple.created_at || new Date().toISOString(),
            },
          }),
        });
      } catch (e) {
        console.warn('Async server sync error on world creation:', e);
      }
    }

    return {
      success: true,
      couple,
      inviteCode: couple.invite_code || '',
    };
  },
};
