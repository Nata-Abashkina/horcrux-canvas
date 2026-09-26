// src/config/debug.ts
// Флаги для отладки. В проде — false.

export const DEBUG = {
  OCR: false,      // console.log в OCRService
  CANVAS: false,   // console.error в CanvasPresenter (ошибки OCR)
} as const;