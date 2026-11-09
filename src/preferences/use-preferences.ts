import { useLocation, useNavigate } from 'react-router-dom';
import type { Language } from '../i18n/config';
import { usePreferencesStore } from './preferences-store';
import { preferencesSearch, resolvePreferences } from './preferences';
import type { Preferences, Theme } from './preferences';

export function usePreferences() {
  const location = useLocation();
  const navigate = useNavigate();
  const language = usePreferencesStore((state) => state.language);
  const theme = usePreferencesStore((state) => state.theme);
  const preferences = resolvePreferences(location.search, { language, theme });

  const update = (patch: Partial<Preferences>) => {
    const next = { ...preferences, ...patch };

    void navigate(
      {
        pathname: location.pathname,
        search: preferencesSearch(location.search, next),
        hash: location.hash,
      },
      { replace: true, state: location.state, preventScrollReset: true },
    );
  };

  return {
    ...preferences,
    setLanguage: (next: Language) => update({ language: next }),
    setTheme: (next: Theme) => update({ theme: next }),
    toggleTheme: () =>
      update({ theme: preferences.theme === 'light' ? 'dark' : 'light' }),
    linkTo: (pathname: string) => ({
      pathname,
      search: preferencesSearch('', preferences),
    }),
  };
}