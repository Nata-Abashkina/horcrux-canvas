import type { IEasterEgg } from '../IEasterEgg';
import { appearPauseDisappear } from '../shared/AppearPauseDisappear';
import { renderCipher } from '../shared/RenderCipher';
import { LORE_COLORS, LORE_LAYOUT } from '../config/lore.hp.config';

export class Nagini implements IEasterEgg {
  readonly type = 'nagini';

  async execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void> {
    const fontSize = width * LORE_LAYOUT.NAGINI_FONT_SIZE_RATIO;
    const lineHeight = fontSize * LORE_LAYOUT.NAGINI_LINE_HEIGHT_RATIO;
    const startX = fontSize;
    const startY = height * LORE_LAYOUT.NAGINI_TEXT_START_Y;
    const maxWidth = width - fontSize * 2;

    const draw = (alpha: number) => {
      ctx.clearRect(0, 0, width, height);
      renderCipher(ctx, response, {
        fontSize,
        color: LORE_COLORS.NAGINI_TEXT,
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