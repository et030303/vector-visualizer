let mode = 'NONE';
let step = 0; // 0: 그리기, 1: 조작
let sA, eA, sB, eB;
let mS, mE; // 조작용 벡터 A
let isDragging = false;
let isSnapped = false;
let groupOffset; // 왼쪽/오른쪽 공통으로 사용할 정렬 오프셋

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

    // 1. 단계가 바뀌는 순간 오프셋 계산 (한 번만)
    if (step === 1 && !groupOffset) {
        calculateBalanceOffset();
    }

    renderLeftPanel();
    if (step === 0 && eA && eB) drawNextButton();
    if (step >= 1) renderRightPanel();
}

// 벡터 뭉치를 칸 중앙에 놓기 위한 좌표 계산
function calculateBalanceOffset() {
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    
    // 벡터들이 차지하는 영역(Bounding Box) 계산
    let points = [createVector(0,0), vA, vB];
    if (mode === 'ADD') points.push(p5.Vector.add(vA, vB));
    if (mode === 'SUB') points.push(p5.Vector.sub(vA, vB));

    let minX = min(points.map(p => p.x));
    let maxX = max(points.map(p => p.x));
    let minY = min(points.map(p => p.y));
    let maxY = max(points.map(p => p.y));

    let groupW = maxX - minX;
    let groupH = maxY - minY;

    // 칸의 중심에서 뭉치의 중심만큼 뺀 오프셋 생성
    groupOffset = createVector(-(minX + groupW/2), -(minY + groupH/2));
    
    // 조작용 벡터 A의 시작 위치를 '정렬된 시작점'으로 초기화
    mS = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
    mE = p5.Vector.add(mS, vA);
}

function renderLeftPanel() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255, 100, 100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100, 100, 255), "B");
    } else {
        let originL = createVector(width/4 + groupOffset.x, height/2 + groupOffset.y);
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);

        drawArrow(originL, p5.Vector.add(originL, vA), color(255, 100, 100, isSnapped ? 255 : 150), "A");
        drawArrow(originL, p5.Vector.add(originL, vB), color(100, 100, 255, 150), "B");
        
        if (isSnapped) {
            let resColor = mode === 'ADD' ? color(200, 0, 255) : color(0, 200, 100);
            let resVec = mode === 'ADD' ? p5.Vector.add(vA, vB) : p5.Vector.sub(vA, vB);
            drawArrow(originL, p5.Vector.add(originL, resVec), resColor, "결과");
        }
    }
}

function renderRightPanel() {
    let originR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    let target = p5.Vector.add(originR, vB); // B의 종점

    // 고정된 B 표시
    drawArrow(originR, target, color(100, 100, 255), "B (고정)");

    if (!isSnapped) {
        // 안내 텍스트
        fill(255, 200, 0); noStroke(); textSize(16);
        text("A의 시작점(●)을 B의 끝점(○)으로 옮기세요!", width*0.75, height - 50);

        // 가이드 점 (B의 끝점)
        stroke(255, 255, 0); noFill();
        ellipse(target.x, target.y, 20, 20);
        
        // A의 시작점 표시
        fill(255, 100, 100); noStroke();
        ellipse(mS.x, mS.y, 12, 12);

        // 자석 효과 체크
        if (dist(mS.x, mS.y, target.x, target.y) < 25) {
            mS.set(target.x, target.y);
            mE = p5.Vector.add(mS, vA);
            isSnapped = true;
        }
    } else {
        // 합/차에 따른 추가 시각화
        if (mode === 'SUB') {
            let minusB_E = p5.Vector.add(mS, p5.Vector.sub(originR, target));
            drawArrow(mS, minusB_E, color(100, 100, 255), "-B");
        }
    }
    // 이동 중인 A 표시
    drawArrow(mS, mE, color(255, 100, 100), "A (이동)");
}

function drawNextButton() {
    let bx = width/4 - 60, by = height - 80;
    fill(0, 200, 100); rect(bx, by, 120, 45, 8);
    fill(255); textSize(16); text("다음 단계 ➔", width/4, height - 57);
}

// --- 공통 로직 ---
function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0 && eA && eB) {
        if (mouseX > width/4-60 && mouseX < width/4+60 && mouseY > height-80 && mouseY < height-35) {
            step = 1; return;
        }
    }
    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    } else if (step === 1 && !isSnapped) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 40) isDragging = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        let cx = constrain(mouseX, 10, width/2 - 10);
        if (sA && !sB) eA.set(cx, mouseY);
        else if (sB) eB.set(cx, mouseY);
    } else if (isDragging) {
        let dx = mouseX - pmouseX;
        let dy = mouseY - pmouseY;
        mS.add(dx, dy); mE.add(dx, dy);
    }
}

function mouseReleased() { isDragging = false; }
function resetAll() { sA=eA=sB=eB=mS=mE=groupOffset=null; step=0; isSnapped=false; }
function setMode(m) { resetAll(); mode = m; }

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,10,-4); line(0,0,10,4); pop();
    noStroke(); textSize(13);
    text(label + " ("+round(dist(v1.x,v1.y,v2.x,v2.y)/10)+")", (v1.x+v2.x)/2, (v1.y+v2.y)/2-15);
}
