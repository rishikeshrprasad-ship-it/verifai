import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type {
  SupportedLocale,
  LocaleInfo
} from '../i18n/translations';
import {
  AVAILABLE_LOCALES,
  TRANSLATIONS
} from '../i18n/translations';

export type { SupportedLocale, LocaleInfo };
export { AVAILABLE_LOCALES, TRANSLATIONS };

export interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale | string) => void;
  t: (key: string, fallbackOrParams?: string | Record<string, string | number>) => string;
  languageName: string;
  availableLocales: LocaleInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const saved = localStorage.getItem('fusionx_locale') || localStorage.getItem('verifai_locale');
      if (saved) {
        const upper = saved.toUpperCase() as SupportedLocale;
        if (TRANSLATIONS[upper]) {
          return upper;
        }
      }
    } catch (e) {
      console.warn('Failed to load locale from localStorage:', e);
    }
    return 'EN';
  });

  const setLocale = (newLoc: SupportedLocale | string) => {
    const upper = (newLoc || 'EN').toUpperCase() as SupportedLocale;
    const validated: SupportedLocale = TRANSLATIONS[upper] ? upper : 'EN';
    setLocaleState(validated);
    try {
      localStorage.setItem('fusionx_locale', validated);
      localStorage.setItem('verifai_locale', validated);
    } catch (e) {
      console.warn('Failed to persist locale to localStorage:', e);
    }
  };

  const t = (key: string, fallbackOrParams?: string | Record<string, string | number>): string => {
    const currentDict = TRANSLATIONS[locale] || TRANSLATIONS.EN;
    let template = currentDict[key] || TRANSLATIONS.EN[key];

    if (!template) {
      if (typeof fallbackOrParams === 'string') {
        template = fallbackOrParams;
      } else {
        template = key;
      }
    }

    if (fallbackOrParams && typeof fallbackOrParams === 'object') {
      Object.entries(fallbackOrParams).forEach(([paramKey, paramVal]) => {
        template = template.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return template;
  };

  const languageName = useMemo(() => {
    const found = AVAILABLE_LOCALES.find((l) => l.code === locale);
    return found ? found.name : 'English';
  }, [locale]);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        languageName,
        availableLocales: AVAILABLE_LOCALES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
