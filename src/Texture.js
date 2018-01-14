import { Subject } from 'rxjs/Subject';

export default class Texture {
  constructor(src) {
    this.image = new Image();
    this.image.onload = this.onload.bind(this);
    this.image.src = src;
    this.stream$ = new Subject();
  }

  extractImageData() {
    const canvas = document.createElement('canvas');
    canvas.width = this.image.width;
    canvas.height = this.image.height;

    const context = canvas.getContext('2d');
    context.drawImage(this.image, 0, 0);

    this.imageBuffer = context.getImageData(0, 0, this.image.width, this.image.height);
  }

  onload() {
    this.extractImageData();
    this.stream$.next(this);
  }

  static load(src) {
    return new Texture(src).stream$;
  }
}
