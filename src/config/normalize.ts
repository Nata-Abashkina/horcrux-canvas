// Символы, которые OCR часто путает между алфавитами.
// Русские → латинские визуальные двойники и наоборот.

const RU_TO_LAT: Record<string, string> = {
  'а': 'a', 'в': 'b', 'е': 'e', 'к': 'k', 'м': 'm',
  'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't',
  'у': 'y', 'х': 'x',
};

const LAT_TO_RU: Record<string, string> = {
  'a': 'а', 'b': 'в', 'e': 'е', 'k': 'к', 'm': 'м',
  'h': 'н', 'o': 'о', 'p': 'р', 'c': 'с', 't': 'т',
  'y': 'у', 'x': 'х',
};

/**
 * Приводит текст к русскому виду: латинские двойники → русские.
 * Например, "Kpyциo" → "круцио".
 */
export const normalizeToRu = (text: string): string => {
  const lower = text.toLowerCase();
  let out = '';
  for (const ch of lower) {
    out += LAT_TO_RU[ch] ?? ch;
  }
  return out;
};

/**
 * Приводит текст к английскому виду: русские двойники → латинские.
 * Например, "crюcio" → "crucio".
 */
export const normalizeToEn = (text: string): string => {
  const lower = text.toLowerCase();
  let out = '';
  for (const ch of lower) {
    out += RU_TO_LAT[ch] ?? ch;
  }
  return out;
};