let mode = 'NONE';
let step = 0; // 0:그리기, 1:이동애니메이션, 2:B조작, 3:변환버튼대기, 4:결과완료
let sA, eA, sB, eB;
let mS, mE; 
let isDragging = false, isSnapped = false, isReversed = false;
let groupOffset, animProgress = 0;

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
    text("PANEL 1: 원리 및 최종 결과", width/4, 25);
    text("PANEL 2: B 벡터 조작", width*0.75, 25);
}

function calculateBalanceOffset() {
    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    // 시점이 0,0일 때 모든 끝점들 계산 (A-B 결과 벡터 포함)
    let points = [createVector(0,0), vA, vB];
    if (mode === 'ADD') points.push(p5.Vector.add(vA, vB));
    if (mode === 'SUB') points.push(p5.Vector.sub(vA, vB)); // A-B 끝점 포함

    let minX = min(points.map(p => p.x)), maxX = max(points.map(p => p.x));
    let minY = min(points.map(p => p.y)), maxY = max(points.map(p => p.y));
    
    // 전체 뭉치의 중심을 계산하여 칸 중앙에 배치하기 위한 오프셋
    groupOffset = createVector(-(minX + (maxX-minX)/2), -(minY + (maxY-minY)/2));
    
    // 조작용 B의 시점 초기화 (A와 동일한 시점에서 시작)
    mS = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
}

function renderLeftPanel() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255,100,100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100,100,255), "B");
    } else {
        if (!groupOffset) calculateBalanceOffset();
        if (animProgress < 1) animProgress += 0.04; else if (step === 1) step = 2;
        
        let targetOrg = createVector(width/4 + groupOffset.x, height/2 + groupOffset.y);
        let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
        let curSA = p5.Vector.lerp(sA, targetOrg, animProgress);
        let curSB = p5.Vector.lerp(sB, targetOrg, animProgress);
        
        let finalEA = p5.Vector.add(targetOrg, vA);
        let finalEB = p5.Vector.add(targetOrg, vB);

        drawArrow(curSA, p5.Vector.add(curSA, vA), color(255,100,100,150), "A");
        drawArrow(curSB, p5.Vector.add(curSB, vB), color(100,100,255,150), "B");

        if (isSnapped) {
            let resColor = (mode === 'ADD') ? color(200,0,255) : color(0,200,100);
            if (mode === 'ADD') {
                drawArrow(targetOrg, p5.Vector.add(targetOrg, p5.Vector.add(vA, vB)), resColor, "A+B");
            } else if (step === 4) {
                // 왼쪽 칸: B의 종점에서 A의 종점으로 향하는 차 벡터 (수학적 정의)
                drawArrow(finalEB, finalEA, resColor, "A-B");
            }
        }
    }
}

function renderRightPanel() {
    let originR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
    let vA = p5.Vector.sub(eA, sA), vB = p5.Vector.sub(eB, sB);
    let targetA = p5.Vector.add(originR, vA);
    
    drawArrow(originR, targetA, color(255,100,100), "A");

    let currentVB = isReversed ? p5.Vector.mult(vB, -1) : vB;
    let currentEB = p5.Vector.add(mS, currentVB);

    // 공통 가이드 (B 조작 중일 때)
    if (step === 2) {
        drawGuide(targetA);
        if (dist(mS.x, mS.y, targetA.x, targetA.y) < 15) { 
            mS.set(targetA.x, targetA.y); 
            if (mode === 'SUB') step = 3; else isSnapped = true;
        }
    }

    if (mode === 'ADD') {
        drawArrow(mS, currentEB, color(100,100,255), "B");
        if (isSnapped) drawArrow(originR, currentEB, color(200,0,255), "A+B");
    } else if (mode === 'SUB') {
        drawArrow(mS, currentEB, color(100,100,255), isReversed ? "-B" : "B");
        if (step === 3) drawActionBtn("-B로 만들기");
        if (step === 4) {
            isSnapped = true;
            // 오른쪽 칸: A + (-B)의 기하학적 합으로 표현
            drawArrow(originR, currentEB, color(0,200,100), "A+(-B)");
        }
    }
    
    if (step === 2) { // 조작 중일 때만 파란 점 표시
        fill(100,100,255); noStroke(); ellipse(mS.x, mS.y, 12, 12); 
    }
}

function drawGuide(t) {
    let blink = abs(sin(frameCount*0.15))*255;
    stroke(255,255,0,blink); strokeWeight(2); noFill(); 
    ellipse(t.x, t.y, 25, 25);
    fill(255,255,0); noStroke(); textSize(14);
    text("B의 시점을 A의 끝점으로!", width*0.75, height-40);
}

function drawActionBtn(txt) {
    let bx = width*0.75-70, by = height-60;
    fill(255,150,0); rect(bx, by, 140, 40, 8);
    fill(255); noStroke(); fontWeight(600);
    text(txt, width*0.75, height-40);
}

function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0 && eA && eB) {
        if (mouseX > width/4-60 && mouseX < width/4+60 && mouseY > height-70 && mouseY < height-30) { step = 1; return; }
    }
    if (step === 3 && mode === 'SUB') {
        if (mouseX > width*0.75-70 && mouseX < width*0.75+70 && mouseY > height-60 && mouseY < height-20) { isReversed = true; step = 4; return; }
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
        // [A 벡터 위에서만 움직이는 제한 로직]
        let orgR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
        let vA = p5.Vector.sub(eA, sA);
        let targetA = p5.Vector.add(orgR, vA);
        
        let dir = p5.Vector.sub(targetA, orgR);
        let dMag = dir.mag(); dir.normalize();
        
        let relM = p5.Vector.sub(createVector(mouseX, mouseY), orgR);
        let sp = relM.dot(dir);
        sp = constrain(sp, 0, dMag); // A의 시점(0)과 종점(dMag) 사이로 제한
        mS = p5.Vector.add(orgR, dir.mult(sp));
    }
}

function mouseReleased() { isDragging = false; }
function drawNextButton() { fill(40,180,100); rect(width/4-60, height-70, 120, 40, 5); fill(255); text("다음 단계 ➔", width/4, height-50); }

window.changeMode = function(m) { resetSimulation(); mode = m; }
window.resetSimulation = function() { sA=eA=sB=eB=mS=groupOffset=null; step=0; isSnapped=false; isReversed=false; animProgress=0; mode='NONE'; }

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3); line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle); line(0,0,10,-4); line(0,0,10,4); pop();
    noStroke(); text(label, (v1.x+v2.x)/2, (v1.y+v2.y)/2-15);
}
