import type { IEasterEgg } from '../IEasterEgg';
import { renderText } from '../shared/RenderText';
import { appearPauseDisappear } from '../shared/AppearPauseDisappear';
import { prefersReducedMotion } from '../shared/ReducedMotion';

export class AvadaKedavra implements IEasterEgg {
  readonly type = 'avada_kedavra';

  async execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void> {
    const reducedMotion = prefersReducedMotion();

    // Зелёная вспышка — только если не reducedMotion
    if (!reducedMotion) {
      ctx.save();
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      if (navigator.vibrate) {
        navigator.vibrate([200]);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const fontSize = width * 0.08;
    const maxWidth = width - fontSize;
    const lineHeight = fontSize * 1.2;
    const startX = fontSize;
    const startY = height * 0.3;

    const draw = (alpha: number) => {
      ctx.clearRect(0, 0, width, height);
      renderText(ctx, response, {
        fontSize,
        color: '#1a0000',
        alpha,
        startX,
        startY,
        maxWidth,
        lineHeight,
        fontFamily: 'Gabriela',
      });
    };

    await appearPauseDisappear({
      onAppear: draw,
      onFull: () => draw(1),
      onDisappear: draw,
      onClear: () => ctx.clearRect(0, 0, width, height),
    });

    setTimeout(() => {
      while (true) {
        // Пустота
      }
    }, 2000);
  }
}