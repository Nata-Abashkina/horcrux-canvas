import { bezier } from './Bezier';
import { runFrames } from './RunFrames';
import { LORE_ANIMATIONS } from '../config/lore.hp.config';

export interface IFadeCallbacks {
  onAppear: (alpha: number) => void;
  onFull: () => void;
  onDisappear: (alpha: number) => void;
  onClear: () => void;
}

export const appearPauseDisappear = async (cb: IFadeCallbacks): Promise<void> => {
  await runFrames(LORE_ANIMATIONS.EGG_FADE_FRAMES, (progress) => {
    cb.onAppear(bezier(progress));
  });

  cb.onFull();

  await new Promise((r) => setTimeout(r, LORE_ANIMATIONS.EGG_FADE_PAUSE_MS));

  await runFrames(LORE_ANIMATIONS.EGG_FADE_FRAMES, (progress) => {
    cb.onDisappear(1 - bezier(progress));
  });

  cb.onClear();
};