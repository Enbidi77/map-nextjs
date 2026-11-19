import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_LOCALE,
  LANGUAGES,
  SUPPORTED_LOCALES,
  isLocale,
  translate,
  translations,
  useI18nStore,
  useTranslation,
  useTranslationStore,
  I18N_STORAGE_KEY,
  type Locale,
  type KnownTranslationKey,
} from '../index';

describe('i18n feature', () => {
  describe('Language Metadata & Locale Validation', () => {
    it('defines DEFAULT_LOCALE as "en"', () => {
      expect(DEFAULT_LOCALE).toBe('en');
    });

    it('contains all 6 required locales in SUPPORTED_LOCALES', () => {
      const expectedLocales: Locale[] = ['en', 'vi', 'ko', 'ja', 'zh-CN', 'zh-TW'];
      expect(SUPPORTED_LOCALES).toEqual(expectedLocales);
      expect(SUPPORTED_LOCALES.length).toBe(6);
    });

    it('defines complete metadata for all 6 required languages in LANGUAGES', () => {
      expect(LANGUAGES.length).toBe(6);

      const codes = LANGUAGES.map((lang) => lang.code);
      expect(codes).toEqual(['en', 'vi', 'ko', 'ja', 'zh-CN', 'zh-TW']);

      const en = LANGUAGES.find((l) => l.code === 'en')!;
      expect(en).toBeDefined();
      expect(en.name).toBe('English');
      expect(en.englishName).toBe('English');
      expect(en.flag).toBeTruthy();

      const vi = LANGUAGES.find((l) => l.code === 'vi')!;
      expect(vi).toBeDefined();
      expect(vi.name).toBe('Tiếng Việt');
      expect(vi.englishName).toBe('Vietnamese');
      expect(vi.flag).toBeTruthy();

      const ko = LANGUAGES.find((l) => l.code === 'ko')!;
      expect(ko).toBeDefined();
      expect(ko.name).toBe('한국어');
      expect(ko.englishName).toBe('Korean');
      expect(ko.flag).toBeTruthy();

      const ja = LANGUAGES.find((l) => l.code === 'ja')!;
      expect(ja).toBeDefined();
      expect(ja.name).toBe('日本語');
      expect(ja.englishName).toBe('Japanese');
      expect(ja.flag).toBeTruthy();

      const zhCN = LANGUAGES.find((l) => l.code === 'zh-CN')!;
      expect(zhCN).toBeDefined();
      expect(zhCN.name).toBe('简体中文');
      expect(zhCN.englishName).toBe('Simplified Chinese');
      expect(zhCN.flag).toBeTruthy();

      const zhTW = LANGUAGES.find((l) => l.code === 'zh-TW')!;
      expect(zhTW).toBeDefined();
      expect(zhTW.name).toBe('繁體中文');
      expect(zhTW.englishName).toBe('Traditional Chinese');
      expect(zhTW.flag).toBeTruthy();
    });

    it('correctly validates locales using isLocale', () => {
      // Valid locales
      expect(isLocale('en')).toBe(true);
      expect(isLocale('vi')).toBe(true);
      expect(isLocale('ko')).toBe(true);
      expect(isLocale('ja')).toBe(true);
      expect(isLocale('zh-CN')).toBe(true);
      expect(isLocale('zh-TW')).toBe(true);

      // Invalid locales
      expect(isLocale('fr')).toBe(false);
      expect(isLocale('de')).toBe(false);
      expect(isLocale('es')).toBe(false);
      expect(isLocale('')).toBe(false);
      expect(isLocale('EN')).toBe(false);
      expect(isLocale(null)).toBe(false);
      expect(isLocale(undefined)).toBe(false);
      expect(isLocale(123)).toBe(false);
      expect(isLocale({})).toBe(false);
    });
  });

  describe('Translations Dictionary', () => {
    const requiredKeys: KnownTranslationKey[] = [
      'nav.brand',
      'nav.subtitle',
      'nav.searchPlaceholder',
      'nav.searchPlaceholderMobile',
      'nav.directions',
      'nav.savedPlaces',
      'nav.saved',
      'nav.layers',
      'nav.layersAndStyles',
      'nav.mySavedPlaces',
      'nav.exploreMap',
      'nav.signOut',
      'nav.signIn',
      'nav.language',
      'nav.theme',
      'nav.onlineSession',
      'nav.sessionActive',
      'nav.sessionConnecting',
      'nav.sessionSolo',
      'nav.sessionCollaborators',
      'nav.collapseSidebar',
      'nav.expandSidebar',
      'nav.userMenu',
      'nav.guestMenu',
      'nav.signedIn',
      'common.save',
      'common.cancel',
      'common.close',
      'common.loading',
      // Sidebar
      'sidebar.title',
      'sidebar.explore',
      'sidebar.directions',
      'sidebar.saved',
      // Directions
      'directions.originPlaceholder',
      'directions.destPlaceholder',
      'directions.yourLocation',
      'directions.driving',
      'directions.walking',
      'directions.cycling',
      'directions.transit',
      'directions.getDirections',
      'directions.clear',
      // Place Details
      'place.backToResults',
      'place.directions',
      'place.save',
      'place.saved',
      'place.view3D',
      'place.openNow',
      'place.closed',
      // Auth Modal
      'auth.welcomeBack',
      'auth.createAccount',
      'auth.signInGoogle',
      'auth.signInGithub',
      'auth.submitSignIn',
      'auth.submitSignUp',
      // Map Controls & Measurement
      'map.zoomIn',
      'map.zoomOut',
      'map.switchTo2D',
      'map.switchTo3D',
      'map.findLocation',
      'map.layersAndStyles',
      'measure.distance',
      'measure.area',
      // Mobile
      'mobile.directionsPlanner',
      'mobile.exploreNearby',
    ];

    it('has translation dictionaries defined for all 6 locales', () => {
      SUPPORTED_LOCALES.forEach((locale) => {
        expect(translations[locale]).toBeDefined();
        expect(typeof translations[locale]).toBe('object');
      });
    });

    it('has non-empty values for all required keys across all supported locales', () => {
      SUPPORTED_LOCALES.forEach((locale) => {
        const dict = translations[locale];
        requiredKeys.forEach((key) => {
          const val = dict[key];
          expect(val, `Missing key "${key}" in locale "${locale}"`).toBeDefined();
          expect(typeof val).toBe('string');
          expect(val?.trim().length).toBeGreaterThan(0);
        });
      });
    });

    it('provides accurate native translations for nav.language', () => {
      expect(translations.en['nav.language']).toBe('Language');
      expect(translations.vi['nav.language']).toBe('Ngôn ngữ');
      expect(translations.ko['nav.language']).toBe('언어');
      expect(translations.ja['nav.language']).toBe('言語');
      expect(translations['zh-CN']['nav.language']).toBe('语言');
      expect(translations['zh-TW']['nav.language']).toBe('語言');
    });

    it('provides accurate native translations for nav.brand', () => {
      expect(translations.en['nav.brand']).toBe('Modern Maps');
      expect(translations.vi['nav.brand']).toBe('Bản Đồ Hiện Đại');
      expect(translations.ko['nav.brand']).toBe('모던 맵스');
      expect(translations.ja['nav.brand']).toBe('モダンマップ');
      expect(translations['zh-CN']['nav.brand']).toBe('现代地图');
      expect(translations['zh-TW']['nav.brand']).toBe('現代地圖');
    });
  });

  describe('translate() Function', () => {
    it('translates known keys for each supported locale', () => {
      expect(translate('nav.signIn', 'en')).toBe('Sign In');
      expect(translate('nav.signIn', 'vi')).toBe('Đăng nhập');
      expect(translate('nav.signIn', 'ko')).toBe('로그인');
      expect(translate('nav.signIn', 'ja')).toBe('ログイン');
      expect(translate('nav.signIn', 'zh-CN')).toBe('登录');
      expect(translate('nav.signIn', 'zh-TW')).toBe('登入');
    });

    it('defaults to English when no locale is passed', () => {
      expect(translate('nav.savedPlaces')).toBe('Saved Places');
      expect(translate('common.loading')).toBe('Loading...');
    });

    it('falls back to English when a key is missing in the target locale', () => {
      // Temporarily add a key only in 'en'
      const testKey = '__test.only.in.en__';
      translations.en[testKey] = 'English Only Text';

      try {
        expect(translate(testKey, 'vi')).toBe('English Only Text');
        expect(translate(testKey, 'ko')).toBe('English Only Text');
        expect(translate(testKey, 'ja')).toBe('English Only Text');
        expect(translate(testKey, 'zh-CN')).toBe('English Only Text');
        expect(translate(testKey, 'zh-TW')).toBe('English Only Text');
      } finally {
        delete translations.en[testKey];
      }
    });

    it('falls back to the raw key string when missing from all locales', () => {
      const nonExistentKey = 'non.existent.translation.key.xyz';
      expect(translate(nonExistentKey, 'vi')).toBe(nonExistentKey);
      expect(translate(nonExistentKey, 'en')).toBe(nonExistentKey);
    });

    it('interpolates placeholders correctly with params', () => {
      expect(
        translate('nav.sessionCollaborators', 'en', { count: 3 })
      ).toBe('3 active collaborators online.');

      expect(
        translate('nav.sessionCollaborators', 'vi', { count: 5 })
      ).toBe('5 cộng tác viên đang trực tuyến.');

      expect(
        translate('nav.sessionCollaborators', 'ko', { count: 2 })
      ).toBe('2명의 공동 작업자가 온라인 상태입니다.');

      expect(
        translate('nav.sessionCollaborators', 'ja', { count: 4 })
      ).toBe('4人の共同作業者がオンラインです。');

      expect(
        translate('nav.sessionCollaborators', 'zh-CN', { count: 8 })
      ).toBe('8 位协作者在线。');

      expect(
        translate('nav.sessionCollaborators', 'zh-TW', { count: 10 })
      ).toBe('10 位協作者在線。');
    });

    it('supports multiple parameters in custom text', () => {
      const customKey = '__test.multi_params__';
      translations.en[customKey] = 'Hello {name}, you have {count} notifications in {city}.';

      try {
        const result = translate(customKey, 'en', {
          name: 'Alice',
          count: 7,
          city: 'San Francisco',
        });
        expect(result).toBe('Hello Alice, you have 7 notifications in San Francisco.');
      } finally {
        delete translations.en[customKey];
      }
    });
  });

  describe('useI18nStore / useTranslation Hook', () => {
    beforeEach(() => {
      localStorage.clear();
      useI18nStore.setState({ locale: 'en' });
    });

    afterEach(() => {
      localStorage.clear();
      useI18nStore.setState({ locale: 'en' });
    });

    it('exposes useTranslation as an alias of useI18nStore and useTranslationStore', () => {
      expect(useTranslation).toBe(useI18nStore);
      expect(useTranslationStore).toBe(useI18nStore);
    });

    it('initializes with default locale "en" and LANGUAGES list', () => {
      const state = useI18nStore.getState();
      expect(state.locale).toBe('en');
      expect(state.languages).toEqual(LANGUAGES);
    });

    it('allows switching locale to all supported languages and updates t() output', () => {
      const { setLocale } = useI18nStore.getState();

      // Switch to Vietnamese
      setLocale('vi');
      expect(useI18nStore.getState().locale).toBe('vi');
      expect(useI18nStore.getState().t('nav.brand')).toBe('Bản Đồ Hiện Đại');
      expect(useI18nStore.getState().t('nav.directions')).toBe('Chỉ đường');

      // Switch to Korean
      setLocale('ko');
      expect(useI18nStore.getState().locale).toBe('ko');
      expect(useI18nStore.getState().t('nav.brand')).toBe('모던 맵스');
      expect(useI18nStore.getState().t('nav.directions')).toBe('길찾기');

      // Switch to Japanese
      setLocale('ja');
      expect(useI18nStore.getState().locale).toBe('ja');
      expect(useI18nStore.getState().t('nav.brand')).toBe('モダンマップ');
      expect(useI18nStore.getState().t('nav.directions')).toBe('ルート案内');

      // Switch to Simplified Chinese
      setLocale('zh-CN');
      expect(useI18nStore.getState().locale).toBe('zh-CN');
      expect(useI18nStore.getState().t('nav.brand')).toBe('现代地图');
      expect(useI18nStore.getState().t('nav.directions')).toBe('路线');

      // Switch to Traditional Chinese
      setLocale('zh-TW');
      expect(useI18nStore.getState().locale).toBe('zh-TW');
      expect(useI18nStore.getState().t('nav.brand')).toBe('現代地圖');
      expect(useI18nStore.getState().t('nav.directions')).toBe('路線');

      // Switch back to English
      setLocale('en');
      expect(useI18nStore.getState().locale).toBe('en');
      expect(useI18nStore.getState().t('nav.brand')).toBe('Modern Maps');
      expect(useI18nStore.getState().t('nav.directions')).toBe('Directions');
    });

    it('ignores invalid locale values in setLocale', () => {
      const { setLocale } = useI18nStore.getState();
      useI18nStore.setState({ locale: 'en' });

      // Attempt to set invalid locales
      setLocale('invalid' as Locale);
      expect(useI18nStore.getState().locale).toBe('en');

      setLocale('fr' as Locale);
      expect(useI18nStore.getState().locale).toBe('en');

      setLocale('' as Locale);
      expect(useI18nStore.getState().locale).toBe('en');
    });

    it('persists selected locale to localStorage', () => {
      const { setLocale } = useI18nStore.getState();

      setLocale('vi');

      // Should save raw locale key
      expect(localStorage.getItem('locale')).toBe('vi');

      // Should save Zustand persisted storage key
      const persistedState = localStorage.getItem(I18N_STORAGE_KEY);
      expect(persistedState).toBeTruthy();
      const parsed = JSON.parse(persistedState!);
      expect(parsed.state.locale).toBe('vi');
    });

    it('preserves parameter interpolation through the store t() method', () => {
      const { setLocale, t } = useI18nStore.getState();
      setLocale('vi');

      const message = t('nav.sessionCollaborators', { count: 3 });
      expect(message).toBe('3 cộng tác viên đang trực tuyến.');
    });
  });
});
