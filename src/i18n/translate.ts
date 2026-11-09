import { LANGUAGES } from './config';
import type { Language } from './config';
import type { Dictionary, TranslationKey } from './types';

function readTranslation(dictionary: Dictionary, key: string): string | undefined {
  let value: unknown = dictionary;

  for (const part of key.split('.')) {
    if (typeof value !== 'object' || value === null || !Object.hasOwn(value, part)) {
      return undefined;
    }

    value = (value as Record<string, unknown>)[part];
  }

  return typeof value === 'string' ? value : undefined;
}

export function getTranslation(language: Language, key: TranslationKey): string {
  return (
    readTranslation(LANGUAGES[language].dictionary, key) ??
    readTranslation(LANGUAGES.en.dictionary, key) ??
    key
  );
}