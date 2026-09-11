"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { memoryStore } from '@/lib/store/memoryStore';
import { Memory } from '@/lib/types/database';
import { formatRomanticDate } from '@/lib/utils/date';
import { WashiTape } from '@/components/decorative/WashiTape';
import { ArrowLeft, MapPin, Calendar, Trash2, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memoryId = params?.id as string;

  const [memory, setMemory] = useState<Memory | null>(null);
  const [commentText, setCommentText] = useState('');
  const [paperColor, setPaperColor] = useState<'yellow' | 'pink' | 'lavender'>('yellow');

  const loadMemory = () => {
    const m = memoryStore.getMemoryById(memoryId);
    if (m) {
      setMemory(m);
    }
  };

  useEffect(() => {
    loadMemory();
    const unsubscribe = memoryStore.subscribe(() => {
      loadMemory();
    });
    return () => unsubscribe();
  }, [memoryId]);

  if (!memory) {
    return (
      <div className="text-center py-20 font-section">
        <p className="text-2xl text-brand-warm-gray">
          This memory seems to be tucked away... ♡
        </p>
        <Link href="/memories" className="font-button text-xs text-brand-rose font-bold hover:underline mt-4 inline-block">
          ← Back to scrapbook
        </Link>
      </div>
    );
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    memoryStore.addComment(memoryId, commentText.trim(), paperColor);
    setCommentText('');
    loadMemory();
  };

  const handleReaction = (reactionType: any) => {
    memoryStore.toggleReaction(memoryId, reactionType);
    loadMemory();

    try {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#F69BB7', '#FFDFEA', '#FFF2BC'],
      });
    } catch {
      // ignore
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to remove this memory from your scrapbook?")) {
      memoryStore.deleteMemory(memoryId);
      router.push('/memories');
    }
  };

  const reactionCounts: Record<string, number> = {};
  memory.reactions?.forEach((r) => {
    reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Top Back Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/memories"
          className="inline-flex items-center gap-1.5 font-section text-xs font-semibold text-brand-warm-gray hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>all memories</span>
        </Link>

        <button
          onClick={handleDelete}
          className="font-section text-xs text-brand-warm-gray hover:text-rose-500 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-rose-50 cursor-pointer"
          title="Remove from scrapbook"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>remove</span>
        </button>
      </div>

      {/* Main Scrapbook Page Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Big Polaroid Frame (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-[440px]">
            
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <WashiTape styleName={memory.tape_style || 'washi-pink'} className="w-32" angle={-1.5} />
            </div>

            <div className="polaroid-frame rounded-2xl bg-white w-full">
              <div className="aspect-[4/3] w-full overflow-hidden bg-brand-cream-subtle rounded-xl border border-brand-dark/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={memory.image_url}
                  alt={memory.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="pt-4 pb-2 px-2">
                <h1 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark leading-tight">
                  {memory.title}
                </h1>

                {memory.caption && (
                  <p className="font-body text-sm text-brand-dark/85 mt-2 leading-relaxed">
                    {memory.caption}
                  </p>
                )}

                <div className="flex items-center justify-between font-body text-xs text-brand-warm-gray mt-4 pt-3 border-t border-brand-dark/10">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-brand-rose" />
                    <span>{formatRomanticDate(memory.memory_date)}</span>
                  </span>
                  {memory.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-rose" />
                      <span>{memory.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reactions Bar with Baloo 2 tags */}
            <div className="mt-5 paper-sheet rounded-3xl p-3 sm:p-4 border-2 border-brand-rose/25 flex items-center justify-around bg-white/95 shadow-2xs">
              {[
                { type: 'heart', emoji: '💖', label: 'love' },
                { type: 'sparkle', emoji: '✨', label: 'magic' },
                { type: 'hug', emoji: '🤗', label: 'hug' },
                { type: 'kiss', emoji: '💋', label: 'kiss' },
                { type: 'laugh', emoji: '😂', label: 'haha' },
              ].map((r) => {
                const count = reactionCounts[r.type] || 0;
                return (
                  <button
                    key={r.type}
                    onClick={() => handleReaction(r.type)}
                    className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-brand-soft-pink/50 transition-transform active:scale-125 cursor-pointer"
                  >
                    <span className="text-xl sm:text-2xl">{r.emoji}</span>
                    <span className="font-button text-[11px] font-bold text-brand-warm-gray">
                      {count > 0 ? count : r.label}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right: Handwritten Sticky Notes Thread (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-section text-2xl sm:text-3xl font-bold text-brand-dark">
              Little Notes ♡
            </h2>
            <span className="font-body text-xs text-brand-warm-gray">sticky memories</span>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {memory.comments && memory.comments.length > 0 ? (
              memory.comments.map((comment) => {
                const isYellow = comment.paper_color === 'yellow';
                const isPink = comment.paper_color === 'pink';
                const bgClass = isYellow
                  ? 'paper-sticky-yellow text-[#4E3D29]'
                  : isPink
                  ? 'paper-sticky-pink text-[#573543]'
                  : 'paper-sticky-lavender text-[#3F3652]';

                return (
                  <div key={comment.id} className={`p-4 rounded-2xl relative shadow-xs ${bgClass}`}>
                    <div className="flex items-center justify-between font-section text-xs font-bold mb-1 opacity-90">
                      <span>♡ {comment.author_name}</span>
                      <span className="text-[10px] font-normal">note</span>
                    </div>
                    <p className="font-section text-lg leading-snug font-semibold">
                      &ldquo;{comment.comment}&rdquo;
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="paper-ruled rounded-3xl p-6 text-center font-body text-xs text-brand-warm-gray border border-brand-rose/20 bg-white/90">
                No little notes pinned yet. Leave a sweet sticky note below!
              </div>
            )}
          </div>

          {/* Add Sticky Note Form */}
          <form onSubmit={handleAddComment} className="paper-sheet rounded-3xl p-5 border-2 border-brand-rose/25 bg-white/95 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-section text-xs font-bold text-brand-dark">
                Leave a sticky note
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'yellow', color: 'bg-[#FFF6C4]' },
                  { id: 'pink', color: 'bg-[#FFE6EE]' },
                  { id: 'lavender', color: 'bg-[#EFE8FF]' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPaperColor(c.id as any)}
                    className={`w-4 h-4 rounded-full ${c.color} border transition-all ${
                      paperColor === c.id ? 'scale-125 border-brand-dark' : 'border-brand-dark/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              required
              placeholder="Write a sweet thought..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-brand-cream-subtle border border-brand-dark/15 rounded-2xl p-3 font-body text-xs sm:text-sm text-brand-dark focus:ring-2 focus:ring-brand-rose/40 resize-none"
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-brand-rose hover:bg-brand-rose-deep text-white font-button font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span>Pin note</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
