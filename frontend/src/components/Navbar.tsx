import React from 'react';
import {
  ShieldCheck,
  MessageSquare,
  Database,
  GitMerge,
  FileText,
  Newspaper
} from 'lucide-react';
import { UserProfile } from './TransparentLoginView';
import { useLanguage, SupportedLocale } from '../context/LanguageContext';

interface NavbarProps {
  activeTab: 'editorial' | 'briefing' | 'whatsapp' | 'history' | 'pipeline';
  setActiveTab: (tab: 'editorial' | 'briefing' | 'whatsapp' | 'history' | 'pipeline') => void;
  apiConnected: boolean;
  user?: UserProfile | null;
  onLogout?: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  selectedLanguage?: string;
  setSelectedLanguage?: (lang: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  apiConnected,
  user,
  onLogout,
  theme,
  setTheme,
  selectedLanguage,
  setSelectedLanguage
}) => {
  const { locale, setLocale, t, availableLocales } = useLanguage();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleLanguageChange = (newLang: string) => {
    const upper = newLang.toUpperCase() as SupportedLocale;
    setLocale(upper);
    if (setSelectedLanguage) {
      setSelectedLanguage(upper);
    }
  };

  const userHandle = user?.handle || user?.name || 'Zorro';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#200C12]/90 backdrop-blur-2xl border-b border-stone-200 dark:border-[#E5C158]/25 shadow-2xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-2.5 space-y-2">
        
        {/* Top Row: Brand & Status on Left, Utility Cluster on Right */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Brand Block */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-8 w-8 rounded-xl bg-stone-900 dark:bg-[#2D141E] border border-stone-300 dark:border-[#E5C158]/40 flex items-center justify-center text-[#E5C158] shadow-md shadow-black/30 flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#E5C158]" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-serif-editorial text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-[#FAF6F0] leading-none">
                  VerifAI
                </span>
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-[#2D141E] text-[#E5C158] border border-amber-300 dark:border-[#E5C158]/40 leading-none">
                  FUSIONX 1.0
                </span>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-[#D4B29E] font-sans leading-tight mt-0.5 hidden sm:block">
                {t('nav.tagline', 'AI Multi-Paper Intelligence')}
              </p>
            </div>
          </div>

          {/* Right: Post-Login Control Cluster */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <div className="flex items-center gap-2 bg-stone-100 dark:bg-[#2D141E]/90 backdrop-blur-md border border-stone-300 dark:border-[#E5C158]/35 rounded-full px-3 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)] whitespace-nowrap">
                {/* Language Dropdown / Pill Switcher */}
                <select
                  value={locale}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent text-xs text-stone-800 dark:text-[#E5C158] font-semibold outline-none cursor-pointer"
                  title="Select Application Language"
                >
                  {availableLocales.map((l) => (
                    <option key={l.code} value={l.code} className="bg-white dark:bg-[#2D141E] text-stone-900 dark:text-[#E5C158]">
                      {l.code} ({l.nativeName})
                    </option>
                  ))}
                </select>

                <span className="w-px h-3.5 bg-stone-300 dark:bg-[#E5C158]/30" />

                {/* Dark / Light Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="text-stone-700 dark:text-[#E5C158] hover:scale-110 transition-transform text-xs cursor-pointer flex items-center"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                <span className="w-px h-3.5 bg-stone-300 dark:bg-[#E5C158]/30" />

                {/* User Handle & Logout */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-stone-800 dark:text-[#FAF6F0]">
                    {userHandle}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] text-rose-500 hover:text-rose-400 font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    [{t('nav.logout', 'Log out')}]
                  </button>
                </div>
              </div>
            )}

            {/* Engine Health Status Indicator */}
            <div className="flex items-center gap-1.5 pl-1 flex-shrink-0">
              <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${apiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[11px] font-mono text-stone-600 dark:text-[#E5C158]/80 whitespace-nowrap font-medium hidden md:inline">
                {apiConnected ? t('nav.engineReady', 'Engine Ready') : t('nav.connecting', 'Connecting...')}
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Row: Navigation Tabs Strip (Scrollable & Wrap-Safe) */}
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-stone-200/70 dark:border-[#E5C158]/15">
          {/* 1. Daily Briefing */}
          <button
            type="button"
            onClick={() => setActiveTab('briefing')}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'briefing'
                ? 'bg-gradient-to-r from-[#6D1B26] to-[#990033] text-[#E5C158] border border-[#E5C158]/50 shadow-[0_0_15px_rgba(229,193,88,0.2)] font-semibold'
                : 'text-stone-700 dark:text-[#FAF6F0]/80 hover:text-stone-900 dark:hover:text-[#E5C158] hover:bg-stone-100 dark:hover:bg-[#2D141E]/70 border border-transparent'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 flex-shrink-0 text-[#E5C158]" />
            <span>{t('nav.dailyBriefing', 'Daily Briefing')}</span>
          </button>

          {/* 2. Editorial Desk */}
          <button
            type="button"
            onClick={() => setActiveTab('editorial')}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'editorial'
                ? 'bg-gradient-to-r from-[#6D1B26] to-[#990033] text-[#E5C158] border border-[#E5C158]/50 shadow-[0_0_15px_rgba(229,193,88,0.2)] font-semibold'
                : 'text-stone-700 dark:text-[#FAF6F0]/80 hover:text-stone-900 dark:hover:text-[#E5C158] hover:bg-stone-100 dark:hover:bg-[#2D141E]/70 border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5 flex-shrink-0 text-[#E5C158]" />
            <span>{t('nav.editorialDesk', 'Editorial Desk')}</span>
          </button>

          {/* 3. WhatsApp Forward */}
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-[#008069] text-white shadow-md font-semibold border border-emerald-400/40'
                : 'text-stone-700 dark:text-[#FAF6F0]/80 hover:text-[#008069] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-emerald-300" />
            <span>{t('nav.whatsAppForward', 'WhatsApp Forward')}</span>
          </button>

          {/* 4. Registry & History */}
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-[#6D1B26] to-[#990033] text-[#E5C158] border border-[#E5C158]/50 shadow-[0_0_15px_rgba(229,193,88,0.2)] font-semibold'
                : 'text-stone-700 dark:text-[#FAF6F0]/80 hover:text-stone-900 dark:hover:text-[#E5C158] hover:bg-stone-100 dark:hover:bg-[#2D141E]/70 border border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5 flex-shrink-0 text-[#E5C158]" />
            <span>{t('nav.registryHistory', 'Registry & History')}</span>
          </button>

          {/* 5. 13-Stage Architecture */}
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-gradient-to-r from-[#6D1B26] to-[#990033] text-[#E5C158] border border-[#E5C158]/50 shadow-[0_0_15px_rgba(229,193,88,0.2)] font-semibold'
                : 'text-stone-700 dark:text-[#FAF6F0]/80 hover:text-stone-900 dark:hover:text-[#E5C158] hover:bg-stone-100 dark:hover:bg-[#2D141E]/70 border border-transparent'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5 flex-shrink-0 text-[#E5C158]" />
            <span>{t('nav.architecture', '13-Stage Architecture')}</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
