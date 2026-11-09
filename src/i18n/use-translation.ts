import { usePreferences } from '../preferences/use-preferences';
import { getTranslation } from './translate';
import type { TranslationKey } from './types';

export function useTranslation() {
  const { language } = usePreferences();

  return { language, t: (key: TranslationKey) => getTranslation(language, key) };
}