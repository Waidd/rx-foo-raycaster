import Block from './Block';

export default class Map {
  constructor(content, atlas) {
    this.content = content;
    this.atlas = atlas;
    this.build();
  }

  build() {
    this.data = this.content.map(line => line.map((column) => {
      const texture = this.atlas[column] || this.atlas.default;
      return new Block(texture);
    }));
  }

  collide(x, y) {
    if (this.isOutOf(x, y)) { return null; }
    return Boolean(this.content[x][y]) || null;
  }

  getBlockAt(x, y) {
    return this.data[x][y];
  }

  isOutOf(x, y) {
    if (x < 0 || x >= this.content.length) { return true; }
    if (y < 0 || y >= this.content[x].length) { return true; }
    return false;
  }

  toString() {
    return this.content.map(line => line.join(',')).join('\n');
  }
}
