import type { IEasterEgg, ICanvasState } from '../IEasterEgg';
import { runFrames } from '../shared/RunFrames';
import { bezier } from '../shared/Bezier';
import { appearPauseDisappear } from '../shared/AppearPauseDisappear';
import { renderText } from '../shared/RenderText';
import { FONT_IMPERIO, FONT_TOM } from '../../config/fonts';

export class Imperio implements IEasterEgg {
  readonly type = 'imperio';
  readonly awaitsSecondInput = true;

  async execute(): Promise<void> {
    return;
  }

  async continueExecution(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string,
    overlayText: string,
    canvasState: ICanvasState
  ): Promise<void> {
    const COLOR_STRIKE = '#1a1a1a';
    const COLOR_OVERLAY = '#6b0f1a';
    const COLOR_RESPONSE = '#1a1a3a';
    const BASE_FONT_SIZE = 80;
    const fontSize = Math.max(BASE_FONT_SIZE * 0.5, Math.min(BASE_FONT_SIZE, width * 0.05));
    const lineHeight = fontSize * 1.4;
    const startX = fontSize;
    const maxWidth = width - fontSize * 2;
    const TRANSITION_FRAMES = 300;

    // Позиция overlay — верхняя точка ввода
    const inputMinY = this.getInputMinY(canvasState, height);
    const overlayStartY = inputMinY > 0 ? inputMinY : height * 0.15;

    // Зачёркивание — рисуем поверх живого холста
    const strikeLines = this.buildStrikeLines(canvasState, width, height);

    const drawStrikes = (alpha: number) => {
      ctx.save();
      ctx.strokeStyle = COLOR_STRIKE;
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha;
      for (const line of strikeLines) {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }
      ctx.restore();
    };

    drawStrikes(1);

    // Снимок холста: второй ввод + зачёркивание
    const snapshot = document.createElement('canvas');
    snapshot.width = ctx.canvas.width;
    snapshot.height = ctx.canvas.height;
    const snapCtx = snapshot.getContext('2d');
    if (snapCtx) {
      snapCtx.drawImage(ctx.canvas, 0, 0);
    }

    const drawSnapshot = (alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(snapshot, 0, 0, width, height);
      ctx.restore();
    };

    const drawOverlay = (alpha: number) => {
      renderText(ctx, overlayText, {
        fontSize,
        color: COLOR_OVERLAY,
        alpha,
        startX,
        startY: overlayStartY,
        maxWidth,
        lineHeight,
        fontFamily: FONT_IMPERIO,
      });
    };

    // ФАЗА 1: overlay появляется, ввод + зачёркивание исчезают — одновременно
    await runFrames(TRANSITION_FRAMES, (progress) => {
      const eased = bezier(progress);
      ctx.clearRect(0, 0, width, height);
      drawSnapshot(1 - eased);
      drawOverlay(eased);
    });

    // ПАУЗА: overlay висит
    await new Promise((r) => setTimeout(r, 5000));

    // ФАЗА 2: overlay исчезает
    await runFrames(TRANSITION_FRAMES, (progress) => {
      const eased = bezier(progress);
      ctx.clearRect(0, 0, width, height);
      drawOverlay(1 - eased);
    });

    ctx.clearRect(0, 0, width, height);

    // Сцена ответа Тома — стандартным путём
    const drawResponse = (alpha: number) => {
      ctx.clearRect(0, 0, width, height);
      renderText(ctx, response, {
        fontSize,
        color: COLOR_RESPONSE,
        alpha,
        startX,
        startY: height * 0.25,
        maxWidth,
        lineHeight,
        fontFamily: FONT_TOM,
      });
    };

    await appearPauseDisappear({
      onAppear: drawResponse,
      onFull: () => drawResponse(1),
      onDisappear: drawResponse,
      onClear: () => ctx.clearRect(0, 0, width, height),
    });
  }

  private getInputMinY(canvasState: ICanvasState, height: number): number {
    const ys: number[] = [];

    if (canvasState.typedChars.length > 0) {
      for (const c of canvasState.typedChars) {
        ys.push(c.y);
      }
    } else if (canvasState.strokePoints.length > 0) {
      for (const p of canvasState.strokePoints) {
        ys.push(p.y * height);
      }
    }

    if (ys.length === 0) return 0;
    return Math.min(...ys);
  }

  private buildStrikeLines(
    canvasState: ICanvasState,
    width: number,
    height: number
  ): { x1: number; y1: number; x2: number; y2: number }[] {
    const xs: number[] = [];
    const ys: number[] = [];

    for (const c of canvasState.typedChars) {
      xs.push(c.x);
      ys.push(c.y);
    }
    for (const p of canvasState.strokePoints) {
      xs.push(p.x * width);
      ys.push(p.y * height);
    }

    if (xs.length === 0) return [];

    const minX = Math.min(...xs) - 10;
    const maxX = Math.max(...xs) + 10;
    const minY = Math.min(...ys) - 30;
    const maxY = Math.max(...ys) + 10;

    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const t1 = i / count;
      const t2 = (i + 0.5) / count;
      const y1 = minY + (maxY - minY) * t1;
      const y2 = minY + (maxY - minY) * t2;
      const x1 = minX + Math.random() * (maxX - minX) * 0.3;
      const x2 = maxX - Math.random() * (maxX - minX) * 0.3;
      lines.push({ x1, y1, x2, y2 });
    }
    return lines;
  }
}