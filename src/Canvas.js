export default class Canvas {
  constructor(parent, width, height) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.border = '1px solid red';
    this.context = this.canvas.getContext('2d');

    parent.append(this.canvas);
  }

  clear() {
    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPixel(x, y, color = '#FF00DC') {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, 1, 1);
  }

  drawRect(x, y, width, height, color = '#FF00DC') {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, width, height);
  }

  drawImage(...args) {
    this.context.drawImage(...args);
  }
}
