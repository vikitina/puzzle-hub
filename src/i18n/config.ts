import { en } from './locales/en';
import { uk } from './locales/uk';
import { ru } from './locales/ru';
import type { Dictionary } from './types';

export const LANGUAGES = {
  en: { label: 'English', dictionary: en },
  uk: { label: 'Українська', dictionary: uk },
  ru: { label: 'Русский', dictionary: ru },
} satisfies Record<string, { label: string; dictionary: Dictionary }>;

export type Language = keyof typeof LANGUAGES;
export const DEFAULT_LANGUAGE: Language = 'uk';

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && Object.hasOwn(LANGUAGES, value);
}