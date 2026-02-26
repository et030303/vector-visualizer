let mode = 'NONE';
let step = 0; // 0: 그리기, 1: 조작 단계
let sA, eA, sB, eB; 
let mS, mE; // 조작용 벡터
let isDragging = false;
let isSnapped = false;

function setup() {
    let canvas = createCanvas(1000, 600);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER);
}

function draw() {
    background(20);
    drawLayout();

    if (mode === 'NONE') {
        fill(150); textSize(20);
        text("상단 메뉴에서 연산을 선택하세요", width/2, height/2);
        return;
    }

    // --- PANEL 1 (좌측) ---
    renderLeftPanel();
    if (step === 0 && eA && eB) drawNextButton();

    // --- PANEL 2 (우측) ---
    if (step >= 1) renderRightPanel();
}

function drawLayout() {
    stroke(60); strokeWeight(2);
    line(width/2, 0, width/2, height);
    noStroke(); fill(100); textSize(13);
    text("PANEL 1: 결과 및 시점 통합", width/4, 25);
    text("PANEL 2: 조작 및 가이드", width*0.75, 25);
}

function renderLeftPanel() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255, 100, 100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100, 100, 255), "B");
    } else {
        // [핵심] 벡터 뭉치를 왼쪽 칸 정중앙에 배치하기 위한 오프셋 계산
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);
        let vSum = p5.Vector.add(vA, vB);
        let vSub = p5.Vector.sub(vA, vB);

        // 결과 벡터까지 포함한 모든 끝점 중 가장 먼 곳을 찾아 중앙 정렬
        let pts = [createVector(0,0), vA, vB];
        if (mode === 'ADD') pts.push(vSum);
        if (mode === 'SUB') pts.push(vSub);

        let minX = min(pts.map(p => p.x));
        let maxX = max(pts.map(p => p.x));
        let minY = min(pts.map(p => p.y));
        let maxY = max(pts.map(p => p.y));

        let groupWidth = maxX - minX;
        let groupHeight = maxY - minY;
        let visualCenter = createVector(width/4 - (minX + groupWidth/2), height/2 - (minY + groupHeight/2));

        drawArrow(visualCenter, p5.Vector.add(visualCenter, vA), color(255, 100, 100), "A");
        drawArrow(visualCenter, p5.Vector.add(visualCenter, vB), color(100, 100, 255), "B");
        
        if (isSnapped) {
            if (mode === 'ADD') drawArrow(visualCenter, p5.Vector.add(visualCenter, vSum), color(200, 0, 255), "A+B");
            if (mode === 'SUB') drawArrow(visualCenter, p5.Vector.add(visualCenter, vSub), color(0, 200, 100), "A-B");
        }
    }
}

function renderRightPanel() {
    let centerR = createVector(width*0.75, height/2);
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);

    if (mode === 'ADD' || mode === 'SUB') {
        let targetPoint = p5.Vector.add(centerR, vB); // B의 종점 (목표)
        drawArrow(centerR, targetPoint, color(100, 100, 255, 150), "B");

        // 목표 지점 깜빡이는 점
        let blink = abs(sin(frameCount * 0.1)) * 255;
        fill(255, 255, 0, blink); noStroke();
        ellipse(targetPoint.x, targetPoint.y, 15, 15);

        // A의 시점 점
        fill(255, 100, 100);
        ellipse(mS.x, mS.y, 10, 10);

        // 자석 효과
        if (dist(mS.x, mS.y, targetPoint.x, targetPoint.y) < 25) {
            mS.set(targetPoint.x, targetPoint.y);
            mE = p5.Vector.add(mS, vA);
            isSnapped = true;
            if (mode === 'ADD') drawArrow(centerR, mE, color(200, 0, 255), "A+B 완성");
            else {
                let minusB_E = p5.Vector.add(mS, p5.Vector.sub(centerR, targetPoint));
                drawArrow(mS, minusB_E, color(100, 100, 255), "-B");
            }
        }
        drawArrow(mS, mE, color(255, 100, 100), "A");
    } 
    else if (mode === 'DOT') {
        drawArrow(centerR, p5.Vector.add(centerR, vA), color(255, 100, 100), "A");
        drawArrow(centerR, p5.Vector.add(centerR, vB), color(100, 100, 255), "B");
        drawDotProcess(centerR, p5.Vector.add(centerR, vA), p5.Vector.add(centerR, vB));
        isSnapped = true;
    }
}

function drawNextButton() {
    let bx = width/4 - 50;
    let by = height - 60;
    fill(40, 180, 100);
    rect(bx, by, 100, 40, 5);
    fill(255); textSize(16);
    text("다음 단계", width/4, height - 40);
    if (mouseX > bx && mouseX < bx+100 && mouseY > by && mouseY < by+40) cursor(HAND);
    else cursor(ARROW);
}

function nextStep() {
    step = 1;
    // A의 초기 위치를 오른쪽 칸 적절한 곳에 배치
    mS = createVector(width*0.6, height*0.7);
    mE = p5.Vector.add(mS, p5.Vector.sub(eA, sA));
}

// --- 마우스 제어 ---
function mousePressed() {
    if (mode === 'NONE') return;

    // 다음 버튼 클릭 체크
    if (step === 0 && eA && eB) {
        if (mouseX > width/4 - 50 && mouseX < width/4 + 50 && mouseY > height - 60 && mouseY < height - 20) {
            nextStep();
            return;
        }
    }

    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = createVector(mouseX, mouseY); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = createVector(mouseX, mouseY); }
    } else if (step === 1 && mS) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 40) isDragging = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        let cx = constrain(mouseX, 10, width/2 - 10);
        if (sA && !sB) eA.set(cx, mouseY);
        else if (sB) eB.set(cx, mouseY);
    } else if (isDragging) {
        // [가이드] 오른쪽 칸 내에서만 움직이게 제한
        let dx = mouseX - pmouseX;
        let dy = mouseY - pmouseY;
        let nextS = p5.Vector.add(mS, createVector(dx, dy));
        
        if (nextS.x > width/2 + 20 && nextS.x < width - 20) {
            mS.add(dx, dy); mE.add(dx, dy);
        }
    }
}

function mouseReleased() { isDragging = false; }

function resetAll() {
    sA = eA = sB = eB = mS = mE = null;
    step = 0; isSnapped = false; isDragging = false;
}

function setMode(m) { resetAll(); mode = m; }

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,12,-5); line(0,0,12,5); pop();
    noStroke(); text(label + " (" + round(dist(v1.x,v1.y,v2.x,v2.y)/10) + ")", (v1.x+v2.x)/2, (v1.y+v2.y)/2 - 15);
}

function drawDotProcess(orig, tA, tB) {
    let vA = p5.Vector.sub(tA, orig);
    let vB = p5.Vector.sub(tB, orig);
    let projMag = vA.dot(vB.copy().normalize());
    let projVec = vB.copy().normalize().mult(projMag);
    let pPoint = p5.Vector.add(orig, projVec);
    stroke(255, 100); drawingContext.setLineDash([5, 5]);
    line(tA.x, tA.y, pPoint.x, pPoint.y);
    drawingContext.setLineDash([]);
    fill(255, 165, 0); text("평행: " + round(projMag/10), pPoint.x, pPoint.y + 25);
    fill(0, 255, 0); text("수직: 0", (tA.x + pPoint.x)/2 + 30, (tA.y + pPoint.y)/2);
}
