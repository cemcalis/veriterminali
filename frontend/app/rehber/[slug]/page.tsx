import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { GLOSSARY, getGlossaryTerm } from '@/lib/glossary';

export function generateStaticParams() {
  return GLOSSARY.map((g) => ({ slug: g.slug }));
}

export default async function RehberDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  return (
    <div className="pb-6">
      <header className="px-4 pt-4">
        <Link href="/rehber" className="flex items-center gap-1 text-xs text-slate-400">
          <ChevronLeft size={14} /> Rehber
        </Link>
        <h1 className="text-lg font-bold mt-2">{term.term}</h1>
      </header>
      <div className="px-4 mt-3">
        <p className="text-sm text-slate-200 leading-relaxed">{term.body}</p>
      </div>
    </div>
  );
}
