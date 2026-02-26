let mode = 'NONE';
let step = 0; // 0:그리기, 1:이동애니메이션, 2:B조작, 3:변환버튼대기, 4:결과완료
let sA, eA, sB, eB;
let mS; // 조작용 벡터 B의 시점
let isDragging = false, isSnapped = false, isReversed = false;
let offsetL, offsetR; // 왼쪽과 오른쪽 독립 오프셋
let animProgress = 0;

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
    renderLeftPanel();
    if (step === 0 && eA && eB) drawNextButton();
    if (step >= 2) renderRightPanel();
}

function drawLayout() {
    stroke(60); line(width/2, 0, width/2, height);
    noStroke(); fill(100); textSize(13);
    text("PANEL 1: 수학적 정의 (B의 끝 → A의 끝)", width/4, 25);
    text("PANEL 2: 연산 과정 (A + (-B))", width*0.75, 25);
}

// 각 패널의 벡터 뭉치를 각각 중앙 정렬
function calculateSeparateOffsets() {
    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    
    // 왼쪽용 오프셋: 시점 통합 상태 (A, B, 그리고 B 끝점에서 A 끝점으로 가는 결과 포함)
    let pointsL = [createVector(0,0), vA, vB];
    offsetL = getCenterOffset(pointsL);

    // 오른쪽용 오프셋: A의 종점에 B가 붙은 상태 (A, A+B 뭉치 포함)
    let pointsR = [createVector(0,0), vA, p5.Vector.add(vA, vB), p5.Vector.add(vA, p5.Vector.mult(vB, -1))];
    offsetR = getCenterOffset(pointsR);

    // 조작용 B의 시점 초기화 (오른쪽 패널의 A 시점에서 시작)
    mS = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
}

function getCenterOffset(pts) {
    let minX = min(pts.map(p => p.x)), maxX = max(pts.map(p => p.x));
    let minY = min(pts.map(p => p.y)), maxY = max(pts.map(p => p.y));
    return createVector(-(minX + (maxX-minX)/2), -(minY + (maxY-minY)/2));
}

function renderLeftPanel() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255,100,100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100,100,255), "B");
    } else {
        if (!offsetL) calculateSeparateOffsets();
        if (animProgress < 1) animProgress += 0.04; else if (step === 1) step = 2;
        
        let originL = createVector(width/4 + offsetL.x, height/2 + offsetL.y);
        let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
        
        let curSA = p5.Vector.lerp(sA, originL, animProgress);
        let curSB = p5.Vector.lerp(sB, originL, animProgress);

        let finalEA = p5.Vector.add(originL, vA);
        let finalEB = p5.Vector.add(originL, vB);

        drawArrow(curSA, p5.Vector.add(curSA, vA), color(255,100,100, 150), "A");
        drawArrow(curSB, p5.Vector.add(curSB, vB), color(100,100,255, 150), "B");

        if (step === 4) { // 결과 완료 시
            let resColor = (mode === 'ADD') ? color(200,0,255) : color(0,200,100);
            if (mode === 'ADD') drawArrow(originL, p5.Vector.add(originL, p5.Vector.add(vA, vB)), resColor, "A+B");
            else drawArrow(finalEB, finalEA, resColor, "A-B");
        }
    }
}

function renderRightPanel() {
    let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    let targetA = p5.Vector.add(originR, vA);
    
    drawArrow(originR, targetA, color(255,100,100), "A");

    // 종점 스냅 감지 (Step 2에서만)
    if (step === 2 && dist(mS.x, mS.y, targetA.x, targetA.y) < 15) {
        mS.set(targetA.x, targetA.y);
        isDragging = false; 
        step = (mode === 'SUB') ? 3 : 4; 
    }

    let currentVB = isReversed ? p5.Vector.mult(vB, -1) : vB;
    let currentEB = p5.Vector.add(mS, currentVB);

    if (mode === 'ADD') {
        if (step === 2) drawGuide(targetA);
        drawArrow(mS, currentEB, color(100,100,255), "B");
        if (step === 4) drawArrow(originR, currentEB, color(200,0,255), "A+B");
    } else {
        if (step === 2) drawGuide(targetA);
        drawArrow(mS, currentEB, color(100,100,255), isReversed ? "-B" : "B");
        if (step === 3) drawActionBtn("-B로 만들기");
        if (step === 4) drawArrow(originR, currentEB, color(0,200,100), "A+(-B)");
    }
    
    if (step === 2) { 
        fill(100,100,255); noStroke(); ellipse(mS.x, mS.y, 12, 12); 
    }
}

function drawGuide(t) {
    let blink = abs(sin(frameCount*0.15))*255;
    stroke(255,255,0,blink); noFill(); ellipse(t.x, t.y, 25, 25);
    fill(255,255,0); noStroke(); text("B의 시점을 A의 종점으로!", width*0.75, height-40);
}

function drawActionBtn(txt) {
    let bx = width*0.75-70, by = height-60;
    fill(255,150,0); rect(bx, by, 140, 40, 8);
    fill(255); noStroke(); text(txt, width*0.75, height-40);
}

function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0 && eA && eB) {
        if (mouseX > width/4-60 && mouseX < width/4+60 && mouseY > height-70 && mouseY < height-30) { step = 1; animProgress = 0; return; }
    }
    if (step === 3) {
        let bx = width*0.75-70, by = height-60;
        if (mouseX > bx && mouseX < bx+140 && mouseY > by && mouseY < by+40) { isReversed = true; step = 4; return; }
    }
    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    } else if (step === 2) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 50) isDragging = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        let cx = constrain(mouseX, 10, width/2-10);
        if (sA && !sB) eA.set(cx, mouseY);
        else if (sB) eB.set(cx, mouseY);
    } else if (isDragging && step === 2) {
        let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
        let targetA = p5.Vector.add(originR, p5.Vector.sub(eA, sA));
        let dir = p5.Vector.sub(targetA, originR);
        let dMag = dir.mag(); dir.normalize();
        let relM = p5.Vector.sub(createVector(mouseX, mouseY), originR);
        mS = p5.Vector.add(originR, dir.mult(constrain(relM.dot(dir), 0, dMag)));
    }
}

function mouseReleased() { isDragging = false; }
function drawNextButton() { fill(40,180,100); rect(width/4-60, height-70, 120, 40, 5); fill(255); text("다음 단계 ➔", width/4, height-50); }

window.changeMode = function(m) { resetSimulation(); mode = m; }
window.resetSimulation = function() { 
    sA=eA=sB=eB=mS=offsetL=offsetR=null; step=0; 
    isSnapped=isReversed=false; animProgress=0; mode='NONE'; 
}

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3); line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle); line(0,0,10,-4); line(0,0,10,4); pop();
    noStroke(); text(label, (v1.x+v2.x)/2, (v1.y+v2.y)/2-15);
}
