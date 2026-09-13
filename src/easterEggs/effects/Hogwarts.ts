import { BaseImageEgg } from '../shared/BaseImageEgg';
import hogwartsUrl from '../../assets/easterEggs/hogwarts.svg';

export class Hogwarts extends BaseImageEgg {
  readonly type = 'hogwarts';
  protected readonly svgUrl = hogwartsUrl;
  protected readonly textYRatio = 0.65;
}