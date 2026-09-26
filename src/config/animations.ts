// src/config/animations.ts
// Тайминги анимаций. Кадры при 60fps.

export const ANIMATIONS = {
  // Впитывание чернил пользователя
  ABSORPTION_FRAMES: 180,          // ~3 сек
  ABSORPTION_DEFAULT_DURATION: 3000, // если пользователь не печатал

  // Дебаунс ввода
  INPUT_DEBOUNCE_MS: 1200,

  // Появление / пауза / исчезновение ответа Тома
  RESPONSE_FRAMES: 300,            // ~5 сек
  RESPONSE_PAUSE_MS: 5000,

  // Crucio
  CRUCIO_CRACKS_FRAMES: 200,       // фаза появления трещин

  // Imperio
  IMPERIO_TRANSITION_FRAMES: 300,

  // Avada Kedavra
  AVADA_FLASH_MS: 100,
  AVADA_VIBRATE_MS: 200,
  AVADA_FREEZE_DELAY_MS: 2000,     // до while(true)
} as const;