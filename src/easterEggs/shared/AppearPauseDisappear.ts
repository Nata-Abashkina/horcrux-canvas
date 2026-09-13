import { bezier } from './Bezier';
import { runFrames } from './RunFrames';

export const TOTAL_FRAMES = 300;
export const PAUSE_MS = 5000;

export interface IFadeCallbacks {
  onAppear: (alpha: number) => void;
  onFull: () => void;
  onDisappear: (alpha: number) => void;
  onClear: () => void;
}

export const appearPauseDisappear = async (cb: IFadeCallbacks): Promise<void> => {
  await runFrames(TOTAL_FRAMES, (progress) => {
    cb.onAppear(bezier(progress));
  });

  cb.onFull();

  await new Promise((r) => setTimeout(r, PAUSE_MS));

  await runFrames(TOTAL_FRAMES, (progress) => {
    cb.onDisappear(1 - bezier(progress));
  });

  cb.onClear();
};