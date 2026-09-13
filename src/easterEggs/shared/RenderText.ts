export interface ITextRenderOptions {
  fontSize: number;
  color: string;
  alpha: number;
  startX: number;
  startY: number;
  maxWidth: number;
  lineHeight: number;
  fontFamily: string;
}

export const renderText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: ITextRenderOptions
): void => {
  ctx.save();
  ctx.font = `${opts.fontSize}px ${opts.fontFamily}`;
  ctx.fillStyle = opts.color;
  ctx.globalAlpha = opts.alpha;

  const words = text.split(' ');
  let line = '';
  let y = opts.startY;

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > opts.maxWidth && line) {
      ctx.fillText(line, opts.startX, y);
      line = word;
      y += opts.lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, opts.startX, y);
  }

  ctx.restore();
};