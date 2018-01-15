export default class Map {
  constructor(content) {
    this.content = content;
  }

  collide(x, y) {
    if (this.isOutOf(x, y)) { return null; }
    return this.content[x][y] || null;
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
