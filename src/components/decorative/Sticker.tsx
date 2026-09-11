import React from 'react';

interface StickerProps {
  type: 'heart' | 'star' | 'flower' | 'kiss' | 'sparkle' | 'stamp';
  label?: string;
  className?: string;
  rotation?: number;
}

export function Sticker({ type, label, className = '', rotation = 0 }: StickerProps) {
  const getIcon = () => {
    switch (type) {
      case 'heart':
        return '💖';
      case 'star':
        return '⭐️';
      case 'flower':
        return '🌸';
      case 'kiss':
        return '💋';
      case 'sparkle':
        return '✨';
      case 'stamp':
        return '💌';
      default:
        return '♡';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/95 text-brand-dark rounded-full shadow-sm border border-brand-rose/30 text-xs font-semibold select-none backdrop-blur-xs transition-transform hover:scale-105 ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <span className="text-sm">{getIcon()}</span>
      {label && <span className="tracking-wide text-brand-dark/90 font-medium">{label}</span>}
    </div>
  );
}
