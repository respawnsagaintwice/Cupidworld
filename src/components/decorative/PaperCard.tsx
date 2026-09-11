import React from 'react';

interface PaperCardProps {
  children: React.ReactNode;
  variant?: 'sheet' | 'ruled' | 'grid' | 'kraft' | 'sticky-yellow' | 'sticky-pink' | 'sticky-lavender';
  className?: string;
  rotation?: number;
}

export function PaperCard({
  children,
  variant = 'sheet',
  className = '',
  rotation = 0,
}: PaperCardProps) {
  const variantClasses = {
    'sheet': 'paper-sheet rounded-2xl p-6 sm:p-8',
    'ruled': 'paper-ruled rounded-2xl p-6 sm:p-8',
    'grid': 'paper-grid rounded-2xl p-6 sm:p-8',
    'kraft': 'paper-kraft rounded-2xl p-6 sm:p-8 text-[#483B36]',
    'sticky-yellow': 'paper-sticky-yellow rounded-lg p-5 text-[#544636]',
    'sticky-pink': 'paper-sticky-pink rounded-lg p-5 text-[#5C3E4A]',
    'sticky-lavender': 'paper-sticky-lavender rounded-lg p-5 text-[#4D425A]',
  };

  return (
    <div
      className={`relative transition-all duration-300 ${variantClasses[variant]} ${className}`}
      style={{
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
      }}
    >
      {children}
    </div>
  );
}
