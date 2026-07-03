import { Suspense } from 'react';
import { ScannerContent } from './scanner-content';

export default function TarayiciPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Yükleniyor…</div>}>
      <ScannerContent />
    </Suspense>
  );
}
