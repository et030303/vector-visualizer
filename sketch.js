let mode = 'NONE';
let step = 0; // 0: 그리기, 1: 합쳐지는 애니메이션, 2: 조작
let sA, eA, sB, eB;
let mS, mE; 
let isDragging = false, isSnapped = false;
let groupOffset;
let animProgress = 0; // 0에서 1까지 증가하며 애니메이션 제어

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

    renderLeftPanel();
    if (step === 0 && eA && eB) drawNextButton();
    if (step >= 2) renderRightPanel();
}

function renderLeftPanel() {
    // 뭉치 중심 계산 (애니메이션 목표 지점)
    if (step >= 1 && !groupOffset) calculateBalanceOffset();

    if (step === 0) {
        // 그리기 단계
        if (sA && eA) drawArrow(sA, eA, color(255, 100, 100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100, 100, 255), "B");
    } 
    else if (step >= 1) {
        // 애니메이션 진행 (0 -> 1)
        if (animProgress < 1) animProgress += 0.03; // 이동 속도 조절
        else if (step === 1) step = 2; // 이동 끝나면 조작 단계로

        let targetOrigin = createVector(width/4 + groupOffset.x, height/2 + groupOffset.y);
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);

        // lerp를 이용해 원래 시점(sA, sB)에서 targetOrigin으로 부드럽게 이동
        let currentSA = p5.Vector.lerp(sA, targetOrigin, animProgress);
        let currentEA = p5.Vector.add(currentSA, vA);
        let currentSB = p5.Vector.lerp(sB, targetOrigin, animProgress);
        let currentEB = p5.Vector.add(currentSB, vB);

        drawArrow(currentSA, currentEA, color(255, 100, 100, 150), "A");
        drawArrow(currentSB, currentEB, color(100, 100, 255, 150), "B");

        if (isSnapped) {
            let resVec = (mode === 'ADD') ? p5.Vector.add(vA, vB) : p5.Vector.sub(vA, vB);
            let resColor = (mode === 'ADD') ? color(200, 0, 255) : color(0, 200, 100);
            drawArrow(targetOrigin, p5.Vector.add(targetOrigin, resVec), resColor, "결과");
        }
    }
}

// 다음 단계 버튼 클릭 시 호출
function startAnimation() {
    step = 1;
    animProgress = 0;
}

// --- 마우스 및 버튼 로직 수정 ---
function mousePressed() {
    if (mode === 'NONE') return;
    
    // 다음 버튼 클릭 (애니메이션 시작)
    if (step === 0 && eA && eB) {
        let bx = width/4 - 60, by = height - 70;
        if (mouseX > bx && mouseX < bx+120 && mouseY > by && mouseY < by+40) {
            startAnimation();
            return;
        }
    }
    
    // 그리기 및 조작 로직 (기존과 동일)
    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    } else if (step === 2 && !isSnapped) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 50) isDragging = true;
    }
}

// (나머지 renderRightPanel, calculateBalanceOffset 등은 이전과 동일)
