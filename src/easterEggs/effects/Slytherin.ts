import { BaseImageEgg } from '../shared/BaseImageEgg';
import { LORE_COLORS, LORE_LAYOUT } from '../config/lore.hp.config';
import slytherinUrl from '../../assets/easterEggs/slytherin.svg';

export class Slytherin extends BaseImageEgg {
  readonly type = 'slytherin';
  protected readonly svgUrl = slytherinUrl;
  protected readonly glowColor = LORE_COLORS.GLOW_SLYTHERIN;
  protected readonly textYRatio = LORE_LAYOUT.EGG_TEXT_START_Y_NORMAL;
  protected readonly useGlow = true;
}