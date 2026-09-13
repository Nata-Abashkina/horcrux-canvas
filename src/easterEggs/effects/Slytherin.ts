import { BaseImageEgg } from '../shared/BaseImageEgg';
import slytherinUrl from '../../assets/easterEggs/slytherin.svg';

export class Slytherin extends BaseImageEgg {
  readonly type = 'slytherin';
  protected readonly svgUrl = slytherinUrl;
  protected readonly glowColor = 'rgba(0, 150, 50, ';
  protected readonly textYRatio = 0.65;
  protected readonly useGlow = true;
}