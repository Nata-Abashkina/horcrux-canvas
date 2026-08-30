import type { ICanvasPresenter, ICanvasView, IDiaryModel, IOCRService, IStrokeService, IPixelPoint } from "../types";

interface IChronologicalChar {
  char: string;
  x: number;
  y: number;
  timestamp: number;
}

interface ICanvasViewWithContext extends ICanvasView {
  readonly ctx: CanvasRenderingContext2D;
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

  private caretX: number = 50; 
  private caretY: number = 130;

  private typedChars: IChronologicalChar[] = [];
  private sessionStartTime: number = 0;
  
  private aiResponseAnimFrameId: number | null = null;
  private aiResponseText: string = '';
  private aiResponseTimeoutId: number | null = null;
  private aiResponseShown: boolean = false;

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

    const existingOnDataChanged = this.diaryModel.onDataChanged;

    this.diaryModel.onDataChanged = () => {
      if (existingOnDataChanged) {
        existingOnDataChanged();
      }
      
      const aiResponse = this.diaryModel.aiResponse;
      
      if (aiResponse?.isVisible && aiResponse.text && !this.aiResponseShown) {
        this.aiResponseShown = true;
        this.diaryModel.aiResponse = null;
        this.animateAIResponseIn(aiResponse.text);
      }
    };
  }

  init(): void {
    this.currentWidth = window.innerWidth;
    this.currentHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    this.view.setDimensions(this.currentWidth, this.currentHeight, dpr);

    this.canvas.addEventListener("pointerdown", (e: PointerEvent) => {
      if (this.diaryModel.isLocked) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.handlePointerDown(e);
    });

    this.canvas.addEventListener("pointermove", (e: PointerEvent) => {
      if (this.diaryModel.isLocked) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.handlePointerMove(e);
    });

    this.canvas.addEventListener("pointerup", (e: PointerEvent) => {
      if (this.diaryModel.isLocked) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.handlePointerUp(e);
    });

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

  private getResponsiveFontSize(baseSize: number): number {
    const minScreen = 320;
    const maxScreen = 1920;
    const ratio = (this.currentWidth - minScreen) / (maxScreen - minScreen);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return baseSize * (0.5 + 0.5 * clampedRatio);
  }

  private getResponsiveSpacing(baseSpacing: number): number {
    const minScreen = 320;
    const maxScreen = 1920;
    const ratio = (this.currentWidth - minScreen) / (maxScreen - minScreen);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return baseSpacing * (0.5 + 0.5 * clampedRatio);
  }

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
    
    const totalFrames = 300;
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
        }, 5000);
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
    
    const totalFrames = 300;
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
      }
    };
    
    this.aiResponseAnimFrameId = requestAnimationFrame(tick);
  }

  private bezierEase(t: number): number {
    return t * t * (3 - 2 * t);
  }

  private renderAIResponseText(alpha: number): void {
    if (!this.aiResponseText || alpha <= 0) return;
    
    const viewWithContext = this.view as ICanvasViewWithContext;
    const ctx = viewWithContext.ctx;
    
    if (!ctx) return;
    
    const fontSize = this.getResponsiveFontSize(80);
    const lineHeight = this.getResponsiveSpacing(90);
    const startX = this.getResponsiveSpacing(50);
    const startY = this.getResponsiveSpacing(400);
    const maxWidth = this.currentWidth - startX * 2;
    
    ctx.save();
    ctx.font = `${fontSize}px Gabriela`;
    ctx.fillStyle = "#1a1a3a";
    ctx.globalAlpha = alpha;
    
    const words = this.aiResponseText.split(' ');
    let line = '';
    let y = startY;
    
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

  private handlePointerDown(e: PointerEvent): void {
    if (this.diaryModel.isLocked || (this.ocrTimeoutId !== null && this.isTyping)) {
      return;
    }

    if (this.ocrTimeoutId !== null && this.isDrawing) {
      window.clearTimeout(this.ocrTimeoutId);
      this.ocrTimeoutId = null;
    }

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (err) {
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

    if (this.isDrawing && e.buttons === 0) {
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

  private handlePointerUp(e: PointerEvent): void {
    if (!this.isDrawing) {
      return;
    }

    if (this.ocrTimeoutId !== null) {
      window.clearTimeout(this.ocrTimeoutId);
    }

    this.ocrTimeoutId = window.setTimeout(() => {
      this.isDrawing = false;
      this.executeAbsorptionLoop();
    }, 1200);
  }

  private handleDesktopInput(e: KeyboardEvent): void {
    if (this.diaryModel.isLocked || (this.ocrTimeoutId !== null && this.isDrawing)) {
      return;
    }

    if (e.key === "Enter") {
      this.caretX = this.getResponsiveSpacing(50);
      this.caretY += this.getResponsiveSpacing(130);
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

      const fontSize = this.getResponsiveFontSize(80);
      this.view.drawTextChar(e.key, this.caretX, this.caretY, `${fontSize}px 'Special Elite'`);

      this.typedChars.push({
        char: e.key,
        x: this.caretX,
        y: this.caretY,
        timestamp: performance.now() - this.sessionStartTime
      });

      this.caretX += this.getResponsiveSpacing(65);

      if (this.caretX > this.currentWidth - this.getResponsiveSpacing(50)) {
        this.caretX = this.getResponsiveSpacing(50);
        this.caretY += this.getResponsiveSpacing(130);
      }

      this.ocrTimeoutId = window.setTimeout(() => {
        this.isTyping = false;
        this.executeAbsorptionLoop();
      }, 1200);
    }
  }

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
      ocrCtx.drawImage(this.canvas, 0, 0);
    }

    const points = this.strokeService.getPoints();
    const totalInputDuration = this.typedChars.length > 0 
      ? this.typedChars[this.typedChars.length - 1].timestamp 
      : 3000;

    let currentFrame = 0;
    const totalFrames = 180;

    const tick = () => {
      currentFrame++;
      const globalProgress = currentFrame / totalFrames;

      this.view.clear(this.currentWidth, this.currentHeight);

      const viewWithContext = this.view as ICanvasViewWithContext;
      const ctx = viewWithContext.ctx;
      
      if (ctx) {
        this.drawFadingStrokes(ctx, points, globalProgress, totalInputDuration);
        this.drawFadingText(ctx, globalProgress, totalInputDuration);
      }

      if (currentFrame < totalFrames) {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.view.clear(this.currentWidth, this.currentHeight);
        this.view.resetFilters();
        this.animationFrameId = null;
        this.triggerOCRService(ocrBuffer);
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
    const fontSize = this.getResponsiveFontSize(80);
    
    for (let i = 0; i < this.typedChars.length; i++) {
      const tc = this.typedChars[i];
      const waveDelay = tc.timestamp / (duration + 1000);
      const progress = Math.min(1.0, Math.max(0, (globalProgress - waveDelay * 0.5) / (1.0 - waveDelay * 0.5)));

      if (progress >= 1.0) continue;

      const noise = this.getCapillaryNoise(i + 1000);
      const opacity = Math.pow(1.0 - progress, 1.8 * noise);

      ctx.save();
      this.view.setAlpha(opacity);
      this.view.drawTextChar(tc.char, tc.x, tc.y, `${fontSize}px 'Special Elite'`);
      ctx.restore();
    }
  }

  private triggerOCRService(bufferedCanvas: HTMLCanvasElement): void {
    this.diaryModel.isLocked = true;
    this.diaryModel.isLoading = true;

    this.OCRService.recognize(bufferedCanvas, this.diaryModel.config.ocr.language)
      .then((recognizedText: string) => {
        this.diaryModel.isLoading = false;
        
        if (recognizedText && recognizedText.trim().length > 0) {
          this.diaryModel.text = recognizedText;
        }
      })
      .catch((error: Error) => {
        console.error('Ошибка OCR:', error);
        this.diaryModel.isLoading = false;
      })
      .finally(() => {
        this.finalizeSession();
      });
  }

  private finalizeSession(): void {
    this.ocrTimeoutId = null;
    this.caretX = this.getResponsiveSpacing(50);
    this.caretY = this.getResponsiveSpacing(130);
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
  }
    
  public clearCanvas(): void {
    this.view.clear(this.currentWidth, this.currentHeight);
  }
}

/*import type { ICanvasPresenter, ICanvasView, IDiaryModel, IOCRService, IStrokeService, IPixelPoint } from "../types";

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

  private caretX: number = 50; 
  private caretY: number = 130;

  private typedChars: IChronologicalChar[] = [];
  private sessionStartTime: number = 0;

  constructor(view: ICanvasView, strokeService: IStrokeService, OCRService: IOCRService, diaryModel: IDiaryModel, canvas: HTMLCanvasElement) {
    this.view = view;
    this.strokeService = strokeService;
    this.OCRService = OCRService;
    this.diaryModel = diaryModel;
    this.canvas = canvas;
  }

  init() {
    this.currentWidth = window.innerWidth;
    this.currentHeight = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    this.view.setDimensions(this.currentWidth, this.currentHeight, dpr);

    this.canvas.addEventListener("pointerdown", (e: PointerEvent) => this.handlePointerDown(e));
    this.canvas.addEventListener("pointermove", (e: PointerEvent) => this.handlePointerMove(e));
    this.canvas.addEventListener("pointerup", (e: PointerEvent) => this.handlePointerUp(e));
  
    window.addEventListener("resize", () => this.handleResize());
    window.addEventListener("keydown", (e: KeyboardEvent) => this.handleDesktopInput(e));
  }

  private handlePointerDown(e: PointerEvent): void {
    // ЖЕСТКИЙ ВАШ ЗАМОК: Если тикает таймер клавиатуры — мышь идет в жопу
    if (this.diaryModel.isLocked || (this.ocrTimeoutId !== null && this.isTyping)) {
      return;
    }

    // Если рисование продолжается в рамках одной сессии, сбрасываем ТОЛЬКО графический таймер
    if (this.ocrTimeoutId !== null && this.isDrawing) {
      window.clearTimeout(this.ocrTimeoutId);
      this.ocrTimeoutId = null;
    }

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (err) {
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

  handlePointerMove(e: PointerEvent) {
    if (this.diaryModel.isLocked || this.isTyping || !this.isDrawing) {
      return;
    }

    if (this.isDrawing && e.buttons === 0) {
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

  private handlePointerUp(e: PointerEvent): void {
    if (!this.isDrawing) {
      return;
    }

    // Обратите внимание: isDrawing остается true, пока не кончится дебаунс! Это держит Mutex запертым
    if (this.ocrTimeoutId !== null) {
      window.clearTimeout(this.ocrTimeoutId);
    }

    this.ocrTimeoutId = window.setTimeout(() => {
      this.isDrawing = false; // Сбрасываем флаг только перед анимацией
      this.executeAbsorptionLoop();
    }, 1200);
  }

  private handleDesktopInput(e: KeyboardEvent): void {
    // ЖЕСТКИЙ ВАШ ЗАМОК: Если тикает таймер мыши — клавиатура мертва
    if (this.diaryModel.isLocked || (this.ocrTimeoutId !== null && this.isDrawing)) {
      return;
    }

    if (e.key === "Enter") {
      this.caretX = 50; 
      this.caretY += 130; 
      return;
    }

    if (e.key.length === 1) {
      // Продлевать таймер может только клавиатурная сессия
      if (this.ocrTimeoutId !== null && this.isTyping) {
        window.clearTimeout(this.ocrTimeoutId);
      }

      this.isTyping = true;

      if (this.strokeService.getPoints().length === 0 && this.typedChars.length === 0) {
        this.sessionStartTime = performance.now();
      }

      this.view.drawTextChar(e.key, this.caretX, this.caretY, "104px 'Special Elite'");

      this.typedChars.push({
        char: e.key,
        x: this.caretX,
        y: this.caretY,
        timestamp: performance.now() - this.sessionStartTime
      });

      this.caretX += 85;

      if (this.caretX > this.currentWidth - 50) {
        this.caretX = 50;
        this.caretY += 130;
      }

      this.ocrTimeoutId = window.setTimeout(() => {
        this.isTyping = false; // Сбрасываем флаг только перед анимацией
        this.executeAbsorptionLoop();
      }, 1200);
    }
  }

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

  private getCapillaryNoise(index: number): number {
    const hash = (Math.imul(index, 0x9E3779B1) ^ 0x85EBCA6B) >>> 0;
    return 0.5 + (hash % 100) / 100;
  }

  private executeAbsorptionLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const dpr = window.devicePixelRatio || 1;
    const ocrBuffer = document.createElement("canvas");
    ocrBuffer.width = this.currentWidth * dpr;
    ocrBuffer.height = this.currentHeight * dpr;
    const ocrCtx = ocrBuffer.getContext("2d");
    if (ocrCtx) {
      ocrCtx.drawImage(this.canvas, 0, 0);
    }

    const points = this.strokeService.getPoints();
    const totalInputDuration = this.typedChars.length > 0 
      ? this.typedChars[this.typedChars.length - 1].timestamp 
      : 3000;

    let currentFrame = 0;
    const totalFrames = 180;

    const tick = () => {
      currentFrame++;
      const globalProgress = currentFrame / totalFrames;

      this.view.clear(this.currentWidth, this.currentHeight);

      const rawCtx = (this.view as any).ctx;
      if (rawCtx) {
        this.drawFadingStrokes(rawCtx, points, globalProgress, totalInputDuration);
        this.drawFadingText(rawCtx, globalProgress, totalInputDuration);
      }

      if (currentFrame < totalFrames) {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.view.clear(this.currentWidth, this.currentHeight);
        this.view.resetFilters();
        this.animationFrameId = null;
        this.triggerOCRService(ocrBuffer);
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private drawFadingStrokes(ctx: CanvasRenderingContext2D, points: IPixelPoint[], globalProgress: number, duration: number): void {
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

  private drawFadingText(ctx: CanvasRenderingContext2D, globalProgress: number, duration: number): void {
    for (let i = 0; i < this.typedChars.length; i++) {
      const tc = this.typedChars[i];
      const waveDelay = tc.timestamp / (duration + 1000);
      const progress = Math.min(1.0, Math.max(0, (globalProgress - waveDelay * 0.5) / (1.0 - waveDelay * 0.5)));

      if (progress >= 1.0) continue;

      const noise = this.getCapillaryNoise(i + 1000);
      const opacity = Math.pow(1.0 - progress, 1.8 * noise);

      ctx.save();
      this.view.setAlpha(opacity);
      this.view.drawTextChar(tc.char, tc.x, tc.y, "104px 'Special Elite'");
      ctx.restore();
    }
  }

  private triggerOCRService(bufferedCanvas: HTMLCanvasElement): void {
    this.diaryModel.isLocked = true;
    this.diaryModel.isLoading = true;

    this.OCRService.recognize(bufferedCanvas, this.diaryModel.config.ocr.language)
      .then(() => {
        this.diaryModel.isLoading = false;
      })
      .catch(() => {
        this.diaryModel.isLocked = false;
        this.diaryModel.isLoading = false;
      })
      .finally(() => {
        this.finalizeSession();
      });
    }
    
    private finalizeSession(): void {
      this.ocrTimeoutId = null;this.caretX = 50;
      this.caretY = 130;this.isDrawing = false;
      this.isTyping = false;this.typedChars = [];
      this.strokeService.clear();
      this.view.clear(this.currentWidth, this.currentHeight);
    }
    
    handleResize(): void {
      this.currentWidth = window.innerWidth;
      this.currentHeight = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      this.view.setDimensions(this.currentWidth, this.currentHeight, dpr);
    }
    
    public clearCanvas(): void {
      this.view.clear(this.currentWidth, this.currentHeight);
    }
  }*/