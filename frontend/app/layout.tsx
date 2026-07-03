import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { BottomNav } from '@/components/bottom-nav';
import { AppProviders } from '@/components/app-providers';

export const metadata: Metadata = {
  title: 'Veri Terminali',
  description: 'Telegram için gerçek zamanlı finans terminali',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-slate-100 font-sans">
        <AppProviders>
          <main className="flex-1 pb-16 max-w-lg mx-auto w-full">{children}</main>
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
