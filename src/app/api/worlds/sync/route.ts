import { NextResponse, NextRequest } from 'next/server';
import {
  findServerWorldById,
  findServerWorldByUserId,
  mergeAndSaveServerWorld,
} from '@/lib/server/worldsStorage';
import { StoredWorld } from '@/lib/store/memoryStore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const worldId = searchParams.get('worldId') || '';
  const userId = searchParams.get('userId') || '';

  if (worldId) {
    const world = findServerWorldById(worldId);
    if (world) {
      return NextResponse.json({
        success: true,
        world,
        updated_at: world.updated_at || world.couple.created_at,
      });
    }
  }

  if (userId) {
    const world = findServerWorldByUserId(userId);
    if (world) {
      return NextResponse.json({
        success: true,
        world,
        updated_at: world.updated_at || world.couple.created_at,
      });
    }
  }

  return NextResponse.json(
    { success: false, error: 'World not found' },
    { status: 404 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { worldId, world } = body as { worldId: string; world: StoredWorld };

    const targetWorldId = worldId || world?.couple?.id;
    if (!targetWorldId || !world || !world.couple) {
      return NextResponse.json(
        { success: false, error: 'Invalid world payload' },
        { status: 400 }
      );
    }

    const merged = mergeAndSaveServerWorld(targetWorldId, world);
    return NextResponse.json({
      success: true,
      world: merged,
      updated_at: merged.updated_at,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server sync error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
