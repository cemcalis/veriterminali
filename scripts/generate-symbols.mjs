// Generates src/symbols.ts and frontend/lib/symbols.ts from:
//  - a live Binance exchangeInfo/24hr snapshot (real, currently-traded USDT pairs)
//  - curated static catalogs for forex/commodity/bist/us_stock/etf/index
//
// Run with: node scripts/generate-symbols.mjs
// Re-running refreshes the crypto list against whatever is live on Binance today.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const EXCLUDE_LEVERAGED = /(UP|DOWN|BULL|BEAR)USDT$/;
const EXCLUDE_BASES = new Set(['USDC', 'FDUSD', 'TUSD', 'BUSD', 'USDP', 'DAI', 'EUR', 'EURI', 'GUSD', 'USD1', 'RLUSD', 'AEUR']);
const MAX_CRYPTO = 400;

async function fetchCryptoSymbols() {
  const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
  if (!res.ok) throw new Error(`Binance 24hr ticker fetch failed: HTTP ${res.status}`);
  const rows = await res.json();
  const usdt = rows.filter((r) => {
    if (!/^[A-Z0-9]+USDT$/.test(r.symbol)) return false;
    if (EXCLUDE_LEVERAGED.test(r.symbol)) return false;
    const base = r.symbol.slice(0, -4);
    if (EXCLUDE_BASES.has(base)) return false;
    if (Number.isNaN(parseFloat(r.quoteVolume))) return false;
    return true;
  });
  usdt.sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
  return usdt.slice(0, MAX_CRYPTO).map((r) => {
    const base = r.symbol.slice(0, -4);
    return {
      symbol: `BINANCE:${r.symbol}`,
      binanceSymbol: r.symbol,
      category: 'crypto',
      displayName: base,
      displayNameTr: base,
    };
  });
}

// --- Forex: majors, minors, exotics (real currency pairs) ---
const FOREX = [
  ['EURUSD', 'Euro / US Dollar', 'Euro / ABD Doları'],
  ['GBPUSD', 'British Pound / US Dollar', 'İngiliz Sterlini / ABD Doları'],
  ['USDJPY', 'US Dollar / Japanese Yen', 'ABD Doları / Japon Yeni'],
  ['USDCHF', 'US Dollar / Swiss Franc', 'ABD Doları / İsviçre Frangı'],
  ['AUDUSD', 'Australian Dollar / US Dollar', 'Avustralya Doları / ABD Doları'],
  ['USDCAD', 'US Dollar / Canadian Dollar', 'ABD Doları / Kanada Doları'],
  ['NZDUSD', 'New Zealand Dollar / US Dollar', 'Yeni Zelanda Doları / ABD Doları'],
  ['EURGBP', 'Euro / British Pound', 'Euro / İngiliz Sterlini'],
  ['EURJPY', 'Euro / Japanese Yen', 'Euro / Japon Yeni'],
  ['EURCHF', 'Euro / Swiss Franc', 'Euro / İsviçre Frangı'],
  ['GBPJPY', 'British Pound / Japanese Yen', 'İngiliz Sterlini / Japon Yeni'],
  ['AUDJPY', 'Australian Dollar / Japanese Yen', 'Avustralya Doları / Japon Yeni'],
  ['CHFJPY', 'Swiss Franc / Japanese Yen', 'İsviçre Frangı / Japon Yeni'],
  ['EURAUD', 'Euro / Australian Dollar', 'Euro / Avustralya Doları'],
  ['EURCAD', 'Euro / Canadian Dollar', 'Euro / Kanada Doları'],
  ['GBPCHF', 'British Pound / Swiss Franc', 'İngiliz Sterlini / İsviçre Frangı'],
  ['GBPAUD', 'British Pound / Australian Dollar', 'İngiliz Sterlini / Avustralya Doları'],
  ['GBPCAD', 'British Pound / Canadian Dollar', 'İngiliz Sterlini / Kanada Doları'],
  ['AUDCAD', 'Australian Dollar / Canadian Dollar', 'Avustralya Doları / Kanada Doları'],
  ['AUDCHF', 'Australian Dollar / Swiss Franc', 'Avustralya Doları / İsviçre Frangı'],
  ['AUDNZD', 'Australian Dollar / New Zealand Dollar', 'Avustralya Doları / Yeni Zelanda Doları'],
  ['NZDJPY', 'New Zealand Dollar / Japanese Yen', 'Yeni Zelanda Doları / Japon Yeni'],
  ['CADJPY', 'Canadian Dollar / Japanese Yen', 'Kanada Doları / Japon Yeni'],
  ['CADCHF', 'Canadian Dollar / Swiss Franc', 'Kanada Doları / İsviçre Frangı'],
  ['USDTRY', 'US Dollar / Turkish Lira', 'ABD Doları / Türk Lirası'],
  ['EURTRY', 'Euro / Turkish Lira', 'Euro / Türk Lirası'],
  ['GBPTRY', 'British Pound / Turkish Lira', 'İngiliz Sterlini / Türk Lirası'],
  ['USDZAR', 'US Dollar / South African Rand', 'ABD Doları / Güney Afrika Randı'],
  ['USDMXN', 'US Dollar / Mexican Peso', 'ABD Doları / Meksika Pezosu'],
  ['USDSEK', 'US Dollar / Swedish Krona', 'ABD Doları / İsveç Kronu'],
  ['USDNOK', 'US Dollar / Norwegian Krone', 'ABD Doları / Norveç Kronu'],
  ['USDDKK', 'US Dollar / Danish Krone', 'ABD Doları / Danimarka Kronu'],
  ['USDPLN', 'US Dollar / Polish Zloty', 'ABD Doları / Polonya Zlotisi'],
  ['USDHUF', 'US Dollar / Hungarian Forint', 'ABD Doları / Macar Forinti'],
  ['USDCZK', 'US Dollar / Czech Koruna', 'ABD Doları / Çek Korunası'],
  ['USDSGD', 'US Dollar / Singapore Dollar', 'ABD Doları / Singapur Doları'],
  ['USDHKD', 'US Dollar / Hong Kong Dollar', 'ABD Doları / Hong Kong Doları'],
  ['USDCNH', 'US Dollar / Chinese Yuan (Offshore)', 'ABD Doları / Çin Yuanı'],
  ['USDINR', 'US Dollar / Indian Rupee', 'ABD Doları / Hindistan Rupisi'],
  ['USDIDR', 'US Dollar / Indonesian Rupiah', 'ABD Doları / Endonezya Rupisi'],
  ['USDTHB', 'US Dollar / Thai Baht', 'ABD Doları / Tayland Bahtı'],
  ['USDBRL', 'US Dollar / Brazilian Real', 'ABD Doları / Brezilya Reali'],
  ['USDRUB', 'US Dollar / Russian Ruble', 'ABD Doları / Rus Rublesi'],
  ['USDILS', 'US Dollar / Israeli Shekel', 'ABD Doları / İsrail Şekeli'],
  ['USDSAR', 'US Dollar / Saudi Riyal', 'ABD Doları / Suudi Riyali'],
  ['USDAED', 'US Dollar / UAE Dirham', 'ABD Doları / BAE Dirhemi'],
  ['USDKRW', 'US Dollar / South Korean Won', 'ABD Doları / Güney Kore Wonu'],
  ['USDPHP', 'US Dollar / Philippine Peso', 'ABD Doları / Filipin Pezosu'],
  ['USDVND', 'US Dollar / Vietnamese Dong', 'ABD Doları / Vietnam Dongu'],
  ['USDEGP', 'US Dollar / Egyptian Pound', 'ABD Doları / Mısır Lirası'],
  ['USDCOP', 'US Dollar / Colombian Peso', 'ABD Doları / Kolombiya Pezosu'],
  ['USDARS', 'US Dollar / Argentine Peso', 'ABD Doları / Arjantin Pezosu'],
  ['USDCLP', 'US Dollar / Chilean Peso', 'ABD Doları / Şili Pezosu'],
  ['USDRON', 'US Dollar / Romanian Leu', 'ABD Doları / Romen Leyi'],
  ['USDKWD', 'US Dollar / Kuwaiti Dinar', 'ABD Doları / Kuveyt Dinarı'],
  ['USDQAR', 'US Dollar / Qatari Riyal', 'ABD Doları / Katar Riyali'],
].map(([code, en, tr]) => ({
  symbol: `FX:${code}`,
  yahooSymbol: `${code}=X`,
  category: 'forex',
  displayName: en,
  displayNameTr: tr,
}));

