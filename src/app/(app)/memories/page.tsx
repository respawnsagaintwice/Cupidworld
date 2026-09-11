"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { memoryStore } from '@/lib/store/memoryStore';
import { Memory } from '@/lib/types/database';
import { PolaroidCard } from '@/components/decorative/PolaroidCard';
import { Plus, Camera, Sparkles } from 'lucide-react';

export default function MemoriesGalleryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    setMemories(memoryStore.getMemories());
    const unsubscribe = memoryStore.subscribe(() => {
      setMemories(memoryStore.getMemories());
    });
    return () => unsubscribe();
  }, []);

  const filteredMemories = memories.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.mood === activeFilter;
  });

  const filterTabs = [
    { id: 'all', label: 'All memories' },
    { id: 'romantic', label: '♡ Romantic' },
    { id: 'cozy', label: '☕ Cozy' },
    { id: 'silly', label: '✨ Silly' },
    { id: 'adventure', label: '🌿 Trips' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-rose/20 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-section text-3xl sm:text-5xl font-bold text-brand-dark tracking-tight">
              Our Memory Scrapbook
            </h1>
            <span className="text-2xl text-brand-rose">♡</span>
          </div>
          <p className="font-body text-xs sm:text-sm text-brand-warm-gray mt-1">
            Every snapshot pinned to our wall of little moments
          </p>
        </div>

        <Link
          href="/memories/new"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-102 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ add a memory</span>
        </Link>
      </div>

      {/* Filter Tabs Styled with Baloo 2 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full font-button text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-rose text-white shadow-xs'
                  : 'bg-white hover:bg-brand-soft-pink/50 text-brand-dark/80 border border-brand-rose/25'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Scrapbook Polaroid Grid */}
      {filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 pt-4 pb-12 justify-items-center">
          {filteredMemories.map((memory) => (
            <PolaroidCard key={memory.id} memory={memory} className="w-full max-w-[340px]" />
          ))}
        </div>
      ) : (
        /* Cute Empty State */
        <div className="paper-ruled rounded-3xl p-10 sm:p-14 text-center max-w-lg mx-auto my-12 border-2 border-brand-rose/25 shadow-xs bg-white/95">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-soft-pink flex items-center justify-center border border-brand-rose/30 mb-4">
            <Camera className="w-7 h-7 text-brand-rose" />
          </div>
          <h3 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark mb-1">
            Your little scrapbook is empty ♡
          </h3>
          <p className="font-body text-xs sm:text-sm text-brand-warm-gray max-w-sm mx-auto mb-6 leading-relaxed">
            No memories under this section yet. Snap a picture of something sweet today and add it to your memory album.
          </p>
          <Link
            href="/memories/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs sm:text-sm shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Go make your first memory</span>
          </Link>
        </div>
      )}

    </div>
  );
}
