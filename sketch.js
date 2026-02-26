let mode = 'NONE';
let step = 0; // 0:그리기, 1:이동애니메이션, 2:B조작, 3:변환버튼대기, 4:결과완료
let sA, eA, sB, eB;
let mS, mE; // 조작용 벡터 B
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
    let points = [createVector(0,0), vA, vB];
    if (mode === 'ADD') points.push(p5.Vector.add(vA, vB));
    if (mode === 'SUB') points.push(p5.Vector.sub(vA, vB));
    let minX = min(points.map(p => p.x)), maxX = max(points.map(p => p.x));
    let minY = min(points.map(p => p.y)), maxY = max(points.map(p => p.y));
    groupOffset = createVector(-(minX + (maxX-minX)/2), -(minY + (maxY-minY)/2));
    // 조작용 B의 시점 초기화 (A와 동일 시점)
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
        
        drawArrow(curSA, p5.Vector.add(curSA, vA), color(255,100,100,150), "A");
        drawArrow(curSB, p5.Vector.add(curSB, vB), color(100,100,255,150), "B");

        if (isSnapped) {
            let resColor = (mode === 'ADD') ? color(200,0,255) : color(0,200,100);
            if (mode === 'ADD') drawArrow(targetOrg, p5.Vector.add(targetOrg, p5.Vector.add(vA, vB)), resColor, "A+B");
            else if (step === 4) drawArrow(p5.Vector.add(targetOrg, vB), p5.Vector.add(targetOrg, vA), resColor, "A-B");
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

    if (mode === 'ADD') {
        if (!isSnapped) {
            drawGuide(targetA);
            if (dist(mS.x, mS.y, targetA.x, targetA.y) < 15) { mS.set(targetA.x, targetA.y); isSnapped = true; }
        }
        drawArrow(mS, currentEB, color(100,100,255), "B");
        if (isSnapped) drawArrow(originR, currentEB, color(200,0,255), "A+B");
    } else if (mode === 'SUB') {
        if (step === 2) {
            drawGuide(targetA);
            if (dist(mS.x, mS.y, targetA.x, targetA.y) < 15) { mS.set(targetA.x, targetA.y); step = 3; }
        }
        drawArrow(mS, currentEB, color(100,100,255), isReversed ? "-B" : "B");
        if (step === 3) drawActionBtn("-B로 만들기");
        if (step === 4) {
            isSnapped = true;
            drawArrow(originR, currentEB, color(0,200,100), "A+(-B)");
        }
    }
    if (!isSnapped) { fill(100,100,255); ellipse(mS.x, mS.y, 10, 10); }
}

function drawGuide(t) {
    let blink = abs(sin(frameCount*0.1))*255;
    stroke(255,255,0,blink); noFill(); ellipse(t.x, t.y, 20, 20);
    fill(255,200,0); noStroke(); text("B의 시점을 A의 종점으로 이동!", width*0.75, height-40);
}

function drawActionBtn(txt) {
    let bx = width*0.75-70, by = height-60;
    fill(255,150,0); rect(bx, by, 140, 40, 5);
    fill(255); text(txt, width*0.75, height-40);
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
        if (dist(mouseX, mouseY, mS.x, mS.y) < 40) isDragging = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        if (sA && !sB) eA.set(constrain(mouseX, 10, width/2-10), mouseY);
        else if (sB) eB.set(constrain(mouseX, 10, width/2-10), mouseY);
    } else if (isDragging) {
        let orgR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
        let vA = p5.Vector.sub(eA, sA);
        let targetA = p5.Vector.add(orgR, vA);
        let dir = p5.Vector.sub(targetA, orgR);
        let dMag = dir.mag(); dir.normalize();
        let relM = p5.Vector.sub(createVector(mouseX, mouseY), orgR);
        mS = p5.Vector.add(orgR, dir.mult(constrain(relM.dot(dir), 0, dMag)));
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
