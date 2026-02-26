let mode = 'NONE';
let step = 0; // 0:그리기, 1:이동애니메이션, 2:조작/분해, 3:변환대기(차), 4:결과완료
let sA, eA, sB, eB;
let mSPercent = 0; 
let isDragging = false, isReversed = false, isPanning = false;
let offsetL, offsetR; 
let animProgress = 0;

// 내적 전용 변수
let showComponent = false, showResult = false;

function setup() {
    let canvas = createCanvas(1000, 600);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER);
}

function draw() {
    background(25);
    drawLayout();

    if (mode === 'NONE') {
        fill(150); textSize(20); text("상단 메뉴에서 연산을 선택하세요", width/2, height/2);
        return;
    }

    if (mode === 'DOT') {
        renderDotProduct(); // 내적 렌더링
    } else {
        renderLeftPanel(); // 합, 차 왼쪽
        if (step >= 2) renderRightPanel(); // 합, 차 오른쪽
    }

    // 공통 그리기 단계 안내
    if (step === 0) {
        if (sA && eA && sB && eB) drawNextButton();
        else {
            fill(200, 150, 0); noStroke(); textSize(16);
            text("왼쪽 칸에 드래그하여 벡터 A와 B를 그려주세요", width/2, height - 30);
        }
    }
}

function drawLayout() {
    stroke(60); strokeWeight(1);
    line(width/2, 0, width/2, height);
    noStroke(); fill(100); textSize(13);
    if (mode === 'DOT') {
        text("PANEL 1: 시점 통일 및 B 수평 정렬", width/4, 25);
        text("PANEL 2: 벡터 분해 및 내적 계산", width*0.75, 25);
    } else {
        text("PANEL 1: 최종 결과 (수학적 정의)", width/4, 25);
        text("PANEL 2: 연산 과정 (기하학적 조작)", width*0.75, 25);
    }
}

// --- 공통: 오프셋 계산 ---
function calculateOffsets() {
    if (!sA || !eA || !sB || !eB) return;
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    
    if (mode === 'DOT') {
        let rotVA = vA.copy().rotate(-vB.heading());
        offsetL = createVector(0, 0); 
        offsetR = createVector(-rotVA.x/2, 0);
    } else {
        let pointsL = [createVector(0,0), vA, vB];
        offsetL = getCenterOffset(pointsL);
        let pointsR = [createVector(0,0), vA, p5.Vector.add(vA, vB), p5.Vector.add(vA, p5.Vector.mult(vB, -1))];
        offsetR = getCenterOffset(pointsR);
    }
}

function getCenterOffset(pts) {
    let minX = min(pts.map(p => p.x)), maxX = max(pts.map(p => p.x));
    let minY = min(pts.map(p => p.y)), maxY = max(pts.map(p => p.y));
    return createVector(-(minX + (maxX-minX)/2), -(minY + (maxY-minY)/2));
}

// --- [합 / 차] 패널 렌더링 ---
function renderLeftPanel() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255,100,100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100,100,255), "B");
    } else {
        if (!offsetL) calculateOffsets();
        if (animProgress < 1) animProgress += 0.04; else if (step === 1) step = 2;
        
        let originL = createVector(width/4 + offsetL.x, height/2 + offsetL.y);
        let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
        let curSA = p5.Vector.lerp(sA, originL, animProgress);
        let curSB = p5.Vector.lerp(sB, originL, animProgress);

        drawArrow(curSA, p5.Vector.add(curSA, vA), color(255,100,100, 150), "A");
        drawArrow(curSB, p5.Vector.add(curSB, vB), color(100,100,255, 150), "B");

        if (step === 4) {
            let resColor = (mode === 'ADD') ? color(200,0,255) : color(0,200,100);
            if (mode === 'ADD') drawArrow(originL, p5.Vector.add(originL, p5.Vector.add(vA, vB)), resColor, "A+B");
            else drawArrow(p5.Vector.add(originL, vB), p5.Vector.add(originL, vA), resColor, "A-B");
        }
    }
}

function renderRightPanel() {
    if (!offsetR) return;
    let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    let targetA = p5.Vector.add(originR, vA);
    drawArrow(originR, targetA, color(255,100,100), "A");

    let currentMS = p5.Vector.lerp(originR, targetA, mSPercent);
    if (step === 2 && mSPercent > 0.98) { mSPercent = 1; isDragging = false; step = (mode === 'SUB') ? 3 : 4; }

    let currentVB = isReversed ? p5.Vector.mult(vB, -1) : vB;
    let currentEB = p5.Vector.add(currentMS, currentVB);

    if (mode === 'ADD') {
        if (step === 2) drawGuide(targetA);
        drawArrow(currentMS, currentEB, color(100,100,255), "B");
        if (step === 4) drawArrow(originR, currentEB, color(200,0,255), "A+B");
    } else {
        if (step === 2) drawGuide(targetA);
        drawArrow(currentMS, currentEB, color(100,100,255), isReversed ? "-B" : "B");
        if (step === 3) drawActionBtn("-B로 만들기", width*0.75, height-60, () => { isReversed = true; step = 4; });
        if (step === 4) drawArrow(originR, currentEB, color(0,200,100), "A+(-B)");
    }
    if (step === 2) { fill(100,100,255); noStroke(); ellipse(currentMS.x, currentMS.y, 12, 12); }
}

