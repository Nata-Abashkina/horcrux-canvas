// src/config/layout.ts
// Размеры, отступы, границы адаптива. Всё, что связано с раскладкой текста на холсте.

export const LAYOUT = {
  // Базовый размер шрифта (px)
  BASE_FONT_SIZE: 80,

  // Стартовые координаты пера
  START_X: 50,
  START_Y: 130,

  // Межбуквенный / межстрочный
  LETTER_SPACING: 65,
  LINE_HEIGHT_USER: 130,
  LINE_HEIGHT_TOM: 90,

  // Границы адаптива
  MIN_SCREEN: 320,
  MAX_SCREEN: 1920,

  // Коэффициенты адаптива (от 0.5x до 1x)
  SCALE_MIN: 0.5,
  SCALE_RANGE: 0.5,

  // Пропорции для пасхалок
  EGG_IMAGE_SIZE_RATIO: 0.5,     // размер картинки от min(width, height)
  EGG_FONT_SIZE_RATIO: 0.06,     // размер шрифта от width (большинство)
  EGG_FONT_SIZE_RATIO_AVADA: 0.08, // Avada — крупнее
  EGG_LINE_HEIGHT_RATIO: 1.4,    // lineHeight = fontSize * 1.4
  EGG_LINE_HEIGHT_RATIO_AVADA: 1.2,

  // Стартовые Y для разных пасхалок
  EGG_TEXT_START_Y_NORMAL: 0.25,
  EGG_TEXT_START_Y_NAGINI: 0.15,
  EGG_TEXT_START_Y_AVADA: 0.3,
  EGG_TEXT_START_Y_IMPERIO: 0.15,

  // Позиция картинки пасхалки
  EGG_IMAGE_Y_TOP: 0.1,
  EGG_IMAGE_Y_HUFFLEPUFF_OFFSET: 0.1, // Hufflepuff сдвигает картинку вверх

  // Imperio — особые константы
  IMPERIO_FONT_SIZE_RATIO: 0.05,
  IMPERIO_LINE_HEIGHT_RATIO: 1.4,
  IMPERIO_STRIKE_LINE_COUNT: 8,
  IMPERIO_STRIKE_OFFSET_X: 10,
  IMPERIO_STRIKE_OFFSET_Y_TOP: -30,
  IMPERIO_STRIKE_OFFSET_Y_BOTTOM: 10,
  IMPERIO_STRIKE_RANDOM_RATIO: 0.3,

  // Crucio — генерация трещин
  CRUCIO_COUNT_MIN: 3,
  CRUCIO_COUNT_RANGE: 3,
  CRUCIO_BRANCH_MIN: 2,
  CRUCIO_BRANCH_RANGE: 3,
  CRUCIO_MAIN_STEPS: 12,
  CRUCIO_MAIN_STEP_LEN: 80,
  CRUCIO_BRANCH_STEPS: 5,
  CRUCIO_BRANCH_STEP_LEN: 45,
  CRUCIO_ANGLE_JITTER: 0.9,
  CRUCIO_WIDTH_MIN: 1,
  CRUCIO_WIDTH_RANGE: 1.5,
  CRUCIO_GLOW_ALPHA: 0.35,
  CRUCIO_GLOW_WIDTH: 5,
  CRUCIO_LINE_ALPHA: 0.9,
  CRUCIO_START_RATIO_MIN: 0.15,
  CRUCIO_START_RATIO_RANGE: 0.7,
} as const;