"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Image as ImageIcon, Calendar, BookHeart, Mail, Settings } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/home', label: 'Home', icon: Heart },
    { href: '/story', label: 'Story', icon: BookHeart },
    { href: '/memories', label: 'Memories', icon: ImageIcon },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/notes', label: 'Notes', icon: Mail },
    { href: '/settings', label: 'More', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-cream/95 backdrop-blur-lg border-t border-brand-rose/25 pb-safe px-2 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto font-section">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/home' && pathname?.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
                isActive
                  ? 'text-brand-rose-deep font-semibold scale-105'
                  : 'text-brand-warm-gray hover:text-brand-dark'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? 'bg-brand-soft-pink text-brand-rose-deep shadow-2xs' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5 font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
