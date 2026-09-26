// src/easterEggs/IEasterEgg.ts
export interface ICanvasState {
  typedChars: { char: string; x: number; y: number }[];
  strokePoints: { x: number; y: number; isNew: boolean }[];
}

export interface IEasterEgg {
  readonly type: string;
  readonly awaitsSecondInput?: boolean;

  execute(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string
  ): Promise<void>;

  continueExecution?(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    response: string,
    overlayText: string,
    canvasState: ICanvasState
  ): Promise<void>;
}