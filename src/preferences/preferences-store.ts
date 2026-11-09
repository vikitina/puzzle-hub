import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PREFERENCES, normalizePreferences } from './preferences';
import type { Preferences } from './preferences';

interface PreferencesState extends Preferences {
  setPreferences: (preferences: Preferences) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setPreferences: (preferences) => set(preferences),
    }),
    {
      name: 'puzzle-workshop-preferences',
      version: 1,
      partialize: ({ language, theme }) => ({ language, theme }),
      merge: (persisted, current) => ({
        ...current,
        ...normalizePreferences(persisted, current),
      }),
    },
  ),
);