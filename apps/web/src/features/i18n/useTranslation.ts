import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LanguageMetadata, Locale, TranslationKey } from './types';
import {
  DEFAULT_LOCALE,
  LANGUAGES,
  isLocale,
  translate,
} from './translations';

export const I18N_STORAGE_KEY = 'modern-maps-locale';

export interface I18nStoreState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey | string, params?: Record<string, string | number>) => string;
  languages: LanguageMetadata[];
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const getInitialLocale = (): Locale => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const persisted = window.localStorage.getItem(I18N_STORAGE_KEY);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed?.state?.locale && isLocale(parsed.state.locale)) {
          return parsed.state.locale;
        }
      }
      const raw = window.localStorage.getItem('locale');
      if (raw && isLocale(raw)) {
        return raw;
      }
    } catch {}
  }
  return DEFAULT_LOCALE;
};

/**
 * Zustand store with localStorage persistence for i18n locale state.
 * Returns { locale, setLocale, t, languages }.
 */
export const useI18nStore = create<I18nStoreState>()(
  persist(
    (set, get) => ({
      locale: getInitialLocale(),
      setLocale: (locale: Locale) => {
        if (!isLocale(locale)) return;
        set({ locale });
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem('locale', locale);
          } catch {}
        }
      },
      t: (key: TranslationKey | string, params?: Record<string, string | number>) => {
        return translate(key, get().locale, params);
      },
      languages: LANGUAGES,
    }),
    {
      name: I18N_STORAGE_KEY,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : dummyStorage)),
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

export const useTranslationStore = useI18nStore;

/**
 * Hook returning i18n helpers:
 * - `locale`: current active locale ('en' | 'vi' | 'ko' | 'ja' | 'zh-CN' | 'zh-TW')
 * - `setLocale`: switch active locale
 * - `t`: translate function with fallback and param interpolation
 * - `languages`: list of supported language metadata
 */
export const useTranslation = useI18nStore;
