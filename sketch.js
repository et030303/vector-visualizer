let mode = 'NONE';
let step = 0; // 0: 그리기, 1: 모이는 애니메이션, 2: 조작, 3: 방향전환 대기, 4: 결과완료
let sA, eA, sB, eB;
let mS, mE; 
let isDragging = false, isSnapped = false;
let groupOffset;
let animProgress = 0; 
let isReversed = false; // 벡터 A의 방향 전환 여부

function setup() {
    let canvas = createCanvas(1000, 600);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER);
}

function draw() {
    background(25);
    drawLayout();

    if (mode === 'NONE') {
        fill(150); textSize(20);
        text("상단 메뉴에서 연산을 선택하세요", width/2, height/2);
        return;
    }

    renderLeftPanel();
    if (step === 0 && eA && eB) drawNextButton();
    if (step >= 2) renderRightPanel();
}

function drawLayout() {
    stroke(60); strokeWeight(1);
    line(width/2, 0, width/2, height);
    noStroke(); fill(100); textSize(13);
    text("PANEL 1: 시점 통합 및 결과", width/4, 25);
    text("PANEL 2: 벡터 조작 과정", width*0.75, 25);
}

function calculateBalanceOffset() {
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    let points = [createVector(0,0), vA, vB];
    if (mode === 'ADD') points.push(p5.Vector.add(vA, vB));
    if (mode === 'SUB') points.push(p5.Vector.sub(vA, vB));

    let minX = min(points.map(p => p.x));
    let maxX = max(points.map(p => p.x));
    let minY = min(points.map(p => p.y));
    let maxY = max(points.map(p => p.y));

    groupOffset = createVector(-(minX + (maxX-minX)/2), -(minY + (maxY-minY)/2));
    
    // 조작용 A의 시작 위치를 B의 시작점(시점 통합) 위치로 초기화
    mS = createVector(width * 0.75 + groupOffset.x, height / 2 + groupOffset.y);
}

function renderLeftPanel() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255, 100, 100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100, 100, 255), "B");
    } else {
        if (!groupOffset) calculateBalanceOffset();
        if (animProgress < 1) animProgress += 0.04; 
        else if (step === 1) step = 2;

        let targetOrigin = createVector(width/4 + groupOffset.x, height/2 + groupOffset.y);
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);

        let curSA = p5.Vector.lerp(sA, targetOrigin, animProgress);
        let curSB = p5.Vector.lerp(sB, targetOrigin, animProgress);

        drawArrow(curSB, p5.Vector.add(curSB, vB), color(100, 100, 255, 150), "B");
        drawArrow(curSA, p5.Vector.add(curSA, vA), color(255, 100, 100, 150), "A");

        // 결과 표시 (합은 즉시, 차는 모든 과정 완료 후)
        if (isSnapped && (mode === 'ADD' || step === 4)) {
            let resVec = (mode === 'ADD') ? p5.Vector.add(vA, vB) : p5.Vector.sub(vA, vB);
            let resColor = (mode === 'ADD') ? color(200, 0, 255) : color(0, 200, 100);
            drawArrow(targetOrigin, p5.Vector.add(targetOrigin, resVec), resColor, "결과");
        }
    }
}

function renderRightPanel() {
    let originR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    let targetB = p5.Vector.add(originR, vB); 

    drawArrow(originR, targetB, color(100, 100, 255), "B");

    if (mode === 'ADD') {
        // [합 로직] - 기존 유지
        handleVectorAdd(originR, targetB, vA);
    } else if (mode === 'SUB') {
        // [차 로직] - 새로운 단계형 로직
        handleVectorSub(originR, targetB, vA, vB);
    }
}

