"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { memoryStore } from '@/lib/store/memoryStore';
import { Couple } from '@/lib/types/database';
import { Heart } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. Check Supabase auth session if available
      const supabase = createClient();
      let hasUser = false;

      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            hasUser = true;
            // Ensure local store profile is synced
            const currentUser = memoryStore.getCurrentUser();
            if (!currentUser || currentUser.id !== user.id) {
              const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'My Love';
              memoryStore.setCurrentUser({
                id: user.id,
                display_name: displayName,
                nickname: `${displayName} ♡`,
                created_at: user.created_at,
              });
            }

            // Check world membership from Supabase
            const { data: membership } = await supabase
              .from('couple_members')
              .select('couple_id, role, couples(*)')
              .eq('user_id', user.id)
              .maybeSingle();

            if (membership && membership.couples) {
              memoryStore.setCouple(membership.couples as unknown as Couple);
            } else {
              // User has no world -> must create or join
              if (isMounted) {
                router.replace('/onboarding/create');
              }
              return;
            }
          }
        } catch (err) {
          console.warn("Supabase auth check error", err);
        }
      }

      // 2. Client cache check (for offline/dev fallback)
      if (!hasUser) {
        const localUser = memoryStore.getCurrentUser();
        if (!localUser) {
          const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
          if (isMounted) {
            router.replace(redirectUrl);
          }
          return;
        }

        // Check world membership in local store
        const couple = memoryStore.getCouple();
        if (!couple) {
          if (isMounted) {
            router.replace('/onboarding/create');
          }
          return;
        }
      }

      if (isMounted) {
        setAuthorized(true);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, pathname]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-4">
        <div className="paper-sheet rounded-3xl p-8 border-2 border-brand-rose/30 shadow-md flex flex-col items-center gap-3 bg-white/95">
          <div className="w-12 h-12 rounded-full bg-brand-soft-pink flex items-center justify-center text-brand-rose animate-pulse">
            <Heart className="w-6 h-6 fill-brand-rose" />
          </div>
          <span className="font-section text-base font-bold text-brand-dark">
            Opening your world... ♡
          </span>
          <span className="font-body text-xs text-brand-warm-gray">
            Verifying your sanctuary keys
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
