import { BaseImageEgg } from '../shared/BaseImageEgg';
import hufflepuffUrl from '../../assets/easterEggs/hufflepuff.svg';

export class Hufflepuff extends BaseImageEgg {
  readonly type = 'hufflepuff';
  protected readonly svgUrl = hufflepuffUrl;
  protected readonly glowColor = 'rgba(255, 200, 0, ';
  protected readonly textYRatio = 0.7;
  protected readonly useGlow = true;
  protected readonly useMultiply = true;

  protected getImageY(height: number, size: number): number {
    return (height - size) / 2 - height * 0.1;
  }
}