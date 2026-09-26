// src/view/canvasView.ts
import type { ICanvasView, IPixelPoint } from "../types";
import { FONT_INPUT } from "../config/fonts";
import { COLORS } from "../config/visual";

export class CanvasView implements ICanvasView {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.ctx.font = `104px '${FONT_INPUT}'`;
    this.ctx.measureText("");
  }

  public setDimensions(width: number, height: number, dpr: number): void {
    const canvas = this.ctx.canvas;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    canvas.style.backgroundImage = "url('/assets/parchment.webp')";
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center";

    this.ctx.scale(dpr, dpr);

    this.ctx.strokeStyle = COLORS.USER_INK;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }

  public clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
  }

  public drawStroke(pixelPoints: IPixelPoint[]): void {
    if (pixelPoints.length === 0) return;

    this.ctx.beginPath();
    for (let i = 0; i < pixelPoints.length; i++) {
      const point = pixelPoints[i];
      if (point.isNew) {
        this.ctx.moveTo(point.x, point.y);
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    }
    this.ctx.stroke();
  }

  public drawTextChar(char: string, x: number, y: number, font: string): void {
    this.ctx.font = font;
    this.ctx.fillStyle = COLORS.USER_INK;
    this.ctx.fillText(char, x, y);
  }

  public drawSnapshot(source: HTMLCanvasElement | HTMLImageElement): void {
    this.ctx.drawImage(source, 0, 0);
  }

  public drawSnapshotScaled(source: HTMLCanvasElement, width: number, height: number): void {
    this.ctx.drawImage(source, 0, 0, width, height);
  }

  public setAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha;
  }

  public resetFilters(): void {
    this.ctx.globalAlpha = 1.0;

    this.ctx.strokeStyle = COLORS.USER_INK;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
  }

  public drawFadingStroke(points: IPixelPoint[], alpha: number, lineWidth: number): void {
    if (points.length < 2) return;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = COLORS.USER_INK;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.isNew) {
        this.ctx.moveTo(p.x, p.y);
      } else {
        this.ctx.lineTo(p.x, p.y);
      }
    }
    this.ctx.stroke();

    this.ctx.restore();
  }

  public drawFadingChar(char: string, x: number, y: number, font: string, alpha: number): void {
    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = COLORS.USER_INK;
    this.ctx.globalAlpha = alpha;
    this.ctx.fillText(char, x, y);
    this.ctx.restore();
  }

  public drawTextLine(line: string, x: number, y: number, font: string, alpha: number): void {
    this.ctx.save();
    this.ctx.font = font;
    this.ctx.fillStyle = COLORS.TOM_INK;
    this.ctx.globalAlpha = alpha;
    this.ctx.fillText(line, x, y);
    this.ctx.restore();
  }

  public measureText(text: string, font: string): number {
    this.ctx.save();
    this.ctx.font = font;
    const width = this.ctx.measureText(text).width;
    this.ctx.restore();
    return width;
  }

  // Точка расширения. View не знает, зачем.
  // Удалишь надстройку — метод остаётся, никого не ломает.
  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}