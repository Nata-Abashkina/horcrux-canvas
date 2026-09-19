import type { IEasterEgg, ICanvasState } from './IEasterEgg';

export class EasterEggRegistry {
  private static readonly eggs: Map<string, IEasterEgg> = new Map();
  private static awaitingEgg: IEasterEgg | null = null;
  private static awaitingResponse: string = '';
  private static awaitingOverlay: string = '';

  static register(egg: IEasterEgg): void {
    this.eggs.set(egg.type, egg);
  }

  static find(type: string): IEasterEgg | null {
    return this.eggs.get(type) || null;
  }

  static getAll(): IEasterEgg[] {
    return Array.from(this.eggs.values());
  }

  static beginAwait(egg: IEasterEgg, response: string, overlayText: string): void {
    this.awaitingEgg = egg;
    this.awaitingResponse = response;
    this.awaitingOverlay = overlayText;
  }

  static isAwaitingInput(): boolean {
    return this.awaitingEgg !== null;
  }

  static async notifyInputComplete(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    canvasState: ICanvasState
  ): Promise<void> {
    const egg = this.awaitingEgg;
    const response = this.awaitingResponse;
    const overlay = this.awaitingOverlay;
    this.awaitingEgg = null;
    this.awaitingResponse = '';
    this.awaitingOverlay = '';

    if (!egg) return;

    if (egg.continueExecution) {
      await egg.continueExecution(ctx, width, height, response, overlay, canvasState);
    }
  }

  static resetAwait(): void {
    this.awaitingEgg = null;
    this.awaitingResponse = '';
    this.awaitingOverlay = '';
  }
}