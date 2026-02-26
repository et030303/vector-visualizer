let mode = 'NONE';
let step = 0; 
let sA, eA, sB, eB;
let mSPercent = 0; 
let isDragging = false, isReversed = false, isPanning = false;
let offsetL, offsetR; 
let animProgress = 0, zoom = 1.0;

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

    if (mode === 'DOT') renderDotProduct();
    else {
        renderLeftPanel();
        if (step >= 2) renderRightPanel();
    }

    if (step === 0) {
        if (sA && eA && sB && eB) drawNextButton();
        else { fill(200, 150, 0); noStroke(); text("벡터를 그려주세요 (완료 후 드래그로 시점 이동 가능)", width/2, height - 30); }
    }
}

function drawLayout() {
    stroke(60); line(width/2, 0, width/2, height);
    noStroke(); fill(100); textSize(13);
    text(mode === 'DOT' ? "PANEL 1: 시점 통일 및 회전" : "PANEL 1: 최종 결과", width/4, 25);
    text(mode === 'DOT' ? "PANEL 2: 성분 분해 및 계산" : "PANEL 2: 연산 과정", width*0.75, 25);
    text(`Zoom: ${floor(zoom * 100)}%`, width - 60, 25);
}

function mouseWheel(event) {
    let zoomSpeed = 0.05;
    if (event.delta > 0) zoom -= zoomSpeed; else zoom += zoomSpeed;
    zoom = constrain(zoom, 0.2, 5.0);
    return false;
}

// --- [합 / 차] 왼쪽 패널 ---
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

        push(); translate(originL.x, originL.y); scale(zoom); translate(-originL.x, -originL.y);
        
        // 평행사변형 가이드 (합 모드 step 4일 때)
        if (mode === 'ADD' && step === 4) {
            stroke(255, 100); strokeWeight(1); drawingContext.setLineDash([5, 5]);
            line(originL.x + vA.x, originL.y + vA.y, originL.x + vA.x + vB.x, originL.y + vA.y + vB.y);
            line(originL.x + vB.x, originL.y + vB.y, originL.x + vA.x + vB.x, originL.y + vA.y + vB.y);
            drawingContext.setLineDash([]);
        }

        drawArrow(curSA, p5.Vector.add(curSA, vA), color(255,100,100, 150), "A");
        drawArrow(curSB, p5.Vector.add(curSB, vB), color(100,100,255, 150), "B");

        if (step === 4) {
            let resColor = (mode === 'ADD') ? color(200,0,255) : color(0,200,100);
            if (mode === 'ADD') drawArrow(originL, p5.Vector.add(originL, p5.Vector.add(vA, vB)), resColor, "A+B");
            else drawArrow(p5.Vector.add(originL, vB), p5.Vector.add(originL, vA), resColor, "A-B");
        }
        pop();
    }
}

// --- [합 / 차] 오른쪽 패널 ---
function renderRightPanel() {
    if (!offsetR) return;
    let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    let targetA = p5.Vector.add(originR, vA);
    push(); translate(originR.x, originR.y); scale(zoom); translate(-originR.x, -originR.y);
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
        if (step === 3) pop(), drawActionBtn("-B로 만들기", width*0.75, height-60, () => { isReversed = true; step = 4; }), push();
        if (step === 4) drawArrow(originR, currentEB, color(0,200,100), "A+(-B)");
    }
    pop();
}

// --- [내적] 렌더링 ---
function renderDotProduct() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255,100,100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100,100,255), "B");
        return;
    }
    if (!offsetL) calculateOffsets();
    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    let angleB = vB.heading();
    let angleA = vA.heading();
    let theta = angleA - angleB;

    // Panel 1: 왼쪽 (각도 정확도 개선)
    push();
    let originL = createVector(width/4 + offsetL.x, height/2 + offsetL.y);
    translate(originL.x, originL.y);
    scale(zoom);
    rotate(lerp(0, -angleB, animProgress)); // B를 바닥으로 돌리는 애니메이션
    
    drawArrow(createVector(0,0), vA, color(255,100,100, 150), "A");
    drawArrow(createVector(0,0), vB, color(100,100,255, 150), "B");
    
    if (animProgress >= 0.99) {
        noFill(); stroke(255, 180); strokeWeight(1.5);
        // 벡터 사이의 사잇각을 arc로 표현
        arc(0, 0, 50, 50, min(0, theta), max(0, theta));
        fill(255); noStroke(); 
        text("θ", 40 * cos(theta/2), 40 * sin(theta/2));
    }
    pop();

    if (animProgress < 1) animProgress += 0.02; else if (step === 1) step = 2;

    // Panel 2: 오른쪽
    if (step >= 2) {
        let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
        let rotVA = vA.copy().rotate(-angleB);
        let rotVB = vB.copy().rotate(-angleB);
        push(); translate(originR.x, originR.y); scale(zoom);
        drawArrow(createVector(0,0), rotVB, color(100,100,255), "B");
        fill(120, 120, 255); noStroke(); text(`|B|=${(vB.mag()/10).toFixed(1)}`, rotVB.x / 2, 25);
        if (showComponent) {
            let A2 = createVector(rotVA.x, 0), A1 = createVector(0, rotVA.y); 
            stroke(255, 80); drawingContext.setLineDash([4, 4]); line(rotVA.x, 0, rotVA.x, rotVA.y);
            drawingContext.setLineDash([]);
            drawArrow(createVector(0,0), A1, color(150), "A1", -20); 
            drawArrow(createVector(0,0), A2, color(255, 255, 0), "A2", 20);
            fill(255, 255, 0); noStroke(); text((abs(rotVA.x)/10).toFixed(1), A2.x/2, 15);
            noFill(); stroke(255, 150); arc(0, 0, 40, 40, min(0, rotVA.heading()), max(0, rotVA.heading()));
            fill(255); noStroke(); text("θ", 30 * cos(rotVA.heading()/2), 30 * sin(rotVA.heading()/2));
        }
        drawArrow(createVector(0,0), rotVA, color(255,100,100), "A");
        pop();
        if (!showComponent) drawActionBtn("성분 분해 (A1, A2)", width*0.75, height-60, () => showComponent = true);
        else if (!showResult) drawActionBtn("내적 결과 계산", width*0.75, height-60, () => { showResult = true; step = 4; });
        if (showResult) {
            let aMag = (vA.mag()/10).toFixed(1), bMag = (vB.mag()/10).toFixed(1), cosT = cos(theta).toFixed(2), aProj = (rotVA.x/10).toFixed(1), res = ((vB.mag()/10) * (rotVA.x/10)).toFixed(1);
            fill(40, 240); rect(width*0.75-225, height-210, 450, 130, 15);
            fill(255); textAlign(LEFT); textSize(14);
            text(`1. 공식: A·B = |A||B|cosθ`, width*0.75-200, height-180);
            text(`2. 성분: |B| × (A의 B방향 성분 A2)`, width*0.75-200, height-155);
            textSize(18); fill(0, 255, 255); text(`= ${bMag} × (${aMag} × ${cosT}) = ${bMag} × ${aProj} = ${res}`, width*0.75-200, height-120);
            textAlign(CENTER);
        }
    }
}

