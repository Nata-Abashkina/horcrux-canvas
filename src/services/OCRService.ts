import { createWorker } from 'tesseract.js';
import type { Worker } from 'tesseract.js';
import type { IOCRService } from '../types';

export class OCRService implements IOCRService {
  private worker: Worker | null = null;
  private currentLang: string | null = null;

  async recognize(canvasElement: HTMLCanvasElement, langCode: string): Promise<string> {
    console.log('[OCR] recognize вызван, язык:', langCode);

    try {
      if (this.worker && this.currentLang === langCode) {
        console.log('[OCR] используем существующий worker');
      } else {
        if (this.worker) {
          await this.worker.terminate();
          this.worker = null;
        }
        this.currentLang = langCode;
        console.log('[OCR] создаём worker');
        this.worker = await createWorker(langCode);
        console.log('[OCR] worker создан');
      }

      console.log('[OCR] запускаем recognize');
      const result = await this.worker.recognize(canvasElement);
      const rawText = result.data.text.trim();
      const confidence = result.data.confidence;

      console.log('[OCR] raw:', JSON.stringify(rawText));
      console.log('[OCR] confidence:', confidence);

      // Никаких фильтров. Отдаём как есть.
      return rawText;

    } catch (error) {
      console.error('[OCR] ОШИБКА:', error);
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