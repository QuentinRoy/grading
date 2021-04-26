function setup() {
  createCanvas(200, 150);
}

function draw() {
  background(220); // Grey.

  fill("#e37cff"); // Purple.
  lollipop(width / 2, height / 2, 60, 20);

  fill("#5ef389"); // Green.
  lollipop(mouseX, mouseY, 40, 40);
}

function lollipop(x, y, length, diameter) {
  line(x, y, x, y - length);
  ellipse(x, y - length, diameter, diameter);
}
