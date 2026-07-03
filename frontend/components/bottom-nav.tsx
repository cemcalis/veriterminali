'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Anasayfa', icon: '🏠' },
  { href: '/piyasalar', label: 'Piyasalar', icon: '📊' },
  { href: '/grafik', label: 'Grafik', icon: '📈' },
  { href: '/portfoy', label: 'Portföy', icon: '💼' },
  { href: '/alarm', label: 'Alarm', icon: '🔔' },
  { href: '/ayarlar', label: 'Ayarlar', icon: '⚙️' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[#0a0a0f]/95 backdrop-blur">
      <div className="max-w-lg mx-auto grid grid-cols-6">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${
                active ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
