export interface GlossaryTerm {
  slug: string;
  term: string;
  short: string;
  body: string;
}

/** Real, accurate educational content explaining the concepts this app
 * surfaces -- the reference bot hands users raw data with zero
 * explanation; this is the deliberate difference (roadmap Sprint 9). */
export const GLOSSARY: GlossaryTerm[] = [
  {
    slug: 'akd',
    term: 'Aracı Kurum Dağılımı (AKD)',
    short: 'Bir hissede hangi aracı kurumun ne kadar alım/satım yaptığının dökümü.',
    body: 'Aracı Kurum Dağılımı, belirli bir tarih aralığında bir sembolde işlem yapan aracı kurumların alım/satım hacimlerini ve net pozisyonlarını gösterir. Yatırımcılar bunu genellikle "büyük oyuncular ne yapıyor" sorusuna yanıt aramak için kullanır. Bu veri Borsa İstanbul tarafından yalnızca lisanslı veri sağlayıcılar (VERDA/BISTECH üyeleri, Foreks, Matriks vb.) üzerinden dağıtılır.',
  },
  {
    slug: 'derinlik',
    term: '25 Kademe Derinlik (Order Book)',
    short: 'Bir sembolün alış/satış emir defterinin en iyi 25 fiyat seviyesi.',
    body: 'Derinlik (order book), o an piyasada bekleyen alış ve satış emirlerinin fiyat ve miktar bazında sıralanmış halidir. 25 kademe derinlik, en iyi fiyattan başlayarak 25 seviyeye kadar bu emirleri gösterir ve kısa vadeli arz/talep dengesini anlamaya yardımcı olur. Gerçek zamanlı erişim yalnızca borsanın lisanslı veri yayın sistemleri üzerinden mümkündür.',
  },
  {
    slug: 'teorik-fiyat',
    term: 'Teorik (Endikatif) Fiyat',
    short: 'Açılış/kapanış müzayedesi sırasında borsanın hesapladığı denge fiyatı.',
    body: 'Borsa İstanbul, açılış (09:30) ve kapanış (18:00) seanslarında "tek fiyat" yöntemiyle çalışan bir müzayede uygular. Bu müzayede penceresinde toplanan emirlerin arz-talep dengesini en iyi karşılayan fiyata "teorik fiyat" denir ve müzayede bitene kadar dinamik olarak güncellenir.',
  },
  {
    slug: 'takas',
    term: 'Takas',
    short: 'İşlemin gerçek mülkiyet/para transferine dönüştüğü mutabakat süreci.',
    body: 'Borsada gerçekleşen bir alım/satım işlemi, işlem anında değil Takasbank üzerinden T+2 (işlem gününden 2 iş günü sonra) kesinleşir. Bu sürece "takas" denir. Takas verileri, bir sembolde hangi hacimde mutabakat gerçekleştiğini gösterir.',
  },
  {
    slug: 'rsi',
    term: 'RSI (Göreceli Güç Endeksi)',
    short: '0-100 arası bir momentum göstergesi; genelde 30 altı aşırı satım, 70 üstü aşırı alım kabul edilir.',
    body: 'RSI (Relative Strength Index), belirli bir periyottaki (genelde 14 gün) ortalama kazanç ve kayıpların oranından hesaplanır. Düşük değerler fiyatın kısa vadede aşırı satılmış, yüksek değerler aşırı alınmış olabileceğine işaret eder — tek başına alım/satım sinyali değildir.',
  },
  {
    slug: 'macd',
    term: 'MACD',
    short: 'İki hareketli ortalama arasındaki farkı izleyen bir trend/momentum göstergesi.',
    body: 'MACD (Moving Average Convergence Divergence), genellikle 12 ve 26 periyotluk üstel hareketli ortalamalar (EMA) arasındaki farktan hesaplanır. Bu farkın kendi 9 periyotluk EMA’sı "sinyal çizgisi" olarak kullanılır; MACD çizgisinin sinyal çizgisini kesmesi trend değişimi olarak yorumlanır.',
  },
  {
    slug: 'bollinger',
    term: 'Bollinger Bantları',
    short: 'Fiyatın etrafında oynaklığa göre genişleyen/daralan bir bant.',
    body: 'Bollinger Bantları, bir hareketli ortalama (genelde 20 periyot) ile bu ortalamanın standart sapmasının belirli bir katının eklenip çıkarılmasıyla oluşan üst ve alt bantlardan oluşur. Bantların daralması düşük oynaklığa, genişlemesi yüksek oynaklığa işaret eder.',
  },
  {
    slug: 'temettu',
    term: 'Temettü',
    short: 'Şirketin kârından pay sahiplerine dağıttığı nakit veya hisse ödemesi.',
    body: 'Şirketler, genel kurulda kararlaştırdıkları oranda kârlarını nakit veya bedelsiz hisse şeklinde ortaklarına dağıtabilir. Temettü ödemesi, "kayıt tarihi" (record date) itibarıyla hisseyi elinde bulunduran yatırımcılara yapılır.',
  },
  {
    slug: 'sermaye-artirimi',
    term: 'Sermaye Artırımı (Bedelli/Bedelsiz)',
    short: 'Şirketin çıkarılmış sermayesini artırması; bedelli ortaktan para ister, bedelsiz istemez.',
    body: 'Bedelli sermaye artırımında mevcut ortaklar belirli bir fiyattan yeni pay alma hakkına (rüçhan hakkı) sahip olur. Bedelsiz sermaye artırımında ise şirket iç kaynaklarını (yedek akçe, yeniden değerleme fonu vb.) sermayeye ekleyerek ortaklara karşılıksız yeni pay dağıtır.',
  },
  {
    slug: 'ppk',
    term: 'PPK (Para Politikası Kurulu)',
    short: 'TCMB’nin politika faizine karar veren kurulu.',
    body: 'Türkiye Cumhuriyet Merkez Bankası’nın Para Politikası Kurulu, önceden ilan edilmiş bir takvim çerçevesinde toplanarak politika faizini (1 haftalık repo faizi) belirler. Kararlar enflasyon, kur ve büyüme beklentilerini doğrudan etkiler.',
  },
  {
    slug: 'fomc',
    term: 'FOMC',
    short: 'ABD Merkez Bankası’nın (Fed) faiz kararı aldığı komite.',
    body: 'Federal Open Market Committee, ABD’nin kısa vadeli faiz oranlarına (federal funds rate) karar veren kuruldur. Yılda 8 kez toplanır ve kararları küresel piyasaları, özellikle gelişmekte olan ülke para birimlerini doğrudan etkiler.',
  },
  {
    slug: 'kap',
    term: 'KAP (Kamuyu Aydınlatma Platformu)',
    short: 'Halka açık şirketlerin yasal bildirim yaptığı resmi platform.',
    body: 'KAP, Sermaye Piyasası Kurulu düzenlemeleri gereği halka açık şirketlerin özel durum açıklamaları, finansal raporlar, genel kurul çağrıları gibi bilgileri kamuya duyurduğu resmi platformdur. Bu uygulamadaki "Haberler" ve "Kurumsal Aksiyonlar" bölümleri doğrudan KAP’tan beslenir.',
  },
];

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((g) => g.slug === slug);
}
