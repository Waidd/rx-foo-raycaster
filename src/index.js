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

import missingTextureUrl from '../assets/spritesheets/missing.jpg';

const FPS = 30;
const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 200;
const MOVE_SPEED = 0.25;
const ROTATION_SPEED = 0.25;

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

Observable.fromEvent(document, 'keydown')
  .map(keyEvent => keyEvent.key)
  .filter(key => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key))
  .withLatestFrom(camera$, map$)
  .subscribe(([key, camera, map]) => {
    const position = Vector2D.from(camera.position);
    const direction = Vector2D.from(camera.direction);
    const plane = Vector2D.from(camera.plane);

    switch (key) {
      case ('ArrowUp'): {
        const positionOffset = Vector2D.from(camera.direction).multiply(MOVE_SPEED);
        const expectedMapPosition = Vector2D.from(camera.position).add(positionOffset).truncate();
        const currentMapPosition = Vector2D.from(camera.position).truncate();

        if (!map.collide(expectedMapPosition.x, currentMapPosition.y)
          && !map.isOutOf(expectedMapPosition.x, currentMapPosition.y)) {
          position.x += positionOffset.x;
        }
        if (!map.collide(currentMapPosition.x, expectedMapPosition.y)
          && !map.isOutOf(currentMapPosition.x, expectedMapPosition.y)) {
          position.y += positionOffset.y;
        }
        break;
      }
      case ('ArrowDown'): {
        const positionOffset = Vector2D.from(camera.direction).multiply(MOVE_SPEED);
        const expectedMapPosition = Vector2D
          .from(camera.position)
          .substract(positionOffset)
          .truncate();
        const currentMapPosition = Vector2D.from(camera.position).truncate();

        if (!map.collide(expectedMapPosition.x, currentMapPosition.y)
          && !map.isOutOf(expectedMapPosition.x, currentMapPosition.y)) {
          position.x -= positionOffset.x;
        }
        if (!map.collide(currentMapPosition.x, expectedMapPosition.y)
          && !map.isOutOf(currentMapPosition.x, expectedMapPosition.y)) {
          position.y -= positionOffset.y;
        }
        break;
      }
      case ('ArrowLeft'): {
        // both camera direction and camera plane must be rotated
        direction.x = (camera.direction.x * Math.cos(-ROTATION_SPEED)) -
          (camera.direction.y * Math.sin(-ROTATION_SPEED));
        direction.y = (camera.direction.x * Math.sin(-ROTATION_SPEED)) +
          (camera.direction.y * Math.cos(-ROTATION_SPEED));
        plane.x = (camera.plane.x * Math.cos(-ROTATION_SPEED)) -
          (camera.plane.y * Math.sin(-ROTATION_SPEED));
        plane.y = (camera.plane.x * Math.sin(-ROTATION_SPEED)) +
          (camera.plane.y * Math.cos(-ROTATION_SPEED));
        break;
      }
      case ('ArrowRight'): {
        // both camera direction and camera plane must be rotated
        direction.x = (camera.direction.x * Math.cos(ROTATION_SPEED)) -
          (camera.direction.y * Math.sin(ROTATION_SPEED));
        direction.y = (camera.direction.x * Math.sin(ROTATION_SPEED)) +
          (camera.direction.y * Math.cos(ROTATION_SPEED));
        plane.x = (camera.plane.x * Math.cos(ROTATION_SPEED)) -
          (camera.plane.y * Math.sin(ROTATION_SPEED));
        plane.y = (camera.plane.x * Math.sin(ROTATION_SPEED)) +
          (camera.plane.y * Math.cos(ROTATION_SPEED));
        break;
      }
      default: {
        break;
      }
    }

    console.log('camera', camera.toString());
    camera$.next(new Camera({ position, direction, plane }));
  });

const pause$ = new BehaviorSubject(true);

Observable.fromEvent(document, 'keyup')
  .map(keyEvent => keyEvent.key)
  .filter(key => key === 'p')
  .withLatestFrom(pause$)
  .map(([, pause]) => !pause)
  .subscribe(pause$);

const renderingTimeHistory = [];

