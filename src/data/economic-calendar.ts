/** Real official central-bank calendars, sourced directly from TCMB and
 * the Federal Reserve's own public pages (no scraping, no borrowed
 * credentials -- both banks publish their full-year meeting schedule as
 * plain public HTML). Unlike Sprint 3's BIST institutional data, this
 * data genuinely exists for free; it's just naturally low-frequency
 * (published a year or more in advance, doesn't move intraday), so a
 * yearly manual refresh is the honest cadence here -- the same pattern
 * already used for exchange holiday calendars in exchange-sessions.ts.
 *
 * Sources (fetched 2026-07-04):
 * - https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/duyurular/takvim
 * - https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
 */

export interface MacroEvent {
  date: string; // YYYY-MM-DD
  country: 'TR' | 'US';
  title: string;
  category: 'faiz_karari' | 'enflasyon_raporu' | 'finansal_istikrar_raporu' | 'fomc';
}

export const MACRO_CALENDAR: MacroEvent[] = [
  // TCMB 2026
  { date: '2026-01-22', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2026-02-12', country: 'TR', title: 'Enflasyon Raporu', category: 'enflasyon_raporu' },
  { date: '2026-03-12', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2026-04-22', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2026-05-14', country: 'TR', title: 'Enflasyon Raporu', category: 'enflasyon_raporu' },
  { date: '2026-05-22', country: 'TR', title: 'Finansal İstikrar Raporu', category: 'finansal_istikrar_raporu' },
  { date: '2026-06-11', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2026-07-23', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2026-08-13', country: 'TR', title: 'Enflasyon Raporu', category: 'enflasyon_raporu' },
  { date: '2026-09-10', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2026-10-22', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2026-11-12', country: 'TR', title: 'Enflasyon Raporu', category: 'enflasyon_raporu' },
  { date: '2026-11-27', country: 'TR', title: 'Finansal İstikrar Raporu', category: 'finansal_istikrar_raporu' },
  { date: '2026-12-10', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  // TCMB 2027 (partial, as published)
  { date: '2027-01-21', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2027-02-11', country: 'TR', title: 'Enflasyon Raporu', category: 'enflasyon_raporu' },
  { date: '2027-03-18', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2027-04-22', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },
  { date: '2027-05-13', country: 'TR', title: 'Enflasyon Raporu', category: 'enflasyon_raporu' },
  { date: '2027-05-28', country: 'TR', title: 'Finansal İstikrar Raporu', category: 'finansal_istikrar_raporu' },
  { date: '2027-06-10', country: 'TR', title: 'PPK Toplantı Kararı', category: 'faiz_karari' },

  // Fed FOMC 2026 (first day of each 2-day meeting)
  { date: '2026-01-27', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2026-03-17', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2026-04-28', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2026-06-16', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2026-07-28', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2026-09-15', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2026-10-27', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2026-12-08', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  // Fed FOMC 2027
  { date: '2027-01-26', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2027-03-16', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2027-04-27', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
  { date: '2027-06-08', country: 'US', title: 'FOMC Toplantısı', category: 'fomc' },
];
