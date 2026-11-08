import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Newspaper,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileSearch,
  RotateCcw,
  Globe,
  TrendingUp,
  Radio,
  Trash2
} from 'lucide-react';
import { PublisherLanguageFilter } from './PublisherLanguageFilter';
import { safeFetchJson } from '../api/client';

export interface NewspaperPulse {
  id: string;
  publisher: string;
  nativePublisher?: string;
  language: 'English' | 'Hindi' | 'Tamil' | 'Kannada' | 'Malayalam' | 'Telugu';
  themeBorderClass: string;
  mastheadBgClass: string;
  mastheadTextColor: string;
  fontFamilyClass: string;
  editionLocation: string;
  timestamp: string;
  headline: string;
  nativeHeadline?: string;
  englishTranslation?: string;
  imageUrl?: string;
  image_url?: string;
  summaryBullets: string[];
  domainBadge?: string;
  trustScore: number;
  category: 'Governance & Law' | 'Science & Space' | 'Economy & Finance' | 'Agriculture & Climate' | 'Infrastructure' | 'Technology';
  factCheckStatus: 'Verified Lead' | 'Developing' | 'Official Wire';
}

const getHashFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getHighEntropyParam = (): string => {
  try {
    const buffer = new Uint32Array(2);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(buffer);
      return `cb=${Date.now()}_${buffer[0].toString(36)}${buffer[1].toString(36)}`;
    }
  } catch (e) {
    // Fallback if crypto is unavailable
  }
  return `cb=${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

const SESSION_STORAGE_SEEN_KEY = 'verifai_seen_article_ids';

const loadSeenFromStorage = (): Set<string> => {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_SEEN_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.warn('Could not read seen article ids from sessionStorage:', e);
  }
  return new Set<string>();
};

const saveSeenToStorage = (seenSet: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_SEEN_KEY,
      JSON.stringify(Array.from(seenSet).slice(-200))
    );
  } catch (e) {
    console.warn('Could not write seen article ids to sessionStorage:', e);
  }
};

const getArticleFingerprint = (article: NewspaperPulse): string => {
  if (article.id) return article.id;
  const key = `${(article.headline || '').trim()}--${(article.publisher || '').trim()}`;
  return getHashFromString(key).toString(36);
};

export const UNIQUE_EDITORIAL_POOL = [
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80", // Law
  "https://images.unsplash.com/photo-1517976487437-feec3e6db8dc?auto=format&fit=crop&w=600&q=80", // Space/ISRO
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80", // Economy/Ledger
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80", // Tech/Cyber
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80", // Press desk
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80", // Policy
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80", // Tickers
  "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80", // Infra/Rail
  "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80", // Agriculture
  "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80", // Currency
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80", // Engineering
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80", // Towers
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80", // Analytics
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80", // Chip
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80", // Meeting
];

export const resolveCardImage = (article: any, index: number = 0) => {
  if (article.image_url && typeof article.image_url === "string" && article.image_url.startsWith("http")) {
    return article.image_url;
  }
  if (article.imageUrl && typeof article.imageUrl === "string" && article.imageUrl.startsWith("http")) {
    return article.imageUrl;
  }
  const textKey = (article.headline || article.title || "") + (article.publisher || "");
  const hashedIdx = (getHashFromString(textKey) + index * 7) % UNIQUE_EDITORIAL_POOL.length;
  return UNIQUE_EDITORIAL_POOL[Math.abs(hashedIdx)];
};



const DEFAULT_NEWSPAPERS_DATA: NewspaperPulse[] = [
  // --- ENGLISH ---
  {
    id: 'paper-hindu-01',
    publisher: 'The Hindu',
    language: 'English',
    themeBorderClass: 'border-t-4 border-t-blue-950',
    mastheadBgClass: 'bg-blue-950 text-white',
    mastheadTextColor: 'text-blue-950',
    fontFamilyClass: 'font-serif',
    editionLocation: 'National • New Delhi Edition',
    timestamp: 'Today, 06:00 AM IST',
    headline: 'Supreme Court stays controversial digital broadcast guidelines pending comprehensive constitutional review',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'Constitutional bench questions statutory overreach and potential chilling effect on independent digital investigative newsrooms.',
      'Attorney General requested a 4-week window to submit a revised multi-stakeholder consultation framework.',
      'Final arguments scheduled before a five-judge constitution bench on November 14.'
    ],
    domainBadge: 'thehindu.com',
    trustScore: 98,
    category: 'Governance & Law',
    factCheckStatus: 'Verified Lead'
  },
  {
    id: 'paper-toi-02',
    publisher: 'The Times of India',
    language: 'English',
    themeBorderClass: 'border-t-4 border-t-red-600',
    mastheadBgClass: 'bg-red-600 text-white',
    mastheadTextColor: 'text-red-600',
    fontFamilyClass: 'font-sans',
    editionLocation: 'Metro • Mumbai Edition',
    timestamp: 'Today, 05:45 AM IST',
    headline: 'ISRO unveils blueprint for next-generation reusable heavy-lift launch vehicle to cut orbital satellite deployment costs by 65%',
    imageUrl: 'https://images.unsplash.com/photo-1517976487502-9951d0da4f04?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1517976487502-9951d0da4f04?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'New methane-liquid oxygen staged combustion engine validated for high-cadence commercial deployments.',
      'First integrated sub-orbital prototype test scheduled for Q3 2027 from Sriharikota spaceport.',
      'Private aerospace manufacturing consortium awarded 40% of modular fuselage fabrication orders.'
    ],
    domainBadge: 'timesofindia.indiatimes.com',
    trustScore: 95,
    category: 'Science & Space',
    factCheckStatus: 'Official Wire'
  },
  {
    id: 'paper-tie-03',
    publisher: 'The Indian Express',
    language: 'English',
    themeBorderClass: 'border-t-4 border-t-slate-900',
    mastheadBgClass: 'bg-slate-900 text-white',
    mastheadTextColor: 'text-slate-900',
    fontFamilyClass: 'font-serif',
    editionLocation: 'National • New Delhi',
    timestamp: 'Today, 06:15 AM IST',
    headline: 'Centre finalises revised rural employment wage matrix directly indexed to consumer price inflation',
    imageUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'Base daily guaranteed wage increases by 11.4% across 19 states to counteract seasonal food inflation.',
      'Mandatory biometric geo-attendance protocols simplified following district-level farmer feedback.',
      'Finance Ministry approves supplementary budgetary allocation of ₹14,200 crore for current fiscal.'
    ],
    domainBadge: 'indianexpress.com',
    trustScore: 97,
    category: 'Governance & Law',
    factCheckStatus: 'Verified Lead'
  },
  {
    id: 'paper-mint-04',
    publisher: 'Mint / Livemint',
    language: 'English',
    themeBorderClass: 'border-t-4 border-t-amber-500',
    mastheadBgClass: 'bg-amber-500 text-stone-950 font-bold',
    mastheadTextColor: 'text-amber-700',
    fontFamilyClass: 'font-sans',
    editionLocation: 'Markets • Mumbai / Bengaluru',
    timestamp: 'Today, 06:30 AM IST',
    headline: 'RBI liquidity calibration eases overnight lending rates as retail inflation cools to 4.1%',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'Core manufacturing exports recorded 14.8% sequential expansion in current quarterly reporting cycle.',
      'Foreign institutional capital inflows into domestic sovereign bond indices surpass $1.8 billion.',
      'Monetary policy committee signals continued neutral stance to maintain investment stability.'
    ],
    domainBadge: 'livemint.com',
    trustScore: 96,
    category: 'Economy & Finance',
    factCheckStatus: 'Verified Lead'
  },
  {
    id: 'paper-dh-05',
    publisher: 'Deccan Herald',
    language: 'English',
    themeBorderClass: 'border-t-4 border-t-amber-800',
    mastheadBgClass: 'bg-amber-800 text-white',
    mastheadTextColor: 'text-amber-900',
    fontFamilyClass: 'font-serif',
    editionLocation: 'State • Bengaluru Edition',
    timestamp: 'Today, 05:30 AM IST',
    headline: 'Bengaluru suburban rail corridor-2 achieves major underground tunneling milestone near Yeshwantpur',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'Automated tunnel boring machine finishes 1.8 km twin-tube segment 3 weeks ahead of master project schedule.',
      'Dedicated multimodal feeder interchange plazas integrated with 12 high-density bus terminals.',
      'Trial passenger operations between Baiyappanahalli and Chikkabanavara slated for early 2026.'
    ],
    domainBadge: 'deccanherald.com',
    trustScore: 94,
    category: 'Infrastructure',
    factCheckStatus: 'Official Wire'
  },

  // --- HINDI ---
  {
    id: 'paper-db-07',
    publisher: 'Dainik Bhaskar',
    nativePublisher: 'दैनिक भास्कर',
    language: 'Hindi',
    themeBorderClass: 'border-t-4 border-t-orange-600',
    mastheadBgClass: 'bg-orange-600 text-white',
    mastheadTextColor: 'text-orange-700',
    fontFamilyClass: 'font-sans',
    editionLocation: 'राष्ट्रीय • भोपाल / जयपुर / दिल्ली',
    timestamp: 'आज, सुबह 06:00 बजे IST',
    headline: 'दैनिक भास्कर: नई राष्ट्रीय कौशल नीति को मंजूरी; युवाओं के लिए 5 लाख पेड कॉर्पोरेट अप्रेंटिसशिप का रास्ता साफ',
    englishTranslation: 'Dainik Bhaskar: National Skill Policy approved; clears pathway for 500,000 paid corporate apprenticeships.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'शीर्ष 500 भारतीय कंपनियों में 12 महीने के लाइव इंडस्ट्री प्रशिक्षण के साथ ₹5000 मासिक भत्ता अनिवार्य।',
      'टियर-2 और टियर-3 शहरों के सरकारी पॉलिटेक्निक और आईटीआई पास छात्रों को मिलेगा पहला अवसर।',
      'कौशल विकास मंत्रालय ने एकल पारदर्शी पोर्टल के माध्यम से सीधा पंजीकरण शुरू किया।'
    ],
    domainBadge: 'bhaskar.com',
    trustScore: 94,
    category: 'Technology',
    factCheckStatus: 'Official Wire'
  },
  {
    id: 'paper-au-08',
    publisher: 'Amar Ujala',
    nativePublisher: 'अमर उजाला',
    language: 'Hindi',
    themeBorderClass: 'border-t-4 border-t-red-700',
    mastheadBgClass: 'bg-red-700 text-white',
    mastheadTextColor: 'text-red-800',
    fontFamilyClass: 'font-sans',
    editionLocation: 'उत्तर भारत • लखनऊ / देहरादून / आगरा',
    timestamp: 'आज, सुबह 05:40 बजे IST',
    headline: 'अमर उजाला: उत्तर भारत में प्रमुख बांधों में 78% तक जलस्तर दर्ज, खरीफ फसलों की बुवाई में तेजी',
    englishTranslation: 'Amar Ujala: Key North Indian reservoirs reach 78% capacity; Kharif sowing picks up momentum.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'गंगा, यमुना और घाघरा बेसिन के जलाशयों में पिछले वर्ष की तुलना में 12% अधिक जल संचयन दर्ज किया गया।',
      'धान, दलहन और मोटे अनाजों की बुवाई में 6.4% की औसत वृद्धि, बंपर कृषि पैदावार की उम्मीद।',
      'केंद्रीय जल आयोग ने संवेदनशील बाढ़ क्षेत्रों में ऑटोमेटेड अर्ली-वार्निंग सिस्टम सक्रिय किया।'
    ],
    domainBadge: 'amarujala.com',
    trustScore: 93,
    category: 'Agriculture & Climate',
    factCheckStatus: 'Verified Lead'
  },

  // --- TAMIL ---
  {
    id: 'paper-dinamani-10',
    publisher: 'Dinamani',
    nativePublisher: 'தினமணி',
    language: 'Tamil',
    themeBorderClass: 'border-t-4 border-t-emerald-800',
    mastheadBgClass: 'bg-emerald-800 text-white font-serif',
    mastheadTextColor: 'text-emerald-900',
    fontFamilyClass: 'font-serif',
    editionLocation: 'மாநிலம் • சென்னை / மதுரை / கோவை',
    timestamp: 'இன்று, காலை 06:00 மணி IST',
    headline: 'தினமணி: தமிழகத்தில் ₹28,000 கோடி புதிய தொழில் முதலீடுகளுக்கு அமைச்சரவை ஒப்புதல்; ஓசூர் மற்றும் தூத்துக்குடியில் புதிய தொழிற்பூங்காக்கள்',
    englishTranslation: 'Dinamani: Tamil Nadu clears ₹28,000 Cr industrial investments; new electronics & green parks in Hosur and Tuticorin.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'மின்னணு உற்பத்தி மற்றும் பசுமை ஹைட்ரஜன் துறைகளில் 45,000 பேருக்கு நேரடி வேலைவாய்ப்பு உறுதி.',
      'புறநகர் மற்றும் கிராமப்புற இளைஞர்களுக்கு மேம்பட்ட தொழில்நுட்ப திறன் பயிற்சி முகாம்கள் தொடக்கம்.',
      'அடுத்த 3 ஆண்டுகளில் தமிழக ஏற்றுமதி வர்த்தகம் 18% வளர்ச்சி காணும் என அதிகாரப்பூர்வ அறிவிப்பு.'
    ],
    domainBadge: 'dinamani.com',
    trustScore: 96,
    category: 'Economy & Finance',
    factCheckStatus: 'Verified Lead'
  },

  // --- KANNADA ---
  {
    id: 'paper-prajavani-13',
    publisher: 'Prajavani',
    nativePublisher: 'ಪ್ರಜಾವಾಣಿ',
    language: 'Kannada',
    themeBorderClass: 'border-t-4 border-t-amber-800',
    mastheadBgClass: 'bg-amber-800 text-white font-serif',
    mastheadTextColor: 'text-amber-950',
    fontFamilyClass: 'font-serif',
    editionLocation: 'ರಾಜ್ಯ • ಬೆಂಗಳೂರು / ಮೈಸೂರು / ಹುಬ್ಬಳ್ಳಿ',
    timestamp: 'ಇಂದು, ಬೆಳಗ್ಗೆ 06:00 IST',
    headline: 'ಪ್ರಜಾವಾಣಿ: ಕಾವೇರಿ-ಕೃಷ್ಣಾ ಜಲಾಶಯಗಳಲ್ಲಿ ಗರಿಷ್ಠ ಮಟ್ಟದ ನೀರು ಸಂಗ್ರಹ; ಕೃಷಿ ಪಂಪ್‌ಸೆಟ್‌ಗಳಿಗೆ ನಿರಂತರ 7 ಗಂಟೆ 3-ಫೇಸ್ ವಿದ್ಯುತ್ ಪೂರೈಕೆ ಖಾತರಿ',
    englishTranslation: 'Prajavani: Maximum reservoir capacity reached in Cauvery-Krishna basins; 7-hour 3-phase power guaranteed for farm pumpsets.',
    imageUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'ಕೆಆರ್‌ಎಸ್, ಆಲಮಟ್ಟಿ ಮತ್ತು ತುಂಗಭದ್ರಾ ಅಣೆಕಟ್ಟುಗಳಲ್ಲಿ ನೀರಿನ ಒಳಹರಿವು ಹೆಚ್ಚಳ, ಜಲವಿದ್ಯುತ್ ಉತ್ಪಾದನೆ ಪೂರ್ಣ ಪ್ರಮಾಣದಲ್ಲಿ ಆರಂಭ.',
      'ರಾಜ್ಯದ 30 ಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು ರೈತ ಕುಟುಂಬಗಳಿಗೆ ಬೆಳೆ ಸಂರಕ್ಷಣೆಗೆ ನೆರವಾಗುವಂತೆ ನಿರಂತರ ವಿದ್ಯುತ್ ವೇಳಾಪಟ್ಟಿ ಬಿಡುಗಡೆ.',
      'ಗ್ರಾಮೀಣ ಕೆರೆ ತುಂಬಿಸುವ ಕಾಮಗಾರಿಗಳಿಗೆ ಆದ್ಯತೆ ನೀಡಿ ನೀರು ಹರಿಸಲು ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕಚೇರಿ ಸೂಚನೆ.'
    ],
    domainBadge: 'prajavani.net',
    trustScore: 96,
    category: 'Agriculture & Climate',
    factCheckStatus: 'Verified Lead'
  },

  // --- MALAYALAM ---
  {
    id: 'paper-manorama-15',
    publisher: 'Malayala Manorama',
    nativePublisher: 'മലയാള മനോരമ',
    language: 'Malayalam',
    themeBorderClass: 'border-t-4 border-t-red-800',
    mastheadBgClass: 'bg-red-800 text-white font-serif',
    mastheadTextColor: 'text-red-900',
    fontFamilyClass: 'font-serif',
    editionLocation: 'സംസ്ഥാനം • തിരുവനന്തപുരം / കൊച്ചി / കോഴിക്കോട്',
    timestamp: 'ഇന്ന്, രാവിലെ 06:10 IST',
    headline: 'മലയാള മനോരമ: വിഴിഞ്ഞം അന്താരാഷ്ട്ര തുറമുഖം സജ്ജം; ആദ്യ വാണിജ്യ കണ്ടെയ്നർ മദർഷിപ്പ് ബെർത്തിലെത്തി, ദക്ഷിണേഷ്യൻ ഷിപ്പിംഗ് ഹബ്ബായി കേരളം',
    englishTranslation: 'Malayala Manorama: Vizhinjam International Seaport fully operational; mother container vessel docks, positioning Kerala on global shipping map.',
    imageUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'അത്യാധുനിക ഓട്ടോമേറ്റഡ് ക്രെയിനുകൾ ഉപയോഗിച്ച് മണിക്കൂറിൽ 120 കണ്ടെയ്നറുകൾ കൈകാര്യം ചെയ്യാൻ ശേഷി.',
      'അനുബന്ധ ഇൻഡസ്ട്രിയൽ ആൻഡ് ലോജിസ്റ്റിക്സ് പാർക്കുകൾക്കായി ₹6,000 കോടിയുടെ അധിക നിക്ഷേപ നിർദ്ദേശങ്ങൾ.',
      'ദക്ഷിണേഷ്യയിലെ ഏറ്റവും ആഴമേറിയ പ്രകൃതിദത്ത ഡ്രാൻസ്ഷിപ്പ്മെന്റ് തുറമുഖമായി പ്രവർത്തനം തുടങ്ങി.'
    ],
    domainBadge: 'manoramaonline.com',
    trustScore: 97,
    category: 'Infrastructure',
    factCheckStatus: 'Verified Lead'
  },

  // --- TELUGU ---
  {
    id: 'paper-eenadu-17',
    publisher: 'Eenadu',
    nativePublisher: 'ఈనాడు',
    language: 'Telugu',
    themeBorderClass: 'border-t-4 border-t-rose-800',
    mastheadBgClass: 'bg-rose-800 text-white font-serif',
    mastheadTextColor: 'text-rose-900',
    fontFamilyClass: 'font-serif',
    editionLocation: 'రాష్ట్రం • హైదరాబాద్ / విజయవాడ / విశాఖ',
    timestamp: 'ఈరోజు, ఉదయం 06:00 IST',
    headline: 'ఈనాడు: పోలవరం ప్రాజెక్టు కొత్త డయాఫ్రమ్ వాల్ నిర్మాణానికి కేంద్ర క్యాబినెట్ ₹12,157 కోట్ల నిధుల ప్యాకేజీకి ఆమోదం',
    englishTranslation: 'Eenadu: Union Cabinet greenlights ₹12,157 Cr special funding for Polavaram new diaphragm wall construction.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    summaryBullets: [
      'గోదావరి నదిపై ప్రతిష్టాత్మక బహుళార్ధసాధక ప్రాజెక్టును నిర్దేశిత గడువులోగా పూర్తి చేసేందుకు నిధులు విడుదల.',
      'ఉత్తరాంధ్ర మరియు రాయలసీమ తాగునీరు, సాగునీటి అవసరాల కల్పనకు కీలక ముందడుగు.',
      'అంతర్జాతీయ హైడ్రాలిక్ నిపుణుల కమిటీ పర్యవేక్షణలో అత్యాధునిక సాంకేతికతతో కొత్త నిర్మాణం.'
    ],
    domainBadge: 'eenadu.net',
    trustScore: 97,
    category: 'Infrastructure',
    factCheckStatus: 'Verified Lead'
  }
];

import { EditorialAuditModal, AuditArticleSummary } from './EditorialAuditModal';
import { useLanguage, SupportedLocale } from '../context/LanguageContext';

interface PulseCardProps {
  pulse: NewspaperPulse;
  pulseIdx: number;
  onAuditClick: (pulse: NewspaperPulse, cardImg: string) => void;
  t: (key: string, defaultVal?: string) => string;
}

const PulseCard = React.memo<PulseCardProps>(({ pulse, pulseIdx, onAuditClick, t }) => {
  const cardImg = resolveCardImage(pulse, pulseIdx);

  return (
    <div
      style={{ animation: `staggeredSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${0.03 * (pulseIdx % 12)}s both` }}
      className={`bg-white dark:bg-[#2D141E] rounded-xl border border-stone-200 dark:border-[#E5C158]/25 overflow-hidden shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:shadow-xl dark:hover:border-[#E5C158]/60 hover:-translate-y-0.5 dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),_0_0_20px_rgba(229,193,88,0.12)] transition-all duration-300 flex flex-col justify-between transform-gpu will-change-transform ${pulse.themeBorderClass}`}
    >
      <div>
        {/* Publisher Masthead Header */}
        <div className="p-4 pb-3 border-b border-stone-100 dark:border-[#E5C158]/15 flex items-start justify-between gap-3 bg-stone-50/70 dark:bg-[#200C12]/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-serif-editorial font-bold text-lg tracking-tight ${pulse.mastheadTextColor} dark:text-[#E5C158]`}>
                {pulse.publisher}
              </span>
              {pulse.nativePublisher && (
                <span className="text-xs font-sans text-stone-500 dark:text-[#D4B29E] font-medium">
                  ({pulse.nativePublisher})
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-stone-500 dark:text-[#D4B29E]/70 font-mono">
              <span>{pulse.editionLocation}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-stone-200/80 dark:bg-[#4A1C2C] text-stone-700 dark:text-[#E5C158] border border-stone-300 dark:border-[#E5C158]/40">
              {pulse.language}
            </span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center space-x-1 font-semibold">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>{t('briefing.trustPrefix', 'Trust:')} {pulse.trustScore}%</span>
            </span>
          </div>
        </div>

        {/* Category Pill Tag & Domain Badge */}
        <div className="px-5 pt-3.5 flex items-center justify-between text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-[#200C12] text-stone-700 dark:text-[#E5C158] font-semibold border border-stone-200 dark:border-[#E5C158]/30">
            {pulse.category}
          </span>
          {pulse.domainBadge && (
            <span className="text-stone-400 dark:text-[#D4B29E]/70 flex items-center space-x-1">
              <Globe className="w-3 h-3 text-stone-400 dark:text-[#E5C158]/60" />
              <span>{pulse.domainBadge}</span>
            </span>
          )}
        </div>

        {/* Main Headline Content */}
        <div className="p-5 pt-2.5 space-y-3">
          <h2 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900 dark:text-[#FAF6F0] leading-snug group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
            {pulse.headline}
          </h2>

          {pulse.englishTranslation && (
            <p className="text-xs text-stone-600 dark:text-[#FAF6F0]/85 font-serif-editorial italic border-l-2 border-stone-300 dark:border-[#E5C158]/40 pl-2.5 leading-relaxed bg-stone-50/60 dark:bg-[#200C12]/60 py-1 rounded-r">
              {t('briefing.translationLabel', 'Translation:')} "{pulse.englishTranslation}"
            </p>
          )}

          {/* Contextual Article Preview Thumbnail with Explicit Aspect Ratio to eliminate CLS */}
          <div className="relative w-full aspect-[16/9] min-h-[160px] overflow-hidden rounded-lg bg-stone-100 dark:bg-[#200C12] mb-3 border border-stone-200 dark:border-[#E5C158]/20 group/thumb">
            <img
              src={cardImg}
              alt={pulse.headline}
              loading="lazy"
              decoding="async"
              className="object-cover w-full h-full group-hover/thumb:scale-105 transition-transform duration-300"
              onError={(e) => {
                const fallback = resolveCardImage(
                  { ...pulse, image_url: undefined, imageUrl: undefined },
                  pulseIdx
                );
                (e.target as HTMLImageElement).src = fallback;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#200C12]/95 via-transparent to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-end p-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAuditClick(pulse, cardImg);
                }}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#2D141E]/95 hover:bg-[#4A1C2C] text-[#E5C158] text-xs font-mono font-bold tracking-tight shadow-md transition-colors cursor-pointer border border-[#E5C158]/40"
                title="Inspect & Verify Image in FUSIONX Pipeline"
              >
                <span>🔍 {t('briefing.inspectImage', 'Inspect & Verify Image')}</span>
              </button>
            </div>
          </div>

          {/* 3-Bullet Core Brief */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-[#E5C158]/15">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-[#E5C158] font-bold block mb-1">
              {t('briefing.nliBrief', 'NLI 3-Bullet Front-Page Brief:')}
            </span>
            <ul className="space-y-1.5 text-xs text-stone-700 dark:text-[#FAF6F0]/85 font-sans">
              {pulse.summaryBullets.map((bullet, bIdx) => (
                <li key={bIdx} className="flex items-start space-x-2">
                  <span className="text-stone-400 dark:text-[#E5C158] font-bold text-sm leading-none mt-0.5">•</span>
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 pt-3 border-t border-stone-100 dark:border-[#E5C158]/15 bg-stone-50/60 dark:bg-[#200C12]/80 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-stone-400 dark:text-[#D4B29E]/70">
          {pulse.timestamp}
        </span>

        <button
          type="button"
          onClick={() => onAuditClick(pulse, cardImg)}
          className="text-xs font-semibold text-[#E5C158] bg-gradient-to-r from-[#6D1B26] to-[#990033] border border-[#E5C158]/40 px-3.5 py-1.5 rounded-lg hover:from-[#990033] hover:to-[#6D1B26] transition-all flex items-center gap-1.5 shadow-md dark:shadow-[0_0_15px_rgba(229,193,88,0.2)] cursor-pointer group/btn"
          title="Transfer this front-page assertion directly into the 13-stage verification pipeline"
        >
          <FileSearch className="w-3.5 h-3.5 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
          <span>🔍 {t('briefing.auditClaim', 'Audit Claim')}</span>
          <ArrowUpRight className="w-3 h-3 text-[#E5C158]" />
        </button>
      </div>
    </div>
  );
});

interface DailyBriefingBureauProps {
  onAuditHeadline: (headline: string, publisher?: string) => void;
}

export const DailyBriefingBureau: React.FC<DailyBriefingBureauProps> = ({ onAuditHeadline }) => {
  const { locale, setLocale, t, languageName } = useLanguage();
  const [pulses, setPulses] = useState<NewspaperPulse[]>(DEFAULT_NEWSPAPERS_DATA);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return languageName || 'All';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Just now');
  const [liveSynced, setLiveSynced] = useState<boolean>(true);

  // Progressive windowing / pagination limit (default 12 cards per view)
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // 300ms Debounce for search typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedLanguage, selectedCategory, debouncedSearchQuery]);

  // Audit Modal State for Daily Briefing Article Cards
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [activeAuditArticle, setActiveAuditArticle] = useState<AuditArticleSummary | null>(null);
  const [activeAuditImage, setActiveAuditImage] = useState<string | null>(null);

  const handleCardAuditClick = useCallback((article: NewspaperPulse, imgUrl?: string) => {
    const resolvedImg = imgUrl || resolveCardImage(article);
    const normalizedScore = article.trustScore > 1 ? article.trustScore / 100 : article.trustScore;
    const verdictLabel = article.trustScore >= 90 ? 'Verified True' : article.trustScore >= 70 ? 'Mostly True' : 'Half True / Mixed';

    const articlePayload: AuditArticleSummary = {
      title: article.headline,
      headline: article.headline,
      publisher: article.publisher || 'Wire Feed',
      score: article.trustScore || 95,
      trustScore: article.trustScore || 95,
      verdict: verdictLabel,
      summaryBullets: article.summaryBullets,
      imageUrl: resolvedImg,
      domainBadge: article.domainBadge,
      editionLocation: article.editionLocation,
      category: article.category
    };

    setActiveAuditArticle(articlePayload);
    setActiveAuditImage(resolvedImg);
    setIsAuditModalOpen(true);

    // Save audit record to localStorage registry
    try {
      const newRecord = {
        id: `audit-${article.id || Date.now()}`,
        input_type: 'briefing',
        claim: article.headline,
        verdict: verdictLabel,
        score: normalizedScore,
        meter_zone: verdictLabel === 'Verified True' ? 5 : 4,
        color_code: '#10b981',
        headline: article.headline,
        summary: article.summaryBullets?.[0] || article.headline,
        date: new Date().toISOString(),
        sources: [
          { name: article.publisher, url: article.domainBadge ? `https://${article.domainBadge}` : 'https://news.google.com', stance: 'Supports' }
        ]
      };
      const existingStr = localStorage.getItem('fusionx_audit_registry');
      const existing: any[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [newRecord, ...existing.filter((item: any) => item.claim !== newRecord.claim || item.id !== newRecord.id)].slice(0, 60);
      localStorage.setItem('fusionx_audit_registry', JSON.stringify(updated));
    } catch (storageErr) {
      console.error("Failed to save briefing audit to local registry:", storageErr);
    }
  }, []);

  // Client-side persistent session memory initialized from sessionStorage
  const seenIdsRef = useRef<Set<string>>(loadSeenFromStorage());
  const [seenCount, setSeenCount] = useState<number>(() => seenIdsRef.current.size);

  const languages = ['All', 'English', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Telugu'];
  const categories = ['All', 'Governance & Law', 'Science & Space', 'Economy & Finance', 'Agriculture & Climate', 'Infrastructure', 'Technology'];

  // Reset filters back to default broadsheet view
  const resetFiltersToDefault = useCallback(() => {
    setSelectedLanguage('All');
    setSelectedCategory('All');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setVisibleCount(12);
  }, []);

  // Live Multi-Language Fresh Wire Sync with High-Entropy Busting & Session Deduplication
  const fetchFreshMultiLanguageBriefing = useCallback(async (lang: string = selectedLanguage, isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const langParam = (lang || 'all').toLowerCase();
      const entropy = getHighEntropyParam();
      const url = isManual
        ? `/api/briefing/top-stories?lang=${langParam}&refresh=true&${entropy}`
        : `/api/briefing/top-stories?lang=${langParam}&${entropy}`;
      
      const data = await safeFetchJson<{
        status: string;
        last_synced: number;
        articles?: NewspaperPulse[];
        pulses?: NewspaperPulse[];
      }>(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      const incomingArticles = (data && (data.articles || data.pulses)) || [];
      const seen = seenIdsRef.current;

      // Strict client-side deduplication against seen IDs and normalized titles
      const freshUnseen = incomingArticles.filter((item) => {
        const idKey = getArticleFingerprint(item);
        const titleKey = (item.headline || '').trim().toLowerCase();
        return !seen.has(idKey) && !seen.has(titleKey);
      });

      if (freshUnseen.length > 0) {
        freshUnseen.forEach((item) => {
          seen.add(getArticleFingerprint(item));
          seen.add((item.headline || '').trim().toLowerCase());
        });
        saveSeenToStorage(seen);
        setSeenCount(seen.size);

        setPulses((prev) => {
          const freshMap = new Map<string, NewspaperPulse>();
          freshUnseen.forEach((item) => freshMap.set(getArticleFingerprint(item), item));
          prev.forEach((item) => {
            const key = getArticleFingerprint(item);
            if (!freshMap.has(key)) freshMap.set(key, item);
          });
          return Array.from(freshMap.values()).slice(0, 48);
        });
      } else if (incomingArticles.length > 0 && isManual) {
        // Shift rotation fallback
        const rotated = [...incomingArticles].sort(() => Math.random() - 0.5);
        setPulses((prev) => {
          const merged = [...rotated, ...prev];
          const dedupe = Array.from(new Map(merged.map(i => [getArticleFingerprint(i), i])).values());
          return dedupe.slice(0, 48);
        });
      }

      setLastSyncedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setLiveSynced(true);
    } catch (e) {
      console.warn('Using fallback wire due to network:', e);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  }, [selectedLanguage]);

  // Clear session memory handler
  const clearSessionMemory = useCallback(() => {
    seenIdsRef.current.clear();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_SEEN_KEY);
      } catch (e) {
        // ignore
      }
    }
    setSeenCount(0);
    fetchFreshMultiLanguageBriefing(selectedLanguage, true);
  }, [selectedLanguage, fetchFreshMultiLanguageBriefing]);

  // Sync with global locale from LanguageContext
  useEffect(() => {
    if (languageName) {
      setSelectedLanguage(languageName);
      fetchFreshMultiLanguageBriefing(languageName, false);
    }
  }, [locale, languageName]);

  // Initial load on mount
  useEffect(() => {
    fetchFreshMultiLanguageBriefing('all', false);
  }, [fetchFreshMultiLanguageBriefing]);

  // Language switcher handler with instant backend true-fetch
  const handleLanguageSelect = useCallback((newLang: string) => {
    setSelectedLanguage(newLang);
    // Also sync to global locale if matching
    const matchLocaleMap: Record<string, SupportedLocale> = {
      English: 'EN',
      Hindi: 'HI',
      Tamil: 'TA',
      Kannada: 'KN',
      Malayalam: 'ML',
      Telugu: 'TE'
    };
    if (matchLocaleMap[newLang]) {
      setLocale(matchLocaleMap[newLang]);
    }
    fetchFreshMultiLanguageBriefing(newLang, true);
  }, [setLocale, fetchFreshMultiLanguageBriefing]);

  // Language count badges
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: pulses.length };
    pulses.forEach((item) => {
      counts[item.language] = (counts[item.language] || 0) + 1;
    });
    return counts;
  }, [pulses]);

  // Filtered pulses using debounced search query
  const filteredPulses = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    return pulses.filter((item) => {
      const matchLang = selectedLanguage === 'All' || item.language.toLowerCase() === selectedLanguage.toLowerCase();
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        q === '' ||
        item.headline.toLowerCase().includes(q) ||
        item.publisher.toLowerCase().includes(q) ||
        item.summaryBullets.some((b) => b.toLowerCase().includes(q)) ||
        (item.englishTranslation && item.englishTranslation.toLowerCase().includes(q));
      return matchLang && matchCat && matchSearch;
    });
  }, [pulses, selectedLanguage, selectedCategory, debouncedSearchQuery]);

  // Windowed visible slice to maintain <150 DOM nodes
  const displayedPulses = useMemo(() => {
    return filteredPulses.slice(0, visibleCount);
  }, [filteredPulses, visibleCount]);

  const hasMorePulses = filteredPulses.length > visibleCount;

  return (
    <div className="space-y-8">
      {/* ----------------- 1. HERO PUNCHLINE BANNER ----------------- */}
      <div className="editorial-glass bg-[#2D141E]/75 backdrop-blur-2xl border border-stone-800 dark:border-[#E5C158]/25 rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden text-white shadow-editorial dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all animate-slideUp">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-amber-500/10 dark:bg-[#E5C158]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-rose-500/10 dark:bg-[#6D1B26]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 dark:bg-[#4A1C2C] border border-amber-500/30 dark:border-[#E5C158]/50 text-amber-300 dark:text-[#E5C158] text-xs font-mono font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ {t('briefing.badge', 'Multi-Paper Front-Page Bureau • FUSIONX 1.0')}</span>
            </div>

            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-stone-100 dark:text-[#FAF6F0]">
              {t('briefing.title', 'No time for the noise. Every front-page pulse, decoded in one breath.')}
            </h1>

            <p className="text-sm sm:text-base text-stone-300 dark:text-[#FAF6F0]/80 font-sans leading-relaxed">
              {t('briefing.punchline', 'Real-time multi-source intelligence distilling leading national and regional newspaper front pages across 6 Indian scripts into audited 3-bullet core briefs.')}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 text-xs font-mono text-stone-400 dark:text-[#D4B29E]">
              <span className="inline-flex items-center space-x-1.5 text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-md">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>🟢 {t('briefing.liveInternetSynced', 'Live Internet Synced')}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-[#E5C158]/80" />
                <span>{t('briefing.lastSync', 'Last Synchronized')}: {lastSyncedTime}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1.5 text-stone-300 dark:text-[#E5C158]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{pulses.length} {t('briefing.activeWires', 'Active Newsroom Wires')}</span>
              </span>
            </div>
          </div>

          {/* Manual Internet Wire Sync & Session Memory Controls */}
          <div className="flex flex-col justify-between gap-3 bg-stone-800/80 dark:bg-black/40 backdrop-blur-md p-4 rounded-xl border border-stone-700/60 dark:border-[#E5C158]/20 min-w-[240px] shadow-lg">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-[#D4B29E] block">
                {t('briefing.intelligenceFeed', 'Intelligence Feed')}
              </span>
              <span className="font-serif-editorial text-xl font-bold text-amber-300 dark:text-[#E5C158]">
                {t('briefing.indianScripts', '6 Indian Scripts')}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-700/60 dark:border-[#E5C158]/20 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-stone-400 dark:text-[#FAF6F0]/70">
                  {t('briefing.liveWire', 'Live Wire')}:
                </span>
                <button
                  type="button"
                  onClick={() => fetchFreshMultiLanguageBriefing(selectedLanguage, true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-stone-700 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] hover:bg-stone-600 dark:hover:from-[#990033] dark:hover:to-[#6D1B26] text-stone-100 dark:text-[#FAF6F0] text-xs font-mono font-medium transition-colors cursor-pointer border border-stone-600/60 dark:border-[#E5C158]/40 shadow-sm dark:shadow-[0_0_15px_rgba(229,193,88,0.2)]"
                  title="Pull fresh dynamic live wire updates from internet"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400 dark:text-[#E5C158]' : 'text-stone-300 dark:text-[#E5C158]'}`} />
                  <span>{isRefreshing ? t('briefing.syncing', 'Syncing...') : t('briefing.syncFreshWire', 'Sync Fresh Wire')}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-700/40 dark:border-[#E5C158]/15 text-[11px] font-mono text-stone-400 dark:text-[#D4B29E]/80">
                <span>{t('briefing.seen', 'Seen')}: {seenCount} {t('briefing.items', 'items')}</span>
                <button
                  type="button"
                  onClick={clearSessionMemory}
                  className="inline-flex items-center gap-1 text-amber-400 dark:text-[#E5C158] hover:underline cursor-pointer"
                  title="Clear seen articles history for this session"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>[{t('briefing.clearCache', 'Clear Cache')}]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ----------------- 2. DYNAMIC LANGUAGE & SEARCH CONTROLS ----------------- */}
      <PublisherLanguageFilter
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleLanguageSelect}
        languageCounts={languageCounts}
        languages={languages}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        filteredCount={filteredPulses.length}
      />

      {/* ----------------- 3. MULTI-NEWSPAPER TEXT-FIRST CARDS GRID ----------------- */}
      {filteredPulses.length === 0 && !isRefreshing ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-[#2D141E] border border-slate-200 dark:border-[#E5C158]/25 rounded-xl text-center space-y-4 my-6 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <span className="text-4xl">📡</span>
          <h3 className="text-xl font-serif-editorial font-bold text-slate-900 dark:text-[#FAF6F0]">
            {t('briefing.noNews', 'No news found for this selection')} ({selectedLanguage})
          </h3>
          <p className="text-sm text-slate-500 dark:text-[#D4B29E] max-w-md">
            {t('briefing.noNewsDesc', 'Try changing your language filter, searching different keywords, or clicking Refresh Matrix.')}
          </p>
          <button 
            type="button"
            onClick={() => {
              resetFiltersToDefault();
              fetchFreshMultiLanguageBriefing("all", true);
            }}
            className="bg-slate-900 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] hover:bg-slate-800 dark:hover:from-[#990033] dark:hover:to-[#6D1B26] text-white dark:text-[#FAF6F0] font-medium text-xs px-5 py-2.5 rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer border dark:border-[#E5C158]/40 dark:shadow-[0_0_15px_rgba(229,193,88,0.2)]"
          >
            <span>🏠 {t('briefing.showAll', 'Show All Wire Sources')}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPulses.map((pulse, pulseIdx) => (
              <PulseCard
                key={pulse.id}
                pulse={pulse}
                pulseIdx={pulseIdx}
                onAuditClick={handleCardAuditClick}
                t={t}
              />
            ))}
          </div>

          {/* Progressive Windowing / Load More Controls */}
          {hasMorePulses && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/90 dark:bg-[#200C12] border border-stone-200 dark:border-[#E5C158]/30 rounded-xl shadow-sm">
              <span className="text-xs font-mono text-stone-600 dark:text-[#D4B29E]">
                Showing <strong className="text-stone-900 dark:text-[#E5C158]">{displayedPulses.length}</strong> of <strong className="text-stone-900 dark:text-[#FAF6F0]">{filteredPulses.length}</strong> dispatches
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(filteredPulses.length, prev + 12))}
                  className="px-4 py-2 rounded-lg bg-stone-900 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] text-white dark:text-[#E5C158] hover:brightness-110 text-xs font-mono font-bold transition-all border dark:border-[#E5C158]/40 shadow-sm cursor-pointer"
                >
                  ⚡ Load Next 12 Wires (+{Math.min(12, filteredPulses.length - visibleCount)} remaining)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredPulses.length)}
                  className="px-3 py-2 rounded-lg bg-stone-100 dark:bg-[#2D141E] text-stone-700 dark:text-[#FAF6F0] hover:bg-stone-200 dark:hover:bg-[#4A1C2C] text-xs font-mono font-medium transition-colors border dark:border-[#E5C158]/20 cursor-pointer"
                >
                  Show All ({filteredPulses.length})
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Popover Verification Modal for Briefing Article Cards */}
      <EditorialAuditModal
        isOpen={isAuditModalOpen}
        article={activeAuditArticle}
        imagePreviewUrl={activeAuditImage}
        onClose={() => setIsAuditModalOpen(false)}
        onShowFullBreakdown={() => {
          if (activeAuditArticle) {
            onAuditHeadline(activeAuditArticle.title || activeAuditArticle.headline || '', activeAuditArticle.publisher);
          }
          setIsAuditModalOpen(false);
        }}
      />
    </div>
  );
};

