import { usePreferencesStore } from './preferences-store';
import { preferencesSearch, resolvePreferences } from './preferences';
import { getTranslation } from '../i18n/translate';
import type { Preferences } from './preferences';

export function applyDocumentPreferences(preferences: Preferences): void {
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.lang = preferences.language;
  document.title = getTranslation(preferences.language, 'app.name');
}

export function initializePreferences(): void {
  const store = usePreferencesStore.getState();
  const preferences = resolvePreferences(window.location.search, store);

  store.setPreferences(preferences);
  applyDocumentPreferences(preferences);

  const search = preferencesSearch(window.location.search, preferences);
  const url = `${window.location.pathname}${search}${window.location.hash}`;

  window.history.replaceState(window.history.state, '', url);
}