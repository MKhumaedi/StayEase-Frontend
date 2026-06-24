import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { id } from './id';
import { currencyService, Currency } from '../services/currencyService';

export type Language = 'en' | 'id';
export type TranslationSchema = typeof id;

export const translations: Record<Language, TranslationSchema> = {
  en,
  id
};

// Standardized Currency Formatter for Indonesian Rupiah
// Formats numbers consistently as "Rp 150.000", "Rp 1.250.000", "Rp 12.500.000", etc.
// Scales low USD-range values (e.g., < 50,050) by 1,000 to match realistic Rupiah rates
export function formatCurrencyIDR(val: number): string {
  return currencyService.format(val);
}

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationSchema;
  formatCurrencyIDR: (val: number) => string;
  currency: Currency;
  setCurrency: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('stayease_lang');
    return (saved === 'en' || saved === 'id') ? (saved as Language) : 'id';
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    return currencyService.getCurrentCurrency();
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('stayease_lang', lang);
  };

  const setCurrency = (code: string) => {
    currencyService.setCurrency(code);
    setCurrencyState(currencyService.getCurrentCurrency());
  };

  const t = translations[language];

  const formatIDR = (val: number) => {
    return currencyService.format(val, currency.code);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatCurrencyIDR: formatIDR, currency, setCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

