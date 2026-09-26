// src/services/OCRService.ts
import { createWorker } from 'tesseract.js';
import type { Worker } from 'tesseract.js';
import type { IOCRService } from '../types';

export class OCRService implements IOCRService {
  private worker: Worker | null = null;
  private currentLang: string | null = null;

  async recognize(canvasElement: HTMLCanvasElement, langCode: string): Promise<string> {
    try {
      if (this.worker && this.currentLang === langCode) {
        // Переиспользуем существующий worker
      } else {
        if (this.worker) {
          await this.worker.terminate();
          this.worker = null;
        }
        this.currentLang = langCode;
        this.worker = await createWorker(langCode);
      }

      const result = await this.worker.recognize(canvasElement);
      const rawText = result.data.text.trim();

      // Никаких фильтров. Отдаём как есть.
      return rawText;

    } catch {
      return '';
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.currentLang = null;
    }
  }
}