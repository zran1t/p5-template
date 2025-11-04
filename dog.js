const CANVAS_W = 700, CANVAS_H = 700;

// ---- 參數（簡化集中）----
const PETAL_COUNT = 6;          // 固定花瓣數（視覺一致）
const BASE_PETAL_R = 10;        // 花瓣半徑基準（等比例縮放）
const CLICK_MARGIN = 150;       // 草地頂線往下這麼多才可種
const MAX_FLOWERS = 10;         // 畫面同時存在的上限

// 色盤（多樣但簡潔）
const PALETTES = [
  ["#FF5D73","#FFA3B5","#FFCCE1","#FFD166","#FFE66F"],
  ["#F94144","#F3722C","#F8961E","#43AA8B","#577590"],
  ["#9B5DE5","#F15BB5","#FEE440","#00BBF9","#00F5D4"],
  ["#E07A5F","#F2CC8F","#81B29A","#3D405B","#F4F1DE"],
  ["#D0BCFF","#FFB4A2","#BFD200","#80FFDB","#90DBF4"]
];

let flowers = [];

// ---- p5 基本設定 ----
function setup(){
  createCanvas(CANVAS_W, CANVAS_H);
  rectMode(CENTER);
  ellipseMode(CENTER);
  noStroke();
}

function draw(){
  background(255);
  drawScene();     // 天空＋草地＋狗

  // 更新＋繪製花
  for (let i = flowers.length - 1; i >= 0; i--) {
    const f = flowers[i];
    f.update();
    f.display();
    if (f.alpha <= 0) flowers.splice(i, 1);
  }
}

// ---- 互動：點擊草地才種花，並維持上限 ----
function mousePressed(){
  if (isOnGrass(mouseY)) addFlower(mouseX, mouseY);
}

function isOnGrass(y){
  // 草地頂線 = CANVAS_H/2；往下 CLICK_MARGIN 才允許
  return y > CANVAS_H / 2 + CLICK_MARGIN;
}

function addFlower(x, y){
  // 計算目前「未淡出」花朵數
  const active = flowers.filter(f => !f.fading);
  if (active.length >= MAX_FLOWERS) active[0].startFading(); // 讓最舊的淡出
  flowers.push(new Flower(x, y));
}

// ================== Flower（精簡版） ==================
class Flower{
  constructor(x, y){
    Object.assign(this, {x, y});
    // 等比例縮放
    this.scale = random(0.6, 1.35);
    this.rpBase = BASE_PETAL_R * this.scale;                 // 花瓣半徑
    this.RBase  = this.rpBase / sin(PI / PETAL_COUNT);       // 花冠半徑（確保相切）

    // 花莖參數（依大小縮放）
    this.maxStem = random(60, 130);
    this.stem = 0;
    this.stemW = constrain(this.scale * 1.2, 0.9, 2.0);

    // 顏色
    this.petalColor  = color(random(random(PALETTES)));
    this.centerColor = color(255, 235, 120);
    this.leafColor   = color(70 + random(-10,10), 160 + random(-15,15), 90 + random(-10,10));

    // 動畫控制
    this.grow = 0;     // 0→1（開花）
    this.alpha = 255;  // 淡出
    this.fading = false;

    // 微風搖擺
    this.phase = random(TWO_PI);
    this.speed = random(0.008, 0.016);
    this.sway  = radians(random(2, 6));
  }

  startFading(){ this.fading = true; }

  update(){
    if (!this.fading){
      // 先長莖，再開花
      if (this.stem < this.maxStem) {
        this.stem += max(1.2, (this.maxStem - this.stem) * 0.06);
      } else {
        this.grow = min(this.grow + 0.05, 1);
      }
    } else {
      this.alpha = max(this.alpha - 3, 0);
    }
  }

  display(){
    push();
    translate(this.x, this.y);
    rotate(sin(frameCount * this.speed + this.phase) * this.sway);

    // 花莖
    stroke(80,150,80,this.alpha);
    strokeWeight(this.stemW);
    line(0, 0, 0, -this.stem);

    // 葉子（長到一半後出現）
    if (this.stem > this.maxStem * 0.5){
      noStroke();
      fill(red(this.leafColor), green(this.leafColor), blue(this.leafColor), this.alpha);
      const w = this.rpBase, h = this.rpBase * 0.55, y = -this.stem * 0.6;
      ellipse(-w*0.6, y, w, h);
      ellipse( w*0.6, y - h*0.1, w, h);
    }

    // 花瓣（圓形、互相相切）
    noStroke();
    const rp = this.rpBase * this.grow;
    const R  = this.RBase  * this.grow;
    fill(red(this.petalColor), green(this.petalColor), blue(this.petalColor), this.alpha);

    if (this.grow > 0.02){
      for (let i = 0; i < PETAL_COUNT; i++){
        const ang = TWO_PI * i / PETAL_COUNT;
        circle(cos(ang)*R, -this.stem + sin(ang)*R, rp*2);
      }
      // 花心（不與花瓣重疊）
      fill(red(this.centerColor), green(this.centerColor), blue(this.centerColor), this.alpha);
      circle(0, -this.stem, min(rp*0.9, max(0, R - rp - 1)) * 2);
    }
    pop();
  }
}

// ================== 場景（維持原位置） ==================
function drawScene(){
  push();
  translate(CANVAS_W/2, CANVAS_H/2);
  strokeWeight(3);
  stroke("black");

  // 草地
  fill("rgba(141, 228, 106, 1)");
  rect(0, 350, 700, 600);

  // 天空
  fill("rgba(150, 200, 247, 1)");
  rect(0, -350, 700, 800);

  drawDog();
  pop();
}

// ================== 狗狗（原樣） ==================
function drawDog(){
  fill("#FFE66F");
  rect(0, 0, 200, 250, 90, 90, 0, 0);
  rect(125, 105, 50, 40, 0, 100, 100, 0);
  rect(-125, 105, 50, 40, 100, 0, 0, 100);
  rect(40, 100, 40, 100, 0, 0, 100, 100);
  rect(-40, 100, 40, 100, 0, 0, 100, 100);

  noFill(); ellipse(0, -20, 90, 50);

  fill("pink");
  triangle(-50, -100, -50, -150, 0, -125);
  triangle(50, -100, 50, -150, 0, -125);
  circle(0, -125, 25);

  fill("black");
  push(); rotate(45);  ellipse(10, -110, 120, 50); pop();
  push(); rotate(-45); ellipse(-10, -110, 120, 50); pop();

  push(); translate(0, -40); triangle(-10, 0, 10, 0, 0, 10); pop();

  circle(-30, -60, 10);
  circle(30, -60, 10);
}
