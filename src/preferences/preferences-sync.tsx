import { useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyDocumentPreferences } from './initialize-preferences';
import { usePreferencesStore } from './preferences-store';
import { preferencesSearch, resolvePreferences } from './preferences';

export default function PreferencesSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const language = usePreferencesStore((state) => state.language);
  const theme = usePreferencesStore((state) => state.theme);
  const preferences = resolvePreferences(location.search, { language, theme });

  useLayoutEffect(() => {
    const next = { language: preferences.language, theme: preferences.theme };
    const store = usePreferencesStore.getState();

    if (store.language !== next.language || store.theme !== next.theme) {
      store.setPreferences(next);
    }

    applyDocumentPreferences(next);

    const search = preferencesSearch(location.search, next);

    if (search !== location.search) {
      void navigate(
        { pathname: location.pathname, search, hash: location.hash },
        {
          replace: true,
          state: location.state,
          preventScrollReset: true,
        },
      );
    }
  }, [location, navigate, preferences.language, preferences.theme]);

  return null;
}