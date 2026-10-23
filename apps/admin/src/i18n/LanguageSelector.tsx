import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, Language } from './LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

const LANGUAGES: Array<{ code: Language; label: string; flag: string }> = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false, className = '' }) => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-chairly-border bg-white hover:bg-chairly-panel text-chairly-dark text-xs font-semibold shadow-2xs transition-colors"
      >
        <span className="text-sm">{currentLang.flag}</span>
        {!compact && <span>{currentLang.label}</span>}
        <ChevronDown className="w-3 h-3 text-chairly-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-chairly-border shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLanguage(item.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-chairly-bg transition-colors ${
                item.code === language
                  ? 'text-chairly-terracotta-600 bg-chairly-terracotta-50/50 font-bold'
                  : 'text-chairly-dark'
              }`}
            >
              <span className="text-sm">{item.flag}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
