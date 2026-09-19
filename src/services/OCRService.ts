import { createWorker } from 'tesseract.js';
import type { Worker } from 'tesseract.js';
import type { IOCRService } from '../types';

export class OCRService implements IOCRService {
  private worker: Worker | null = null;
  private currentLang: string | null = null;

  async recognize(canvasElement: HTMLCanvasElement, langCode: string): Promise<string> {
    console.log('1. OCRService.recognize вызван');
    console.log('2. Язык:', langCode);

    try {
      if (this.worker && this.currentLang === langCode) {
        console.log('3. Используем существующий worker');
      } else {
        if (this.worker) {
          console.log('3. Уничтожаем старый worker');
          await this.worker.terminate();
          this.worker = null;
        }

        console.log('4. Создаем новый worker');
        this.currentLang = langCode;
        this.worker = await createWorker(langCode);
        console.log('5. Worker создан');
      }

      console.log('6. Запускаем recognize');
      const result = await this.worker.recognize(canvasElement);
      console.log('7. Recognize завершен');
      console.log('8. Результат (raw):', JSON.stringify(result.data.text));
      console.log('9. Длина:', result.data.text.length);
      console.log('10. После trim:', JSON.stringify(result.data.text.trim()));

      return result.data.text.trim();

    } catch (error) {
      console.error('11. ОШИБКА:', error);
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