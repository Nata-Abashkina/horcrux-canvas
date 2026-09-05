import type { IEasterEgg } from './IEasterEgg';

export class EasterEggRegistry {
  private static readonly eggs: Map<string, IEasterEgg> = new Map();

  static register(egg: IEasterEgg): void {
    this.eggs.set(egg.type, egg);
  }

  static find(type: string): IEasterEgg | null {
    return this.eggs.get(type) || null;
  }

  static getAll(): IEasterEgg[] {
    return Array.from(this.eggs.values());
  }
}