import type { IEasterEgg } from '../IEasterEgg';
import { bezier } from '../shared/Bezier';
import { runFrames } from '../shared/RunFrames';
import { renderText } from '../shared/RenderText';
import { TOTAL_FRAMES } from '../shared/AppearPauseDisappear';
import { prefersReducedMotion } from '../shared/ReducedMotion';

interface ICopy {
  angle: number;
  radiusRatio: number;
  rotation: number;
  scale: number;
  alphaRatio: number;
  phase: number;
  breathSpeed: number;
}

export class OpenSesame implements IEasterEgg {
  readonly type = 'open_sesame';

  private readonly COPIES = 12;

  private makeCopies(): ICopy[] {
    const copies: ICopy[] = [];
    for (let i = 0; i < this.COPIES; i++) {
      copies.push({
        angle: Math.random() * Math.PI * 2,
        radiusRatio: 0.4 + Math.random() * 0.6,
        rotation: (Math.random() - 0.5) * (Math.PI / 30),
        scale: 0.95 + Math.random() * 0.1,
        alphaRatio: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        breathSpeed: 0.8 + Math.random() * 0.6,
      });
    }
    return copies;
  }

  async execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void> {
    const reducedMotion = prefersReducedMotion();

    const fontSize = width * 0.08;
    const maxWidth = width - fontSize;
    const lineHeight = fontSize * 1.2;
    const startX = fontSize;
    const startY = height * 0.3;

    const maxSpread = Math.min(width, height) * 0.02;
    const copies = this.makeCopies();

    const draw = (alpha: number, spreadProgress: number, frame: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const c of copies) {
        const breath = reducedMotion
          ? 1
          : 1 + Math.sin(frame * 0.05 * c.breathSpeed + c.phase) * 0.25;

        const radius = maxSpread * c.radiusRatio * spreadProgress * breath;
        const dx = Math.cos(c.angle) * radius;
        const dy = Math.sin(c.angle) * radius;

        ctx.save();
        ctx.translate(startX + dx, startY + dy);
        ctx.rotate(c.rotation * spreadProgress);
        ctx.scale(c.scale, c.scale);
        ctx.translate(-startX, -startY);

        renderText(ctx, response, {
          fontSize,
          color: '#1a0000',
          alpha: (alpha * c.alphaRatio) / this.COPIES * 1.5,
          startX,
          startY,
          maxWidth,
          lineHeight,
          fontFamily: 'Gabriela',
        });
        ctx.restore();
      }
    };

    await runFrames(TOTAL_FRAMES, (progress) => {
      draw(bezier(progress), 0, 0);
    });

    await runFrames(TOTAL_FRAMES, (progress) => {
      draw(1, bezier(progress), progress * TOTAL_FRAMES);
    });

    await runFrames(TOTAL_FRAMES, (progress) => {
      draw(1 - bezier(progress), 1, TOTAL_FRAMES + progress * TOTAL_FRAMES);
    });

    ctx.clearRect(0, 0, width, height);
  }
}