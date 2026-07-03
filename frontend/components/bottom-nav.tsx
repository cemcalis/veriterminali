'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, LineChart, Briefcase, Bell, Settings } from 'lucide-react';
import type { ComponentType } from 'react';

const ITEMS: { href: string; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { href: '/', label: 'Anasayfa', icon: Home },
  { href: '/piyasalar', label: 'Piyasalar', icon: BarChart3 },
  { href: '/grafik', label: 'Grafik', icon: LineChart },
  { href: '/portfoy', label: 'Portföy', icon: Briefcase },
  { href: '/alarm', label: 'Alarm', icon: Bell },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[#0a0a0f]/95 backdrop-blur">
      <div className="max-w-lg mx-auto grid grid-cols-6">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 text-[10px] transition-colors ${
                active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
