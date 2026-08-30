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
      // Если worker существует и язык тот же - используем его
      if (this.worker && this.currentLang === langCode) {
        console.log('3. Используем существующий worker');
      } else {
        // Если worker существует, но язык другой - уничтожаем
        if (this.worker) {
          console.log('3. Уничтожаем старый worker');
          await this.worker.terminate();
          this.worker = null;
        }
        
        // Создаем новый worker
        console.log('4. Создаем новый worker');
        this.currentLang = langCode;
        this.worker = await createWorker(langCode);
        console.log('5. Worker создан');
      }
      
      console.log('6. Запускаем recognize');
      const result = await this.worker.recognize(canvasElement);
      console.log('7. Recognize завершен');
      console.log('8. Результат:', result.data.text);
      
      return result.data.text.trim();
      
    } catch (error) {
      console.error('9. ОШИБКА:', error);
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







/*import { createWorker, type Worker } from 'tesseract.js';
import type { IOCRService } from '../types';

export class OCRService implements IOCRService {
  private worker: Worker | null = null;

async recognize(canvasElement: HTMLCanvasElement, langCode: string): Promise<string> {
  if (!this.worker) {
    // Первым аргументом передаем язык, вторым OEM-движок (1 = LSTM), третьим — локальные пути
    this.worker = await createWorker(langCode, 1, {
      langPath: window.location.origin + '/assets/tessdata/', // Тянем модель из ваших локальных ассетов
      gzip: false // Кастомные .traineddata лежат без сжатия, отключаем поиск .gz архивов
    });
  }

  const result = await this.worker.recognize(canvasElement);
  const rawText = result.data.text;
  
  return rawText.trim();
}


}*/
