import type { IEasterEgg, ICanvasState } from '../IEasterEgg';
import { runFrames } from '../shared/RunFrames';
import { bezier } from '../shared/Bezier';
import { appearPauseDisappear } from '../shared/AppearPauseDisappear';
import { renderText } from '../shared/RenderText';
import { FONT_IMPERIO, FONT_TOM } from '../../config/fonts';
import { LORE_COLORS, LORE_LAYOUT, LORE_ANIMATIONS } from '../config/lore.hp.config';

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
    const fontSize = width * LORE_LAYOUT.IMPERIO_FONT_SIZE_RATIO;
    const lineHeight = fontSize * LORE_LAYOUT.IMPERIO_LINE_HEIGHT_RATIO;
    const startX = fontSize;
    const maxWidth = width - fontSize * 2;

    const inputMinY = this.getInputMinY(canvasState, height);
    const overlayStartY = inputMinY > 0 ? inputMinY : height * LORE_LAYOUT.IMPERIO_TEXT_START_Y;

    const strikeLines = this.buildStrikeLines(canvasState, width, height);

    const drawStrikes = (alpha: number) => {
      ctx.save();
      ctx.strokeStyle = LORE_COLORS.IMPERIO_STRIKE;
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
        color: LORE_COLORS.IMPERIO_OVERLAY,
        alpha,
        startX,
        startY: overlayStartY,
        maxWidth,
        lineHeight,
        fontFamily: FONT_IMPERIO,
      });
    };

    await runFrames(LORE_ANIMATIONS.IMPERIO_TRANSITION_FRAMES, (progress) => {
      const eased = bezier(progress);
      ctx.clearRect(0, 0, width, height);
      drawSnapshot(1 - eased);
      drawOverlay(eased);
    });

    await new Promise((r) => setTimeout(r, LORE_ANIMATIONS.IMPERIO_PAUSE_MS));

    await runFrames(LORE_ANIMATIONS.IMPERIO_TRANSITION_FRAMES, (progress) => {
      const eased = bezier(progress);
      ctx.clearRect(0, 0, width, height);
      drawOverlay(1 - eased);
    });

    ctx.clearRect(0, 0, width, height);

    const drawResponse = (alpha: number) => {
      ctx.clearRect(0, 0, width, height);
      renderText(ctx, response, {
        fontSize,
        color: LORE_COLORS.IMPERIO_RESPONSE,
        alpha,
        startX,
        startY: height * LORE_LAYOUT.IMPERIO_TEXT_START_Y,
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

    const minX = Math.min(...xs) + LORE_LAYOUT.IMPERIO_STRIKE_OFFSET_X * -1;
    const maxX = Math.max(...xs) + LORE_LAYOUT.IMPERIO_STRIKE_OFFSET_X;
    const minY = Math.min(...ys) + LORE_LAYOUT.IMPERIO_STRIKE_OFFSET_Y_TOP;
    const maxY = Math.max(...ys) + LORE_LAYOUT.IMPERIO_STRIKE_OFFSET_Y_BOTTOM;

    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const count = LORE_LAYOUT.IMPERIO_STRIKE_LINE_COUNT;
    for (let i = 0; i < count; i++) {
      const t1 = i / count;
      const t2 = (i + 0.5) / count;
      const y1 = minY + (maxY - minY) * t1;
      const y2 = minY + (maxY - minY) * t2;
      const x1 = minX + Math.random() * (maxX - minX) * LORE_LAYOUT.IMPERIO_STRIKE_RANDOM_RATIO;
      const x2 = maxX - Math.random() * (maxX - minX) * LORE_LAYOUT.IMPERIO_STRIKE_RANDOM_RATIO;
      lines.push({ x1, y1, x2, y2 });
    }
    return lines;
  }
}