Observable.interval(1000 / FPS, animationFrame)
  .withLatestFrom(canvas$, camera$, map$, texture$, pause$)
  .subscribe(([, canvas, camera, map, texture, pause]) => {
    if (pause) { return; }

    const start = new Date();

    canvas.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2, 'black');
    canvas.drawRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT, '#575757');

    for (let x = 0; x < SCREEN_WIDTH; x += 1) {
      const cameraX = ((2 * x) / SCREEN_WIDTH) - 1;
      const rayPosition = Vector2D.from(camera.position);
      const rayDirection = Vector2D
        .from(camera.plane)
        .multiply(cameraX)
        .add(camera.direction);

      const mapPosition = new Vector2D(
        Math.trunc(rayPosition.x),
        Math.trunc(rayPosition.y),
      );

      // length of ray from one x or y-side to next x or y-side
      const deltaDistance = new Vector2D(
        Math.sqrt(1 + ((rayDirection.y * rayDirection.y) / (rayDirection.x * rayDirection.x))),
        Math.sqrt(1 + ((rayDirection.x * rayDirection.x) / (rayDirection.y * rayDirection.y))),
      );

      const step = new Vector2D();
      const sideDistance = new Vector2D();

      // calculate step and initial sideDist
      if (rayDirection.x < 0) {
        step.x = -1;
        sideDistance.x = (rayPosition.x - mapPosition.x) * deltaDistance.x;
      } else {
        step.x = 1;
        sideDistance.x = ((mapPosition.x + 1) - rayPosition.x) * deltaDistance.x;
      }

      if (rayDirection.y < 0) {
        step.y = -1;
        sideDistance.y = (rayPosition.y - mapPosition.y) * deltaDistance.y;
      } else {
        step.y = 1;
        sideDistance.y = ((mapPosition.y + 1) - rayPosition.y) * deltaDistance.y;
      }

      // perform DDA
      let hit = false;
      let side = null;
      while (!hit && !map.isOutOf(mapPosition.x, mapPosition.y)) {
        // jump to next map square, OR in x-direction, OR in y-direction
        if (sideDistance.x < sideDistance.y) {
          sideDistance.x += deltaDistance.x;
          mapPosition.x += step.x;
          side = 0;
        } else {
          sideDistance.y += deltaDistance.y;
          mapPosition.y += step.y;
          side = 1;
        }
        // Check if ray has hit a wall
        if (map.collide(mapPosition.x, mapPosition.y)) {
          hit = 1;
        }
      }

      if (!hit) { continue; }

      // Calculate distance projected on camera direction
      // (Euclidean distance will give fisheye effect!)
      let perpendicularWallDistance = null;
      if (side === 0) {
        perpendicularWallDistance = ((mapPosition.x - rayPosition.x) + ((1 - step.x) / 2)) /
          rayDirection.x;
      } else {
        perpendicularWallDistance = ((mapPosition.y - rayPosition.y) + ((1 - step.y) / 2)) /
          rayDirection.y;
      }

      // Calculate height of line to draw on screen
      const lineHeight = Math.trunc(SCREEN_HEIGHT / perpendicularWallDistance);

      let lineHeightOnScreen = lineHeight;
      let deltaTextureHeight = 0;
      if (lineHeight > SCREEN_HEIGHT) {
        lineHeightOnScreen = SCREEN_HEIGHT;
        const deltaLineHeight = lineHeight - SCREEN_HEIGHT;
        deltaTextureHeight = Math.trunc((deltaLineHeight * texture.canvas.height) / lineHeight);
      }
      const textureYOffset = Math.trunc(deltaTextureHeight / 2);
      const textureHeight = texture.canvas.height - deltaTextureHeight;

      // calculate lowest pixel
      let lowestPixel = Math.trunc((SCREEN_HEIGHT - lineHeight) / 2);
      if (lowestPixel < 0) {
        lowestPixel = 0;
      }

      let wallX;
      if (side === 0) {
        wallX = rayPosition.y + (perpendicularWallDistance * rayDirection.y);
      } else {
        wallX = rayPosition.x + (perpendicularWallDistance * rayDirection.x);
      }
      wallX -= Math.floor(wallX);

      let textureXOffset = Math.trunc(wallX * texture.image.width);
      if (side === 0 && rayDirection.x > 0) {
        textureXOffset = texture.image.width - textureXOffset - 1;
      } else if (side === 1 && rayDirection.y < 0) {
        textureXOffset = texture.image.width - textureXOffset - 1;
      }

      canvas.drawImage(
        texture.canvas, // img src
        textureXOffset, // src x
        textureYOffset, // src y
        1, // src width
        textureHeight, // src height
        x, // dest x
        lowestPixel, // dest y
        1, // dest width
        lineHeightOnScreen, // dest height
      );
    }

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
