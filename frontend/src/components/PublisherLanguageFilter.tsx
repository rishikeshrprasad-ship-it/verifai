import React from 'react';
import { Globe, Search, Filter, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface PublisherLanguageFilterProps {
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  languageCounts: Record<string, number>;
  languages: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  filteredCount: number;
}

export const PublisherLanguageFilter: React.FC<PublisherLanguageFilterProps> = ({
  selectedLanguage,
  onSelectLanguage,
  languageCounts,
  languages,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  filteredCount,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl border border-slate-200 dark:border-[#E5C158]/30 rounded-xl p-4 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)] space-y-3 transition-colors">
      {/* Row 1: Header + Pill Strip */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-[#E5C158] font-bold flex items-center space-x-1.5">
            <Globe className="w-4 h-4 text-slate-700 dark:text-[#E5C158] flex-shrink-0" />
            <span>{t('briefing.filterLanguage', 'PUBLISHER LANGUAGE FILTER:')}</span>
          </span>
          <span className="text-xs font-mono text-slate-500 dark:text-[#D4B29E]">
            {t('briefing.showingPublications', 'Showing {count} publications').replace('{count}', String(filteredCount))}
          </span>
        </div>

        {/* Horizontal scrollable or wrap-safe pill strip */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {languages.map((lang) => {
            const count = languageCounts[lang] ?? 0;
            const isSelected = selectedLanguage.toLowerCase() === lang.toLowerCase();
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onSelectLanguage(lang)}
                className={`flex-shrink-0 flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] text-white dark:text-[#E5C158] font-semibold shadow-sm dark:shadow-[0_0_15px_rgba(229,193,88,0.2)] ring-1 ring-slate-900 dark:ring-[#E5C158]/50 border border-transparent dark:border-[#E5C158]/50'
                    : 'bg-slate-100 dark:bg-[#200C12] hover:bg-slate-200 dark:hover:bg-[#381624] text-slate-700 dark:text-[#D4B29E] border border-transparent dark:border-[#E5C158]/25 font-medium'
                }`}
              >
                <span>{lang}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                    isSelected
                      ? 'bg-slate-700 dark:bg-[#4A1C2C] text-white dark:text-[#E5C158]'
                      : 'bg-slate-200 dark:bg-[#2D141E] text-slate-600 dark:text-[#D4B29E]/80'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Search + Topic Select */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2.5 border-t border-slate-100 dark:border-[#E5C158]/15">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#E5C158]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('briefing.searchPlaceholder', "Search front-page headlines, topics, or publications (e.g. 'ISRO', 'Supreme Court', 'Dinamani')...")}
            className="w-full pl-10 pr-9 py-2 rounded-lg border border-slate-200 dark:border-[#E5C158]/30 bg-slate-50/50 dark:bg-black/40 hover:bg-white dark:hover:bg-black/50 focus:bg-white dark:focus:bg-black/60 text-xs sm:text-sm font-sans placeholder:text-slate-400 dark:placeholder-[#E5C158]/45 text-slate-900 dark:text-[#FAF6F0] focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-[#E5C158]/40 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#E5C158]/70 hover:text-slate-600 dark:hover:text-[#E5C158] p-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#200C12] transition-colors cursor-pointer"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Topic Select */}
        <div className="flex items-center space-x-2 w-full sm:w-auto flex-shrink-0">
          <span className="text-xs font-mono text-slate-500 dark:text-[#E5C158] flex items-center space-x-1 flex-shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-[#E5C158]/70" />
            <span>Topic:</span>
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-[#E5C158]/30 text-xs sm:text-sm font-sans bg-white dark:bg-[#200C12] text-slate-700 dark:text-[#E5C158] hover:border-slate-300 dark:hover:border-[#E5C158]/60 focus:outline-none focus:ring-2 focus:ring-slate-800 dark:focus:ring-[#E5C158]/40 cursor-pointer shadow-2xs transition-colors"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-white dark:bg-[#2D141E] text-slate-800 dark:text-[#FAF6F0]">
                {c === 'All' ? t('briefing.allTopics', 'All Topics') : c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
