// ========== 互動資料 ==========
let flowers = [];   // 兩種花都放這裡：地面點出(無莖) / 漣漪變化(有莖、會飛)
let raindrops = [];
let ripples = [];

// ========== 參數（可微調） ==========
// 畫面
const CANVAS_W = 700, CANVAS_H = 700;
const HORIZON_Y = 350;        // 視覺分界：天空 / 草地
const FLOOR_Y   = 600;        // 物理地板：雨滴碰撞高度（略低一點，避免太早撞）

// 連續雨 / 花 的「節流」時間（毫秒）—數值越大越稀疏
const RAIN_INTERVAL   = 80;   // 按住天空時，每 80ms 生一小批雨滴
const FLOWER_INTERVAL = 150;  // 按住草地時，每 150ms 長一朵花

// 每批數量與分布
const RAIN_PER_BATCH   = 2;   // 每批雨滴數量
const RAIN_SPREAD_X    = 26;   // 雨滴水平擴散
const RAIN_SPREAD_Y    = 10;   // 雨滴垂直擴散
const FLOWER_SPREAD    = 10;   // 連續種花時的小抖動，避免重疊太滿

// 漣漪外觀（越大越明顯）
const RIPPLE_GROWTH    = 1.0;  // 漣漪每禎擴散量
const RIPPLE_FADE      = 3.0;  // 漣漪每禎淡出量（越小保留越久）
const RIPPLE_STROKE    = 2;    // 漣漪線條粗細
const RIPPLE_BLOOM_AGE = 12;   // 漣漪幾禎後長出花朵

// ========== 時間節流 ==========
let lastRainAt   = 0;
let lastFlowerAt = 0;

// ========== p5 ==========
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
}

function draw() {
  background(240);
  drawScene();

  // 按住：天空下雨、草地長花（都有節流）
  if (mouseIsPressed) {
    if (mouseY <= HORIZON_Y) spawnRainThrottled(mouseX, mouseY);
    if (mouseY >  HORIZON_Y) spawnFlowerThrottled(mouseX, mouseY);
  }

  updateRain();
  updateRipples();

  // 花朵更新與繪製
  for (let f of flowers) {
    // 上升或飄動
    if (f.withStem) {
      // 雨生成的「飛花」：速度較快並左右擺動
      f.y += f.vy;
      // 不改動原始 x，用偏移畫出輕微擺動
      f.xOffset = Math.sin(frameCount * f.swaySpeed + f.phase) * f.swayAmp;
    } else {
      // 地面點出：原本的慢慢往上 & 逐漸淡出
      f.y -= 0.5;
    }

    // 透明度下降
    f.alpha -= 2;
    f.color.setAlpha(f.alpha);

    // 繪製
    drawFlower(f.x + (f.xOffset || 0), f.y, f.color, f.size, f.withStem, f.stemLen || 0);
  }
  // 移除消失的花
  flowers = flowers.filter(f => f.alpha > 0);
}

// ========== 場景 ==========
function drawScene() {
  push();
  translate(CANVAS_W / 2, CANVAS_H / 2);
  strokeWeight(3);
  stroke("black");

  // 草地
  fill("rgba(141, 228, 106, 1)");
  rect(0, 350, 700, 600);

  // 天空
  fill("rgba(150, 200, 247, 1)");
  rect(0, -350, 700, 800);

  fill("#FFE66F");
  // 身體
  rect(0, 0, 200, 250, 90, 90, 0, 0);
  // 雙腳
  rect(125, 105, 50, 40, 0, 100, 100, 0);
  rect(-125, 105, 50, 40, 100, 0, 0, 100);
  // 雙手
  rect(40, 100, 40, 100, 0, 0, 100, 100);
  rect(-40, 100, 40, 100, 0, 0, 100, 100);

  // 嘴巴
  noFill(); ellipse(0, -20, 90, 50);

  // 蝴蝶結
  fill("pink");
  triangle(-50, -100, -50, -150, 0, -125);
  triangle(50, -100, 50, -150, 0, -125);
  circle(0, -125, 25);

  // 耳朵
  fill("black");
  push(); rotate(45);  ellipse(10, -110, 120, 50); pop();
  push(); rotate(-45); ellipse(-10, -110, 120, 50); pop();

  // 鼻子
  push(); translate(0, -40); triangle(-10, 0, 10, 0, 0, 10); pop();

  // 眼睛
  circle(-30, -60, 10);
  circle(30, -60, 10);
  pop();
}

