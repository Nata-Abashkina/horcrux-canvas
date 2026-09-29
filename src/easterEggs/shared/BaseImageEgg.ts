import type { IEasterEgg } from '../IEasterEgg';
import { renderText } from './RenderText';
import { appearPauseDisappear } from './AppearPauseDisappear';
import { LORE_COLORS, LORE_LAYOUT } from '../config/lore.hp.config';
import { FONT_TOM } from '../../config/fonts';

export abstract class BaseImageEgg implements IEasterEgg {
  abstract readonly type: string;

  protected abstract readonly svgUrl: string;
  protected abstract readonly textYRatio: number;

  protected readonly glowColor: string = '';
  protected readonly useGlow: boolean = false;
  protected readonly useMultiply: boolean = false;

  async execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void> {
    const img = await this.loadSvg(this.svgUrl);

    const size = Math.min(width, height) * LORE_LAYOUT.EGG_IMAGE_SIZE_RATIO;
    const x = (width - size) / 2;
    const y = this.getImageY(height, size);

    const fontSize = width * LORE_LAYOUT.EGG_FONT_SIZE_RATIO;
    const maxWidth = width - fontSize * 2;
    const lineHeight = fontSize * LORE_LAYOUT.EGG_LINE_HEIGHT_RATIO;
    const startX = fontSize;
    const startY = height * this.textYRatio;

    await appearPauseDisappear({
      onAppear: (alpha) => this.drawFrame(ctx, width, height, img, x, y, size, response, alpha, fontSize, maxWidth, lineHeight, startX, startY),
      onFull: () => this.drawFrame(ctx, width, height, img, x, y, size, response, 1, fontSize, maxWidth, lineHeight, startX, startY),
      onDisappear: (alpha) => this.drawFrame(ctx, width, height, img, x, y, size, response, alpha, fontSize, maxWidth, lineHeight, startX, startY),
      onClear: () => ctx.clearRect(0, 0, width, height),
    });
  }

  protected getImageY(height: number, _size: number): number {
    return height * LORE_LAYOUT.EGG_IMAGE_Y_TOP;
  }

  private loadSvg(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private drawFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    img: HTMLImageElement,
    x: number,
    y: number,
    size: number,
    response: string,
    alpha: number,
    fontSize: number,
    maxWidth: number,
    lineHeight: number,
    startX: number,
    startY: number
  ): void {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.useMultiply) ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();

    if (this.useGlow && this.glowColor) {
      ctx.save();
      ctx.fillStyle = `${this.glowColor}${LORE_LAYOUT.BASE_IMAGE_MULTIPLY_ALPHA * alpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    renderText(ctx, response, {
      fontSize,
      color: LORE_COLORS.EGG_TEXT_DEFAULT,
      alpha,
      startX,
      startY,
      maxWidth,
      lineHeight,
      fontFamily: FONT_TOM,
    });
  }
}