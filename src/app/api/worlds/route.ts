import { NextResponse, NextRequest } from 'next/server';
import {
  findServerWorldByCode,
  findServerWorldById,
  findServerWorldByUserId,
  getServerDb,
  saveServerDb,
  mergeAndSaveServerWorld,
  normalizeInviteCode,
} from '@/lib/server/worldsStorage';
import { StoredWorld, StoredInvite } from '@/lib/store/memoryStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code') || '';
  const userId = searchParams.get('userId') || '';
  const worldId = searchParams.get('worldId') || '';

  if (worldId) {
    const world = findServerWorldById(worldId);
    if (world) {
      return NextResponse.json({
        success: true,
        valid: true,
        world,
        updated_at: world.updated_at || world.couple.created_at,
      });
    }
  }

  if (!rawCode.trim() && userId) {
    const world = findServerWorldByUserId(userId);
    if (world) {
      return NextResponse.json({
        success: true,
        valid: true,
        world,
        updated_at: world.updated_at || world.couple.created_at,
      });
    }
  }

  if (!rawCode.trim()) {
    return NextResponse.json({
      valid: false,
      code: 'INVITE_NOT_FOUND',
      message: "This invite doesn't seem to exist ♡",
    });
  }

  const { world, invite } = findServerWorldByCode(rawCode);

  if (!world || !invite) {
    return NextResponse.json({
      valid: false,
      code: 'INVITE_NOT_FOUND',
      message: "This invite doesn't seem to exist ♡",
    });
  }

  // Check expiration
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({
      valid: false,
      code: 'INVITE_EXPIRED',
      message: 'This invite has expired ♡',
    });
  }

  // Check self-join
  if (userId && (invite.created_by === userId || world.members.some((m) => m.user_id === userId))) {
    return NextResponse.json({
      valid: false,
      code: 'SELF_JOIN',
      message: "This is already your little world ♡ You don't need to join it again.",
    });
  }

  // Check used
  if (invite.used_by || invite.used_at) {
    return NextResponse.json({
      valid: false,
      code: 'INVITE_ALREADY_USED',
      message: 'This invite has already been used ♡',
    });
  }

  // Check capacity: strictly 2-person limit
  if (world.members.length >= 2 || world.couple.is_full) {
    return NextResponse.json({
      valid: false,
      code: 'WORLD_FULL',
      message: 'This little world is already full ♡ Only two partners can share a world.',
    });
  }

  const creatorMember = world.members.find((m) => m.role === 'creator');

  return NextResponse.json({
    valid: true,
    code: 'VALID',
    message: 'Valid invite ♡',
    world_id: world.couple.id,
    world_name: world.couple.name,
    creator_name: creatorMember?.profile?.display_name || 'Your partner',
    member_count: world.members.length,
    invite_code: invite.code,
    world,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { world, invite } = body as { world: StoredWorld; invite: StoredInvite };

    if (!world || !world.couple || !world.couple.id) {
      return NextResponse.json({ success: false, error: 'Invalid world payload' }, { status: 400 });
    }

    const db = getServerDb();
    const existing = db.worlds[world.couple.id];
    let savedWorld: StoredWorld;

    if (existing) {
      savedWorld = mergeAndSaveServerWorld(world.couple.id, world);
    } else {
      world.updated_at = new Date().toISOString();
      db.worlds[world.couple.id] = world;
      savedWorld = world;
    }

    if (invite && invite.code) {
      const { withPrefix, clean } = normalizeInviteCode(invite.code);
      db.invites[clean] = invite;
      db.invites[withPrefix] = invite;
    } else if (world.couple.invite_code) {
      const { withPrefix, clean } = normalizeInviteCode(world.couple.invite_code);
      const generatedInvite: StoredInvite = {
        code: withPrefix,
        couple_id: world.couple.id,
        created_by: world.couple.creator_id || 'user-creator',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: world.couple.created_at || new Date().toISOString(),
      };
      db.invites[clean] = generatedInvite;
      db.invites[withPrefix] = generatedInvite;
    }

    saveServerDb(db);

    return NextResponse.json({ success: true, world: savedWorld, invite });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error saving world';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
