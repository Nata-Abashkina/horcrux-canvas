import type { IEasterEgg } from '../IEasterEgg';
import { appearPauseDisappear } from '../shared/AppearPauseDisappear';
import { renderCipher } from '../shared/RenderCipher';

export class Nagini implements IEasterEgg {
  readonly type = 'nagini';

  async execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void> {
    const BASE_FONT_SIZE = 80;
    const fontSize = Math.max(BASE_FONT_SIZE * 0.5, Math.min(BASE_FONT_SIZE, width * 0.05));
    const lineHeight = fontSize * 1.4;
    const startX = fontSize;
    const startY = height * 0.15;
    const maxWidth = width - fontSize * 2;

    const draw = (alpha: number) => {
      ctx.clearRect(0, 0, width, height);
      renderCipher(ctx, response, {
        fontSize,
        color: '#1a0000',
        alpha,
        startX,
        startY,
        maxWidth,
        lineHeight,
      });
    };

    await appearPauseDisappear({
      onAppear: draw,
      onFull: () => draw(1),
      onDisappear: draw,
      onClear: () => ctx.clearRect(0, 0, width, height),
    });
  }
}