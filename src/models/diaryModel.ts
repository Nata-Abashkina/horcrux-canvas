// src/models/diaryModel.ts
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

  private readonly languagesMap: Record<string, ILangInterface> = { ru: langRU, en: langEn };
  private listeners: Array<() => void> = [];

  constructor(initialConfig: ILangInterface) {
    this._activeConfig = initialConfig;
  }

  // ============ OBSERVER ============

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // ============ GETTERS / SETTERS ============

  get isLoading(): boolean {
    return this._isAILoading;
  }

  set isLoading(value: boolean) {
    this._isAILoading = value;
    this.notify();
  }

  get isLocked(): boolean {
    return this._inputLock;
  }

  set isLocked(value: boolean) {
    this._inputLock = value;
    this.notify();
  }

  get config(): ILangInterface {
    return this._activeConfig;
  }

  set config(value: ILangInterface) {
    this._activeConfig = value;
    this.notify();
  }

  get languages(): Record<string, ILangInterface> {
    return this.languagesMap;
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
    this.notify();
  }

  get easterEgg(): string | null {
    return this._easterEgg;
  }

  set easterEgg(value: string | null) {
    this._easterEgg = value;
    this.notify();
  }

  get pendingImage(): string | null {
    return this._pendingImage;
  }

  set pendingImage(value: string | null) {
    this._pendingImage = value;
    this.notify();
  }

  get aiResponse(): IAIResponse | null {
    return this._aiResponse;
  }

  set aiResponse(value: IAIResponse | null) {
    this._aiResponse = value;
    this.notify();
  }
}