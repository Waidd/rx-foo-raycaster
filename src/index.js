import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/withLatestFrom';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import Canvas from './Canvas';
import Vector2D from './Vector2D';
import Camera from './Camera';

const SCREEN_WIDTH = 300;
const SCREEN_HEIGHT = 200;
const MOVE_SPEED = 0.25;
const ROTATION_SPEED = 0.25;
const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;
const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const canvas = new Canvas(document.body, SCREEN_WIDTH, SCREEN_HEIGHT);

const camera$ = new BehaviorSubject(new Camera({
  position: new Vector2D(1.5, 1.5),
  direction: new Vector2D(1, 0),
  plane: new Vector2D(0, 0.66),
}));

/* const keyDowns$ = */
Observable.fromEvent(document, 'keydown')
  .map(keyEvent => keyEvent.key)
  .filter(key => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key))
  .withLatestFrom(camera$)
  .subscribe(([key, camera]) => {
    const position = Vector2D.from(camera.position);
    const direction = Vector2D.from(camera.direction);
    const plane = Vector2D.from(camera.plane);

    switch (key) {
      case ('ArrowUp'): {
        const newMapPositionX = Math.round(camera.position.x + (camera.direction.x * MOVE_SPEED));
        const newMapPositionY = Math.round(camera.position.y + (camera.direction.y * MOVE_SPEED));

        if (!MAP[newMapPositionX][Math.round(camera.position.y)]) {
          position.x += camera.direction.x * MOVE_SPEED;
        }
        if (!MAP[Math.round(camera.position.x)][newMapPositionY]) {
          position.y += camera.direction.y * MOVE_SPEED;
        }
        break;
      }
      case ('ArrowDown'): {
        const newMapPositionX = Math.round(camera.position.x - (camera.direction.x * MOVE_SPEED));
        const newMapPositionY = Math.round(camera.position.y - (camera.direction.y * MOVE_SPEED));

        if (!MAP[newMapPositionX][Math.round(camera.position.y)]) {
          position.x -= camera.direction.x * MOVE_SPEED;
        }
        if (!MAP[camera.position.x][newMapPositionY]) {
          position.y -= camera.direction.y * MOVE_SPEED;
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

    camera$.next(new Camera({ position, direction, plane }));
  });


Observable.interval(50)
  .withLatestFrom(camera$)
  .subscribe(([, camera]) => {
    canvas.clear();
    for (let x = 0; x < SCREEN_WIDTH; x += 1) {
      const cameraX = ((2 * x) / SCREEN_WIDTH) - 1;
      const rayPosition = Vector2D.from(camera.position);
      const rayDirection = Vector2D
        .from(camera.plane)
        .multiply(cameraX)
        .add(camera.direction);

      const mapPosition = new Vector2D(
        Math.round(rayPosition.x),
        Math.round(rayPosition.y),
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
      while (!hit) {
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
        if (MAP[mapPosition.x][mapPosition.y] > 0) {
          hit = 1;
        }

        // should check for a too war away block
      }

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
      const lineHeight = Math.round(SCREEN_HEIGHT / perpendicularWallDistance);

      // calculate lowest pixel
      let lowestPixel = (SCREEN_HEIGHT - lineHeight) / 2;
      if (lowestPixel < 0) {
        lowestPixel = 0;
      }

      canvas.drawLine(x, lowestPixel, 1, lineHeight);
    }
  });
