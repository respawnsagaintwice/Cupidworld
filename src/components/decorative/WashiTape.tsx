import React from 'react';

interface WashiTapeProps {
  styleName?: 'washi-pink' | 'washi-yellow' | 'washi-lavender' | 'washi-blue';
  className?: string;
  angle?: number;
}

export function WashiTape({ styleName = 'washi-pink', className = '', angle = -2 }: WashiTapeProps) {
  const colorMap = {
    'washi-pink': 'washi-tape-pink',
    'washi-yellow': 'washi-tape-yellow',
    'washi-lavender': 'washi-tape-lavender',
    'washi-blue': 'washi-tape-blue',
  };

  return (
    <div
      className={`washi-tape ${colorMap[styleName] || 'washi-tape-pink'} ${className}`}
      style={{
        transform: `rotate(${angle}deg)`,
        clipPath: 'polygon(0% 0%, 5% 40%, 0% 100%, 100% 100%, 95% 60%, 100% 0%)',
      }}
      aria-hidden="true"
    />
  );
}
