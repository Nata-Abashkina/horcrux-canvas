// src/config/visual.ts
// Все цвета приложения. Меняешь здесь — меняется везде.

export const COLORS = {
  // Пользовательский ввод (чернила дневника, антрацит)
  USER_INK: '#2b2b2b',
  USER_INK_CRUCIO: '#2a0a00',

  // Ответы Тома (глубокие чернила)
  TOM_INK: '#1a1a3a',

  // Ответы Тома в особых пасхалках (тёмно-красный оттенок)
  TOM_INK_CRUCIO: '#1a0000',
  TOM_INK_NAGINI: '#1a0000',
  TOM_INK_AVADA: '#1a0000',

  // Imperio
  IMPERIO_STRIKE: '#1a1a1a',
  IMPERIO_OVERLAY: '#6b0f1a',
  IMPERIO_RESPONSE: '#1a1a3a',

  // Avada Kedavra — вспышка
  AVADA_FLASH: '#00ff00',

  // Crucio — трещины
  CRUCIO_GLOW: '#fff8e0',
  CRUCIO_LINE: '#2a0a00',

  // Свечения факультетов (базовый цвет, alpha добавляется в BaseImageEgg)
  GLOW_GRYFFINDOR: 'rgba(180, 30, 30, ',
  GLOW_HUFFLEPUFF: 'rgba(255, 200, 0, ',
  GLOW_RAVENCLAW: 'rgba(0, 100, 200, ',
  GLOW_SLYTHERIN: 'rgba(0, 150, 50, ',
} as const;