function calculateOffsets() {
    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    if (mode === 'DOT') {
        offsetL = createVector(0, 0); 
        let rotVA = vA.copy().rotate(-vB.heading());
        let rotVB = vB.copy().rotate(-vB.heading());
        offsetR = createVector(-(rotVA.x + rotVB.x) / 4, -rotVA.y / 2);
    } else {
        let ptsL = [createVector(0,0), vA, vB, p5.Vector.add(vA, vB)];
        offsetL = getCenterOffset(ptsL);
        let ptsR = [createVector(0,0), vA, p5.Vector.add(vA, vB)];
        offsetR = getCenterOffset(ptsR);
    }
}

function getCenterOffset(pts) {
    let minX = min(pts.map(p => p.x)), maxX = max(pts.map(p => p.x));
    let minY = min(pts.map(p => p.y)), maxY = max(pts.map(p => p.y));
    return createVector(-(minX + (maxX-minX)/2), -(minY + (maxY-minY)/2));
}

function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0 && sA && eA && sB && eB) {
        if (mouseX > width/4-60 && mouseX < width/4+60 && mouseY > height-70 && mouseY < height-30) { step = 1; return; }
    }
    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    } else if (step === 2 && (mode === 'ADD' || mode === 'SUB')) {
        let originR = createVector(width*0.75 + (offsetR?offsetR.x:0), height/2 + (offsetR?offsetR.y:0));
        let vA = p5.Vector.sub(eA, sA);
        let currentMS = p5.Vector.lerp(originR, p5.Vector.add(originR, vA), mSPercent);
        if (dist(mouseX, mouseY, currentMS.x, currentMS.y) < 50) isDragging = true;
    } else if (step === 4 || (mode === 'DOT' && step >= 2)) isPanning = true;
}

function mouseDragged() {
    if (step === 0) {
        let cx = constrain(mouseX, 10, width/2-10);
        if (sA && !sB) eA.set(cx, mouseY); else if (sB) eB.set(cx, mouseY);
    } else if (isDragging && step === 2) {
        let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
        let vA = p5.Vector.sub(eA, sA);
        let relM = p5.Vector.sub(createVector(mouseX/zoom, mouseY/zoom), originR);
        mSPercent = constrain(relM.dot(vA.copy().normalize()) / vA.mag(), 0, 1);
    } else if (isPanning) {
        let dx = mouseX - pmouseX, dy = mouseY - pmouseY;
        if (mouseX < width/2) offsetL.add(createVector(dx, dy)); else offsetR.add(createVector(dx, dy));
    }
}

function mouseReleased() { isDragging = false; isPanning = false; }

function drawArrow(v1, v2, c, label, labelOffset = -15) {
    if (!v1 || !v2) return;
    stroke(c); fill(c); strokeWeight(3 / zoom); line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle); line(0,0,10/zoom,-4/zoom); line(0,0,10/zoom,4/zoom); pop();
    noStroke(); fill(c); textSize(14 / zoom);
    let labelPos = p5.Vector.lerp(v1, v2, 1.15);
    text(label, labelPos.x, labelPos.y);
}

function drawNextButton() { fill(40,180,100); rect(width/4-60, height-70, 120, 40, 5); fill(255); text("다음 단계 ➔", width/4, height-50); }

function drawActionBtn(txt, x, y, callback) {
    let bx = x-80, by = y-20;
    if (mouseX > bx && mouseX < bx+160 && mouseY > by && mouseY < by+40) {
        fill(255, 180, 0); if (mouseIsPressed) { callback(); mouseIsPressed = false; }
    } else fill(255, 150, 0);
    rect(bx, by, 160, 40, 8); fill(255); noStroke(); text(txt, x, y);
}

function drawGuide(t) {
    let blink = abs(sin(frameCount*0.15))*255;
    stroke(255,255,0,blink); noFill(); ellipse(t.x, t.y, 25, 25);
    fill(255,255,0); noStroke(); text("B를 A의 종점으로!", width*0.75, height-40);
}

window.changeMode = function(m) { resetSimulation(); mode = m; }
window.resetSimulation = function() { 
    sA=null; eA=null; sB=null; eB=null; mSPercent=0; offsetL=null; offsetR=null; step=0; 
    isReversed=false; animProgress=0; showComponent=false; showResult=false; mode='NONE'; zoom = 1.0;
}
