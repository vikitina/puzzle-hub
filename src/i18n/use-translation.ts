import { usePreferences } from '../preferences/use-preferences';
import { getTranslation } from './translate';
import type { TranslationValues } from './translate';
import type { TranslationKey } from './types';

export function useTranslation() {
  const { language } = usePreferences();

  return {
    language,
    t: (key: TranslationKey, values?: TranslationValues) =>
      getTranslation(language, key, values),
  };
}