// 기존 완벽한 합 로직
function handleVectorAdd(orig, target, vA) {
    if (!isSnapped) {
        let blink = abs(sin(frameCount * 0.1)) * 255;
        stroke(255, 255, 0, blink); noFill(); ellipse(target.x, target.y, 20, 20);
        fill(255, 200, 0); noStroke(); text("A를 B의 끝으로 드래그하세요", width*0.75, height - 40);
        if (dist(mS.x, mS.y, target.x, target.y) < 15) { mS.set(target.x, target.y); isSnapped = true; }
    }
    let currentAE = p5.Vector.add(mS, vA);
    drawArrow(mS, currentAE, color(255, 100, 100), "A");
    if(!isSnapped) { fill(255, 100, 100); ellipse(mS.x, mS.y, 10, 10); }
    else { drawArrow(orig, currentAE, color(200, 0, 255), "A+B (합)"); }
}

// 설계하신 새로운 차 로직
function handleVectorSub(orig, targetB, vA, vB) {
    if (step === 2) {
        // 1단계: A를 B의 시점으로 이동 (이미 mS가 시점으로 초기화됨)
        fill(255, 200, 0); noStroke(); text("A의 시점이 B와 일치되었습니다.", width*0.75, height - 80);
        drawReverseButton(); // 방향전환 버튼 등장
    }
    
    // 방향 전환 처리
    let currentVA = isReversed ? p5.Vector.mult(vA, -1) : vA;
    let currentLabel = isReversed ? "-A" : "A";
    let currentAE = p5.Vector.add(orig, currentVA);

    drawArrow(orig, currentAE, color(255, 100, 100), currentLabel);

    if (step === 4) {
        // 마지막 결과 벡터 (B의 끝에서 A의 끝으로)
        drawArrow(targetB, currentAE, color(0, 200, 100), "B→A (A-B)");
        fill(255, 255, 0); noStroke(); text("차 벡터(A-B)가 완성되었습니다!", width*0.75, height - 40);
    }
}

function drawReverseButton() {
    let bx = width*0.75 - 70, by = height - 60;
    fill(255, 150, 0); rect(bx, by, 140, 40, 5);
    fill(255); textSize(14); 
    text(isReversed ? "결과 확인" : "방향 전환 (-)", width*0.75, height - 40);
}

function mousePressed() {
    if (mode === 'NONE') return;
    
    // 다음 단계 버튼
    if (step === 0 && eA && eB) {
        let bx = width/4 - 60, by = height - 70;
        if (mouseX > bx && mouseX < bx+120 && mouseY > by && mouseY < by+40) {
            step = 1; animProgress = 0; return;
        }
    }
    
    // 차 모드 전용 버튼 클릭
    if (mode === 'SUB' && step >= 2) {
        let bx = width*0.75 - 70, by = height - 60;
        if (mouseX > bx && mouseX < bx+140 && mouseY > by && mouseY < by+40) {
            if (!isReversed) {
                isReversed = true;
            } else {
                step = 4; // 결과 확인
                isSnapped = true;
            }
            return;
        }
    }

    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    } else if (mode === 'ADD' && step === 2 && !isSnapped) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 50) isDragging = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        let cx = constrain(mouseX, 10, width/2 - 10);
        if (sA && !sB) eA.set(cx, mouseY);
        else if (sB) eB.set(cx, mouseY);
    } else if (mode === 'ADD' && isDragging && !isSnapped) {
        let originR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
        let targetR = p5.Vector.add(originR, p5.Vector.sub(eB, sB));
        let dir = p5.Vector.sub(targetR, originR);
        let dMag = dir.mag();
        dir.normalize();
        let relMouse = p5.Vector.sub(createVector(mouseX, mouseY), originR);
        let sp = constrain(relMouse.dot(dir), 0, dMag); 
        mS = p5.Vector.add(originR, dir.mult(sp));
    }
}

function mouseReleased() { isDragging = false; }

function drawNextButton() {
    let bx = width/4 - 60, by = height - 70;
    fill(40, 180, 100); rect(bx, by, 120, 40, 5);
    fill(255); textSize(14); text("다음 단계 ➔", width/4, height - 50);
}

window.changeMode = function(m) { 
    sA=eA=sB=eB=mS=groupOffset=null; step=0; isSnapped=false; 
    animProgress=0; isReversed=false; mode = m; 
}

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,10,-4); line(0,0,10,4); pop();
    noStroke(); text(label, (v1.x+v2.x)/2, (v1.y+v2.y)/2-15);
}
