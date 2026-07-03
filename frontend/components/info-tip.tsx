'use client';

import Link from 'next/link';
import { CircleHelp } from 'lucide-react';
import { getGlossaryTerm } from '@/lib/glossary';

/** Contextual "?" link next to a jargon term, pointing at the real
 * glossary entry in /rehber -- the difference between handing users raw
 * data (the reference bot) and actually explaining it (roadmap Sprint 9). */
export function InfoTip({ slug }: { slug: string }) {
  const term = getGlossaryTerm(slug);
  if (!term) return null;
  return (
    <Link
      href={`/rehber/${slug}`}
      className="inline-flex items-center text-slate-600 hover:text-emerald-400 transition-colors"
      aria-label={`${term.term} nedir?`}
      title={term.short}
    >
      <CircleHelp size={12} />
    </Link>
  );
}
