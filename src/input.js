import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/withLatestFrom';
import { Observable } from 'rxjs/Observable';

import Vector2D from './Vector2D';
import Camera from './Camera';

import { MOVE_SPEED, ROTATION_SPEED } from './constants';

export default function handleInput(camera$, map$) {
  Observable.fromEvent(document, 'keydown')
    .map(keyEvent => keyEvent.key)
    .filter(key => ['z', 's', 'q', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key))
    .withLatestFrom(camera$, map$)
    .subscribe(([key, camera, map]) => {
      const position = Vector2D.from(camera.position);
      const direction = Vector2D.from(camera.direction);
      const plane = Vector2D.from(camera.plane);

      switch (key) {
        case ('d'): {
          const perpendicularDirection = new Vector2D(-camera.direction.y, camera.direction.x);
          const positionOffset = perpendicularDirection.multiply(MOVE_SPEED);
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
        case ('q'): {
          const perpendicularDirection = new Vector2D(camera.direction.y, -camera.direction.x);
          const positionOffset = perpendicularDirection.multiply(MOVE_SPEED);
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
        case ('z'):
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
        case ('s'):
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

      camera$.next(new Camera({ position, direction, plane }));
    });
}
