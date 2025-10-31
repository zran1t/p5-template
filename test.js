let flowers = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background("#A6FFA6");
  noStroke();
}

function draw() {
  background("#A6FFA6"); // 重新畫背景，避免重疊
  for (let f of flowers) {
    drawFlower(f.x, f.y, f.color, f.size);
    f.y -= 0.5; // 讓花慢慢往上飄
    f.alpha -= 2; // 慢慢淡出

    // 重新設定顏色透明度
    f.color.setAlpha(f.alpha);
  }

  // 移除完全透明的花
  flowers = flowers.filter(f => f.alpha > 0);
}

function drawFlower(x, y, c, size) {
  push();
  translate(x, y);
  fill(c);
  for (let i = 0; i < 5; i++) {
    ellipse(0, size, size, size * 1.5);
    rotate(TWO_PI / 5);
  }
  fill("#FFE66F");
  ellipse(0, 0, size, size);
  pop();
}

function mousePressed() {
  let randomColor = color(random(255), random(255), random(255));
  flowers.push({
    x: mouseX,
    y: mouseY,
    color: randomColor,
    size: random(8, 20),
    alpha: 255
  });
}