// --- Commodities: metals, energy, agriculture (real futures/spot instruments) ---
const COMMODITIES = [
  ['XAUUSD', 'OANDA:XAUUSD', 'XAUUSD=X', 'Gold Spot', 'Altın Spot'],
  ['XAGUSD', 'OANDA:XAGUSD', 'XAGUSD=X', 'Silver Spot', 'Gümüş Spot'],
  ['XPTUSD', 'OANDA:XPTUSD', 'XPTUSD=X', 'Platinum Spot', 'Platin Spot'],
  ['XPDUSD', 'OANDA:XPDUSD', 'XPDUSD=X', 'Palladium Spot', 'Paladyum Spot'],
  ['GOLD', 'TVC:GOLD', 'GC=F', 'Gold Futures', 'Altın Vadeli'],
  ['SILVER', 'TVC:SILVER', 'SI=F', 'Silver Futures', 'Gümüş Vadeli'],
  ['COPPER', 'TVC:COPPER', 'HG=F', 'Copper Futures', 'Bakır Vadeli'],
  ['USOIL', 'TVC:USOIL', 'CL=F', 'WTI Crude Oil', 'WTI Ham Petrol'],
  ['BRENT', 'BLACKBULL:BRENT', 'BZ=F', 'Brent Crude Oil', 'Brent Ham Petrol'],
  ['NATGAS', 'NATGAS', 'NG=F', 'Natural Gas', 'Doğal Gaz'],
  ['GASOLINE', 'TVC:GASOLINE', 'RB=F', 'RBOB Gasoline', 'Benzin Vadeli'],
  ['HEATOIL', 'TVC:HEATOIL', 'HO=F', 'Heating Oil', 'Isıtma Yağı'],
  ['CORN', 'CBOT:ZC1!', 'ZC=F', 'Corn Futures', 'Mısır Vadeli'],
  ['WHEAT', 'CBOT:ZW1!', 'ZW=F', 'Wheat Futures', 'Buğday Vadeli'],
  ['SOYBEAN', 'CBOT:ZS1!', 'ZS=F', 'Soybean Futures', 'Soya Fasulyesi Vadeli'],
  ['COFFEE', 'ICEUS:KC1!', 'KC=F', 'Coffee Futures', 'Kahve Vadeli'],
  ['SUGAR', 'ICEUS:SB1!', 'SB=F', 'Sugar Futures', 'Şeker Vadeli'],
  ['COCOA', 'ICEUS:CC1!', 'CC=F', 'Cocoa Futures', 'Kakao Vadeli'],
  ['COTTON', 'ICEUS:CT1!', 'CT=F', 'Cotton Futures', 'Pamuk Vadeli'],
  ['OATS', 'CBOT:ZO1!', 'ZO=F', 'Oats Futures', 'Yulaf Vadeli'],
  ['LUMBER', 'CME:LBR1!', 'LBS=F', 'Lumber Futures', 'Kereste Vadeli'],
  ['LIVECATTLE', 'CME:LE1!', 'LE=F', 'Live Cattle Futures', 'Canlı Sığır Vadeli'],
  ['LEANHOGS', 'CME:HE1!', 'HE=F', 'Lean Hogs Futures', 'Domuz Vadeli'],
].map(([code, tvSym, ySym, en, tr]) => ({
  symbol: tvSym,
  yahooSymbol: ySym,
  category: 'commodity',
  displayName: en,
  displayNameTr: tr,
}));

