import { BaseImageEgg } from '../shared/BaseImageEgg';
import gryffindorUrl from '../../assets/easterEggs/gryffindor.svg';

export class Gryffindor extends BaseImageEgg {
  readonly type = 'gryffindor';
  protected readonly svgUrl = gryffindorUrl;
  protected readonly glowColor = 'rgba(180, 30, 30, ';
  protected readonly textYRatio = 0.65;
  protected readonly useGlow = true;
}