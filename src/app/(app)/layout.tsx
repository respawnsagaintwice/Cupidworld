import React from 'react';
import { Navbar } from '@/components/navigation/Navbar';
import { BottomNav } from '@/components/navigation/BottomNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { WorldSyncProvider } from '@/components/sync/WorldSyncProvider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <WorldSyncProvider>
        <div className="min-h-screen flex flex-col bg-brand-cream relative">
          <Navbar />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 md:pb-12">
            {children}
          </main>
          <BottomNav />
        </div>
      </WorldSyncProvider>
    </AuthGuard>
  );
}