// --- Global indices (real, well-known benchmark indices) ---
const INDICES = [
  ['SPX', 'SP:SPX', '^GSPC', 'S&P 500', 'S&P 500'],
  ['NDX', 'NASDAQ:NDX', '^NDX', 'Nasdaq 100', 'Nasdaq 100'],
  ['DJI', 'DJ:DJI', '^DJI', 'Dow Jones Industrial Average', 'Dow Jones Sanayi Endeksi'],
  ['RUT', 'RUSSELL:RUT', '^RUT', 'Russell 2000', 'Russell 2000'],
  ['VIX', 'CBOE:VIX', '^VIX', 'CBOE Volatility Index', 'CBOE Volatilite Endeksi'],
  ['DXY', 'TVC:DXY', 'DX-Y.NYB', 'US Dollar Index', 'ABD Doları Endeksi'],
  ['UKX', 'FTSE:UKX', '^FTSE', 'FTSE 100', 'FTSE 100'],
  ['DAX', 'XETR:DAX', '^GDAXI', 'DAX 40', 'DAX 40'],
  ['CAC', 'EURONEXT:PX1', '^FCHI', 'CAC 40', 'CAC 40'],
  ['IBEX', 'BME:IBC', '^IBEX', 'IBEX 35', 'IBEX 35'],
  ['FTSEMIB', 'MIL:FTSEMIB', 'FTSEMIB.MI', 'FTSE MIB', 'FTSE MIB'],
  ['SMI', 'SIX:SMI', '^SSMI', 'Swiss Market Index', 'İsviçre Piyasa Endeksi'],
  ['AEX', 'EURONEXT:AEX', '^AEX', 'AEX Index', 'AEX Endeksi'],
  ['STOXX50E', 'INDEX:STOXX50E', '^STOXX50E', 'Euro Stoxx 50', 'Euro Stoxx 50'],
  ['N225', 'TVC:NI225', '^N225', 'Nikkei 225', 'Nikkei 225'],
  ['HSI', 'HSI:HSI', '^HSI', 'Hang Seng Index', 'Hang Seng Endeksi'],
  ['SHCOMP', 'SSE:000001', '000001.SS', 'Shanghai Composite', 'Şangay Bileşik Endeksi'],
  ['KOSPI', 'KRX:KOSPI', '^KS11', 'KOSPI Composite', 'KOSPI Bileşik Endeksi'],
  ['SENSEX', 'BSE:SENSEX', '^BSESN', 'BSE Sensex', 'BSE Sensex'],
  ['NIFTY', 'NSE:NIFTY', '^NSEI', 'Nifty 50', 'Nifty 50'],
  ['ASX200', 'ASX:XJO', '^AXJO', 'S&P/ASX 200', 'S&P/ASX 200'],
  ['TSX', 'TSX:TSX', '^GSPTSE', 'S&P/TSX Composite', 'S&P/TSX Bileşik Endeksi'],
  ['BOVESPA', 'BMFBOVESPA:IBOV', '^BVSP', 'Bovespa Index', 'Bovespa Endeksi'],
  // BIST 100 is intentionally not duplicated here — it already exists
  // under the `bist` category (BIST_INDICES) with the same symbol id.
].map(([code, tvSym, ySym, en, tr]) => ({
  symbol: tvSym,
  yahooSymbol: ySym,
  category: 'index',
  displayName: en,
  displayNameTr: tr,
}));

