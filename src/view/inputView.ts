// src/view/inputView.ts
import type { IInputView } from "../types";
import { FONT_TOM, FONT_INPUT } from "../config/fonts";
import { COLORS } from "../config/visual";

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

  renderUserText(text: string, x: number, y: number, fontSize: number): void {
    this.ctx.font = `${fontSize}px '${FONT_INPUT}'`;
    this.ctx.fillStyle = COLORS.USER_INK;
    this.ctx.fillText(text, x, y);
  }

  renderAIResponse(text: string, x: number, y: number, fontSize: number): void {
    this.ctx.font = `${fontSize}px '${FONT_TOM}'`;
    this.ctx.fillStyle = COLORS.TOM_INK;
    this.ctx.fillText(text, x, y);
  }
}