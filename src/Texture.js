import { Subject } from 'rxjs/Subject';

export default class Texture {
  constructor(src) {
    this.image = new Image();
    this.image.onload = this.onload.bind(this);
    this.image.src = src;
    this.stream$ = new Subject();
  }

  preRender() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.image.width;
    this.canvas.height = this.image.height;

    this.context = this.canvas.getContext('2d');
    this.context.drawImage(this.image, 0, 0);
  }

  onload() {
    this.preRender();
    this.stream$.next(this);
  }

  static load(src) {
    return new Texture(src).stream$;
  }
}