// --- Popular ETFs (real, widely traded US-listed funds) ---
const ETFS = [
  ['SPY', 'SPDR S&P 500 ETF Trust'], ['VOO', 'Vanguard S&P 500 ETF'], ['IVV', 'iShares Core S&P 500 ETF'],
  ['QQQ', 'Invesco QQQ Trust (Nasdaq 100)'], ['DIA', 'SPDR Dow Jones Industrial Average ETF'],
  ['IWM', 'iShares Russell 2000 ETF'], ['VTI', 'Vanguard Total Stock Market ETF'],
  ['VEA', 'Vanguard FTSE Developed Markets ETF'], ['VWO', 'Vanguard FTSE Emerging Markets ETF'],
  ['EFA', 'iShares MSCI EAFE ETF'], ['EEM', 'iShares MSCI Emerging Markets ETF'],
  ['GLD', 'SPDR Gold Shares'], ['SLV', 'iShares Silver Trust'], ['IAU', 'iShares Gold Trust'],
  ['USO', 'United States Oil Fund'], ['UNG', 'United States Natural Gas Fund'],
  ['TLT', 'iShares 20+ Year Treasury Bond ETF'], ['IEF', 'iShares 7-10 Year Treasury Bond ETF'],
  ['SHY', 'iShares 1-3 Year Treasury Bond ETF'], ['BND', 'Vanguard Total Bond Market ETF'],
  ['AGG', 'iShares Core U.S. Aggregate Bond ETF'], ['LQD', 'iShares iBoxx Investment Grade Corp Bond ETF'],
  ['HYG', 'iShares iBoxx High Yield Corp Bond ETF'], ['XLF', 'Financial Select Sector SPDR Fund'],
  ['XLK', 'Technology Select Sector SPDR Fund'], ['XLE', 'Energy Select Sector SPDR Fund'],
  ['XLV', 'Health Care Select Sector SPDR Fund'], ['XLY', 'Consumer Discretionary Select Sector SPDR Fund'],
  ['XLP', 'Consumer Staples Select Sector SPDR Fund'], ['XLI', 'Industrial Select Sector SPDR Fund'],
  ['XLB', 'Materials Select Sector SPDR Fund'], ['XLU', 'Utilities Select Sector SPDR Fund'],
  ['XLRE', 'Real Estate Select Sector SPDR Fund'], ['XLC', 'Communication Services Select Sector SPDR Fund'],
  ['SMH', 'VanEck Semiconductor ETF'], ['SOXX', 'iShares Semiconductor ETF'],
  ['ARKK', 'ARK Innovation ETF'], ['VIG', 'Vanguard Dividend Appreciation ETF'],
  ['VYM', 'Vanguard High Dividend Yield ETF'], ['SCHD', 'Schwab U.S. Dividend Equity ETF'],
  ['VNQ', 'Vanguard Real Estate ETF'], ['GDX', 'VanEck Gold Miners ETF'], ['GDXJ', 'VanEck Junior Gold Miners ETF'],
  ['XOP', 'SPDR S&P Oil & Gas Exploration & Production ETF'], ['KRE', 'SPDR S&P Regional Banking ETF'],
  ['IBB', 'iShares Biotechnology ETF'], ['XBI', 'SPDR S&P Biotech ETF'],
  ['MOO', 'VanEck Agribusiness ETF'], ['ITA', 'iShares U.S. Aerospace & Defense ETF'],
  ['JETS', 'U.S. Global Jets ETF'], ['TAN', 'Invesco Solar ETF'], ['ICLN', 'iShares Global Clean Energy ETF'],
  ['BITO', 'ProShares Bitcoin Strategy ETF'], ['EWZ', 'iShares MSCI Brazil ETF'],
  ['EWJ', 'iShares MSCI Japan ETF'], ['FXI', 'iShares China Large-Cap ETF'], ['MCHI', 'iShares MSCI China ETF'],
  ['EWG', 'iShares MSCI Germany ETF'], ['EWU', 'iShares MSCI United Kingdom ETF'],
  ['EWC', 'iShares MSCI Canada ETF'], ['EWA', 'iShares MSCI Australia ETF'], ['INDA', 'iShares MSCI India ETF'],
  ['TQQQ', 'ProShares UltraPro QQQ'], ['SQQQ', 'ProShares UltraPro Short QQQ'],
  ['SPXL', 'Direxion Daily S&P 500 Bull 3X Shares'], ['SPXS', 'Direxion Daily S&P 500 Bear 3X Shares'],
  ['VXX', 'iPath Series B S&P 500 VIX Short-Term Futures ETN'],
].map(([sym, name]) => ({
  symbol: sym,
  yahooSymbol: sym,
  category: 'etf',
  displayName: name,
  displayNameTr: name,
}));

// --- BIST: Turkish stocks & sector indices (real BIST-listed tickers) ---
const BIST_INDICES = [
  ['XU100', 'BIST 100'], ['XU030', 'BIST 30'], ['XU050', 'BIST 50'], ['XUTUM', 'BIST TÜM'],
  ['XBANK', 'BIST Bankacılık'], ['XUSIN', 'BIST Sınai'], ['XUMAL', 'BIST Mali'], ['XULAS', 'BIST Ulaştırma'],
  ['XHOLD', 'BIST Holding ve Yatırım'], ['XGIDA', 'BIST Gıda İçecek'], ['XTEKS', 'BIST Tekstil Deri'],
  ['XKMYA', 'BIST Kimya Petrol Plastik'], ['XMESY', 'BIST Metal Eşya Makine'], ['XELKT', 'BIST Elektrik'],
  ['XINSA', 'BIST İnşaat'], ['XTRZM', 'BIST Turizm'], ['XILTM', 'BIST İletişim'], ['XSGRT', 'BIST Sigorta'],
  ['XTAST', 'BIST Taş Toprak'],
].map(([code, name]) => ({ symbol: `BIST:${code}`, yahooSymbol: `${code}.IS`, category: 'bist', displayName: name, displayNameTr: name }));

