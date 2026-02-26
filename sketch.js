let sA, eA, sB, eB;
let isDraggingB = false;
let isSnapped = false;
let step = 0; 
let mode = 'add'; 

function setup() {
    createCanvas(windowWidth, windowHeight - 60); // 상단 버튼바 제외
    textSize(16);
}

function draw() {
    background(255);
    drawGrid(); // 배경 격자 (선택사항)

    if (step == 0) {
        fill(100);
        text("Step 1: 화면에 마우스를 드래그하여 두 개의 벡터(A, B)를 그리세요.", 20, 30);
    } else {
        fill(50);
        let msg = mode === 'add' ? "B의 시작점을 A의 '끝점'에 붙이세요." : "B의 시작점을 A의 '시작점'에 붙이세요.";
        text(`모드: ${mode.toUpperCase()} | ${msg}`, 20, 30);
    }

    // 1. 벡터 A (빨강)
    if (sA && eA) drawArrow(sA, eA, color(255, 50, 50), "A");

    // 2. 벡터 B (파랑) 및 연산 로직
    if (sB && eB) {
        if (step == 1 && !isDraggingB) {
            // 모드별 자석 위치 설정
            let target = (mode === 'add') ? eA : sA; 
            if (dist(sB.x, sB.y, target.x, target.y) < 30) {
                let dx = target.x - sB.x;
                let dy = target.y - sB.y;
                sB.add(dx, dy); eB.add(dx, dy);
                isSnapped = true;
            }
        }

        // 3. 연산 결과 시각화
        if (isSnapped) {
            renderResult();
        }
        
        drawArrow(sB, eB, color(50, 50, 255), "B");
        if (step == 1 && !isSnapped) {
            noFill(); stroke(0, 200, 0); 
            ellipse(sB.x, sB.y, 25, 25); // 드래그 가이드
        }
    }
}

function renderResult() {
    if (mode === 'add') {
        drawArrow(sA, eB, color(150, 0, 255), "A+B");
    } else if (mode === 'sub') {
        drawArrow(eB, eA, color(0, 150, 0), "A-B");
    } else if (mode === 'dot') {
        // 내적 시각화: 수선의 발(Projection)
        let vecA = p5.Vector.sub(eA, sA);
        let vecB = p5.Vector.sub(eB, sB);
        let aMagSq = vecA.magSq();
        if (aMagSq > 0) {
            let dot = vecA.dot(vecB);
            let proj = vecA.copy().mult(dot / aMagSq);
            let pPoint = p5.Vector.add(sA, proj);
            
            stroke(100, 100, 100, 150);
            drawingContext.setLineDash([5, 5]); // 점선
            line(eB.x, eB.y, pPoint.x, pPoint.y);
            drawingContext.setLineDash([]); 
            
            fill(255, 150, 0); noStroke();
            text(`내적 값: ${round(dot/100)}`, 20, height - 20); // 스케일 조정된 값
            ellipse(pPoint.x, pPoint.y, 8, 8);
        }
    }
}

// UI용 함수들
function setMode(m) { mode = m; isSnapped = false; }
function resetCanvas() { sA = eA = sB = eB = null; step = 0; isSnapped = false; }

// --- 인터랙션 로직 ---
function mousePressed() {
    if (step == 0) {
        if (!sA) sA = createVector(mouseX, mouseY);
        else if (!sB) sB = createVector(mouseX, mouseY);
    } else if (step == 1 && dist(mouseX, mouseY, sB.x, sB.y) < 40) {
        isDraggingB = true; isSnapped = false;
    }
}

function mouseDragged() {
    if (step == 0) {
        if (!eA || (sB && !eB)) {
            if (!sB) eA = createVector(mouseX, mouseY);
            else eB = createVector(mouseX, mouseY);
        }
    } else if (isDraggingB) {
        let dx = mouseX - sB.x; let dy = mouseY - sB.y;
        sB.add(dx, dy); eB.add(dx, dy);
    }
}

function mouseReleased() {
    if (step == 0 && eB) step = 1;
    isDraggingB = false;
}

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    push();
    translate(v2.x, v2.y);
    rotate(atan2(v1.y - v2.y, v1.x - v2.x));
    line(0, 0, 15, -8); line(0, 0, 15, 8);
    pop();
    noStroke(); text(label, (v1.x + v2.x)/2 + 10, (v1.y + v2.y)/2);
}

function drawGrid() {
    stroke(240); strokeWeight(1);
    for (let i = 0; i < width; i += 40) line(i, 0, i, height);
    for (let i = 0; i < height; i += 40) line(0, i, width, i);
}