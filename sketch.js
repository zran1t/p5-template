

function setup() {
  
  createCanvas(600, 800);
  background(30);
  let mainHue = random(0, 360);
  let isLine = random() < 0.5;

  for(let i=0; i< 100; i++) {

    colorMode(HSL);

    let nowHue = (mainHue + random(-30, 30)) % 360;
    let nowSat = random(40, 80);
    let nowBri = random(40, 100);

    if(isLine) {
      noFill();
      stroke(nowHue, nowSat, nowBri);
      strokeWeight(3);
    }
    else {
      fill(nowHue, nowSat, nowBri);
    }

    let posX = random(0, width);
    let posY = random(0, height);
    let drawSize = random(10, 100);

    circle(posX, posY, drawSize);
  }
  
}

function draw() {

}