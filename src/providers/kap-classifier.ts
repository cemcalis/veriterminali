/** Rule-based classification of KAP disclosure titles into broad
 * categories a retail user actually cares about. Real Turkish keyword
 * matching against real KAP titles -- no ML needed for this first pass
 * (see roadmap Sprint 5.2, which explicitly scopes rule-based first). */

export type DisclosureCategory =
  | 'temettu'
  | 'sermaye_artirimi'
  | 'birlesme_devralma'
  | 'genel_kurul'
  | 'finansal_rapor'
  | 'spk_karari'
  | 'diger';

const RULES: [DisclosureCategory, RegExp][] = [
  ['temettu', /temett[uü]/i],
  ['sermaye_artirimi', /sermaye art[ıi]r[ıi]m|bedelli|bedelsiz/i],
  ['birlesme_devralma', /birle[şs]me|devralma|pay al[ıi]m|hisse devri/i],
  ['genel_kurul', /genel kurul/i],
  ['finansal_rapor', /finansal rapor|bilan[çc]o|faaliyet raporu/i],
  ['spk_karari', /spk|sermaye piyasas[ıi] kurulu/i],
];

export function classifyDisclosure(title: string): DisclosureCategory {
  for (const [category, pattern] of RULES) {
    if (pattern.test(title)) return category;
  }
  return 'diger';
}

export const DISCLOSURE_CATEGORY_LABELS_TR: Record<DisclosureCategory, string> = {
  temettu: 'Temettü',
  sermaye_artirimi: 'Sermaye Artırımı',
  birlesme_devralma: 'Birleşme/Devralma',
  genel_kurul: 'Genel Kurul',
  finansal_rapor: 'Finansal Rapor',
  spk_karari: 'SPK Kararı',
  diger: 'Diğer',
};
