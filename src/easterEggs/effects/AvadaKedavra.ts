import type { IEasterEgg } from '../IEasterEgg';
import { renderText } from '../shared/RenderText';
import { appearPauseDisappear } from '../shared/AppearPauseDisappear';
import { prefersReducedMotion } from '../shared/ReducedMotion';
import { LORE_COLORS, LORE_LAYOUT, LORE_ANIMATIONS } from '../config/lore.hp.config';
import { FONT_TOM } from '../../config/fonts';

export class AvadaKedavra implements IEasterEgg {
  readonly type = 'avada_kedavra';

  async execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void> {
    const reducedMotion = prefersReducedMotion();

    if (!reducedMotion) {
      ctx.save();
      ctx.fillStyle = LORE_COLORS.AVADA_FLASH;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      if (navigator.vibrate) {
        navigator.vibrate([LORE_ANIMATIONS.AVADA_VIBRATE_MS]);
      }

      await new Promise((resolve) => setTimeout(resolve, LORE_ANIMATIONS.AVADA_FLASH_MS));
    }

    const fontSize = width * LORE_LAYOUT.AVADA_FONT_SIZE_RATIO;
    const maxWidth = width - fontSize;
    const lineHeight = fontSize * LORE_LAYOUT.AVADA_LINE_HEIGHT_RATIO;
    const startX = fontSize;
    const startY = height * LORE_LAYOUT.AVADA_TEXT_START_Y;

    const draw = (alpha: number) => {
      ctx.clearRect(0, 0, width, height);
      renderText(ctx, response, {
        fontSize,
        color: LORE_COLORS.AVADA_TEXT,
        alpha,
        startX,
        startY,
        maxWidth,
        lineHeight,
        fontFamily: FONT_TOM,
      });
    };

    await appearPauseDisappear({
      onAppear: draw,
      onFull: () => draw(1),
      onDisappear: draw,
      onClear: () => ctx.clearRect(0, 0, width, height),
    });

    // "Never-returns": дневник убит, ввод не разблокируется.
    // Держим rAF-цикл живым, но НЕ блокируем главный поток.
    // Главный поток свободен, вкладка отвечает, CPU в простое.
    setTimeout(() => {
      const freezeForever = () => {
        requestAnimationFrame(freezeForever);
      };
      requestAnimationFrame(freezeForever);
    }, LORE_ANIMATIONS.AVADA_FREEZE_DELAY_MS);
  }
}