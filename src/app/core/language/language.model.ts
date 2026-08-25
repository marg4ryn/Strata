export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'pl', label: 'Polski' },
] as const;

export const SYSTEM_PREFERENCE = 'system' as const;

export type Lang = (typeof LANGUAGES)[number]['value'];
export type LangPreference = Lang | typeof SYSTEM_PREFERENCE;

export const AVAILABLE_LANGS: Lang[] = LANGUAGES.map((l) => l.value);

export const LOCALE_MAP: Record<string, string> = {
  pl: 'pl-PL',
  en: 'en-US',
};

export function getLocaleFromLang(lang: string): string {
  return LOCALE_MAP[lang] ?? lang;
}
