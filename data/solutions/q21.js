let minSize = 50; // The smallest possible size for the ball.
let maxSize = 200; // The largest possible size for the ball.
let color = 100; // The color of the ball.

let size = 100; // The current size of the ball.
let speed = 2; // The current growing or shrinking speed.

function setup() {
  createCanvas(maxSize, maxSize);
}

function draw() {
  background(255);
  fill(color);

  ellipse(maxSize / 2, maxSize / 2, size, size);

  if (size >= maxSize || size <= minSize) {
    speed = -speed;
  }

  size = size + speed;
}
