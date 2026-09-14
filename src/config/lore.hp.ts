import { EasterEggRegistry } from '../easterEggs/EasterEggRegistry';
import { AvadaKedavra } from '../easterEggs/effects/AvadaKedavra';
import { Hufflepuff } from '../easterEggs/effects/Hufflepuff';
import { Ravenclaw } from '../easterEggs/effects/Ravenclaw';
import { Gryffindor } from '../easterEggs/effects/Gryffindor';
import { Slytherin } from '../easterEggs/effects/Slytherin';
import { Hogwarts } from '../easterEggs/effects/Hogwarts';
import { Nagini } from '../easterEggs/effects/Nagini';

export const registerLore = (): void => {
  EasterEggRegistry.register(new AvadaKedavra());
  EasterEggRegistry.register(new Hufflepuff());
  EasterEggRegistry.register(new Ravenclaw());
  EasterEggRegistry.register(new Gryffindor());
  EasterEggRegistry.register(new Slytherin());
  EasterEggRegistry.register(new Hogwarts());
  EasterEggRegistry.register(new Nagini());
};