const BIST_STOCKS = [
  ['THYAO', 'Türk Hava Yolları'], ['ASELS', 'Aselsan'], ['KCHOL', 'Koç Holding'], ['SISE', 'Şişecam'],
  ['EREGL', 'Ereğli Demir Çelik'], ['BIMAS', 'BİM Mağazalar'], ['TUPRS', 'Tüpraş'], ['SAHOL', 'Sabancı Holding'],
  ['GARAN', 'Garanti BBVA'], ['AKBNK', 'Akbank'], ['ISCTR', 'İş Bankası (C)'], ['YKBNK', 'Yapı Kredi Bankası'],
  ['VAKBN', 'VakıfBank'], ['HALKB', 'Halkbank'], ['TCELL', 'Turkcell'], ['TTKOM', 'Türk Telekom'],
  ['PETKM', 'Petkim'], ['KOZAL', 'Koza Altın'], ['KOZAA', 'Koza Madencilik'], ['PGSUS', 'Pegasus'],
  ['TAVHL', 'TAV Havalimanları'], ['DOHOL', 'Doğan Holding'], ['ENKAI', 'Enka İnşaat'], ['FROTO', 'Ford Otosan'],
  ['TOASO', 'Tofaş Oto'], ['ARCLK', 'Arçelik'], ['VESTL', 'Vestel'], ['OTKAR', 'Otokar'],
  ['KONTR', 'Kontrolmatik'], ['ASTOR', 'Astor Enerji'], ['ALARK', 'Alarko Holding'], ['AEFES', 'Anadolu Efes'],
  ['CCOLA', 'Coca-Cola İçecek'], ['ULKER', 'Ülker Bisküvi'], ['MGROS', 'Migros'], ['SOKM', 'Şok Marketler'],
  ['CIMSA', 'Çimsa'], ['AKCNS', 'Akçansa'], ['OYAKC', 'OYAK Çimento'], ['BUCIM', 'Bursa Çimento'],
  ['KRDMD', 'Kardemir (D)'], ['ISDMR', 'İskenderun Demir Çelik'], ['EGEEN', 'Ege Endüstri'],
  ['TSKB', 'TSKB'], ['ALBRK', 'Albaraka Türk'], ['SKBNK', 'Şekerbank'], ['ICBCT', 'ICBC Turkey Bank'],
  ['GUBRF', 'Gübre Fabrikaları'], ['BAGFS', 'Bagfaş'], ['ALKIM', 'Alkim Kimya'], ['HEKTS', 'Hektaş'],
  ['SASA', 'Sasa Polyester'], ['KORDS', 'Kordsa'], ['BRISA', 'Brisa'], ['GOODY', 'Goodyear'],
  ['DOAS', 'Doğuş Otomotiv'], ['KARSN', 'Karsan Otomotiv'], ['TTRAK', 'Türk Traktör'], ['CEMTS', 'Çemtaş'],
  ['ENJSA', 'Enerjisa'], ['AKSEN', 'Aksa Enerji'], ['AYDEM', 'Aydem Enerji'], ['ZOREN', 'Zorlu Enerji'],
  ['ODAS', 'Odaş Elektrik'], ['AKSA', 'Aksa Akrilik'], ['SARKY', 'Sarkuysan'], ['KUTPO', 'Kütahya Porselen'],
  ['ANACM', 'Anadolu Cam'], ['SISE', 'Şişecam'], ['TRKCM', 'Trakya Cam'], ['DEVA', 'Deva Holding'],
  ['SELEC', 'Selçuk Ecza'], ['ECILC', 'Eczacıbaşı İlaç'], ['ECZYT', 'Eczacıbaşı Yatırım'],
  ['NTHOL', 'Net Holding'], ['NETAS', 'Netaş Telekom'], ['LOGO', 'Logo Yazılım'], ['LINK', 'Link Bilgisayar'],
  ['KAREL', 'Karel Elektronik'], ['ARENA', 'Arena Bilgisayar'], ['ALCTL', 'Alcatel Lucent Teletaş'],
  ['INDES', 'İndeks Bilgisayar'], ['DESPC', 'Despec Bilgisayar'], ['MIATK', 'Mia Teknoloji'],
  ['SMRTG', 'Smart Güneş Enerjisi'], ['CWENE', 'CW Enerji'], ['BIOEN', 'Biotrend Enerji'],
  ['GESAN', 'Girişim Elektrik'], ['MAKTK', 'Makina Takım'], ['ARSAN', 'Arsan Tekstil'],
  ['YATAS', 'Yataş'], ['KLMSN', 'Klimasan'], ['VESBE', 'Vestel Beyaz Eşya'], ['EMKEL', 'Emek Elektrik'],
  ['MMCAS', 'MMC Sanayi'], ['CELHA', 'Çelik Halat'], ['IZMDC', 'İzmir Demir Çelik'],
  ['BURCE', 'Burçelik'], ['BURVA', 'Burçelik Vana'], ['KATMR', 'Katmerciler'], ['FROTO', 'Ford Otosan'],
  ['ANSGR', 'Anadolu Sigorta'], ['AGESA', 'AgeSA Hayat Emeklilik'], ['TURSG', 'Türkiye Sigorta'],
  ['RAYSG', 'Ray Sigorta'], ['AKGRT', 'Aksigorta'], ['GARFA', 'Garanti Faktoring'],
  ['ISGYO', 'İş GYO'], ['EKGYO', 'Emlak Konut GYO'], ['SNGYO', 'Sinpaş GYO'], ['TRGYO', 'Torunlar GYO'],
  ['HLGYO', 'Halk GYO'], ['VKGYO', 'Vakıf GYO'], ['AKFGY', 'Akfen GYO'], ['KLGYO', 'Kiler GYO'],
  ['NUGYO', 'Nurol GYO'], ['OZKGY', 'Özak GYO'], ['PEGYO', 'Pera GYO'], ['RYGYO', 'Reysaş GYO'],
  ['SAYAS', 'Sayaş'], ['MPARK', 'MLP Sağlık'], ['LKMNH', 'Lokman Hekim'], ['MEDTR', 'Medya Turizm'],
  ['BJKAS', 'Beşiktaş Futbol'], ['GSRAY', 'Galatasaray'], ['FENER', 'Fenerbahçe'], ['TSPOR', 'Trabzonspor'],
  ['MAVI', 'Mavi Giyim'], ['DESA', 'Desa Deri'], ['KRTEK', 'Karsu Tekstil'], ['YUNSA', 'Yünsa'],
  ['BOSSA', 'Bossa'], ['SNPAM', 'Sönmez Pamuklu'], ['MNDRS', 'Menderes Tekstil'], ['DAGI', 'Dagi Giyim'],
  ['ADEL', 'Adel Kalemcilik'], ['KENT', 'Kent Gıda'], ['TATGD', 'Tat Gıda'], ['PINSU', 'Pınar Su'],
  ['PNSUT', 'Pınar Süt'], ['PENGD', 'Penguen Gıda'], ['BANVT', 'Banvit'], ['ALYAG', 'Altınyağ'],
  ['KRVGD', 'Kervan Gıda'], ['CRFSA', 'Carrefoursa'], ['BIZIM', 'Bizim Toptan'], ['VBTYZ', 'Vakıf Girişim'],
  ['HATSN', 'Hatsan'], ['BFREN', 'Bosch Fren Sistemleri'], ['DITAS', 'Ditaş Doğan'],
  ['JANTS', 'Jantsa'], ['EGGUB', 'Ege Gübre'], ['GOLTS', 'Göltaş Çimento'], ['NIBAS', 'Niğbaş'],
  ['CMENT', 'Çimentaş'], ['KONYA', 'Konya Çimento'], ['MRDIN', 'Mardin Çimento'], ['UNYEC', 'Ünye Çimento'],
  ['MARTI', 'Martı Otel'], ['AYCES', 'Altınyunus Çeşme'], ['UTPYA', 'Utopya Turizm'],
  ['KLKIM', 'Kalekim'], ['KAPLM', 'Kaplamin'], ['METRO', 'Metro Ticaret'], ['MERIT', 'Merit Turizm'],
  ['MRSHL', 'Marshall Boya'], ['DYOBY', 'DYO Boya'], ['POLTK', 'Polisan Holding'], ['BRKO', 'Birko'],
  ['GEDIK', 'Gedik Yatırım'], ['ISMEN', 'İş Yatırım'], ['OYAYO', 'OYAK Yatırım'], ['YAYLA', 'Yayla Enerji'],
  ['GLYHO', 'Global Yatırım Holding'], ['GSDHO', 'GSD Holding'], ['GLRYH', 'Güler Yatırım Holding'],
  ['METUR', 'Metemtur Otelcilik'], ['ALFAS', 'Alfa Solar Enerji'], ['CANTE', 'Çan2 Termik'],
  ['BEYAZ', 'Beyaz Filo'], ['REEDR', 'Reeder Teknoloji'], ['EUPWR', 'Europower Enerji'],
].map(([code, name]) => ({ symbol: `BIST:${code}`, yahooSymbol: `${code}.IS`, category: 'bist', displayName: name, displayNameTr: name }));

