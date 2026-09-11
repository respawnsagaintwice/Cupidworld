import React from 'react';

export function HeartDoodle({ className = "w-6 h-6 text-brand-rose", fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={fill} className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarDoodle({ className = "w-5 h-5 text-brand-butter-yellow" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlowerDoodle({ className = "w-6 h-6 text-brand-rose" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="3.5" fill="#FFF1B8" stroke="#594A4A" strokeWidth="1.2" />
      <circle cx="16" cy="9" r="4" fill="#FFDDE8" stroke="#594A4A" strokeWidth="1.2" />
      <circle cx="23" cy="16" r="4" fill="#FFDDE8" stroke="#594A4A" strokeWidth="1.2" />
      <circle cx="16" cy="23" r="4" fill="#FFDDE8" stroke="#594A4A" strokeWidth="1.2" />
      <circle cx="9" cy="16" r="4" fill="#FFDDE8" stroke="#594A4A" strokeWidth="1.2" />
    </svg>
  );
}

export function CloudDoodle({ className = "w-10 h-6 text-brand-baby-blue" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 30" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M38 18a8 8 0 0 0-14.7-4.4A10 10 0 0 0 8 20a7 7 0 0 0 2 13.7h28a8 8 0 0 0 0-16z"
        fillOpacity="0.8"
        stroke="#594A4A"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CuteArrow({ className = "w-8 h-4 text-brand-dark" }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 12c12-6 28-2 44-2m-8-7l8 7-8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UnderlineDoodle({ className = "w-32 h-3 text-brand-rose" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 11c35-7 85-6 154 2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
