import { describe, expect, it } from 'vitest';
import { isLanguage } from '../i18n/config';
import {
  normalizePreferences,
  preferencesSearch,
  resolvePreferences,
} from './preferences';

describe('preferences', () => {
  it('даёт URL приоритет над сохранёнными настройками', () => {
    expect(
      resolvePreferences('?lang=ru&theme=dark', { language: 'en', theme: 'light' }),
    ).toEqual({ language: 'ru', theme: 'dark' });
  });

  it('разрешает параметры независимо друг от друга', () => {
    expect(resolvePreferences('?lang=en', { language: 'uk', theme: 'dark' })).toEqual({
      language: 'en',
      theme: 'dark',
    });
  });

  it('использует сохранённый язык при неизвестном языке URL', () => {
    expect(
      resolvePreferences('?lang=unknown&theme=dark', { language: 'uk', theme: 'light' }),
    ).toEqual({ language: 'uk', theme: 'dark' });
  });

  it('использует сохранённую тему при неправильной теме URL', () => {
    expect(
      resolvePreferences('?lang=ru&theme=wrong', { language: 'en', theme: 'light' }),
    ).toEqual({ language: 'ru', theme: 'light' });
  });

  it('сохраняет посторонние параметры и заменяет дубликаты', () => {
    const params = new URLSearchParams(
      preferencesSearch('?game=42&lang=en&lang=ru', {
        language: 'uk',
        theme: 'dark',
      }),
    );
    expect(params.get('game')).toBe('42');
    expect(params.getAll('lang')).toEqual(['uk']);
    expect(params.get('theme')).toBe('dark');
  });

  it('обрабатывает повреждённые сохранённые данные', () => {
    expect(normalizePreferences({ language: 'removed', theme: 42 })).toEqual({
      language: 'uk',
      theme: 'light',
    });
    expect(normalizePreferences(null)).toEqual({ language: 'uk', theme: 'light' });
  });

  it('не принимает свойства прототипа за языки', () => {
    expect(isLanguage('__proto__')).toBe(false);
    expect(isLanguage('constructor')).toBe(false);
    expect(isLanguage('ru')).toBe(true);
  });
});