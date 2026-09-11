import React from 'react';

// Cute Dudu (Brown Bear) & Bubu (White Panda) Header Icon
export function DuduBubuIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center -space-x-1.5 ${className}`}>
      {/* Dudu (Brown Bear) */}
      <div className="w-6 h-6 rounded-full bg-[#A88165] border-2 border-[#543D2B] relative flex items-center justify-center shadow-xs">
        {/* Ears */}
        <div className="absolute -top-1 -left-0.5 w-2 h-2 rounded-full bg-[#A88165] border border-[#543D2B]" />
        <div className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-[#A88165] border border-[#543D2B]" />
        {/* Cheeks */}
        <div className="absolute bottom-1 left-0.5 w-1.5 h-1 rounded-full bg-[#FFAAA6]/80" />
        <div className="absolute bottom-1 right-0.5 w-1.5 h-1 rounded-full bg-[#FFAAA6]/80" />
        {/* Face eyes */}
        <div className="flex gap-1 mb-0.5">
          <div className="w-0.5 h-0.5 rounded-full bg-[#543D2B]" />
          <div className="w-0.5 h-0.5 rounded-full bg-[#543D2B]" />
        </div>
      </div>

      {/* Bubu (White Panda/Bear) */}
      <div className="w-6 h-6 rounded-full bg-white border-2 border-[#543D2B] relative flex items-center justify-center shadow-xs z-10">
        {/* Ears */}
        <div className="absolute -top-1 -left-0.5 w-2 h-2 rounded-full bg-[#543D2B]" />
        <div className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-[#543D2B]" />
        {/* Cheeks */}
        <div className="absolute bottom-1 left-0.5 w-1.5 h-1 rounded-full bg-[#FFAAA6]" />
        <div className="absolute bottom-1 right-0.5 w-1.5 h-1 rounded-full bg-[#FFAAA6]" />
        {/* Eyes */}
        <div className="flex gap-1 mb-0.5">
          <div className="w-0.5 h-0.5 rounded-full bg-[#543D2B]" />
          <div className="w-0.5 h-0.5 rounded-full bg-[#543D2B]" />
        </div>
      </div>
    </div>
  );
}

// Paw Fist-Bump Banner Badge
export function DuduBubuPawsBadge({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden border-2 border-brand-rose/40 shadow-xs ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/dudububu/dudu_bubu_paws.png"
        alt="Dudu & Bubu Paws"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// Blossom Tree Couple Badge
export function DuduBubuBlossomBadge({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden border-2 border-brand-rose/40 shadow-xs ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/dudububu/dudu_bubu_blossom.png"
        alt="Dudu & Bubu Cherry Blossom"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
