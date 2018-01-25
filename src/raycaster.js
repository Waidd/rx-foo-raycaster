import Vector2D from './Vector2D';

export function computeWall(screenWidth, screenHeight, canvas, camera, map, texture) {
  const zBuffer = {};

  [...Array(screenWidth).keys()].forEach((x) => {
    const cameraX = ((2 * x) / screenWidth) - 1;
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
      Math.abs(1 / rayDirection.x),
      Math.abs(1 / rayDirection.y),
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

    if (!hit) {
      zBuffer[x] = Infinity;
      return;
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

    zBuffer[x] = perpendicularWallDistance;

    // Calculate height of line to draw on screen
    const lineHeight = Math.trunc(screenHeight / perpendicularWallDistance);

    let lineHeightOnScreen = lineHeight;
    let deltaTextureHeight = 0;
    if (lineHeight > screenHeight) {
      lineHeightOnScreen = screenHeight;
      const deltaLineHeight = lineHeight - screenHeight;
      deltaTextureHeight = Math.trunc((deltaLineHeight * texture.canvas.height) / lineHeight);
    }
    const textureYOffset = Math.trunc(deltaTextureHeight / 2);
    const textureHeight = texture.canvas.height - deltaTextureHeight;

    // calculate lowest pixel
    let lowestPixel = Math.trunc((screenHeight - lineHeight) / 2);
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
  });

  return zBuffer;
}

export function computeDog(screenWidth, screenHeight, camera, dogSpriteSheet, canvas, zBuffer) {
  const whereIsDog = new Vector2D(
    5,
    5,
  );

  // translate sprite position to relative to camera
  const spritePosition = new Vector2D(
    whereIsDog.x - camera.position.x,
    whereIsDog.y - camera.position.y,
  );

  const invDet = 1.0 / ((camera.plane.x * camera.direction.y) - (camera.direction.x * camera.plane.y));

  const transform = new Vector2D(
    invDet * ((camera.direction.y * spritePosition.x) - (camera.direction.x * spritePosition.y)),
    // this is actually the depth inside the screen, that what Z is in 3D
    invDet * ((-camera.plane.y * spritePosition.x) + (camera.plane.x * spritePosition.y)),
  );

  if (transform.y > 0) {
    const spriteScreenPositionX = Math.trunc((screenWidth / 2) * (1 + (transform.x / transform.y)));

    // calculate height of the sprite on screen
    // using "transformY" instead of the real distance prevents fisheye
    const spriteScreenHeight = Math.abs(Math.trunc(screenHeight / transform.y));
    // calculate lowest and highest pixel to fill in current stripe
    let drawStartY = (-spriteScreenHeight / 2) + (screenHeight / 2);
    if (drawStartY < 0) { drawStartY = 0; }

    // calculate width of the sprite
    const spriteScreenWidth = Math.abs(Math.trunc(screenHeight / transform.y));
    let drawStartX = Math.trunc((-spriteScreenWidth / 2) + spriteScreenPositionX);
    if (drawStartX < 0) { drawStartX = 0; }
    let drawEndX = Math.trunc((spriteScreenWidth / 2) + spriteScreenPositionX);
    if (drawEndX >= screenWidth) { drawEndX = screenWidth - 1; }

    const spriteIndex = dogSpriteSheet.elements.RUNNING_045_00;

    for (let stripe = drawStartX; stripe < drawEndX; stripe += 1) {
      const texX = Math.trunc(256 * (stripe - ((-spriteScreenWidth / 2) + spriteScreenPositionX)) * (spriteIndex.width / spriteScreenWidth)) / 256;
      if (transform.y < zBuffer[stripe]) {
        const d = ((drawStartY * 256) - (screenHeight * 128)) + (spriteScreenHeight * 128);
        const texY = ((d * spriteIndex.height) / spriteScreenHeight) / 256;
        canvas.drawImage(
          dogSpriteSheet.canvas,
          spriteIndex.x + texX, // src x
          spriteIndex.y + texY, // src y
          1, // src width
          spriteIndex.height, // src height
          stripe, // dest x
          drawStartY, // dest y
          1, // dest width
          spriteScreenHeight, // dest height
        );
      }
    }
  }
}
