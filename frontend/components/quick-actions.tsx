'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Bell, Wallet, Settings2, Radar, CalendarDays } from 'lucide-react';
import { haptic } from '@/lib/telegram';

const ACTIONS = [
  { href: '/tarayici', label: 'Tarayıcı', icon: Radar },
  { href: '/piyasalar', label: 'Piyasalar', icon: Search },
  { href: '/portfoy', label: 'Portföy', icon: Wallet },
  { href: '/takvim', label: 'Takvim', icon: CalendarDays },
  { href: '/alarm', label: 'Alarm Kur', icon: Bell },
  { href: '/ayarlar', label: 'Ayarlar', icon: Settings2 },
];

export function QuickActions() {
  return (
    <div className="px-4 pt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
      {ACTIONS.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
          >
            <Link
              href={action.href}
              onClick={() => haptic('light')}
              className="flex flex-col items-center gap-1.5 panel-elevated py-3 active:scale-95 transition-transform"
            >
              <div className="h-9 w-9 rounded-xl gradient-accent flex items-center justify-center">
                <Icon size={16} className="text-black" />
              </div>
              <span className="text-[10px] text-slate-400">{action.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
