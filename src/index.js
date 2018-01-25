import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/withLatestFrom';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { animationFrame } from 'rxjs/scheduler/animationFrame';

import Canvas from './Canvas';
import Vector2D from './Vector2D';
import Camera from './Camera';
import Map from './Map';
import Texture from './Texture';
import SpriteSheet from './SpriteSheet';
import { computeWall, computeDog } from './raycaster';
import handleInput from './input';
import { FPS, SCREEN_WIDTH, SCREEN_HEIGHT } from './constants';


import missingTextureUrl from '../assets/spritesheets/missing.jpg';
import dogTextureUrl from '../assets/spritesheets/dog.png';

const map$ = new BehaviorSubject(new Map([
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]));

const texture$ = Texture.load(missingTextureUrl);
const dogSpriteSheet$ = SpriteSheet.load(dogTextureUrl);

const canvas$ = new BehaviorSubject(new Canvas(
  document.body,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
));

const timer = document.createElement('div');
document.body.append(timer);

const camera$ = new BehaviorSubject(new Camera({
  position: new Vector2D(1.5, 1.5),
  direction: new Vector2D(1, 0),
  plane: new Vector2D(0, 0.66),
}));

handleInput(camera$, map$);

const pause$ = new BehaviorSubject(true);

Observable.fromEvent(document, 'keyup')
  .map(keyEvent => keyEvent.key)
  .filter(key => key === 'p')
  .withLatestFrom(pause$)
  .map(([, pause]) => !pause)
  .subscribe(pause$);

const renderingTimeHistory = [];

Observable.interval(1000 / FPS, animationFrame)
  .withLatestFrom(canvas$, camera$, map$, texture$, dogSpriteSheet$, pause$)
  .subscribe(([, canvas, camera, map, texture, dogSpriteSheet, pause]) => {
    if (pause) { return; }

    const start = new Date();

    canvas.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2, 'black');
    canvas.drawRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, '#575757');

    const zBuffer = computeWall(SCREEN_WIDTH, SCREEN_HEIGHT, canvas, camera, map, texture);
    computeDog(SCREEN_WIDTH, SCREEN_HEIGHT, camera, dogSpriteSheet, canvas, zBuffer);

    const renderingTime = new Date() - start;

    renderingTimeHistory.push(renderingTime);
    if (renderingTimeHistory.length > 100) { renderingTimeHistory.shift(); }

    let averageTime = renderingTimeHistory.reduce((a, b) => a + b, 0);
    averageTime /= renderingTimeHistory.length;
    averageTime = Math.trunc(averageTime);

    timer.innerHTML = `rendering ${renderingTime}ms<br/>average ${averageTime}ms`;
  });

const textarea = document.createElement('textarea');
textarea.style.height = '200px';
document.body.append(textarea);
map$.subscribe((map) => {
  textarea.value = map.toString();
});

Observable.fromEvent(textarea, 'keyup')
  .withLatestFrom(map$)
  .filter(([, map]) => map.toString() !== textarea.value)
  .map(() => new Map(textarea.value.split('\n').map(line => line.split(',').map(value => parseInt(value, 10)))))
  .subscribe(map$);
