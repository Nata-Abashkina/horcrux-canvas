import { createWorker } from 'tesseract.js';
import type { Worker } from 'tesseract.js';
import type { IOCRService } from '../types';

const OCR_TIMEOUT_MS = 15000;
const WARMUP_TIMEOUT_MS = 30000;

export class OCRService implements IOCRService {
  private worker: Worker | null = null;
  private currentLang: string | null = null;
  private initPromise: Promise<Worker> | null = null;

  /**
   * Ленивая предзагрузка. Вызывать при первом pointerdown на canvas
   * (или при загрузке страницы, если не жалко трафика).
   * Идемпотентна: повторные вызовы вернут тот же промис.
   */
  async preload(langCode: string): Promise<void> {
    if (this.worker && this.currentLang === langCode) return;
    if (this.initPromise) return this.initPromise.then(() => undefined);

    this.initPromise = this.createAndWarmup(langCode);
    try {
      await this.initPromise;
    } catch {
      // прогреву не удалось — не страшно, recognize попробует ещё раз
      this.initPromise = null;
    }
  }

  private async createAndWarmup(langCode: string): Promise<Worker> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }

    const worker = await createWorker(langCode);
    this.worker = worker;
    this.currentLang = langCode;

    // Прогрев: прогоняем пустой canvas, чтобы WASM и модели
    // были полностью инициализированы до первого реального ввода.
    try {
      const warmup = document.createElement('canvas');
      warmup.width = 32;
      warmup.height = 32;
      await Promise.race([
        worker.recognize(warmup),
        new Promise((_, rej) => setTimeout(() => rej(new Error('warmup timeout')), WARMUP_TIMEOUT_MS)),
      ]);
    } catch {
      // прогрев не критичен
    }

    return worker;
  }

  async recognize(canvasElement: HTMLCanvasElement, langCode: string): Promise<string> {
    try {
      // Если воркер ещё не готов — ждём предзагрузку или создаём сейчас
      if (!this.worker || this.currentLang !== langCode) {
        if (this.initPromise && this.currentLang === langCode) {
          await this.initPromise;
        } else {
          this.initPromise = this.createAndWarmup(langCode);
          await this.initPromise;
        }
      }

      if (!this.worker) return '';

      const result = await Promise.race([
        this.worker.recognize(canvasElement),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('ocr timeout')), OCR_TIMEOUT_MS),
        ),
      ]);

      return result.data.text.trim();

    } catch {
      // При таймауте или ошибке — убиваем воркер, чтобы следующий
      // вызов создал чистый. Иначе можно застрять на битом состоянии.
      if (this.worker) {
        try { await this.worker.terminate(); } catch { /* ignore */ }
        this.worker = null;
        this.currentLang = null;
        this.initPromise = null;
      }
      return '';
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      try { await this.worker.terminate(); } catch { /* ignore */ }
      this.worker = null;
      this.currentLang = null;
      this.initPromise = null;
    }
  }
}