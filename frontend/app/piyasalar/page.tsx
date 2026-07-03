import { Suspense } from 'react';
import { PiyasalarContent } from './piyasalar-content';

export default function PiyasalarPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Yükleniyor…</div>}>
      <PiyasalarContent />
    </Suspense>
  );
}
