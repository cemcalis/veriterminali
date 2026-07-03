'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, BarChart3, LineChart, Briefcase, Bell, Settings } from 'lucide-react';
import type { ComponentType } from 'react';
import { haptic } from '@/lib/telegram';

const ITEMS: { href: string; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { href: '/', label: 'Ana Sayfa', icon: Home },
  { href: '/piyasalar', label: 'Piyasalar', icon: BarChart3 },
  { href: '/grafik', label: 'Grafik', icon: LineChart },
  { href: '/portfoy', label: 'Portföy', icon: Briefcase },
  { href: '/alarm', label: 'Alarm', icon: Bell },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(0.75rem+var(--tg-safe-bottom,0px))] pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="glass rounded-[1.75rem] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7)] px-1.5 py-1.5 flex items-center justify-between">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => haptic('select')}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl text-[10px]"
              >
                {active && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 rounded-2xl bg-emerald-500/15 border border-emerald-500/30"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 transition-colors ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Icon size={19} strokeWidth={active ? 2.4 : 1.75} />
                </span>
                <span className={`relative z-10 transition-colors ${active ? 'text-emerald-300 font-medium' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
