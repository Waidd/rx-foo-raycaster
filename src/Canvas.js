export default class Canvas {
  constructor(parent, width, height) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.border = '1px solid red';
    this.context = this.canvas.getContext('2d');

    this.shadowCanvas = document.createElement('canvas');
    this.shadowCanvas.width = width;
    this.shadowCanvas.height = height;
    this.shadowContext = this.shadowCanvas.getContext('2d');

    parent.append(this.canvas);
  }

  clear() {
    this.shadowContext.fillStyle = 'black';
    this.shadowContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPixel(x, y, color = '#FF00DC') {
    this.shadowContext.fillStyle = color;
    this.shadowContext.fillRect(x, y, 1, 1);
  }

  drawRect(x, y, width, height, color = '#FF00DC') {
    this.shadowContext.fillStyle = color;
    this.shadowContext.fillRect(x, y, width, height);
  }

  drawImage(...args) {
    this.shadowContext.drawImage(...args);
  }

  render() {
    this.context.drawImage(this.shadowCanvas, 0, 0);
  }
}
