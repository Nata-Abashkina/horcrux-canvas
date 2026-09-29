import { BaseImageEgg } from '../shared/BaseImageEgg';
import { LORE_COLORS, LORE_LAYOUT } from '../config/lore.hp.config';
import gryffindorUrl from '../../assets/easterEggs/gryffindor.svg';

export class Gryffindor extends BaseImageEgg {
  readonly type = 'gryffindor';
  protected readonly svgUrl = gryffindorUrl;
  protected readonly glowColor = LORE_COLORS.GLOW_GRYFFINDOR;
  protected readonly textYRatio = LORE_LAYOUT.EGG_TEXT_START_Y_NORMAL;
  protected readonly useGlow = true;
}