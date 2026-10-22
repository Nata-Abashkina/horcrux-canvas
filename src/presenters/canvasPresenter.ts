import type {
  ICanvasPresenter,
  ICanvasView,
  IDiaryModel,
  IOCRService,
  IStrokeService,
  IPixelPoint,
} from "../types";
import { EasterEggRegistry } from '../easterEggs/EasterEggRegistry';
import { FONT_INPUT, FONT_TOM } from "../config/fonts";
import { COLORS, LAYOUT, ANIMATIONS } from "../config/core.theme.config";

interface IChronologicalChar {
  char: string;
  x: number;
  y: number;
  timestamp: number;
}

export class CanvasPresenter implements ICanvasPresenter {
  private isDrawing: boolean = false;
  private ocrTimeoutId: number | null = null;
  private currentWidth: number = 0;
  private currentHeight: number = 0;
  private isTyping: boolean = false;
  private animationFrameId: number | null = null;

  private readonly view: ICanvasView;
  private readonly strokeService: IStrokeService;
  private readonly OCRService: IOCRService;
  private readonly diaryModel: IDiaryModel;
  private readonly canvas: HTMLCanvasElement;

  private caretX: number = LAYOUT.START_X;
  private caretY: number = LAYOUT.START_Y;

  private typedChars: IChronologicalChar[] = [];
  private sessionStartTime: number = 0;

  private aiResponseAnimFrameId: number | null = null;
  private aiResponseText: string = '';
  private aiResponseTimeoutId: number | null = null;
  private aiResponseShown: boolean = false;

  private crucioLayer: HTMLCanvasElement | null = null;

  constructor(
    view: ICanvasView,
    strokeService: IStrokeService,
    OCRService: IOCRService,
    diaryModel: IDiaryModel,
    canvas: HTMLCanvasElement
  ) {
    this.view = view;
    this.strokeService = strokeService;
    this.OCRService = OCRService;
    this.diaryModel = diaryModel;
    this.canvas = canvas;
  }

  // ============ ПУБЛИЧНЫЙ ВХОД ДЛЯ ПОДПИСКИ ============

  public handleModelUpdate(): void {
    const eggType = this.diaryModel.easterEgg;

    if (eggType) {
      this.diaryModel.easterEgg = null;
      const egg = EasterEggRegistry.find(eggType);
      const eggConfig = this.diaryModel.config.easterEggs[eggType];

      if (egg && eggConfig) {
        const ctx = this.view.getContext();

        if (egg.awaitsSecondInput) {
          EasterEggRegistry.beginAwait(egg, eggConfig.response, eggConfig.overlayText ?? '');
          this.diaryModel.isLocked = false;
          return;
        }

        egg.execute(ctx, this.currentWidth, this.currentHeight, eggConfig.response)
          .then(() => {
            if (eggType === 'crucio') {
              this.captureCrucioLayer();
            }
            if (eggConfig.finalize !== 'never-returns') {
              this.diaryModel.isLocked = false;
              this.finalizeSession();
            }
          })
          .catch(() => {
            this.diaryModel.isLocked = false;
            this.finalizeSession();
          });
      } else {
        this.diaryModel.isLocked = false;
        this.finalizeSession();
      }
      return;
    }

    const aiResponse = this.diaryModel.aiResponse;

    if (aiResponse?.isVisible && aiResponse.text && !this.aiResponseShown) {
      this.aiResponseShown = true;
      this.diaryModel.aiResponse = null;
      this.animateAIResponseIn(aiResponse.text);
    }
  }

  // ============ ИНИЦИАЛИЗАЦИЯ ============

