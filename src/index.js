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

const canvas = new Canvas(document.body, SCREEN_WIDTH, SCREEN_HEIGHT);

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


Observable.interval(1000 / FPS, animationFrame)
  .withLatestFrom(camera$, map$, texture$)
  .subscribe(([, camera, map, texture]) => {
    console.time('renderingTime');
    canvas.clear();

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

      // calculate lowest pixel
      let lowestPixel = (SCREEN_HEIGHT - lineHeight) / 2;
      if (lowestPixel < 0) {
        lowestPixel = 0;
      }
      const heighestPixel = lowestPixel + lineHeight;

      let wallX;
      if (side === 0) {
        wallX = rayPosition.y + (perpendicularWallDistance * rayDirection.y);
      } else {
        wallX = rayPosition.x + (perpendicularWallDistance * rayDirection.x);
      }
      wallX -= Math.floor(wallX);

      const texturePosition = new Vector2D(Math.trunc(wallX * texture.image.width));
      if (side === 0 && rayDirection.x > 0) {
        texturePosition.x = texture.image.width - texturePosition.x - 1;
      } else if (side === 1 && rayDirection.y < 0) {
        texturePosition.x = texture.image.width - texturePosition.x - 1;
      }

      for (let y = lowestPixel; y < heighestPixel; y += 1) {
        const d = ((2 * y) - SCREEN_HEIGHT) + lineHeight;
        texturePosition.y = Math.trunc((d * texture.image.height) / lineHeight / 2);

        const index = ((texturePosition.y * texture.imageBuffer.width) + texturePosition.x) * 4;
        const r = texture.imageBuffer.data[index];
        const g = texture.imageBuffer.data[index + 1];
        const b = texture.imageBuffer.data[index + 2];
        const color = `rgb(${r}, ${g}, ${b})`;

        canvas.drawPixel(x, y, color);
      }
    }
    console.timeEnd('renderingTime');
  });
