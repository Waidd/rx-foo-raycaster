import Texture from './Texture';

const DOG_ELEMENTS = {
  RUNNING_000_00: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  },
  RUNNING_045_00: {
    x: 66, // 65
    y: 0,
    width: 62, // 64
    height: 62, // 64
  },
  RUNNING_045_01: {
    x: 65,
    y: 65,
    width: 64,
    height: 64,
  },
  RUNNING_045_02: {
    x: 65,
    y: 130,
    width: 64,
    height: 64,
  },
  RUNNING_045_03: {
    x: 65,
    y: 195,
    width: 64,
    height: 64,
  },
};

const DOG_ANIMATIONS = {
  RUNNING_045: ['RUNNING_045_00', 'RUNNING_045_01', 'RUNNING_045_02', 'RUNNING_045_03'],
};

export default class SpriteSheet extends Texture {
  constructor(src) {
    super(src);

    this.elements = DOG_ELEMENTS;
    this.animations = DOG_ANIMATIONS;
  }

  static load(src) {
    return new SpriteSheet(src).stream$;
  }
}
