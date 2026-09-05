import type { IEasterEgg } from '../IEasterEgg';

export class AvadaKedavra implements IEasterEgg {
  readonly type = 'avada_kedavra';

  async execute(ctx: CanvasRenderingContext2D, width: number, height: number, response: string): Promise<void> {
    // Зелёная вспышка
    ctx.save();
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    if (navigator.vibrate) {
      navigator.vibrate([200]);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Появление текста через Безье (5 секунд)
    const fontSize = width * 0.08;
    const totalFrames = 300;
    let currentFrame = 0;

    const drawFrame = () => {
      const progress = currentFrame / totalFrames;
      const alpha = progress * progress * (3 - 2 * progress); // Безье

      ctx.clearRect(0, 0, width, height);
      this.renderText(ctx, response, width, height, fontSize, alpha);

      currentFrame++;
      if (currentFrame < totalFrames) {
        requestAnimationFrame(drawFrame);
      } else {
        // Показ 5 секунд
        ctx.clearRect(0, 0, width, height);
        this.renderText(ctx, response, width, height, fontSize, 1);

        // Исчезновение через Безье (5 секунд)
        setTimeout(() => {
          let fadeFrame = 0;
          const fadeTotal = 300;

          const fadeOut = () => {
            const fadeProgress = fadeFrame / fadeTotal;
            const fadeAlpha = 1 - fadeProgress * fadeProgress * (3 - 2 * fadeProgress);

            ctx.clearRect(0, 0, width, height);
            this.renderText(ctx, response, width, height, fontSize, fadeAlpha);

            fadeFrame++;
            if (fadeFrame < fadeTotal) {
              requestAnimationFrame(fadeOut);
            } else {
              ctx.clearRect(0, 0, width, height);

              // Финальный нокаут
              setTimeout(() => {
                while (true) {
                  // Пустота
                }
              }, 2000);
            }
          };

          requestAnimationFrame(fadeOut);
        }, 5000);
      }
    };

    requestAnimationFrame(drawFrame);
  }

  private renderText(
    ctx: CanvasRenderingContext2D,
    response: string,
    width: number,
    height: number,
    fontSize: number,
    alpha: number
  ): void {
    ctx.save();
    ctx.font = `${fontSize}px Gabriela`;
    ctx.fillStyle = '#1a0000';
    ctx.globalAlpha = alpha;

    const words = response.split(' ');
    let line = '';
    let y = height * 0.3;
    const maxWidth = width - fontSize;
    const lineHeight = fontSize * 1.2;
    const startX = fontSize;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, startX, y);
        line = word;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      ctx.fillText(line, startX, y);
    }

    ctx.restore();
  }
}