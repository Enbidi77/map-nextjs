import type { LanguageMetadata, Locale, TranslationsDictionary } from './types';
import en from './locales/en.json';
import vi from './locales/vi.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';

export const DEFAULT_LOCALE: Locale = 'en';

export const LANGUAGES: LanguageMetadata[] = [
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'vi',
    name: 'Tiếng Việt',
    englishName: 'Vietnamese',
    flag: '🇻🇳',
  },
  {
    code: 'ko',
    name: '한국어',
    englishName: 'Korean',
    flag: '🇰🇷',
  },
  {
    code: 'ja',
    name: '日本語',
    englishName: 'Japanese',
    flag: '🇯🇵',
  },
  {
    code: 'zh-CN',
    name: '简体中文',
    englishName: 'Simplified Chinese',
    flag: '🇨🇳',
  },
  {
    code: 'zh-TW',
    name: '繁體中文',
    englishName: 'Traditional Chinese',
    flag: '🇹🇼',
  },
];

export const translations: TranslationsDictionary = {
  en: en as Record<string, string>,
  vi: vi as Record<string, string>,
  ko: ko as Record<string, string>,
  ja: ja as Record<string, string>,
  'zh-CN': zhCN as Record<string, string>,
  'zh-TW': zhTW as Record<string, string>,
};

export const SUPPORTED_LOCALES: Locale[] = ['en', 'vi', 'ko', 'ja', 'zh-CN', 'zh-TW'];

export function isLocale(val: unknown): val is Locale {
  return typeof val === 'string' && SUPPORTED_LOCALES.includes(val as Locale);
}

/**
 * Translate a key into the given locale with fallback to English, then the key itself.
 * Supports placeholder interpolation using `{key}`.
 */
export function translate(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  params?: Record<string, string | number>
): string {
  const dict = translations[locale] || translations[DEFAULT_LOCALE];
  let text = dict[key] ?? translations[DEFAULT_LOCALE]?.[key] ?? key;

  if (params && typeof text === 'string') {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    });
  }

  return text;
}