// dedupe BIST stocks by symbol (a couple of the source names repeat, e.g. SISE / FROTO)
const seenBist = new Set();
const BIST = [...BIST_INDICES, ...BIST_STOCKS].filter((s) => (seenBist.has(s.symbol) ? false : (seenBist.add(s.symbol), true)));

// --- US stocks: S&P 500 constituents (real, currently-listed large caps) ---
const US_STOCKS_RAW = `AAPL Apple|MSFT Microsoft|NVDA NVIDIA|AMZN Amazon|GOOGL Alphabet (A)|GOOG Alphabet (C)|META Meta Platforms|BRK.B Berkshire Hathaway|AVGO Broadcom|TSLA Tesla|LLY Eli Lilly|JPM JPMorgan Chase|V Visa|UNH UnitedHealth|XOM ExxonMobil|MA Mastercard|COST Costco|HD Home Depot|PG Procter & Gamble|JNJ Johnson & Johnson|NFLX Netflix|BAC Bank of America|CRM Salesforce|ABBV AbbVie|MRK Merck|KO Coca-Cola|CVX Chevron|AMD Advanced Micro Devices|PEP PepsiCo|ORCL Oracle|ADBE Adobe|TMO Thermo Fisher Scientific|WMT Walmart|LIN Linde|MCD McDonald's|CSCO Cisco|ACN Accenture|ABT Abbott Laboratories|DHR Danaher|WFC Wells Fargo|TXN Texas Instruments|GE General Electric|PM Philip Morris International|IBM IBM|CAT Caterpillar|VZ Verizon|INTU Intuit|NOW ServiceNow|AMAT Applied Materials|NEE NextEra Energy|CMCSA Comcast|ISRG Intuitive Surgical|AXP American Express|PFE Pfizer|UNP Union Pacific|DIS Walt Disney|QCOM Qualcomm|RTX RTX Corporation|SPGI S&P Global|LOW Lowe's|HON Honeywell|AMGN Amgen|BKNG Booking Holdings|COP ConocoPhillips|UPS United Parcel Service|T AT&T|BA Boeing|ELV Elevance Health|SYK Stryker|MS Morgan Stanley|BLK BlackRock|GS Goldman Sachs|MDT Medtronic|LMT Lockheed Martin|SBUX Starbucks|ADI Analog Devices|PLD Prologis|CB Chubb|TJX TJX Companies|GILD Gilead Sciences|MMC Marsh McLennan|VRTX Vertex Pharmaceuticals|C Citigroup|SCHW Charles Schwab|ETN Eaton|ADP Automatic Data Processing|CI Cigna|MO Altria|BSX Boston Scientific|REGN Regeneron Pharmaceuticals|SO Southern Company|ZTS Zoetis|PGR Progressive|FI Fiserv|DUK Duke Energy|EQIX Equinix|CME CME Group|MU Micron Technology|APH Amphenol|SHW Sherwin-Williams|AON Aon|ITW Illinois Tool Works|CL Colgate-Palmolive|TGT Target|CSX CSX Corporation|WM Waste Management|PNC PNC Financial|MCK McKesson|USB US Bancorp|NOC Northrop Grumman|CDNS Cadence Design Systems|EOG EOG Resources|FDX FedEx|MPC Marathon Petroleum|EMR Emerson Electric|SNPS Synopsys|APD Air Products|ICE Intercontinental Exchange|CMG Chipotle Mexican Grill|NSC Norfolk Southern|MAR Marriott International|ORLY O'Reilly Automotive|GD General Dynamics|ROP Roper Technologies|PXD Pioneer Natural Resources|PSA Public Storage|FCX Freeport-McMoRan|F Ford Motor|GM General Motors|OXY Occidental Petroleum|AJG Arthur J. Gallagher|TFC Truist Financial|AZO AutoZone|MSI Motorola Solutions|SRE Sempra Energy|TT Trane Technologies|CARR Carrier Global|ANET Arista Networks|HUM Humana|NXPI NXP Semiconductors|AEP American Electric Power|MET MetLife|PSX Phillips 66|ADM Archer-Daniels-Midland|WELL Welltower|DXCM Dexcom|PCAR Paccar|KLAC KLA Corporation|CTAS Cintas|D Dominion Energy|MCHP Microchip Technology|EW Edwards Lifesciences|COF Capital One|AIG American International Group|ROST Ross Stores|A Agilent Technologies|LHX L3Harris Technologies|MNST Monster Beverage|IQV IQVIA Holdings|CPRT Copart|SPG Simon Property Group|HES Hess Corporation|EXC Exelon|KMB Kimberly-Clark|PAYX Paychex|AFL Aflac|DOW Dow Inc|GIS General Mills|IDXX IDEXX Laboratories|BK BNY Mellon|OTIS Otis Worldwide|MSCI MSCI Inc|SYY Sysco|CTVA Corteva|CHTR Charter Communications|BIIB Biogen|VLO Valero Energy|ODFL Old Dominion Freight Line|WMB Williams Companies|HAL Halliburton|KMI Kinder Morgan|YUM Yum! Brands|PRU Prudential Financial|ALL Allstate|TEL TE Connectivity|CMI Cummins|DD DuPont|EA Electronic Arts|DVN Devon Energy|RSG Republic Services|GWW W.W. Grainger|NUE Nucor|ON ON Semiconductor|EL Estee Lauder|VRSK Verisk Analytics|ACGL Arch Capital Group|CTSH Cognizant Technology|ED Consolidated Edison|FTNT Fortinet|FAST Fastenal|HSY Hershey|XEL Xcel Energy|PEG Public Service Enterprise|GLW Corning|ROK Rockwell Automation|AMP Ameriprise Financial|PPG PPG Industries|APTV Aptiv|LEN Lennar|DLR Digital Realty Trust|WEC WEC Energy|KDP Keurig Dr Pepper|ANSS Ansys|KR Kroger|ES Eversource Energy|BKR Baker Hughes|ZBH Zimmer Biomet|VMC Vulcan Materials|DFS Discover Financial|MTD Mettler-Toledo|MLM Martin Marietta Materials|EIX Edison International|CDW CDW Corporation|FANG Diamondback Energy|TSCO Tractor Supply|WBD Warner Bros Discovery|AWK American Water Works|CBRE CBRE Group|HIG Hartford Financial|EFX Equifax|IT Gartner|RMD ResMed|WY Weyerhaeuser|GPN Global Payments|CAH Cardinal Health|STZ Constellation Brands|ULTA Ulta Beauty|GEHC GE HealthCare|ILMN Illumina|NDAQ Nasdaq Inc|DAL Delta Air Lines|CNC Centene|ETR Entergy|LYB LyondellBasell|VICI VICI Properties|LVS Las Vegas Sands|ROL Rollins|HPQ HP Inc|ARE Alexandria Real Estate|IRM Iron Mountain|K Kellanova|PCG PG&E|EBAY eBay|FE FirstEnergy|FITB Fifth Third Bancorp|WTW Willis Towers Watson|DHI D.R. Horton|MPWR Monolithic Power Systems|HPE Hewlett Packard Enterprise|NVR NVR Inc|RJF Raymond James|TDY Teledyne Technologies|VLTO Veralto|EXR Extra Space Storage|CHD Church & Dwight|LUV Southwest Airlines|CINF Cincinnati Financial|SBAC SBA Communications|MKC McCormick & Company|FSLR First Solar|STE Steris|BR Broadridge Financial|STT State Street|SYF Synchrony Financial|GPC Genuine Parts|EQR Equity Residential|TROW T. Rowe Price|CTRA Coterra Energy|AVB AvalonBay Communities|OKE ONEOK|HBAN Huntington Bancshares|DOV Dover Corporation|NTRS Northern Trust|EXPE Expedia Group|WAT Waters Corporation|WST West Pharmaceutical Services|DTE DTE Energy|PPL PPL Corporation|COO Cooper Companies|PHM PulteGroup|TYL Tyler Technologies|VTR Ventas|CMS CMS Energy|LDOS Leidos Holdings|AEE Ameren|NTAP NetApp|FDS FactSet Research|BALL Ball Corporation|PFG Principal Financial|MOH Molina Healthcare|CFG Citizens Financial|MRO Marathon Oil|TXT Textron|ATO Atmos Energy|LH Labcorp|J Jacobs Solutions|DGX Quest Diagnostics|CBOE Cboe Global Markets|IEX IDEX Corporation|CLX Clorox|SWKS Skyworks Solutions|POOL Pool Corporation|NDSN Nordson|ESS Essex Property Trust|MAA Mid-America Apartment|BAX Baxter International|MAS Masco|JBHT J.B. Hunt Transport|AKAM Akamai Technologies|CE Celanese|IFF International Flavors|ALGN Align Technology|INVH Invitation Homes|SJM J.M. Smucker|TER Teradyne|HRL Hormel Foods|EVRG Evergy|LNT Alliant Energy|PKI Revvity|NI NiSource|WRB W.R. Berkley|EPAM EPAM Systems|APA APA Corporation|HOLX Hologic|CAG Conagra Brands|BBY Best Buy|SNA Snap-on|ZBRA Zebra Technologies|TRMB Trimble|SWK Stanley Black & Decker|JKHY Jack Henry & Associates|UDR UDR Inc|KEY KeyCorp|CPT Camden Property Trust|CF CF Industries|PNR Pentair|EMN Eastman Chemical|BXP BXP Inc|NRG NRG Energy|GEN Gen Digital|PAYC Paycom Software|MGM MGM Resorts|CRL Charles River Laboratories|WBA Walgreens Boots Alliance|AES AES Corporation|FFIV F5 Inc|WYNN Wynn Resorts|RCL Royal Caribbean|CCL Carnival Corporation|RL Ralph Lauren|LKQ LKQ Corporation|MTCH Match Group|MOS Mosaic Company|HST Host Hotels & Resorts|IPG Interpublic Group|CTLT Catalent|BWA BorgWarner|NWSA News Corp|FOXA Fox Corporation|PARA Paramount Global|DVA DaVita|AAL American Airlines|WHR Whirlpool|GNRC Generac Holdings|HAS Hasbro|BEN Franklin Resources|IVZ Invesco|NCLH Norwegian Cruise Line|UHS Universal Health Services|VFC VF Corporation|ALB Albemarle`;

