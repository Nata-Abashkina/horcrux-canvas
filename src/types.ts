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
  setAlpha(alpha: number): void;
  resetFilters(): void;
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
  onDataChanged: (() => void) | null;
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
}

export interface IGuardrailsResult {
  status: 'PASSED' | 'ABUSE' | 'SPAM';
  cleanedText: string;
  responseText?: string;
}

export interface IGuardrailsService {
  validate(rawInput: string, config: ILangInterface): IGuardrailsResult;
}
