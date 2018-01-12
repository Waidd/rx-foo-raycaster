export default class Camera {
  constructor({ position, direction, plane }) {
    this.position = position;
    this.direction = direction;
    this.plane = plane;
  }

  toString() {
    const position = this.position.toString();
    const direction = this.direction.toString();
    const plane = this.plane.toString();
    return `position: ${position} direction: ${direction} plane: ${plane}`;
  }
}
