let mode = 'IDLE'; // ADD, SUB, DOT
let step = 0;      // 0:그리기, 1:시점합치기(애니메이션), 2:조작/완성
let sA, eA, sB, eB;
let moveB_s, moveB_e; // 우측 칸에서 조작할 벡터 B의 좌표
let isDragging = false;
let progress = 0;    // 애니메이션용 변수

function setup() {
  createCanvas(1000, 600);
}

function draw() {
  background(255);
  drawLayout(); // 칸 나누기 및 가이드 텍스트

  // 1. 좌측 칸 (결과창) - 시점 합쳐진 상태 유지
  push();
  if (step >= 1) {
    drawLeftPanel();
  }
  pop();

  // 2. 우측 칸 (조작창) - 실제 드래그 및 과정 수행
  push();
  drawRightPanel();
  pop();
}

// --- 레이아웃 설정 ---
function drawLayout() {
  stroke(200);
  line(width / 2, 0, width / 2, height); // 중앙 분리선
  fill(0);
  noStroke();
  textSize(16);
  text("결과 및 시점 통일 창", width / 4, 25);
  text("과정 및 조작 창", (width / 4) * 3, 25);
  
  if (mode === 'IDLE') text("상단 버튼을 눌러 연산을 선택하세요", width/2, height/2);
}

// --- 좌측 패널: 결과물 표시 ---
function drawLeftPanel() {
  let origin = createVector(width / 4, height / 2);
  let vA = p5.Vector.sub(eA, sA);
  let vB = p5.Vector.sub(eB, sB);

  drawArrow(origin, p5.Vector.add(origin, vA), color(255, 50, 50), "A");
  
  if (step === 1) {
    // 시점이 합쳐지는 애니메이션 (A와 B가 같은 곳에서 출발)
    drawArrow(origin, p5.Vector.add(origin, vB), color(50, 50, 255), "B");
  } else if (step === 2) {
    // 우측 조작 완료 후 결과 벡터 표시
    drawArrow(origin, p5.Vector.add(origin, vB), color(50, 50, 255, 100), "B"); 
    if (mode === 'ADD') {
      drawArrow(origin, p5.Vector.add(origin, p5.Vector.add(vA, vB)), color(150, 0, 255), "A+B");
    } else if (mode === 'SUB') {
      let subResult = p5.Vector.sub(vA, vB);
      drawArrow(origin, p5.Vector.add(origin, subResult), color(0, 150, 0), "A-B");
    }
  }
}

// --- 우측 패널: 조작 및 과정 ---
function drawRightPanel() {
  let offset = width / 2;
  if (step === 0 && mode !== 'IDLE') {
    text("마우스로 벡터 A, B를 그리세요", offset + 250, 50);
    if (sA && eA) drawArrow(sA, eA, color(255, 50, 50), "A");
    if (sB && eB) drawArrow(sB, eB, color(50, 50, 255), "B");
  } 
  
  else if (step >= 1) {
    // 조작 로직 (ADD 기준 예시)
    if (mode === 'ADD') {
      text("B의 시작점을 A의 끝점으로 옮기세요", offset + 250, 50);
      drawArrow(sA, eA, color(255, 50, 50), "A");
      
      // 드래그 가능한 B
      if (!moveB_s) { moveB_s = sB.copy(); moveB_e = eB.copy(); }
      
      // 자석 기능: A의 종점에 가까워지면 '착' 붙음
      if (dist(moveB_s.x, moveB_s.y, eA.x, eA.y) < 30) {
        let diff = p5.Vector.sub(eA, moveB_s);
        moveB_s.add(diff); moveB_e.add(diff);
        step = 2; // 완료 단계로 전환
        drawArrow(sA, moveB_e, color(150, 0, 255), "Result");
      }
      drawArrow(moveB_s, moveB_e, color(50, 50, 255), "B");
    }
    
    // 차(SUB) 로직: A를 B의 종점으로 이동 -> -B 방향 전환
    else if (mode === 'SUB') {
       text("A를 B의 끝점으로 옮겨 -B를 만드세요", offset + 250, 50);
       drawArrow(sB, eB, color(50, 50, 255), "B");
       // ... 유사한 드래그 로직 및 방향 반전 시각화 추가
    }
  }
}

// --- 공통 화살표 함수 ---
function drawArrow(base, target, c, label) {
  stroke(c); strokeWeight(3); fill(c);
  line(base.x, base.y, target.x, target.y);
  let angle = atan2(base.y - target.y, base.x - target.x);
  push();
  translate(target.x, target.y);
  rotate(angle);
  line(0, 0, 15, -7); line(0, 0, 15, 7);
  pop();
  noStroke(); text(label, (base.x + target.x)/2 + 15, (base.y + target.y)/2);
}

// --- 마우스 제어 ---
function mousePressed() {
  if (step === 0 && mode !== 'IDLE') {
    if (!sA) sA = createVector(mouseX, mouseY);
    else if (!sB) sB = createVector(mouseX, mouseY);
  } else if (step === 1) {
    if (dist(mouseX, mouseY, moveB_s.x, moveB_s.y) < 30) isDragging = true;
  }
}

function mouseDragged() {
  if (step === 0) {
    if (sA && !eA) eA = createVector(mouseX, mouseY);
    else if (sB && !eB) eB = createVector(mouseX, mouseY);
  } else if (isDragging) {
    let dx = mouseX - moveB_s.x;
    let dy = mouseY - moveB_s.y;
    moveB_s.add(dx, dy); moveB_e.add(dx, dy);
  }
}

function mouseReleased() {
  if (step === 0 && eB) { /* '다음' 버튼 클릭 시 step=1로 가는 로직 필요 */ }
  isDragging = false;
}

// --- 모드 변경 함수 (버튼 연동용) ---
function setMode(m) {
  mode = m; step = 0; sA = eA = sB = eB = moveB_s = null;
}
