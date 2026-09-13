import type { IEasterEgg } from '../IEasterEgg';
import { renderText } from '../shared/RenderText';
import naginiUrl from '../../assets/easterEggs/nagini.svg';

interface ISegment {
  x: number;
  y: number;
}

export class Nagini implements IEasterEgg {
  readonly type = 'nagini';

  private readonly SEGMENTS = 20;
  private readonly SPEED = 2;
  private readonly LENGTH_RATIO = 1 / 3;
  private readonly EDGE_MARGIN = 40;
  private readonly TURN_JITTER = 0.05;
  private readonly OVERLAP = 1.4;

  async execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void> {
    const img = await this.loadSvg(naginiUrl);

    // В SVG морда слева. Значит кусок базово "смотрит" влево = π.
    const BASE = Math.PI;

    const segW = img.width / this.SEGMENTS;
    const segH = img.height;

    const bodyLength = width * this.LENGTH_RATIO;
    const segmentLength = bodyLength / this.SEGMENTS;
    const drawW = segmentLength * this.OVERLAP;
    const drawH = drawW * (segH / segW);

    // Скелет: голова в точке 0, тело уходит вправо
    const segments: ISegment[] = [];
    const startX = width * 0.5;
    const startY = height * 0.5;
    for (let i = 0; i < this.SEGMENTS; i++) {
      segments.push({ x: startX + i * segmentLength, y: startY });
    }

    // Направление движения головы. 0 = вправо.
    let headAngle = 0;

    // Текст Тома
    const fontSize = width * 0.08;
    const maxWidth = width - fontSize;
    const lineHeight = fontSize * 1.2;
    const startTextX = fontSize;
    const startTextY = height * 0.3;

    let textAlpha = 0;
    const TOTAL_FRAMES = 300;
    const PAUSE_MS = 5000;
    let textPhase: 'appear' | 'full' | 'disappear' | 'done' = 'appear';
    let textFrame = 0;
    let pauseStart = 0;

    const bezier = (t: number) => t * t * (3 - 2 * t);

    const tick = () => {
      // === Движение головы ===
      const head = segments[0];

      headAngle += (Math.random() - 0.5) * this.TURN_JITTER;

      head.x += Math.cos(headAngle) * this.SPEED;
      head.y += Math.sin(headAngle) * this.SPEED;

      // Разворот от краёв
      if (head.x < this.EDGE_MARGIN) {
        head.x = this.EDGE_MARGIN;
        headAngle = Math.PI - headAngle;
      } else if (head.x > width - this.EDGE_MARGIN) {
        head.x = width - this.EDGE_MARGIN;
        headAngle = Math.PI - headAngle;
      }
      if (head.y < this.EDGE_MARGIN) {
        head.y = this.EDGE_MARGIN;
        headAngle = -headAngle;
      } else if (head.y > height - this.EDGE_MARGIN) {
        head.y = height - this.EDGE_MARGIN;
        headAngle = -headAngle;
      }

      // === Тело тянется за головой ===
      for (let i = 1; i < segments.length; i++) {
        const prev = segments[i - 1];
        const curr = segments[i];
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > segmentLength) {
          const ratio = segmentLength / dist;
          curr.x = prev.x + dx * ratio;
          curr.y = prev.y + dy * ratio;
        }
      }

      // === Фазы текста ===
      if (textPhase === 'appear') {
        textAlpha = bezier(textFrame / TOTAL_FRAMES);
        textFrame++;
        if (textFrame >= TOTAL_FRAMES) {
          textPhase = 'full';
          textAlpha = 1;
        }
      } else if (textPhase === 'full') {
        if (pauseStart === 0) pauseStart = performance.now();
        if (performance.now() - pauseStart >= PAUSE_MS) {
          textPhase = 'disappear';
          textFrame = 0;
        }
      } else if (textPhase === 'disappear') {
        textAlpha = 1 - bezier(textFrame / TOTAL_FRAMES);
        textFrame++;
        if (textFrame >= TOTAL_FRAMES) {
          textAlpha = 0;
          textPhase = 'done';
        }
      }

      // === Отрисовка ===
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < segments.length; i++) {
        const s = segments[i];
        let targetAngle: number;

        if (i === 0) {
          targetAngle = headAngle;
        } else {
          const prev = segments[i - 1];
          targetAngle = Math.atan2(prev.y - s.y, prev.x - s.x);
        }

        const rotation = BASE - targetAngle;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(rotation);
        ctx.drawImage(
          img,
          i * segW, 0, segW, segH,
          -drawW / 2, -drawH / 2, drawW, drawH
        );
        ctx.restore();
      }

      if (textAlpha > 0) {
        renderText(ctx, response, {
          fontSize,
          color: '#1a0000',
          alpha: textAlpha,
          startX: startTextX,
          startY: startTextY,
          maxWidth,
          lineHeight,
          fontFamily: 'Gabriela',
        });
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  private loadSvg(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}