import React, { createContext, useContext, useState, useEffect } from 'react';
import { uz, Translations } from './locales/uz';
import { ru } from './locales/ru';
import { en } from './locales/en';

export type Language = 'uz' | 'ru' | 'en';

const translations: Record<Language, Translations> = {
  uz,
  ru,
  en,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'uz',
  setLanguage: () => {},
  t: (path: string) => path,
});

const STORAGE_KEY = 'chairly_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Check saved preference; default to Uzbek ('uz')
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uz' || saved === 'ru' || saved === 'en') {
      return saved;
    }
    return 'uz';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // Ignore storage errors
    }
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to Uzbek if key is missing in target language
        let fallback: any = translations['uz'];
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    if (params) {
      let str = current;
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
      }
      return str;
    }

    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
