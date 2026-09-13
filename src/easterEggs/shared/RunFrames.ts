export const runFrames = (
  totalFrames: number,
  onFrame: (progress: number) => void
): Promise<void> =>
  new Promise((resolve) => {
    let frame = 0;
    const tick = () => {
      onFrame(frame / totalFrames);
      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });