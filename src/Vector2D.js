export default class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(operand) {
    if (operand instanceof Vector2D) {
      this.x += operand.x;
      this.y += operand.y;
    } else {
      this.x += operand;
      this.y += operand;
    }
    return this;
  }

  multiply(operand) {
    if (operand instanceof Vector2D) {
      this.x *= operand.x;
      this.y *= operand.y;
    } else {
      this.x *= operand;
      this.y *= operand;
    }
    return this;
  }

  static from(vector) {
    return new Vector2D(vector.x, vector.y);
  }
}
