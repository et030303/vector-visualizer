let mode = 'NONE';
let step = 0; // 0:그리기, 1:이동, 2:조작(분해/계산), 3:결과완료
let sA, eA, sB, eB;
let offsetL, offsetR;
let animProgress = 0;
let isPanning = false, showComponent = false, showResult = false;

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

    if (mode === 'DOT') renderDotProduct();
    else {
        // 기존 합/차 렌더링 함수들 호출 (이전 코드 유지)
        renderLeftPanel();
        if (step === 0 && sA && eA && sB && eB) drawNextButton();
        if (step >= 2) renderRightPanel();
    }
}

function drawLayout() {
    stroke(60); line(width/2, 0, width/2, height);
    noStroke(); fill(100); textSize(13);
    if (mode === 'DOT') {
        text("PANEL 1: 시점 통일 및 B 수평 정렬", width/4, 25);
        text("PANEL 2: 벡터 분해 및 내적 계산", width*0.75, 25);
    } else {
        text("PANEL 1: 최종 결과", width/4, 25);
        text("PANEL 2: 연산 과정", width*0.75, 25);
    }
}

function renderDotProduct() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255,100,100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100,100,255), "B");
        if (sA && eA && sB && eB) drawNextButton();
        return;
    }

    if (!offsetL) calculateDotOffsets();
    if (animProgress < 1) animProgress += 0.03; else if (step === 1) step = 2;

    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    let angleB = vB.heading();

    // --- 왼쪽 패널: 시점 통일 + B 수평 회전 ---
    push();
    let originL = createVector(width/4 + offsetL.x, height/2 + offsetL.y);
    translate(originL.x, originL.y);
    rotate(lerp(0, -angleB, animProgress)); // B를 수평(0도)으로 회전
    
    drawArrow(createVector(0,0), vA, color(255,100,100, 150), "A");
    drawArrow(createVector(0,0), vB, color(100,100,255, 150), "B");
    pop();

    // --- 오른쪽 패널: 분해 및 계산 ---
    if (step >= 2) {
        let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
        let rotVA = vA.copy().rotate(-angleB);
        let rotVB = vB.copy().rotate(-angleB);
        
        push();
        translate(originR.x, originR.y);
        
        // 벡터 B (기준)
        drawArrow(createVector(0,0), rotVB, color(100,100,255), "B");
        
        if (showComponent) {
            let parX = rotVA.x;
            let parVec = createVector(parX, 0);
            let perVec = createVector(parX, rotVA.y);
            
            // 수직 성분 (회색)
            stroke(150, 100); line(parX, 0, parX, rotVA.y);
            drawArrow(parVec, perVec, color(100, 100), ""); 
            
            // 수평 성분 (정사영 - 강조)
            drawArrow(createVector(0,0), parVec, color(255, 255, 0), "A_proj");
            fill(255, 255, 0); noStroke();
            text(abs(parX/10).toFixed(1), parX/2, 20); // 길이 표시
            
            // 본래 벡터 A
            drawArrow(createVector(0,0), rotVA, color(255,100,100), "A");
        } else {
            drawArrow(createVector(0,0), rotVA, color(255,100,100), "A");
        }
        pop();

        // 버튼 및 결과창
        if (!showComponent) drawActionBtn("벡터 분해", width*0.75, height-100, () => { showComponent = true; });
        else if (!showResult) drawActionBtn("내적 계산", width*0.75, height-100, () => { showResult = true; });
        
        if (showResult) {
            let dotVal = (rotVA.x * rotVB.x) / 100; // 스케일 조정된 값
            fill(255); noStroke();
            rectMode(CENTER); fill(40, 200); rect(width*0.75, height-180, 350, 100, 10);
            fill(255); textSize(16);
            let bLen = (rotVB.x/10).toFixed(1);
            let aProj = (rotVA.x/10).toFixed(1);
            text(`내적 공식: |B| × (A의 B방향 성분)`, width*0.75, height-205);
            textSize(20); fill(0, 255, 255);
            text(`${bLen} × ${aProj} = ${dotVal.toFixed(1)}`, width*0.75, height-175);
        }
    }
}

function calculateDotOffsets() {
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    let rotVA = vA.copy().rotate(-vB.heading());
    
    offsetL = createVector(0,0); 
    offsetR = createVector(-rotVA.x/2, 0);
}

function drawActionBtn(txt, x, y, callback) {
    let bx = x-70, by = y-20;
    if (mouseX > bx && mouseX < bx+140 && mouseY > by && mouseY < by+40) {
        fill(255, 180, 0);
        if (mouseIsPressed) { callback(); mouseIsPressed = false; }
    } else {
        fill(255, 150, 0);
    }
    rectMode(CORNER); rect(bx, by, 140, 40, 8);
    fill(255); noStroke(); textSize(15); text(txt, x, y);
}

// 기존 mousePressed 등에 DOT 모드 조건 추가 필요...
function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0 && sA && eA && sB && eB) {
        if (mouseX > width/4-60 && mouseX < width/4+60 && mouseY > height-70 && mouseY < height-30) {
            step = 1; animProgress = 0; return;
        }
    }
    // 그리기 로직 (기존과 동일)
    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    }
}
// (이하 mouseDragged, resetSimulation 등은 기존 코드에 DOT 변수 초기화 추가)
