import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import { GLOSSARY } from '@/lib/glossary';

export default function RehberPage() {
  return (
    <div className="pb-6">
      <header className="px-4 pt-4 flex items-center gap-2">
        <BookOpen size={18} className="text-emerald-400" />
        <h1 className="text-lg font-bold">Rehber</h1>
      </header>
      <p className="px-4 mt-1 text-[11px] text-slate-500">
        Uygulamada gördüğünüz terimlerin gerçek, sade açıklamaları.
      </p>

      <div className="mx-4 mt-3 flex flex-col gap-2">
        {GLOSSARY.map((g) => (
          <Link
            key={g.slug}
            href={`/rehber/${g.slug}`}
            className="panel-elevated p-3 flex items-center justify-between gap-2 hover:bg-white/[0.02] transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium">{g.term}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{g.short}</div>
            </div>
            <ChevronRight size={15} className="shrink-0 text-slate-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}
