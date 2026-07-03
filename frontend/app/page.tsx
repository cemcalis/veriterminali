import { MarketStatus } from '@/components/market-status';
import { Section } from '@/components/section';

export default function AnasayfaPage() {
  return (
    <div className="pb-4">
      <header className="px-3 pt-4">
        <h1 className="text-lg font-bold">Veri Terminali</h1>
        <p className="text-xs text-slate-500">Gerçek zamanlı piyasa verileri</p>
      </header>
      <MarketStatus />
      <Section title="Endeksler" category="index" />
      <Section title="Kripto Paralar" category="crypto" />
      <Section title="Forex" category="forex" />
      <Section title="Emtia" category="commodity" />
      <Section title="BIST" category="bist" />
      <Section title="ABD Hisseleri" category="us_stock" />
    </div>
  );
}
