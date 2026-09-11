"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Image as ImageIcon, Calendar, BookHeart, Mail, Settings } from 'lucide-react';
import { DuduBubuIcon } from '../decorative/DuduBubuCharacters';

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/home', label: 'Home', icon: Heart },
    { href: '/story', label: 'Our Story', icon: BookHeart },
    { href: '/memories', label: 'Memories', icon: ImageIcon },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/notes', label: 'Love Notes', icon: Mail },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-brand-cream/95 backdrop-blur-md border-b border-brand-rose/25 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo: us ♡ */}
        <Link href="/home" className="group flex items-center gap-2.5 select-none">
          <DuduBubuIcon className="scale-110 group-hover:scale-120 transition-transform" />
          <div className="flex items-center gap-1.5">
            <span className="font-section font-bold text-2xl text-brand-dark tracking-tight leading-none block">
              us <span className="text-brand-rose">♡</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Tabs (Fredoka Medium font) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/home' && pathname?.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-full font-section text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-brand-rose-deep bg-brand-soft-pink font-semibold shadow-2xs'
                    : 'text-brand-dark/75 hover:text-brand-dark hover:bg-brand-soft-pink/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-rose-deep' : 'text-brand-warm-gray'}`} />
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-rose" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Button: + Memory */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/memories/new"
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-brand-soft-pink hover:bg-brand-soft-pink/90 text-brand-rose-deep font-button font-bold text-xs sm:text-sm border border-brand-rose/40 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 fill-brand-rose text-brand-rose" />
            <span>+ Memory ♡</span>
          </Link>
        </div>

      </div>
    </header>
  );
}
