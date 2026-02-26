let mode = 'NONE';
let step = 0; // 0: 왼쪽에서 그리기, 1: 시점합치기(왼쪽), 2: 오른쪽에서 조작
let sA, eA, sB, eB;
let mS, mE; // 오른쪽 조작용 벡터
let isDragging = false;
let isSnapped = false;

function setup() {
    let canvas = createCanvas(1000, 600);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER);
}

function draw() {
    background(25);
    drawLayout();

    if (mode === 'NONE') {
        fill(100); textSize(20);
        text("상단 메뉴에서 연산을 선택하세요", width/2, height/2);
        return;
    }

    // --- PANEL 1 (왼쪽: 그리기 및 시점 합치기) ---
    renderLeftPanel();

    // --- PANEL 2 (오른쪽: 실제 조작) ---
    if (step >= 1) renderRightPanel();
}

function drawLayout() {
    stroke(80); strokeWeight(2);
    line(width/2, 0, width/2, height); // 중앙 가이드선
    noStroke(); fill(150); textSize(14);
    text("PANEL 1: 벡터 그리기 및 시점 통합", width/4, 30);
    text("PANEL 2: 조작 및 연산 과정", width*0.75, 30);
}

function renderLeftPanel() {
    let centerLeft = createVector(width/4, height/2);

    if (step === 0) {
        // [단계 0] 사용자가 그린 위치 그대로 표시
        if (sA && eA) drawArrow(sA, eA, color(255, 100, 100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100, 100, 255), "B");
    } else {
        // [단계 1 이상] 시점이 왼쪽 칸 중앙으로 합쳐진 상태
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);
        drawArrow(centerLeft, p5.Vector.add(centerLeft, vA), color(255, 100, 100), "A");
        drawArrow(centerLeft, p5.Vector.add(centerLeft, vB), color(100, 100, 255), "B");
        
        // 조작이 완료(Snap)되면 결과 벡터도 왼쪽 칸에 표시
        if (isSnapped) {
            if (mode === 'ADD') drawArrow(centerLeft, p5.Vector.add(centerLeft, p5.Vector.add(vA, vB)), color(200, 0, 255), "A+B");
            if (mode === 'SUB') drawArrow(centerLeft, p5.Vector.add(centerLeft, p5.Vector.sub(vA, vB)), color(0, 200, 100), "A-B");
        }
    }
}

function renderRightPanel() {
    push();
    let centerRight = createVector(width*0.75, height/2);
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);

    if (mode === 'ADD') {
        // B는 고정, A를 드래그해서 B의 끝에 붙이기
        let fixedB_E = p5.Vector.add(centerRight, vB);
        drawArrow(centerRight, fixedB_E, color(100, 100, 255, 150), "B");
        
        if (dist(mS.x, mS.y, fixedB_E.x, fixedB_E.y) < 25) {
            mS.set(fixedB_E.x, fixedB_E.y); mE = p5.Vector.add(mS, vA);
            isSnapped = true;
            drawArrow(centerRight, mE, color(200, 0, 255), "A+B 완성");
        }
        drawArrow(mS, mE, color(255, 100, 100), "A 이동");
    } 
    else if (mode === 'SUB') {
        // A-B 과정을 위해 A를 B의 끝으로 이동
        let fixedB_E = p5.Vector.add(centerRight, vB);
        drawArrow(centerRight, fixedB_E, color(100, 100, 255, 150), "B");
        
        if (dist(mS.x, mS.y, fixedB_E.x, fixedB_E.y) < 25) {
            mS.set(fixedB_E.x, fixedB_E.y); mE = p5.Vector.add(mS, vA);
            isSnapped = true;
            // -B 시각화
            let minusB_E = p5.Vector.add(mS, p5.Vector.sub(centerRight, fixedB_E));
            drawArrow(mS, minusB_E, color(100, 100, 255), "-B");
        }
        drawArrow(mS, mE, color(255, 100, 100), "A 이동");
    }
    else if (mode === 'DOT') {
        drawArrow(centerRight, p5.Vector.add(centerRight, vA), color(255, 100, 100), "A");
        drawArrow(centerRight, p5.Vector.add(centerRight, vB), color(100, 100, 255), "B");
        drawDotProcess(centerRight, p5.Vector.add(centerRight, vA), p5.Vector.add(centerRight, vB));
        isSnapped = true;
    }
    pop();
}

function drawDotProcess(orig, tA, tB) {
    let vecB = p5.Vector.sub(tB, orig);
    let vecA = p5.Vector.sub(tA, orig);
    let projMag = vecA.dot(vecB.copy().normalize());
    let projVec = vecB.copy().normalize().mult(projMag);
    let pPoint = p5.Vector.add(orig, projVec);

    stroke(255, 150); drawingContext.setLineDash([5, 5]);
    line(tA.x, tA.y, pPoint.x, pPoint.y);
    drawingContext.setLineDash([]);
    fill(255, 165, 0); text("평행크기: " + round(projMag/10), pPoint.x, pPoint.y + 25);
    fill(0, 255, 0); text("수직: 0", (tA.x + pPoint.x)/2 + 30, (tA.y + pPoint.y)/2);
}

// --- 마우스 제어: 왼쪽 칸으로 제한 ---
function mousePressed() {
    if (mode === 'NONE') return;

    if (step === 0) {
        // 왼쪽 칸(0 ~ 500) 안에서만 시작점 생성 가능
        if (mouseX < width/2) {
            if (!sA) { sA = createVector(mouseX, mouseY); eA = createVector(mouseX, mouseY); }
            else if (eA && !sB) { sB = createVector(mouseX, mouseY); eB = createVector(mouseX, mouseY); }
        }
    } else if (step === 1 && mS) {
        // 오른쪽 칸 조작
        if (dist(mouseX, mouseY, mS.x, mS.y) < 40) isDragging = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        // 그릴 때 마우스가 오른쪽으로 넘어가도 좌표를 중앙선(500)에 고정
        let constrainedX = constrain(mouseX, 0, width/2 - 10);
        if (sA && !sB) eA.set(constrainedX, mouseY);
        else if (sB) eB.set(constrainedX, mouseY);
    } else if (isDragging) {
        let dx = mouseX - pmouseX; let dy = mouseY - pmouseY;
        mS.add(dx, dy); mE.add(dx, dy);
    }
}

function mouseReleased() {
    isDragging = false;
    if (step === 0 && eA && eB && dist(sB.x, sB.y, eB.x, eB.y) > 5) {
        document.getElementById('next-btn').style.display = 'block';
    }
}

function nextStep() {
    step = 1;
    // 조작용 벡터 초기 위치 설정 (오른쪽 칸 어딘가)
    mS = createVector(width*0.6, height*0.7);
    mE = p5.Vector.add(mS, p5.Vector.sub(eA, sA));
    document.getElementById('next-btn').style.display = 'none';
}

function resetAll() {
    sA = eA = sB = eB = mS = mE = null;
    step = 0; isSnapped = false; isDragging = false;
    document.getElementById('next-btn').style.display = 'none';
}

function setMode(m) {
    resetAll(); mode = m;
    document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    if(document.getElementById('btn-'+m)) document.getElementById('btn-'+m).classList.add('active');
}

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,12,-5); line(0,0,12,5); pop();
    noStroke(); text(label + " (" + round(dist(v1.x,v1.y,v2.x,v2.y)/10) + ")", (v1.x+v2.x)/2, (v1.y+v2.y)/2 - 15);
}
