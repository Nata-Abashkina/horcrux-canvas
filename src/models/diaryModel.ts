import { langEn } from "../config/lang.en";
import type { ILangInterface } from "../config/lang.interface";
import { langRU } from "../config/lang.ru";
import type { IDiaryModel, IAIResponse } from "../types";

export class DiaryModel implements IDiaryModel {
  private _isAILoading: boolean = false;
  private _inputLock: boolean = false;
  private _activeConfig: ILangInterface;
  private _text: string = '';
  private _easterEgg: string | null = null;
  private _aiResponse: IAIResponse | null = null;
  private _pendingImage: string | null = null;
  
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

  get easterEgg(): string | null {
    return this._easterEgg;
  }

  set easterEgg(value: string | null) {
    this._easterEgg = value;
    if (this.onDataChanged) {
      this.onDataChanged();
    }
  }

  get pendingImage(): string | null {
    return this._pendingImage;
  }

  set pendingImage(value: string | null) {
    this._pendingImage = value;
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