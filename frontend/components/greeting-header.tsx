'use client';

import { motion } from 'framer-motion';
import { useMarketStore } from '@/lib/store';

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'İyi geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export function GreetingHeader() {
  const user = useMarketStore((s) => s.telegramUser);
  const greeting = timeGreeting();
  const name = user?.firstName ?? null;
  const initials = name ? name.slice(0, 1).toUpperCase() : 'V';

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="px-4 pt-4 flex items-center justify-between"
    >
      <div>
        <p className="text-xs text-slate-500">
          {greeting}
          {name ? `, ${name} 👋` : ''}
        </p>
        <h1 className="text-xl font-bold text-gradient">Veri Terminali</h1>
      </div>
      <div className="h-11 w-11 rounded-2xl overflow-hidden shrink-0 gradient-accent flex items-center justify-center text-black font-semibold text-sm shadow-[0_4px_16px_-4px_rgba(34,197,94,0.5)]">
        {user?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoUrl} alt={name ?? 'kullanıcı'} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>
    </motion.header>
  );
}
