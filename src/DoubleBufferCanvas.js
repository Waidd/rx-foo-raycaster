import Canvas from './Canvas';

export default class DoubleBufferCanvas extends Canvas {
  constructor(parent, width, height) {
    super(parent, width, height);

    this.bufferLen = width * height;
    this.currentBuffer = Array(this.bufferLen);
    this.nextBuffer = Array(this.bufferLen);
  }

  computeXYIndex(x, y) {
    return ((y * this.canvas.width) + x);
  }

  drawPixel(x, y, color = '#FF00DC') {
    this.nextBuffer[this.computeXYIndex(x, y)] = color;
  }

  render() {
    for (let y = 0; y < this.canvas.height; y += 1) {
      for (let x = 0; x < this.canvas.width; x += 1) {
        const index = this.computeXYIndex(x, y);

        if (this.currentBuffer[index] !== this.nextBuffer[index]) {
          super.drawPixel(x, y, this.nextBuffer[index]);
          this.currentBuffer[index] = this.nextBuffer[index];
        }
      }
    }
  }
}
