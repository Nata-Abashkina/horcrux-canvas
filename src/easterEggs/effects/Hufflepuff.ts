import type { IEasterEgg } from '../IEasterEgg';
import hufflepuffUrl from '../../assets/easterEggs/hufflepuff.svg';

export class Hufflepuff implements IEasterEgg {
  readonly type = 'hufflepuff';

  async execute(ctx: CanvasRenderingContext2D, width: number, height: number, response: string): Promise<void> {
    const img = new Image();
    img.src = hufflepuffUrl;
    await new Promise((resolve) => img.onload = resolve);

    const size = Math.min(width, height) * 0.5;
    const x = (width - size) / 2;
    const y = (height - size) / 2 - height * 0.1;

    // Появление через Безье
    await this.animateBezier(ctx, width, height, img, x, y, size, response, true);

    // Пауза 5 секунд
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Исчезновение через Безье
    await this.animateBezier(ctx, width, height, img, x, y, size, response, false);

    // Очистка
    ctx.clearRect(0, 0, width, height);
  }

  private animateBezier(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    img: HTMLImageElement,
    x: number,
    y: number,
    size: number,
    response: string,
    isAppearing: boolean
  ): Promise<void> {
    const totalFrames = 300;
    let currentFrame = 0;

    return new Promise((resolve) => {
      const drawFrame = () => {
        const progress = currentFrame / totalFrames;
        const bezier = progress * progress * (3 - 2 * progress);
        const alpha = isAppearing ? bezier : 1 - bezier;

        ctx.clearRect(0, 0, width, height);

        // Барсук
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();

        // Жёлтое свечение
        ctx.save();
        ctx.fillStyle = `rgba(255, 200, 0, ${0.2 * alpha})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // Текст Тома
        const fontSize = width * 0.06;
        ctx.save();
        ctx.font = `${fontSize}px Gabriela`;
        ctx.fillStyle = '#1a1a3a';
        ctx.globalAlpha = alpha;

        const words = response.split(' ');
        let line = '';
        let textY = height * 0.65;
        const maxWidth = width - fontSize * 2;
        const lineHeight = fontSize * 1.3;
        const startX = fontSize;

        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line) {
            ctx.fillText(line, startX, textY);
            line = word;
            textY += lineHeight;
          } else {
            line = testLine;
          }
        }
        if (line) {
          ctx.fillText(line, startX, textY);
        }
        ctx.restore();

        currentFrame++;
        if (currentFrame < totalFrames) {
          requestAnimationFrame(drawFrame);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(drawFrame);
    });
  }
}