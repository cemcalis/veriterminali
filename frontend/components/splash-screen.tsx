'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart } from 'lucide-react';

const SPLASH_SEEN_KEY = 'veri-terminali-splash-seen';
const SPLASH_DURATION_MS = 2400;

export function SplashScreen({ children }: { children: React.ReactNode }) {
  // Starts false on both server and first client render (no window/
  // sessionStorage access during SSR) to avoid a hydration mismatch; the
  // effect below promotes it to true right after mount if this is the
  // first visit in this session.
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_SEEN_KEY)) return;
    setVisible(true);
    const start = Date.now();
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / SPLASH_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(tick);
    }, 30);
    const timer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
      setVisible(false);
    }, SPLASH_DURATION_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0f]"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-20 w-20 rounded-3xl gradient-accent flex items-center justify-center shadow-[0_0_60px_-10px_rgba(34,197,94,0.6)]"
            >
              <LineChart size={38} className="text-black" strokeWidth={2.5} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-5 text-xl font-bold text-gradient"
            >
              Veri Terminali
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-1 text-xs text-slate-500"
            >
              Profesyonel finans terminali
            </motion.p>
            <div className="absolute bottom-16 w-40 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full gradient-accent rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear', duration: 0.03 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
