import { Suspense } from 'react';
import { GrafikContent } from './grafik-content';

export default function GrafikPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Yükleniyor…</div>}>
      <GrafikContent />
    </Suspense>
  );
}
