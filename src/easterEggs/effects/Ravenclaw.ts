import { BaseImageEgg } from '../shared/BaseImageEgg';
import ravenclawUrl from '../../assets/easterEggs/ravenclaw.svg';

export class Ravenclaw extends BaseImageEgg {
  readonly type = 'ravenclaw';
  protected readonly svgUrl = ravenclawUrl;
  protected readonly glowColor = 'rgba(0, 100, 200, ';
  protected readonly textYRatio = 0.65;
  protected readonly useGlow = true;
  protected readonly useMultiply = true;
}