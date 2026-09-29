import { BaseImageEgg } from '../shared/BaseImageEgg';
import { LORE_LAYOUT } from '../config/lore.hp.config';
import hogwartsUrl from '../../assets/easterEggs/hogwarts.svg';

export class Hogwarts extends BaseImageEgg {
  readonly type = 'hogwarts';
  protected readonly svgUrl = hogwartsUrl;
  protected readonly textYRatio = LORE_LAYOUT.EGG_TEXT_START_Y_NORMAL;
}