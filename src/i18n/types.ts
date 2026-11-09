import type { en } from './locales/en';

export type Dictionary = typeof en;

type LeafPaths<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends object
      ? `${Key}.${LeafPaths<T[Key]>}`
      : never;
}[keyof T & string];

export type TranslationKey = LeafPaths<Dictionary>;