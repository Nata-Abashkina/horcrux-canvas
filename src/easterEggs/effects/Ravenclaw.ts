import { BaseImageEgg } from '../shared/BaseImageEgg';
import { LORE_COLORS, LORE_LAYOUT } from '../config/lore.hp.config';
import ravenclawUrl from '../../assets/easterEggs/ravenclaw.svg';

export class Ravenclaw extends BaseImageEgg {
  readonly type = 'ravenclaw';
  protected readonly svgUrl = ravenclawUrl;
  protected readonly glowColor = LORE_COLORS.GLOW_RAVENCLAW;
  protected readonly textYRatio = LORE_LAYOUT.EGG_TEXT_START_Y_NORMAL;
  protected readonly useGlow = true;
  protected readonly useMultiply = true;
}