"use client";

import React, { useEffect, useRef } from 'react';
import { memoryStore } from '@/lib/store/memoryStore';

export function WorldSyncProvider({ children }: { children: React.ReactNode }) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function pullLatestWorld() {
      if (isSyncingRef.current) return;
      const user = memoryStore.getCurrentUser();
      const activeWorld = memoryStore.getActiveWorld();
      const worldId = activeWorld?.couple?.id;

      if (!worldId && !user?.id) return;

      isSyncingRef.current = true;
      try {
        const queryParams: string[] = [];
        if (worldId) queryParams.push(`worldId=${encodeURIComponent(worldId)}`);
        if (user?.id) queryParams.push(`userId=${encodeURIComponent(user.id)}`);
        const query = queryParams.join('&');
        const res = await fetch(`/api/worlds/sync?${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.world && isMounted) {
            memoryStore.syncFromServer(data.world);
          }
        }
      } catch (err) {
        console.debug('Background world sync tick error (offline/dev):', err);
      } finally {
        isSyncingRef.current = false;
      }
    }

    // 1. Immediate pull on mount
    pullLatestWorld();

    // 2. Poll every 2 seconds for real-time responsiveness between partners
    const interval = setInterval(pullLatestWorld, 2000);

    // 3. Immediate pull when tab is focused or becomes visible
    const handleFocus = () => pullLatestWorld();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullLatestWorld();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}
