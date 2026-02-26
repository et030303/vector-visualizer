let mode = 'NONE';
let step = 0; // 0: 그리기, 1: 시점합치기/대기, 2: 조작/완성
let sA, eA, sB, eB;
let mS, mE; // 조작용 벡터 (moveable)
let isDragging = false;
let isSnapped = false;

function setup() {
    createCanvas(1000, 550);
}

function draw() {
    background(30);
    drawPanels();

    if (mode === 'NONE') {
        fill(150); textAlign(CENTER); textSize(20);
        text("상단 버튼을 눌러 연산을 시작하세요", width/2, height/2);
        return;
    }

    drawLeftPanel();
    drawRightPanel();
}

function drawPanels() {
    stroke(80); strokeWeight(2);
    line(width/2, 0, width/2, height);
    noStroke(); fill(180); textAlign(CENTER); textSize(14);
    text("PANEL 1: 최종 결과 (시점 통일)", width/4, 30);
    text("PANEL 2: 과정 및 직접 조작", width*0.75, 30);
}

function drawLeftPanel() {
    let origin = createVector(width/4, height/2);
    if (step >= 1) {
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);
        drawArrow(origin, p5.Vector.add(origin, vA), color(255, 100, 100), "A");
        drawArrow(origin, p5.Vector.add(origin, vB), color(100, 100, 255), "B");
        
        if (isSnapped) {
            if (mode === 'ADD') drawArrow(origin, p5.Vector.add(origin, p5.Vector.add(vA, vB)), color(200, 0, 255), "A+B");
            if (mode === 'SUB') drawArrow(origin, p5.Vector.add(origin, p5.Vector.sub(vA, vB)), color(0, 200, 100), "A-B");
            if (mode === 'DOT') {
                fill(255, 165, 0); textSize(18);
                let dotVal = round(vA.dot(vB)/100);
                text("내적 결과 스칼라: " + dotVal, width/4, height - 40);
            }
        }
    }
}

function drawRightPanel() {
    push();
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255, 100, 100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100, 100, 255), "B");
    } else if (step >= 1) {
        if (mode === 'ADD') {
            drawArrow(sA, eA, color(255, 100, 100), "A");
            if (dist(mS.x, mS.y, eA.x, eA.y) < 25) {
                mS.set(eA.x, eA.y); mE = p5.Vector.add(mS, p5.Vector.sub(eB, sB));
                isSnapped = true;
                drawArrow(sA, mE, color(200, 0, 255), "A+B");
            }
        } else if (mode === 'SUB') {
            drawArrow(sB, eB, color(100, 100, 255), "B");
            if (dist(mS.x, mS.y, eB.x, eB.y) < 25) {
                mS.set(eB.x, eB.y); mE = p5.Vector.add(mS, p5.Vector.sub(eA, sA));
                isSnapped = true;
                let minusB_E = p5.Vector.add(mS, p5.Vector.sub(sB, eB));
                drawArrow(mS, minusB_E, color(100, 100, 255, 150), "-B");
                drawArrow(eB, mE, color(0, 200, 100), "A-B");
            }
        } else if (mode === 'DOT') {
            mS.set(sA.x, sA.y); mE.set(sA.x + (eB.x-sB.x), sA.y + (eB.y-sB.y));
            isSnapped = true;
            drawArrow(sA, eA, color(255, 100, 100), "A");
            drawProjection(sA, eA, mE);
        }
        drawArrow(mS, mE, color(100, 100, 255, 180), mode === 'SUB' ? "A(이동)" : "B");
        if (!isSnapped) { fill(0, 255, 0); noStroke(); ellipse(mS.x, mS.y, 12, 12); }
    }
    pop();
}

function drawProjection(baseS, baseE, targetE) {
    let vA = p5.Vector.sub(baseE, baseS);
    let vB = p5.Vector.sub(targetE, baseS);
    let proj = vA.copy().normalize().mult(vB.dot(vA) / vA.mag());
    let pPoint = p5.Vector.add(baseS, proj);
    stroke(255, 150); drawingContext.setLineDash([5, 5]);
    line(targetE.x, targetE.y, pPoint.x, pPoint.y);
    drawingContext.setLineDash([]);
    fill(255, 165, 0); noStroke(); textSize(14);
    text("평행 성분 크기: " + round(proj.mag()/10), pPoint.x, pPoint.y + 25);
    text("수직 성분: 0", (targetE.x + pPoint.x)/2 + 20, (targetE.y + pPoint.y)/2);
}

function setMode(m) {
    resetAll(); mode = m;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    let activeBtn = document.getElementById('btn-'+m);
    if(activeBtn) activeBtn.classList.add('active');
}

function nextStep() {
    step = 1;
    if(mode === 'SUB') { mS = sA.copy(); mE = eA.copy(); }
    else { mS = sB.copy(); mE = eB.copy(); }
    document.getElementById('next-btn').style.display = 'none';
}

function resetAll() {
    sA = eA = sB = eB = mS = mE = null;
    step = 0; isSnapped = false; isDragging = false;
    document.getElementById('next-btn').style.display = 'none';
}

function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0) {
        if (!sA) sA = createVector(mouseX, mouseY);
        else if (eA && !sB && mouseX > width/2) sB = createVector(mouseX, mouseY);
    } else if (step === 1 && mS) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 40) isDragging = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        if (sA && !eA) eA = createVector(mouseX, mouseY);
        else if (sB && !eB) eB = createVector(mouseX, mouseY);
    } else if (isDragging) {
        let dx = mouseX - mS.x; let dy = mouseY - mS.y;
        mS.add(dx, dy); mE.add(dx, dy);
    }
}

function mouseReleased() {
    isDragging = false;
    if (step === 0 && eB) document.getElementById('next-btn').style.display = 'block';
}

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,12, -5); line(0,0,12, 5); pop();
    noStroke(); textAlign(CENTER);
    text(label + " (" + round(dist(v1.x,v1.y,v2.x,v2.y)/10) + ")", (v1.x+v2.x)/2, (v1.y+v2.y)/2 - 12);
}
