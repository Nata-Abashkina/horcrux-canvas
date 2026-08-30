import { langEn } from "../config/lang.en";
import type { ILangInterface } from "../config/lang.interface";
import { langRU } from "../config/lang.ru";
import type { IDiaryModel, IAIResponse } from "../types";

export class DiaryModel implements IDiaryModel {
  private _isAILoading: boolean = false;
  private _inputLock: boolean = false;
  private _activeConfig: ILangInterface;
  private _text: string = '';
  private _aiResponse: IAIResponse | null = null;
  
  public readonly languagesMap: Record<string, ILangInterface> = { ru: langRU, en: langEn };
  public onDataChanged: (() => void) | null = null;

  constructor(initialConfig: ILangInterface) {
    this._activeConfig = initialConfig;
  }

  get isLoading(): boolean {
    return this._isAILoading;
  }

  set isLoading(value: boolean) {
    this._isAILoading = value;
    if (this.onDataChanged) {
      this.onDataChanged();
    }
  }

  get isLocked(): boolean {
    return this._inputLock;
  }

  set isLocked(value: boolean) {
    this._inputLock = value;
    if (this.onDataChanged) {
      this.onDataChanged();
    }
  }

  get config(): ILangInterface {
    return this._activeConfig;
  }

  set config(value: ILangInterface) {
    this._activeConfig = value;
    if (this.onDataChanged) {
      this.onDataChanged();
    }
  }

  get languages(): Record<string, ILangInterface> {
    return this.languagesMap;
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
    if (this.onDataChanged) {
      this.onDataChanged();
    }
  }

  // НОВОЕ: Геттер и сеттер для ответа ИИ
  get aiResponse(): IAIResponse | null {
    return this._aiResponse;
  }

  set aiResponse(value: IAIResponse | null) {
    this._aiResponse = value;
    if (this.onDataChanged) {
      this.onDataChanged();
    }
  }
}


/*

  // Сюда мы сейчас добавим методы управления
  switchLanguage(lang: string):void {
    if (this.languagesMap[lang]) {
      this.activeConfig = this.languagesMap[lang]; // <- вставьте сюда имя параметра lang, чтобы вытащить нужный конфиг
    }
    this.isAILoading = false;
    this.inputLock = false;
    this.strokeService.clear();
  }

  validateInput(rawText: string): string {
  // Наш каноничный «Эффект Кляксы»
    if (rawText.trim().length === 0) {
      this.strokeService.clear(); 
      return ""; 
    }
  
  // Прогоняем текст через ваш сервис валидации
    const response = this.guardrails.validate(rawText, this.activeConfig);

  // Если это спам или абьюз — сразу возвращаем фразу-отпор
    if (response.status === 'ABUSE' || response.status === 'SPAM') {
      return response.responseText || '';
    }

  // Если всё чисто — отдаем Презентеру очищенный текст
    return response.cleanedText;
  }

  async requestAI(validText: string): Promise<string> {
  // Включаем рубильники блокировки Дневника
    this.isAILoading = true;
    this.inputLock = true;

  // Имитируем задержку сети в 1 секунду перед ответом Тома Реддла
    await new Promise(resolve => setTimeout(resolve, 1000));

  // Выключаем блокировку — Дневник снова готов слушать
    this.isAILoading = false;
    this.inputLock = false;
  
  // Возвращаем «Принцип Эхо»: Том Реддл просто зеркалит очищенный текст обратно
    return validText;
  }

  // 1. Метод для добавления новой точки штриха
  addStrokePoint(pixelX: number, pixelY: number, canvasWidth: number, canvasHeight: number, isStartOfStroke: boolean): void {
  // Перенаправляем сырые пиксели в сервис, где они превратятся в относительные проценты
    this.strokeService.addPoint(pixelX, pixelY, canvasWidth, canvasHeight, isStartOfStroke);
  }

// 2. Метод для получения всех накопленных точек (нужен Презентеру для отрисовки)
  public getStrokePoints(): IStrokePoint[] {
  // Просто отдаем наружу массив точек из сервиса штрихов
    return this.strokeService.getPoints();
  }

}*/