const US_STOCKS = US_STOCKS_RAW.split('|').map((entry) => {
  const [code, ...nameParts] = entry.split(' ');
  const name = nameParts.join(' ');
  return {
    symbol: code,
    yahooSymbol: code,
    category: 'us_stock',
    displayName: name,
    displayNameTr: name,
  };
});

const CHUNK_SIZE = 80;

// TypeScript's checker chokes ("union type too complex to represent") on
// a single object-literal array with 1000+ entries typed against an
// interface with optional/union fields. Splitting into many smaller
// `const` chunks (each individually cheap to check) and concatenating
// keeps compile time trivial while producing the exact same runtime
// array.
function renderCatalog(entries, varPrefix) {
  const chunkNames = [];
  const chunks = [];
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const chunkName = `${varPrefix}_${chunkNames.length}`;
    chunkNames.push(chunkName);
    const lines = chunk.map((s) => {
      const parts = [`symbol: ${JSON.stringify(s.symbol)}`];
      if (s.binanceSymbol) parts.push(`binanceSymbol: ${JSON.stringify(s.binanceSymbol)}`);
      if (s.yahooSymbol) parts.push(`yahooSymbol: ${JSON.stringify(s.yahooSymbol)}`);
      parts.push(`category: ${JSON.stringify(s.category)}`);
      parts.push(`displayName: ${JSON.stringify(s.displayName)}`);
      parts.push(`displayNameTr: ${JSON.stringify(s.displayNameTr)}`);
      return `  { ${parts.join(', ')} },`;
    });
    chunks.push(`const ${chunkName}: SymbolDef[] = [\n${lines.join('\n')}\n];`);
  }
  return { declarations: chunks.join('\n\n'), combineExpr: chunkNames.join(', ') };
}