// --- [내적] 패널 렌더링 ---
function renderDotProduct() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255,100,100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100,100,255), "B");
        return;
    }
    if (!offsetL) calculateOffsets();
    if (animProgress < 1) animProgress += 0.03; else if (step === 1) step = 2;

    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    let angleB = vB.heading();

    // 왼쪽: 시점 통일 + 회전
    push();
    let originL = createVector(width/4 + offsetL.x, height/2 + offsetL.y);
    translate(originL.x, originL.y);
    rotate(lerp(0, -angleB, animProgress));
    drawArrow(createVector(0,0), vA, color(255,100,100,150), "A");
    drawArrow(createVector(0,0), vB, color(100,100,255,150), "B");
    pop();

    // 오른쪽: 분해 및 계산
    if (step >= 2) {
        let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
        let rotVA = vA.copy().rotate(-angleB);
        let rotVB = vB.copy().rotate(-angleB);
        push();
        translate(originR.x, originR.y);
        drawArrow(createVector(0,0), rotVB, color(100,100,255), "B");
        if (showComponent) {
            let parX = rotVA.x;
            stroke(150, 100); line(parX, 0, parX, rotVA.y);
            drawArrow(createVector(parX, 0), createVector(parX, rotVA.y), color(100, 100), ""); 
            drawArrow(createVector(0,0), createVector(parX, 0), color(255, 255, 0), "A_proj");
            fill(255, 255, 0); noStroke(); text((abs(parX)/10).toFixed(1), parX/2, 20);
        }
        drawArrow(createVector(0,0), rotVA, color(255,100,100), "A");
        pop();

        if (!showComponent) drawActionBtn("벡터 분해", width*0.75, height-60, () => { showComponent = true; });
        else if (!showResult) drawActionBtn("내적 계산", width*0.75, height-60, () => { showResult = true; step = 4; });
        
        if (showResult) {
            let dotVal = (rotVA.x * rotVB.x) / 100;
            fill(40, 220); rect(width*0.75-175, height-180, 350, 100, 10);
            fill(255); textSize(16); text(`내적: |B| × (A의 B방향 성분)`, width*0.75, height-205);
            textSize(22); fill(0, 255, 255); text(`${(rotVB.x/10).toFixed(1)} × ${(rotVA.x/10).toFixed(1)} = ${dotVal.toFixed(1)}`, width*0.75, height-170);
        }
    }
}

// --- 인터렉션 (마우스 제어) ---
function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0 && sA && eA && sB && eB) {
        if (mouseX > width/4-60 && mouseX < width/4+60 && mouseY > height-70 && mouseY < height-30) {
            step = 1; animProgress = 0; return;
        }
    }
    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    } else if (step === 2 && (mode === 'ADD' || mode === 'SUB')) {
        let originR = createVector(width*0.75 + (offsetR ? offsetR.x : 0), height/2 + (offsetR ? offsetR.y : 0));
        let vA = p5.Vector.sub(eA, sA);
        let currentMS = p5.Vector.lerp(originR, p5.Vector.add(originR, vA), mSPercent);
        if (dist(mouseX, mouseY, currentMS.x, currentMS.y) < 50) isDragging = true;
    } else if (step === 4) { isPanning = true; }
}

function mouseDragged() {
    if (step === 0) {
        let cx = constrain(mouseX, 10, width/2-10);
        if (sA && !sB) eA.set(cx, mouseY); else if (sB) eB.set(cx, mouseY);
    } else if (isDragging && step === 2) {
        let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
        let vA = p5.Vector.sub(eA, sA);
        let relM = p5.Vector.sub(createVector(mouseX, mouseY), originR);
        mSPercent = constrain(relM.dot(vA.copy().normalize()) / vA.mag(), 0, 1);
    } else if (isPanning && step === 4) {
        let dx = mouseX - pmouseX, dy = mouseY - pmouseY;
        if (mouseX < width/2) offsetL.add(createVector(dx, dy)); else offsetR.add(createVector(dx, dy));
    }
}

function mouseReleased() { isDragging = false; isPanning = false; }

// --- 공통 UI 요소 ---
function drawArrow(v1, v2, c, label) {
    if (!v1 || !v2) return;
    stroke(c); fill(c); strokeWeight(3); line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle); line(0,0,10,-4); line(0,0,10,4); pop();
    noStroke(); fill(c); text(label, (v1.x+v2.x)/2, (v1.y+v2.y)/2-15);
}

function drawNextButton() { fill(40,180,100); rect(width/4-60, height-70, 120, 40, 5); fill(255); text("다음 단계 ➔", width/4, height-50); }

function drawActionBtn(txt, x, y, callback) {
    let bx = x-70, by = y-20;
    if (mouseX > bx && mouseX < bx+140 && mouseY > by && mouseY < by+40) {
        fill(255, 180, 0); if (mouseIsPressed) { callback(); mouseIsPressed = false; }
    } else fill(255, 150, 0);
    rectMode(CORNER); rect(bx, by, 140, 40, 8); fill(255); noStroke(); text(txt, x, y);
}

function drawGuide(t) {
    let blink = abs(sin(frameCount*0.15))*255;
    stroke(255,255,0,blink); noFill(); ellipse(t.x, t.y, 25, 25);
    fill(255,255,0); noStroke(); text("B를 A의 종점으로!", width*0.75, height-40);
}

window.changeMode = function(m) { resetSimulation(); mode = m; }
window.resetSimulation = function() { 
    sA=null; eA=null; sB=null; eB=null; mSPercent=0; offsetL=null; offsetR=null; step=0; 
    isReversed=false; animProgress=0; showComponent=false; showResult=false; mode='NONE'; 
}
