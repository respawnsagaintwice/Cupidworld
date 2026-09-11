import { NextResponse, NextRequest } from 'next/server';
import {
  findServerWorldByCode,
  getServerDb,
  saveServerDb,
} from '@/lib/server/worldsStorage';
import { CoupleMember } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, partnerName, userId } = body as {
      code: string;
      partnerName?: string;
      userId?: string;
    };

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: "This invite doesn't seem to exist ♡" },
        { status: 400 }
      );
    }

    const { world, invite } = findServerWorldByCode(code);

    if (!world || !invite) {
      return NextResponse.json(
        { success: false, error: "This invite doesn't seem to exist ♡" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, error: 'This invite has expired ♡' },
        { status: 400 }
      );
    }

    // Check self-join
    if (userId && (invite.created_by === userId || world.members.some((m) => m.user_id === userId))) {
      return NextResponse.json(
        {
          success: false,
          error: "This is already your little world ♡ You don't need to join it again.",
        },
        { status: 400 }
      );
    }

    // Check used
    if (invite.used_by || invite.used_at) {
      return NextResponse.json(
        { success: false, error: 'This invite has already been used ♡' },
        { status: 400 }
      );
    }

    // Capacity: strictly 2-person limit
    if (world.members.length >= 2 || world.couple.is_full) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This little world is already full ♡ Only two partners can share a world.',
        },
        { status: 400 }
      );
    }

    const effectiveUserId = userId || `user-partner-${Date.now()}`;
    const effectiveName = partnerName?.trim() || 'My Love';

    // Add Member 2
    const partnerMember: CoupleMember = {
      id: `m-${Date.now()}-partner`,
      couple_id: world.couple.id,
      user_id: effectiveUserId,
      role: 'partner',
      joined_at: new Date().toISOString(),
      profile: {
        id: effectiveUserId,
        display_name: effectiveName,
        nickname: `${effectiveName} ♡`,
        created_at: new Date().toISOString(),
      },
    };

    world.members.push(partnerMember);
    world.couple.member_count = 2;
    world.couple.is_full = true;

    // Mark invite as used
    invite.used_by = effectiveUserId;
    invite.used_at = new Date().toISOString();

    world.updated_at = new Date().toISOString();
    const db = getServerDb();
    db.worlds[world.couple.id] = world;
    db.invites[invite.code] = invite;
    saveServerDb(db);

    return NextResponse.json({
      success: true,
      couple: world.couple,
      world,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error during join';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
