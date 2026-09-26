// src/types.ts
import type { ILangInterface } from "./config/lang.interface";

export interface IStrokePoint {
  x: number;     // координата X (от 0 до 1, например 0.5 — это ровно середина ширины)
  y: number;     // координата Y (от 0 до 1, например 0.2 — это верхняя часть высоты)
  isNew: boolean; // флаг: true — если пользователь только прикоснулся (старт новой линии)
}

export interface IPixelPoint {
  x: number;
  y: number;
  isNew: boolean;
}

export interface ICanvasView {
  setDimensions(width: number, height: number, dpr: number): void;
  clear(width: number, height: number): void;
  drawStroke(pixelPoints: IPixelPoint[]): void;
  drawTextChar(char: string, x: number, y: number, font: string): void;
  drawSnapshot(source: HTMLCanvasElement | HTMLImageElement): void;
  drawSnapshotScaled(source: HTMLCanvasElement, width: number, height: number): void;
  setAlpha(alpha: number): void;
  resetFilters(): void;

  // Основной поток: ответ Тома
  drawTextLine(line: string, x: number, y: number, font: string, alpha: number): void;
  measureText(text: string, font: string): number;

  // Впитывание: используется через ctx (см. getContext)
  drawFadingStroke(points: IPixelPoint[], alpha: number, lineWidth: number): void;
  drawFadingChar(char: string, x: number, y: number, font: string, alpha: number): void;

  // Точка расширения: надстройки (пасхалки) получают ctx отсюда.
  // View не знает, зачем. Если надстройку удалить — метод остаётся.
  getContext(): CanvasRenderingContext2D;
}

export interface IInputView {
  updateLangButton(localeName: string): void;
  renderUserText(text: string, x: number, y: number, fontSize: number): void;
  renderAIResponse(text: string, x: number, y: number, fontSize: number): void;
}

export interface IStrokeService {
  clear(): void;
  getPoints(): IStrokePoint[];
  addPoint(pixelX: number, pixelY: number, canvasWidth: number, canvasHeight: number, isNew: boolean): void;
}

export interface IAIResponse {
  readonly text: string;
  readonly timestamp: number;
  readonly isVisible: boolean;
}

export interface IDiaryModel {
  isLoading: boolean;
  isLocked: boolean;
  config: ILangInterface;
  text: string;
  easterEgg: string | null;
  aiResponse: IAIResponse | null;
  languages: Record<string, ILangInterface>;
  pendingImage: string | null;

  // Observer: массив подписчиков вместо одного onDataChanged
  subscribe(listener: () => void): () => void;
}

export interface IOCRService {
  recognize(canvasElement: HTMLCanvasElement, langCode: string): Promise<string>;
  terminate(): Promise<void>;
}

export interface ICanvasPresenter {
  init(): void;
  handlePointerMove(e: PointerEvent): void;
  handleResize(): void;
  clearCanvas(): void;
  handleModelUpdate(): void;
}

export interface IGuardrailsResult {
  status: 'PASSED' | 'ABUSE' | 'SPAM';
  cleanedText: string;
  responseText?: string;
}

export interface IGuardrailsService {
  validate(rawInput: string, config: ILangInterface): IGuardrailsResult;
}

export interface IAIClientService {
  sendMessage(prompt: string, imageBase64?: string): Promise<string>;
  setLanguage(config: ILangInterface): void;
}