let mode = 'NONE';
let step = 0; // 0: 그리기, 1: 조작/과정 진행
let sA, eA, sB, eB; // 원본 벡터 A, B
let mS, mE; // 조작용 벡터 (오른쪽 칸용)
let isDragging = false;
let isSnapped = false;

function setup() {
    let canvas = createCanvas(1000, 600);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER);
}

function draw() {
    background(25);
    drawPanels();

    if (mode === 'NONE') {
        fill(100); textSize(20);
        text("상단 메뉴에서 연산을 선택한 후 시작하세요", width/2, height/2);
        return;
    }

    // --- PANEL 1 (좌측: 결과창) ---
    renderLeftPanel();

    // --- PANEL 2 (우측: 조작창) ---
    renderRightPanel();
}

function drawPanels() {
    stroke(60); strokeWeight(2);
    line(width/2, 0, width/2, height);
    noStroke(); fill(150); textSize(14);
    text("PANEL 1: 최종 결과 (시점 일치)", width/4, 30);
    text("PANEL 2: 직접 조작 및 과정", width*0.75, 30);
}

function renderLeftPanel() {
    let origin = createVector(width/4, height/2);
    if (step >= 1) {
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);
        drawArrow(origin, p5.Vector.add(origin, vA), color(255, 100, 100), "A");
        drawArrow(origin, p5.Vector.add(origin, vB), color(100, 100, 255), "B");
        
        if (isSnapped) {
            if (mode === 'ADD') drawArrow(origin, p5.Vector.add(origin, p5.Vector.add(vA, vB)), color(200, 0, 255), "A+B (합)");
            if (mode === 'SUB') drawArrow(origin, p5.Vector.add(origin, p5.Vector.sub(vA, vB)), color(0, 200, 100), "A-B (차)");
            if (mode === 'DOT') {
                let dotVal = round(p5.Vector.dot(vA, vB) / 1000); // 스케일 조정
                fill(255, 165, 0); textSize(24);
                text("내적값: " + dotVal, width/4, height - 50);
            }
        }
    }
}

function renderRightPanel() {
    push();
    if (step === 0) {
        // 벡터 그리기 단계
        if (sA && eA) drawArrow(sA, eA, color(255, 100, 100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100, 100, 255), "B");
    } else {
        // 조작 단계
        if (mode === 'ADD') {
            drawArrow(sB, eB, color(100, 100, 255, 100), "B (고정)");
            if (dist(mS.x, mS.y, eB.x, eB.y) < 25) { // A의 시점을 B의 종점으로
                mS.set(eB.x, eB.y); mE = p5.Vector.add(mS, p5.Vector.sub(eA, sA));
                isSnapped = true;
                drawArrow(sB, mE, color(200, 0, 255), "A+B 완성");
            }
            drawArrow(mS, mE, color(255, 100, 100), "A (이동시키세요)");
        } 
        else if (mode === 'SUB') {
            drawArrow(sB, eB, color(100, 100, 255, 100), "B");
            if (dist(mS.x, mS.y, eB.x, eB.y) < 25) {
                mS.set(eB.x, eB.y); mE = p5.Vector.add(mS, p5.Vector.sub(eA, sA));
                isSnapped = true;
                // -B 표현 (화살표 반전)
                let minusB_E = p5.Vector.add(mS, p5.Vector.sub(sB, eB));
                strokeWeight(2); stroke(100, 100, 255); line(mS.x, mS.y, minusB_E.x, minusB_E.y);
                drawArrow(mS, minusB_E, color(100, 100, 255), "-B");
            }
            drawArrow(mS, mE, color(255, 100, 100), "A (이동)");
        }
        else if (mode === 'DOT') {
            // 내적: 시점 일치 및 성분 분해
            let originR = createVector(width*0.75, height/2);
            let vA = p5.Vector.sub(eA, sA);
            let vB = p5.Vector.sub(eB, sB);
            let targetA = p5.Vector.add(originR, vA);
            let targetB = p5.Vector.add(originR, vB);
            
            drawArrow(originR, targetA, color(255, 100, 100), "A");
            drawArrow(originR, targetB, color(100, 100, 255), "B");
            isSnapped = true; // 시점 합쳐지면 바로 계산
            
            // 수직/평행 분해 시각화
            drawDotProcess(originR, targetA, targetB);
        }
        
        if (!isSnapped && mode !== 'DOT') {
            fill(0, 255, 0); noStroke(); ellipse(mS.x, mS.y, 15, 15); // "여기 잡으세요" 표시
        }
    }
    pop();
}

function drawDotProcess(orig, tA, tB) {
    let vecB = p5.Vector.sub(tB, orig);
    let vecA = p5.Vector.sub(tA, orig);
    let projMag = vecA.dot(vecB) / vecB.mag();
    let projVec = vecB.copy().normalize().mult(projMag);
    let pPoint = p5.Vector.add(orig, projVec);

    stroke(255, 200); drawingContext.setLineDash([5, 5]);
    line(tA.x, tA.y, pPoint.x, pPoint.y); // 수직선
    drawingContext.setLineDash([]);
    
    fill(0, 255, 0); text("수직성분: 0", (tA.x + pPoint.x)/2 + 40, (tA.y + pPoint.y)/2);
    fill(255, 165, 0); text("평행성분 크기: " + round(projMag/10), pPoint.x, pPoint.y + 25);
}

// --- 이벤트 핸들러 ---
function setMode(m) {
    resetAll(); mode = m;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + m).classList.add('active');
}

function nextStep() {
    step = 1;
    mS = sA.copy(); mE = eA.copy(); // 기본적으로 A를 움직임
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
        if (!sA) { sA = createVector(mouseX, mouseY); eA = createVector(mouseX, mouseY); }
        else if (eA && !sB && mouseX > width/2) { sB = createVector(mouseX, mouseY); eB = createVector(mouseX, mouseY); }
    } else if (step === 1 && mS) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 40) isDragging = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        if (sA && !sB) eA.set(mouseX, mouseY);
        else if (sB) eB.set(mouseX, mouseY);
    } else if (isDragging) {
        let dx = mouseX - pmouseX; let dy = mouseY - pmouseY;
        mS.add(dx, dy); mE.add(dx, dy);
    }
}

function mouseReleased() {
    isDragging = false;
    if (step === 0 && eA && eB && dist(sB.x, sB.y, eB.x, eB.y) > 10) {
        document.getElementById('next-btn').style.display = 'block';
    }
}

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,12,-5); line(0,0,12,5); pop();
    noStroke(); text(label + " (" + round(dist(v1.x,v1.y,v2.x,v2.y)/10) + ")", (v1.x+v2.x)/2, (v1.y+v2.y)/2 - 15);
}