  init(): void {
    this.currentWidth = window.innerWidth;
    this.currentHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    this.view.setDimensions(this.currentWidth, this.currentHeight, dpr);

    const preloadOnce = () => {
      this.canvas.removeEventListener("pointerdown", preloadOnce);
      void this.OCRService.preload?.(this.diaryModel.config.ocr.language);
    };
    this.canvas.addEventListener("pointerdown", preloadOnce, { once: true });

    this.canvas.addEventListener("pointerdown", (e: PointerEvent) => {
      e.preventDefault();
      if (this.diaryModel.isLocked) {
        e.stopPropagation();
        return;
      }
      this.handlePointerDown(e);
    }, { passive: false });

    // ИЗМЕНЕНО: pointermove больше не блокируется по isLocked —
    // handlePointerMove сам проверяет isLocked первой строкой.
    this.canvas.addEventListener("pointermove", (e: PointerEvent) => {
      e.preventDefault();
      this.handlePointerMove(e);
    }, { passive: false });

    // ИЗМЕНЕНО: pointerup всегда доходит до handlePointerUp, даже если
    // isLocked стал true во время штриха. Иначе isDrawing залипнет.
    this.canvas.addEventListener("pointerup", (e: PointerEvent) => {
      e.preventDefault();
      this.handlePointerUp(e);
    }, { passive: false });

    // КАК В ИСХОДНИКЕ: pointercancel → handlePointerUp.
    this.canvas.addEventListener("pointercancel", (e: PointerEvent) => {
      e.preventDefault();
      this.handlePointerUp(e);
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e: Event) => {
      e.preventDefault();
    });

    this.canvas.addEventListener('selectstart', (e: Event) => {
      e.preventDefault();
    });

    this.canvas.addEventListener('dragstart', (e: Event) => {
      e.preventDefault();
    });

    this.canvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (this.diaryModel.isLocked) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.handleDesktopInput(e);
    }, true);

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (this.diaryModel.isLocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    document.addEventListener("pointerdown", (e: PointerEvent) => {
      if (this.diaryModel.isLocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    window.addEventListener("resize", () => this.handleResize());
  }

  // ============ АДАПТИВ ============

  private getResponsive(base: number): number {
    const ratio = (this.currentWidth - LAYOUT.MIN_SCREEN) / (LAYOUT.MAX_SCREEN - LAYOUT.MIN_SCREEN);
    const clamped = Math.max(0, Math.min(1, ratio));
    return base * (LAYOUT.SCALE_MIN + LAYOUT.SCALE_RANGE * clamped);
  }

  private getTomResponseMetrics(): {
    padding: number;
    fontSize: number;
    lineHeight: number;
    startY: number;
    maxWidth: number;
  } {
    const w = this.currentWidth;
    const h = this.currentHeight;

    const padding = Math.max(16, w * 0.06);
    const fontSize = Math.max(16, Math.min(48, w * 0.055));
    const lineHeight = fontSize * 1.35;
    const startY = h * 0.22;
    const maxWidth = w - padding * 2;

    return { padding, fontSize, lineHeight, startY, maxWidth };
  }

  // ============ CRUCIO LAYER ============

  private captureCrucioLayer(): void {
    const snap = document.createElement('canvas');
    snap.width = this.canvas.width;
    snap.height = this.canvas.height;
    const sctx = snap.getContext('2d');
    if (sctx) sctx.drawImage(this.canvas, 0, 0);
    this.crucioLayer = snap;
  }

  // ============ АНИМАЦИЯ ОТВЕТА ТОМА ============

  private animateAIResponseIn(text: string): void {
    if (this.aiResponseAnimFrameId !== null) {
      cancelAnimationFrame(this.aiResponseAnimFrameId);
    }

    if (this.aiResponseTimeoutId !== null) {
      clearTimeout(this.aiResponseTimeoutId);
      this.aiResponseTimeoutId = null;
    }

    this.aiResponseText = text;
    this.diaryModel.isLocked = true;

    const totalFrames = ANIMATIONS.RESPONSE_FRAMES;
    let currentFrame = 0;

    const tick = () => {
      currentFrame++;
      const progress = currentFrame / totalFrames;
      const alpha = this.bezierEase(progress);

      this.view.clear(this.currentWidth, this.currentHeight);
      this.renderAIResponseText(alpha);

      if (currentFrame < totalFrames) {
        this.aiResponseAnimFrameId = requestAnimationFrame(tick);
      } else {
        this.view.clear(this.currentWidth, this.currentHeight);
        this.renderAIResponseText(1);
        this.aiResponseAnimFrameId = null;

        this.aiResponseTimeoutId = window.setTimeout(() => {
          this.animateAIResponseOut();
        }, ANIMATIONS.RESPONSE_PAUSE_MS);
      }
    };

    this.aiResponseAnimFrameId = requestAnimationFrame(tick);
  }

  private animateAIResponseOut(): void {
    if (this.aiResponseAnimFrameId !== null) {
      cancelAnimationFrame(this.aiResponseAnimFrameId);
    }

    if (this.aiResponseTimeoutId !== null) {
      clearTimeout(this.aiResponseTimeoutId);
      this.aiResponseTimeoutId = null;
    }

    this.diaryModel.isLocked = true;

    const totalFrames = ANIMATIONS.RESPONSE_FRAMES;
    let currentFrame = 0;

    const tick = () => {
      currentFrame++;
      const progress = currentFrame / totalFrames;
      const alpha = 1 - this.bezierEase(progress);

      this.view.clear(this.currentWidth, this.currentHeight);
      this.renderAIResponseText(alpha);

      if (currentFrame < totalFrames) {
        this.aiResponseAnimFrameId = requestAnimationFrame(tick);
      } else {
        this.view.clear(this.currentWidth, this.currentHeight);
        this.aiResponseAnimFrameId = null;
        this.aiResponseText = '';
        this.aiResponseShown = false;

        this.diaryModel.isLocked = false;
        this.diaryModel.aiResponse = null;

        this.finalizeSession();
      }
    };

    this.aiResponseAnimFrameId = requestAnimationFrame(tick);
  }

  private bezierEase(t: number): number {
    return t * t * (3 - 2 * t);
  }

  private renderAIResponseText(alpha: number): void {
    if (!this.aiResponseText || alpha <= 0) return;

    const { padding, fontSize, lineHeight, startY, maxWidth } =
      this.getTomResponseMetrics();
    const font = `${fontSize}px '${FONT_TOM}'`;

    const words = this.aiResponseText.split(' ');
    let line = '';
    let y = startY;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = this.view.measureText(testLine, font);

      if (width > maxWidth && line) {
        this.view.drawTextLine(line, padding, y, font, alpha);
        line = word;
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      this.view.drawTextLine(line, padding, y, font, alpha);
    }
  }

  // ============ ВВОД ============

  private handlePointerDown(e: PointerEvent): void {
    if (this.diaryModel.isLocked || this.isTyping) {
      return;
    }

    // ИЗМЕНЕНО: clearTimeout всегда, без проверки isDrawing.
    // Буферы strokeService/typedChars здесь НЕ чистим.
    if (this.ocrTimeoutId !== null) {
      window.clearTimeout(this.ocrTimeoutId);
      this.ocrTimeoutId = null;
    }

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Игнорируем
    }

    if (this.strokeService.getPoints().length === 0 && this.typedChars.length === 0) {
      this.sessionStartTime = performance.now();
    }

    this.isDrawing = true;

    this.strokeService.addPoint(
      e.clientX,
      e.clientY,
      this.currentWidth,
      this.currentHeight,
      true
    );
  }

  handlePointerMove(e: PointerEvent): void {
    if (this.diaryModel.isLocked || this.isTyping || !this.isDrawing) {
      return;
    }

    // ИЗМЕНЕНО: buttons === 0 для ЛЮБОГО pointerType, не только mouse.
    // Перо в воздухе (hover) завершает штрих.
    if (e.buttons === 0) {
      this.handlePointerUp(e);
      return;
    }

    this.strokeService.addPoint(e.clientX, e.clientY, this.currentWidth, this.currentHeight, false);

    const points = this.strokeService.getPoints();
    if (points.length < 2) {
      return;
    }

    this.renderLiveBezierSegment(points);
  }

  private handlePointerUp(_e: PointerEvent): void {
    if (!this.isDrawing) {
      return;
    }

    // ИЗМЕНЕНО: isDrawing сбрасывается сразу, а не внутри таймера.
    this.isDrawing = false;

    if (this.ocrTimeoutId !== null) {
      window.clearTimeout(this.ocrTimeoutId);
    }

    this.ocrTimeoutId = window.setTimeout(() => {
      if (EasterEggRegistry.isAwaitingInput()) {
        this.handleEasterEggSecondInput();
        return;
      }
      this.diaryModel.isLocked = true;
      this.executeAbsorptionLoop();
    }, ANIMATIONS.INPUT_DEBOUNCE_MS);
  }

  private handleDesktopInput(e: KeyboardEvent): void {
    if (this.diaryModel.isLocked || this.isDrawing) {
      return;
    }

    if (e.key === "Enter") {
      this.caretX = this.getResponsive(LAYOUT.START_X);
      this.caretY += this.getResponsive(LAYOUT.LINE_HEIGHT_USER);
      return;
    }

    if (e.key.length === 1) {
      if (this.ocrTimeoutId !== null && this.isTyping) {
        window.clearTimeout(this.ocrTimeoutId);
      }

      this.isTyping = true;

      if (this.strokeService.getPoints().length === 0 && this.typedChars.length === 0) {
        this.sessionStartTime = performance.now();
      }

      const fontSize = this.getResponsive(LAYOUT.BASE_FONT_SIZE);
      this.view.drawTextChar(e.key, this.caretX, this.caretY, `${fontSize}px '${FONT_INPUT}'`);

      this.typedChars.push({
        char: e.key,
        x: this.caretX,
        y: this.caretY,
        timestamp: performance.now() - this.sessionStartTime
      });

      this.caretX += this.getResponsive(LAYOUT.LETTER_SPACING);

      if (this.caretX > this.currentWidth - this.getResponsive(LAYOUT.START_X)) {
        this.caretX = this.getResponsive(LAYOUT.START_X);
        this.caretY += this.getResponsive(LAYOUT.LINE_HEIGHT_USER);
      }

      this.ocrTimeoutId = window.setTimeout(() => {
        if (EasterEggRegistry.isAwaitingInput()) {
          this.handleEasterEggSecondInput();
          return;
        }
        this.isTyping = false;
        this.diaryModel.isLocked = true;
        this.executeAbsorptionLoop();
      }, ANIMATIONS.INPUT_DEBOUNCE_MS);
    }
  }

  private handleEasterEggSecondInput(): void {
    this.isDrawing = false;
    this.isTyping = false;
    this.diaryModel.isLocked = true;

    const ctx = this.view.getContext();

    EasterEggRegistry.notifyInputComplete(
      ctx,
      this.currentWidth,
      this.currentHeight,
      {
        typedChars: this.typedChars.map(c => ({ char: c.char, x: c.x, y: c.y })),
        strokePoints: this.strokeService.getPoints().map(p => ({ x: p.x, y: p.y, isNew: p.isNew })),
      }
    ).then(() => {
      this.diaryModel.isLocked = false;
      this.finalizeSession();
    }).catch(() => {
      this.diaryModel.isLocked = false;
      this.finalizeSession();
    });
  }

  // ============ ОТРИСОВКА ЖИВОГО ШТРИХА ============

  private renderLiveBezierSegment(points: IPixelPoint[]): void {
    const len = points.length;
    const p1 = points[len - 2];
    const p2 = points[len - 1];

    const p1x = p1.x * this.currentWidth;
    const p1y = p1.y * this.currentHeight;
    const p2x = p2.x * this.currentWidth;
    const p2y = p2.y * this.currentHeight;

    const segment: IPixelPoint[] = [
      { x: p1x, y: p1y, isNew: p1.isNew },
      { x: p2x, y: p2y, isNew: false }
    ];

    this.view.drawStroke(segment);
  }

  // ============ ВПИТЫВАНИЕ ЧЕРНИЛ ============

  private getCapillaryNoise(index: number): number {
    const hash = (Math.imul(index, 0x9E3779B1) ^ 0x85EBCA6B) >>> 0;
    return 0.5 + (hash % 100) / 100;
  }

  private executeAbsorptionLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const dpr = window.devicePixelRatio || 1;
    const ocrBuffer = document.createElement("canvas");
    ocrBuffer.width = this.currentWidth * dpr;
    ocrBuffer.height = this.currentHeight * dpr;
    const ocrCtx = ocrBuffer.getContext("2d");

    if (ocrCtx) {
      ocrCtx.scale(dpr, dpr);

      ocrCtx.strokeStyle = COLORS.USER_INK;
      ocrCtx.lineWidth = 2;
      ocrCtx.lineCap = "round";
      ocrCtx.lineJoin = "round";

      const allPoints = this.strokeService.getPoints();
      if (allPoints.length > 0) {
        ocrCtx.beginPath();
        for (let i = 0; i < allPoints.length; i++) {
          const p = allPoints[i];
          const px = p.x * this.currentWidth;
          const py = p.y * this.currentHeight;
          if (p.isNew) ocrCtx.moveTo(px, py);
          else ocrCtx.lineTo(px, py);
        }
        ocrCtx.stroke();
      }

      const fontSize = this.getResponsive(LAYOUT.BASE_FONT_SIZE);
      ocrCtx.font = `${fontSize}px '${FONT_INPUT}'`;
      ocrCtx.fillStyle = COLORS.USER_INK;
      for (const tc of this.typedChars) {
        ocrCtx.fillText(tc.char, tc.x, tc.y);
      }
    }

    const ocrPromise = this.OCRService.recognize(
      ocrBuffer,
      this.diaryModel.config.ocr.language
    );

    const points = this.strokeService.getPoints();
    const totalInputDuration = this.typedChars.length > 0
      ? this.typedChars[this.typedChars.length - 1].timestamp
      : ANIMATIONS.ABSORPTION_DEFAULT_DURATION;

    const ctx = this.view.getContext();

    let currentFrame = 0;
    const totalFrames = ANIMATIONS.ABSORPTION_FRAMES;

    const tick = () => {
      currentFrame++;
      const globalProgress = currentFrame / totalFrames;

      this.view.clear(this.currentWidth, this.currentHeight);

      if (this.crucioLayer) {
        this.view.drawSnapshotScaled(this.crucioLayer, this.currentWidth, this.currentHeight);
      }

      this.drawFadingStrokes(ctx, points, globalProgress, totalInputDuration);
      this.drawFadingText(ctx, globalProgress, totalInputDuration);

      if (currentFrame < totalFrames) {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.view.clear(this.currentWidth, this.currentHeight);

        if (this.crucioLayer) {
          this.view.drawSnapshotScaled(this.crucioLayer, this.currentWidth, this.currentHeight);
        }

        this.view.resetFilters();
        this.animationFrameId = null;
        this.handleOCRResult(ocrPromise, ocrBuffer);
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private drawFadingStrokes(
    ctx: CanvasRenderingContext2D,
    points: IPixelPoint[],
    globalProgress: number,
    duration: number
  ): void {
    if (points.length === 0) return;

    let isPathOpen = false;
    const baseLineWidth = 2;
    const currentLineWidth = Math.max(0.1, baseLineWidth * (1.0 - globalProgress));

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const px = p.x * this.currentWidth;
      const py = p.y * this.currentHeight;

      const waveDelay = (i / points.length) * (duration / (duration + 1500));
      const progress = Math.min(1.0, Math.max(0, (globalProgress - waveDelay * 0.4) / (1.0 - waveDelay * 0.4)));

      if (progress >= 1.0) {
        if (isPathOpen) {
          ctx.stroke();
          isPathOpen = false;
        }
        continue;
      }

      if (p.isNew || !isPathOpen) {
        if (isPathOpen) {
          ctx.stroke();
        }

        const noise = this.getCapillaryNoise(i);
        const opacity = Math.pow(1.0 - progress, 1.8 * noise);

        ctx.beginPath();
        this.view.setAlpha(opacity);
        ctx.lineWidth = currentLineWidth;
        ctx.moveTo(px, py);
        isPathOpen = true;
      } else if (i < points.length - 1) {
        const nextP = points[i + 1];
        if (nextP.isNew) {
          ctx.lineTo(px, py);
          ctx.stroke();
          isPathOpen = false;
        } else {
          const midX = (px + nextP.x * this.currentWidth) / 2;
          const midY = (py + nextP.y * this.currentHeight) / 2;
          ctx.quadraticCurveTo(px, py, midX, midY);
        }
      } else {
        ctx.lineTo(px, py);
      }
    }

    if (isPathOpen) {
      ctx.stroke();
    }
  }

  private drawFadingText(
    ctx: CanvasRenderingContext2D,
    globalProgress: number,
    duration: number
  ): void {
    const fontSize = this.getResponsive(LAYOUT.BASE_FONT_SIZE);

    for (let i = 0; i < this.typedChars.length; i++) {
      const tc = this.typedChars[i];
      const waveDelay = tc.timestamp / (duration + 1000);
      const progress = Math.min(1.0, Math.max(0, (globalProgress - waveDelay * 0.5) / (1.0 - waveDelay * 0.5)));

      if (progress >= 1.0) continue;

      const noise = this.getCapillaryNoise(i + 1000);
      const opacity = Math.pow(1.0 - progress, 1.8 * noise);

      ctx.save();
      this.view.setAlpha(opacity);
      this.view.drawTextChar(tc.char, tc.x, tc.y, `${fontSize}px '${FONT_INPUT}'`);
      ctx.restore();
    }
  }

  // ============ OCR ============

  private handleOCRResult(
    ocrPromise: Promise<string>,
    bufferedCanvas: HTMLCanvasElement
  ): void {
    this.diaryModel.isLoading = true;

    ocrPromise
      .then((recognizedText: string) => {
        this.diaryModel.isLoading = false;

        if (recognizedText && recognizedText.trim().length > 0) {
          this.diaryModel.pendingImage = bufferedCanvas.toDataURL('image/png');
          this.diaryModel.text = recognizedText;
        } else {
          this.diaryModel.isLocked = false;
          this.finalizeSession();
        }
      })
      .catch(() => {
        this.diaryModel.isLoading = false;
        this.diaryModel.isLocked = false;
        this.finalizeSession();
      });
  }

  // ============ ФИНАЛИЗАЦИЯ ============

  public finalizeSession(): void {
    this.ocrTimeoutId = null;
    this.caretX = this.getResponsive(LAYOUT.START_X);
    this.caretY = this.getResponsive(LAYOUT.START_Y);
    this.isDrawing = false;
    this.isTyping = false;
    this.typedChars = [];
    this.strokeService.clear();
  }

  handleResize(): void {
    this.currentWidth = window.innerWidth;
    this.currentHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    this.view.setDimensions(this.currentWidth, this.currentHeight, dpr);

    if (this.crucioLayer) {
      this.view.drawSnapshotScaled(this.crucioLayer, this.currentWidth, this.currentHeight);
    }
  }

  public clearCanvas(): void {
    this.view.clear(this.currentWidth, this.currentHeight);
  }
}