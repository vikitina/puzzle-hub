import { DEFAULT_LANGUAGE, isLanguage } from '../i18n/config';
import type { Language } from '../i18n/config';

export type Theme = 'light' | 'dark';
export interface Preferences {
  language: Language;
  theme: Theme;
}

export const DEFAULT_PREFERENCES: Preferences = {
  language: DEFAULT_LANGUAGE,
  theme: 'light',
};

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

export function normalizePreferences(
  value: unknown,
  fallback: Preferences = DEFAULT_PREFERENCES,
): Preferences {
  const record =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

  return {
    language: isLanguage(record.language) ? record.language : fallback.language,
    theme: isTheme(record.theme) ? record.theme : fallback.theme,
  };
}

export function resolvePreferences(search: string, fallback: Preferences): Preferences {
  const params = new URLSearchParams(search);

  return normalizePreferences(
    {
      language: params.get('lang'),
      theme: params.get('theme'),
    },
    fallback,
  );
}

export function preferencesSearch(search: string, preferences: Preferences): string {
  const params = new URLSearchParams(search);
  params.set('lang', preferences.language);
  params.set('theme', preferences.theme);

  return `?${params.toString()}`;
}