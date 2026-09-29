// src/easterEggs/config/lore.hp.config.ts
// Весь лор Гарри Поттера: цвета, пропорции, тайминги пасхалок.
// Ядро сюда не лазает. Замена лора = замена этого файла + effects/ + lore.hp.ts + lang.*.

export const LORE_HP = {
  colors: {
    // Ввод и ответ Тома в особых пасхалках
    USER_INK_CRUCIO: '#2a0a00',
    TOM_INK_CRUCIO: '#1a0000',
    TOM_INK_NAGINI: '#1a0000',
    TOM_INK_AVADA: '#1a0000',

    // Imperio
    IMPERIO_STRIKE: '#1a1a1a',
    IMPERIO_OVERLAY: '#6b0f1a',
    IMPERIO_RESPONSE: '#1a1a3a',

    // Avada Kedavra
    AVADA_FLASH: '#00ff00',
    AVADA_TEXT: '#1a0000',

    // Nagini
    NAGINI_TEXT: '#1a0000',

    // Crucio
    CRUCIO_GLOW: '#fff8e0',
    CRUCIO_LINE: '#2a0a00',

    // Свечения факультетов (базовый цвет, alpha добавляется в BaseImageEgg)
    GLOW_GRYFFINDOR: 'rgba(180, 30, 30, ',
    GLOW_HUFFLEPUFF: 'rgba(255, 200, 0, ',
    GLOW_RAVENCLAW: 'rgba(0, 100, 200, ',
    GLOW_SLYTHERIN: 'rgba(0, 150, 50, ',

    // Общий цвет текста ответа в пасхалках с картинкой
    EGG_TEXT_DEFAULT: '#1a1a3a',
  },

  layout: {
    // Общие пропорции для пасхалок с картинкой
    EGG_IMAGE_SIZE_RATIO: 0.5,
    EGG_FONT_SIZE_RATIO: 0.06,
    EGG_LINE_HEIGHT_RATIO: 1.3,
    EGG_TEXT_START_Y_NORMAL: 0.65,
    EGG_IMAGE_Y_TOP: 0.1,

    // Avada — крупнее
    AVADA_FONT_SIZE_RATIO: 0.08,
    AVADA_LINE_HEIGHT_RATIO: 1.2,
    AVADA_TEXT_START_Y: 0.3,

    // Nagini
    NAGINI_FONT_SIZE_RATIO: 0.05,
    NAGINI_LINE_HEIGHT_RATIO: 1.4,
    NAGINI_TEXT_START_Y: 0.15,

    // Imperio
    IMPERIO_FONT_SIZE_RATIO: 0.05,
    IMPERIO_LINE_HEIGHT_RATIO: 1.4,
    IMPERIO_TEXT_START_Y: 0.15,
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
    CRUCIO_TEXT_START_Y: 0.25,
    CRUCIO_FONT_SIZE_RATIO: 0.06,
    CRUCIO_LINE_HEIGHT_RATIO: 1.4,

    // BaseImageEgg
    BASE_IMAGE_MULTIPLY_ALPHA: 0.2,
  },

  animations: {
    // Общий цикл появление/пауза/исчезновение
    EGG_FADE_FRAMES: 300,
    EGG_FADE_PAUSE_MS: 5000,

    // Avada
    AVADA_FLASH_MS: 100,
    AVADA_VIBRATE_MS: 200,
    AVADA_FREEZE_DELAY_MS: 2000,

    // Crucio
    CRUCIO_CRACKS_FRAMES: 200,
    CRUCIO_TEXT_FRAMES: 300,
    CRUCIO_TEXT_PAUSE_MS: 5000,

    // Imperio
    IMPERIO_TRANSITION_FRAMES: 300,
    IMPERIO_PAUSE_MS: 5000,
  },
} as const;

// Короткие алиасы
export const LORE_COLORS = LORE_HP.colors;
export const LORE_LAYOUT = LORE_HP.layout;
export const LORE_ANIMATIONS = LORE_HP.animations;