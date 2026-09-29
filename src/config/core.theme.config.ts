// Ядро. Тема приложения. Без лора. Без шрифтов.
// Шрифты — отдельно (fonts.ts), у каждого проекта свои.
// Лор — отдельно (src/easterEggs/config/lore.hp.config.ts).

export const CORE_THEME = {
  colors: {
    USER_INK: '#2b2b2b',
    TOM_INK: '#1a1a3a',
  },
  layout: {
    BASE_FONT_SIZE: 80,
    START_X: 50,
    START_Y: 130,
    LETTER_SPACING: 65,
    LINE_HEIGHT_USER: 130,
    LINE_HEIGHT_TOM: 90,
    MIN_SCREEN: 320,
    MAX_SCREEN: 1920,
    SCALE_MIN: 0.5,
    SCALE_RANGE: 0.5,
  },
  animations: {
    ABSORPTION_FRAMES: 180,
    ABSORPTION_DEFAULT_DURATION: 3000,
    INPUT_DEBOUNCE_MS: 1200,
    RESPONSE_FRAMES: 300,
    RESPONSE_PAUSE_MS: 5000,
  },
} as const;

// Короткие алиасы — чтобы код оставался читаемым.
export const COLORS = CORE_THEME.colors;
export const LAYOUT = CORE_THEME.layout;
export const ANIMATIONS = CORE_THEME.animations;