function backendFile(catalog, total) {
  return `import type { MarketCategory } from './providers/market-provider.interface.js';

// Auto-generated by scripts/generate-symbols.mjs — do not hand-edit the
// SYMBOL_CATALOG array. Crypto entries are pulled live from Binance
// exchangeInfo/24hr at generation time (top ${MAX_CRYPTO} USDT pairs by
// volume); all other categories are curated real-world static catalogs.
// Total symbols at last generation: ${total}.

export interface SymbolDef {
  /** canonical id used across the app and as the TradingView-adapter symbol */
  symbol: string;
  /** symbol as used by Binance (crypto only) */
  binanceSymbol?: string;
  /** symbol as used by Yahoo Finance fallback */
  yahooSymbol?: string;
  category: MarketCategory;
  displayName: string;
  displayNameTr: string;
}

${catalog.declarations}

export const SYMBOL_CATALOG: SymbolDef[] = [${catalog.combineExpr}].flat();

export function findSymbol(symbol: string): SymbolDef | undefined {
  return SYMBOL_CATALOG.find((s) => s.symbol === symbol);
}

export function symbolsByCategory(category: MarketCategory): SymbolDef[] {
  return SYMBOL_CATALOG.filter((s) => s.category === category);
}
`;
}

function frontendFile(catalog) {
  return `import type { SymbolDef } from './types';

// Auto-generated by scripts/generate-symbols.mjs — keep in sync with
// src/symbols.ts (same data, duplicated so the frontend has no build-time
// dependency on the backend package).

${catalog.declarations}

export const SYMBOL_CATALOG: SymbolDef[] = [${catalog.combineExpr}].flat();

export const CATEGORY_LABELS_TR: Record<string, string> = {
  crypto: 'Kripto',
  forex: 'Forex',
  commodity: 'Emtia',
  bist: 'BIST',
  us_stock: 'ABD Hisseleri',
  etf: 'ETF',
  index: 'Endeksler',
};

export function findSymbol(symbol: string): SymbolDef | undefined {
  return SYMBOL_CATALOG.find((s) => s.symbol === symbol);
}
`;
}

async function main() {
  const crypto = await fetchCryptoSymbols();
  const combined = [...crypto, ...FOREX, ...COMMODITIES, ...BIST, ...US_STOCKS, ...ETFS, ...INDICES];

  // Global safety net: the same canonical symbol id must never appear
  // twice across categories (breaks React list keys and findSymbol()).
  const seen = new Set();
  const duplicates = [];
  const all = combined.filter((s) => {
    if (seen.has(s.symbol)) {
      duplicates.push(s.symbol);
      return false;
    }
    seen.add(s.symbol);
    return true;
  });
  if (duplicates.length > 0) {
    console.warn(`Dropped ${duplicates.length} duplicate symbol id(s) across categories:`, duplicates);
  }

  const byCategory = all.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1;
    return acc;
  }, {});

  const backendCatalog = renderCatalog(all, 'CHUNK');
  const frontendCatalog = renderCatalog(all, 'CHUNK');
  writeFileSync(join(ROOT, 'src', 'symbols.ts'), backendFile(backendCatalog, all.length), 'utf8');
  writeFileSync(join(ROOT, 'frontend', 'lib', 'symbols.ts'), frontendFile(frontendCatalog), 'utf8');

  console.log(`Generated ${all.length} total symbols`);
  console.log(byCategory);
}

main().catch((err) => {
  console.error('generate-symbols failed:', err);
  process.exit(1);
});
