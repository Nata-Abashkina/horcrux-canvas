export interface IEasterEgg {
  readonly type: string;
  execute(ctx: CanvasRenderingContext2D, width: number, height: number, response: string): Promise<void>;
}