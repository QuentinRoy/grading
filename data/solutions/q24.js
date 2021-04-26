let rows = 10;
let cols = 8;
let size = 20;

function setup() {
  createCanvas(size * rows, size * cols);

  for (let i = 0; i < rows; i++) {
    // i goes from 0 to rows - 1, so 255 must be reached when i == rows - 1.
    fill((i * 255) / (rows - 1));
    for (let j = 0; j < cols; j++) {
      ellipse(i * size + size / 2, j * size + size / 2, size, size);
    }
  }
}