// ========== 花朵（支援有莖/無莖） ==========
function drawFlower(x, y, c, size, withStem=false, stemLen=0) {
  push();
  noStroke();
  translate(x, y);

  // 花莖（雨生花才畫）
  if (withStem) {
    stroke(40, 140, 60);
    strokeWeight(3);
    line(0, size * 0.6, 0, size * 0.6 + stemLen);
    noStroke();
    // 小葉子（可愛一點）
    fill(70, 170, 90);
    ellipse(5, size * 0.6 + stemLen * 0.4, 10, 6);
    ellipse(-5, size * 0.6 + stemLen * 0.6, 10, 6);
  }

  // 花瓣
  fill(c);
  for (let i = 0; i < 5; i++) {
    ellipse(0, size, size, size * 1.5);
    rotate(TWO_PI / 5);
  }
  // 花心
  fill("#FFE66F");
  ellipse(0, 0, size, size);
  pop();
}

function spawnFlowerThrottled(x, y) {
  const now = millis();
  if (now - lastFlowerAt < FLOWER_INTERVAL) return;
  lastFlowerAt = now;

  // 位置微抖動，避免重疊太密
  let jx = random(-FLOWER_SPREAD, FLOWER_SPREAD);
  let jy = random(-FLOWER_SPREAD, FLOWER_SPREAD);

  let randomColor = color(random(255), random(255), random(255));
  flowers.push({
    x: constrain(x + jx, 0, width),
    y: constrain(y + jy, HORIZON_Y + 1, height),
    color: randomColor,
    size: random(10, 20),
    alpha: 255,
    withStem: false,        // 地面種的花：沒有花莖
    vy: -0.5
  });
}

// ========== 雨滴 & 漣漪 ==========
function updateRain() {
  for (let d of raindrops) {
    d.vy += 0.25;   // 重力
    d.y  += d.vy;

    if (d.y >= FLOOR_Y) {
      // 落地：先生成漣漪
      ripples.push({
        x: d.x,
        y: FLOOR_Y,
        r: 2,
        alpha: 180,
        w: random(20, 28),
        h: random(10, 16),
        age: 0,
        bloomed: false
      });
      d.dead = true;
    }
  }
  raindrops = raindrops.filter(d => !d.dead);

  // 畫雨滴
  for (let d of raindrops) {
    push();
    noStroke();
    fill(120, 170, 255);
    ellipse(d.x, d.y, 3, 8);
    pop();
  }
}

function updateRipples() {
  const newFlowers = [];

  for (let rp of ripples) {
    // 先畫漣漪
    push();
    noFill();
    let c = color(120, 170, 255);
    c.setAlpha(rp.alpha);
    stroke(c);
    strokeWeight(RIPPLE_STROKE);
    ellipse(rp.x, rp.y, rp.w + rp.r, rp.h + rp.r * 0.6);
    pop();

    // 更新狀態
    rp.r     += RIPPLE_GROWTH;
    rp.alpha -= RIPPLE_FADE;
    rp.age++;

    // 到達一定年齡才「長出花」，避免太即時看不到漣漪
    if (!rp.bloomed && rp.age >= RIPPLE_BLOOM_AGE) {
      rp.bloomed = true;

      // 由漣漪長出的「飛花」：有花莖、往上飛、輕微擺動
      const randomColor = color(random(255), random(255), random(255));
      newFlowers.push({
        x: rp.x,
        y: rp.y - 4,
        color: randomColor,
        size: random(10, 18),
        alpha: 255,
        withStem: true,
        stemLen: random(18, 36),
        vy: random(-1.6, -1.1),
        swayAmp: random(4, 8),          // 左右擺動幅度（像被風吹）
        swaySpeed: random(0.035, 0.055),// 擺動速度
        phase: random(TWO_PI),
        xOffset: 0
      });
    }
  }

  // 淡出完就移除漣漪
  ripples = ripples.filter(rp => rp.alpha > 0);

  // 把新長出的花補進去
  flowers.push(...newFlowers);
}

function spawnRainThrottled(x, y) {
  const now = millis();
  if (now - lastRainAt < RAIN_INTERVAL) return;
  lastRainAt = now;

  for (let i = 0; i < RAIN_PER_BATCH; i++) {
    raindrops.push({
      x: x + random(-RAIN_SPREAD_X, RAIN_SPREAD_X),
      y: y + random(-RAIN_SPREAD_Y, RAIN_SPREAD_Y),
      vy: random(2, 5),
      dead: false
    });
  }
}

// ========== 點一下也會有即時反應 ==========
function mousePressed() {
  if (mouseY > HORIZON_Y) {
    spawnFlowerThrottled(mouseX, mouseY);  // 當下也種一朵
  } else {
    spawnRainThrottled(mouseX, mouseY);    // 當下也下一小批
  }
}
