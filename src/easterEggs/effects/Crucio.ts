import type { IEasterEgg } from '../IEasterEgg';
import { renderText } from '../shared/RenderText';
import { runFrames } from '../shared/RunFrames';
import { bezier } from '../shared/Bezier';
import { FONT_TOM } from '../../config/fonts';

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

    // ФАЗА 1: трещины появляются
    await runFrames(200, (progress) => {
      const eased = bezier(progress);
      ctx.clearRect(0, 0, width, height);
      this.drawCracks(ctx, cracks, eased);
    });

    // ФАЗА 2: ответ Тома
    const fontSize = width * 0.06;
    const maxWidth = width - fontSize * 2;
    const lineHeight = fontSize * 1.4;
    const startX = fontSize;
    const startY = height * 0.25;

    const drawScene = (alpha: number) => {
      ctx.clearRect(0, 0, width, height);
      this.drawCracks(ctx, cracks, 1);
      if (alpha > 0) {
        renderText(ctx, response, {
          fontSize,
          color: '#1a0000',
          alpha,
          startX,
          startY,
          maxWidth,
          lineHeight,
          fontFamily: FONT_TOM,
        });
      }
    };

    await runFrames(300, (progress) => {
      drawScene(bezier(progress));
    });
    drawScene(1);
    await new Promise((r) => setTimeout(r, 5000));
    await runFrames(300, (progress) => {
      drawScene(1 - bezier(progress));
    });

    // ФИНАЛ: только трещины, без текста. До перезагрузки.
    drawScene(0);
  }

  private buildCracks(width: number, height: number): ICrack[] {
    const count = 3 + Math.floor(Math.random() * 3);
    const cracks: ICrack[] = [];

    for (let i = 0; i < count; i++) {
      const startX = width * (0.15 + Math.random() * 0.7);
      const startY = height * (0.15 + Math.random() * 0.7);
      const pts = this.walk(startX, startY, width, height, 12, 80);

      const branches: { x: number; y: number }[][] = [];
      const branchCount = 2 + Math.floor(Math.random() * 3);
      for (let b = 0; b < branchCount; b++) {
        const idx = Math.floor(Math.random() * pts.length);
        const p = pts[idx];
        branches.push(this.walk(p.x, p.y, width, height, 5, 45));
      }

      cracks.push({ pts, branches, w: 1 + Math.random() * 1.5 });
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
      angle += (Math.random() - 0.5) * 0.9;
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

    // Свечение под трещинами — светлая подложка
    ctx.save();
    ctx.globalAlpha = 0.35 * progress;
    ctx.strokeStyle = '#fff8e0';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const c of cracks) {
      this.strokePartial(ctx, c.pts, progress);
      for (const br of c.branches) {
        this.strokePartial(ctx, br, progress);
      }
    }
    ctx.restore();

    // Основная линия трещины
    ctx.save();
    ctx.globalAlpha = 0.9 * progress;
    ctx.strokeStyle = '#2a0a00';
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