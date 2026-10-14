// Единый источник правды для карты языков.
// Импортируется и в main.ts, и в DiaryModel.

import { langRU } from './lang.ru';
import { langEN } from './lang.en';
import type { ILangInterface } from './lang.interface';

export const LANGUAGES_MAP: Record<string, ILangInterface> = {
  ru: langRU,
  en: langEN,
}