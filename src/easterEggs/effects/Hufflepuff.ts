import { BaseImageEgg } from '../shared/BaseImageEgg';
import { LORE_COLORS, LORE_LAYOUT } from '../config/lore.hp.config';
import hufflepuffUrl from '../../assets/easterEggs/hufflepuff.svg';

export class Hufflepuff extends BaseImageEgg {
  readonly type = 'hufflepuff';
  protected readonly svgUrl = hufflepuffUrl;
  protected readonly glowColor = LORE_COLORS.GLOW_HUFFLEPUFF;
  protected readonly textYRatio = LORE_LAYOUT.EGG_TEXT_START_Y_NORMAL;
  protected readonly useGlow = true;
  protected readonly useMultiply = true;
}