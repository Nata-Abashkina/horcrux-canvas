import type { IEasterEgg } from '../IEasterEgg';
import { renderText } from '../shared/RenderText';
import { runFrames } from '../shared/RunFrames';
import { bezier } from '../shared/Bezier';
import { FONT_TOM } from '../../config/fonts';
import { LORE_COLORS, LORE_LAYOUT, LORE_ANIMATIONS } from '../config/lore.hp.config';

interface ICrack {
  pts: { x: number; y: number }[];
  branches: { x: number; y: number }[][];
  w: number;
}

export class Crucio implements IEasterEgg {
  readonly type = 'crucio';

  async execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void> {
    const cracks = this.buildCracks(width, height);

    await runFrames(LORE_ANIMATIONS.CRUCIO_CRACKS_FRAMES, (progress) => {
      const eased = bezier(progress);
      ctx.clearRect(0, 0, width, height);
      this.drawCracks(ctx, cracks, eased);
    });

    const fontSize = width * LORE_LAYOUT.CRUCIO_FONT_SIZE_RATIO;
    const maxWidth = width - fontSize * 2;
    const lineHeight = fontSize * LORE_LAYOUT.CRUCIO_LINE_HEIGHT_RATIO;
    const startX = fontSize;
    const startY = height * LORE_LAYOUT.CRUCIO_TEXT_START_Y;

    const drawScene = (alpha: number) => {
      ctx.clearRect(0, 0, width, height);
      this.drawCracks(ctx, cracks, 1);
      if (alpha > 0) {
        renderText(ctx, response, {
          fontSize,
          color: LORE_COLORS.CRUCIO_LINE,
          alpha,
          startX,
          startY,
          maxWidth,
          lineHeight,
          fontFamily: FONT_TOM,
        });
      }
    };

    await runFrames(LORE_ANIMATIONS.CRUCIO_TEXT_FRAMES, (progress) => {
      drawScene(bezier(progress));
    });
    drawScene(1);
    await new Promise((r) => setTimeout(r, LORE_ANIMATIONS.CRUCIO_TEXT_PAUSE_MS));
    await runFrames(LORE_ANIMATIONS.CRUCIO_TEXT_FRAMES, (progress) => {
      drawScene(1 - bezier(progress));
    });

    drawScene(0);
  }

  private buildCracks(width: number, height: number): ICrack[] {
    const count = LORE_LAYOUT.CRUCIO_COUNT_MIN + Math.floor(Math.random() * LORE_LAYOUT.CRUCIO_COUNT_RANGE);
    const cracks: ICrack[] = [];

    for (let i = 0; i < count; i++) {
      const startX = width * (LORE_LAYOUT.CRUCIO_START_RATIO_MIN + Math.random() * LORE_LAYOUT.CRUCIO_START_RATIO_RANGE);
      const startY = height * (LORE_LAYOUT.CRUCIO_START_RATIO_MIN + Math.random() * LORE_LAYOUT.CRUCIO_START_RATIO_RANGE);
      const pts = this.walk(startX, startY, width, height, LORE_LAYOUT.CRUCIO_MAIN_STEPS, LORE_LAYOUT.CRUCIO_MAIN_STEP_LEN);

      const branches: { x: number; y: number }[][] = [];
      const branchCount = LORE_LAYOUT.CRUCIO_BRANCH_MIN + Math.floor(Math.random() * LORE_LAYOUT.CRUCIO_BRANCH_RANGE);
      for (let b = 0; b < branchCount; b++) {
        const idx = Math.floor(Math.random() * pts.length);
        const p = pts[idx];
        branches.push(this.walk(p.x, p.y, width, height, LORE_LAYOUT.CRUCIO_BRANCH_STEPS, LORE_LAYOUT.CRUCIO_BRANCH_STEP_LEN));
      }

      cracks.push({ pts, branches, w: LORE_LAYOUT.CRUCIO_WIDTH_MIN + Math.random() * LORE_LAYOUT.CRUCIO_WIDTH_RANGE });
    }
    return cracks;
  }

  private walk(
    x: number,
    y: number,
    width: number,
    height: number,
    steps: number,
    stepLen: number
  ): { x: number; y: number }[] {
    const pts = [{ x, y }];
    let angle = Math.random() * Math.PI * 2;
    let cx = x;
    let cy = y;

    for (let i = 0; i < steps; i++) {
      angle += (Math.random() - 0.5) * LORE_LAYOUT.CRUCIO_ANGLE_JITTER;
      cx += Math.cos(angle) * stepLen;
      cy += Math.sin(angle) * stepLen;
      if (cx < 0 || cx > width || cy < 0 || cy > height) break;
      pts.push({ x: cx, y: cy });
    }
    return pts;
  }

  private drawCracks(
    ctx: CanvasRenderingContext2D,
    cracks: ICrack[],
    progress: number
  ): void {
    if (progress <= 0) return;

    ctx.save();
    ctx.globalAlpha = LORE_LAYOUT.CRUCIO_GLOW_ALPHA * progress;
    ctx.strokeStyle = LORE_COLORS.CRUCIO_GLOW;
    ctx.lineWidth = LORE_LAYOUT.CRUCIO_GLOW_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const c of cracks) {
      this.strokePartial(ctx, c.pts, progress);
      for (const br of c.branches) {
        this.strokePartial(ctx, br, progress);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = LORE_LAYOUT.CRUCIO_LINE_ALPHA * progress;
    ctx.strokeStyle = LORE_COLORS.CRUCIO_LINE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const c of cracks) {
      ctx.lineWidth = c.w;
      this.strokePartial(ctx, c.pts, progress);
      for (const br of c.branches) {
        this.strokePartial(ctx, br, progress);
      }
    }
    ctx.restore();
  }

  private strokePartial(
    ctx: CanvasRenderingContext2D,
    pts: { x: number; y: number }[],
    progress: number
  ): void {
    if (pts.length < 2) return;
    const total = pts.length - 1;
    const limit = Math.max(1, Math.floor(total * progress));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= limit; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  }
}