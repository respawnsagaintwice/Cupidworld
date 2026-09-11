"use client";

import React from 'react';
import Link from 'next/link';
import { Memory } from '@/lib/types/database';
import { WashiTape } from './WashiTape';
import { formatRomanticDate } from '@/lib/utils/date';
import { MapPin, MessageSquare } from 'lucide-react';

interface PolaroidCardProps {
  memory: Memory;
  priority?: boolean;
  className?: string;
  showCommentsBadge?: boolean;
}

export function PolaroidCard({
  memory,
  className = '',
  showCommentsBadge = true,
}: PolaroidCardProps) {
  const rotation = memory.rotation_deg ?? 0;
  const tapeAngle = rotation > 0 ? -2.5 : 2.5;

  return (
    <div
      className={`relative inline-block select-none group ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Pinned Washi Tape on top */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <WashiTape styleName={memory.tape_style || 'washi-pink'} className="w-24 sm:w-28" angle={tapeAngle} />
      </div>

      <Link
        href={`/memories/${memory.id}`}
        className="block polaroid-frame max-w-[340px] w-full cursor-pointer bg-white"
      >
        {/* Photo Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-cream-subtle rounded-xl border border-brand-dark/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={memory.image_url}
            alt={memory.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {memory.mood && (
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs font-button font-bold text-[11px] text-brand-dark px-2.5 py-0.5 rounded-full shadow-xs border border-brand-rose/30">
              {memory.mood === 'romantic' && '♡ romantic'}
              {memory.mood === 'silly' && '✨ silly'}
              {memory.mood === 'cozy' && '☕ cozy'}
              {memory.mood === 'adventure' && '🌿 adventure'}
              {memory.mood === 'magical' && '💫 magical'}
            </div>
          )}
        </div>

        {/* Polaroid Bottom Caption Area */}
        <div className="pt-3 pb-1 px-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-section text-xl sm:text-2xl text-brand-dark leading-snug font-bold group-hover:text-brand-rose-deep transition-colors line-clamp-1">
              {memory.title}
            </h3>
            {showCommentsBadge && memory.comments && memory.comments.length > 0 && (
              <span className="flex items-center gap-1 font-body text-xs text-brand-warm-gray pt-1 shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-brand-rose" />
                <span>{memory.comments.length}</span>
              </span>
            )}
          </div>

          {memory.caption && (
            <p className="font-body text-xs text-brand-warm-gray line-clamp-2 mt-1 leading-relaxed">
              {memory.caption}
            </p>
          )}

          <div className="flex items-center justify-between font-body text-[11px] text-brand-muted mt-2 pt-2 border-t border-brand-dark/5">
            <span className="font-medium text-brand-warm-gray">
              {formatRomanticDate(memory.memory_date)}
            </span>
            {memory.location && (
              <span className="flex items-center gap-1 text-brand-warm-gray/80 truncate max-w-[140px]">
                <MapPin className="w-3 h-3 text-brand-rose/70 shrink-0" />
                <span className="truncate">{memory.location}</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
