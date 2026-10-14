// src/view/inputView.ts
import type { IInputView } from "../types";

export class InputView implements IInputView {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly langButton: HTMLButtonElement;

  constructor(canvas: HTMLCanvasElement, button: HTMLButtonElement) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Не удалось получить 2D контекст канваса');
    }

    this.ctx = context;
    this.langButton = button;
  }

  updateLangButton(localeName: string): void {
    this.langButton.textContent = localeName;
    this.langButton.setAttribute('data-lang', localeName.toLowerCase());
  }
}