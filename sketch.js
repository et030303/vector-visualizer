let mode = 'NONE';
let step = 0; 
let sA, eA, sB, eB;
let mSPercent = 0; 
let isDragging = false, isReversed = false;
let offsetL, offsetR; 
let animProgress = 0;
let isPanning = false; 

function setup() {
    let canvas = createCanvas(1000, 600);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER);
    resetSimulation(); // 초기화 보장
}

function draw() {
    background(25);
    drawLayout();

    if (mode === 'NONE') {
        fill(150); textSize(20); text("상단 메뉴에서 연산을 선택하세요", width/2, height/2);
        return;
    }

    renderLeftPanel();
    if (step === 0 && sA && eA && sB && eB) drawNextButton();
    if (step >= 2) renderRightPanel();

    if (step === 4) {
        fill(150); noStroke(); textSize(12);
        text("마우스 드래그로 각 칸의 시점을 자유롭게 이동해보세요", width/2, height - 20);
    }
}

function drawLayout() {
    stroke(60); strokeWeight(1);
    line(width/2, 0, width/2, height);
    noStroke(); fill(100); textSize(13);
    text("PANEL 1: 최종 결과", width/4, 25);
    text("PANEL 2: 연산 과정", width*0.75, 25);
}

function calculateSeparateOffsets() {
    if (!sA || !eA || !sB || !eB) return;
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    
    let pointsL = [createVector(0,0), vA, vB];
    offsetL = getCenterOffset(pointsL);
    
    let pointsR = [createVector(0,0), vA, p5.Vector.add(vA, vB), p5.Vector.add(vA, p5.Vector.mult(vB, -1))];
    offsetR = getCenterOffset(pointsR);
    
    mSPercent = 0; 
}

function getCenterOffset(pts) {
    let minX = min(pts.map(p => p.x));
    let maxX = max(pts.map(p => p.x));
    let minY = min(pts.map(p => p.y));
    let maxY = max(pts.map(p => p.y));
    return createVector(-(minX + (maxX-minX)/2), -(minY + (maxY-minY)/2));
}

function renderLeftPanel() {
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255,100,100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100,100,255), "B");
    } else {
        if (!offsetL) calculateSeparateOffsets();
        if (animProgress < 1) animProgress += 0.04; 
        else if (step === 1) step = 2;
        
        let originL = createVector(width/4 + offsetL.x, height/2 + offsetL.y);
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);
        
        let curSA = p5.Vector.lerp(sA, originL, animProgress);
        let curSB = p5.Vector.lerp(sB, originL, animProgress);
        let finalEA = p5.Vector.add(originL, vA);
        let finalEB = p5.Vector.add(originL, vB);

        drawArrow(curSA, p5.Vector.add(curSA, vA), color(255,100,100, 150), "A");
        drawArrow(curSB, p5.Vector.add(curSB, vB), color(100,100,255, 150), "B");

        if (step === 4) {
            let resColor = (mode === 'ADD') ? color(200,0,255) : color(0,200,100);
            if (mode === 'ADD') {
                drawArrow(originL, p5.Vector.add(originL, p5.Vector.add(vA, vB)), resColor, "A+B");
            } else {
                drawArrow(finalEB, finalEA, resColor, "A-B");
            }
        }
    }
}

function renderRightPanel() {
    if (!offsetR) return;
    let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    let targetA = p5.Vector.add(originR, vA);
    
    drawArrow(originR, targetA, color(255,100,100), "A");

    // mS 실시간 위치 계산 (비비기 방지)
    let currentMS = p5.Vector.lerp(originR, targetA, mSPercent);

    if (step === 2 && mSPercent > 0.98) {
        mSPercent = 1;
        isDragging = false; 
        step = (mode === 'SUB') ? 3 : 4; 
    }

    let currentVB = isReversed ? p5.Vector.mult(vB, -1) : vB;
    let currentEB = p5.Vector.add(currentMS, currentVB);

    if (mode === 'ADD') {
        if (step === 2) drawGuide(targetA);
        drawArrow(currentMS, currentEB, color(100,100,255), "B");
        if (step === 4) drawArrow(originR, currentEB, color(200,0,255), "A+B");
    } else if (mode === 'SUB') {
        if (step === 2) drawGuide(targetA);
        drawArrow(currentMS, currentEB, color(100,100,255), isReversed ? "-B" : "B");
        if (step === 3) drawActionBtn("-B로 만들기");
        if (step === 4) drawArrow(originR, currentEB, color(0,200,100), "A+(-B)");
    }
    
    if (step === 2) { 
        fill(100,100,255); noStroke(); ellipse(currentMS.x, currentMS.y, 12, 12); 
    }
}

function drawGuide(t) {
    let blink = abs(sin(frameCount*0.15))*255;
    stroke(255,255,0,blink); noFill(); strokeWeight(2);
    ellipse(t.x, t.y, 25, 25);
    fill(255,255,0); noStroke(); text("B를 A의 종점으로!", width*0.75, height-40);
}

function drawActionBtn(txt) {
    let bx = width*0.75-70, by = height-60;
    fill(255,150,0); rect(bx, by, 140, 40, 8);
    fill(255); noStroke(); text(txt, width*0.75, height-40);
}

function mousePressed() {
    if (mode === 'NONE') return;
    
    // 버튼 클릭 판정
    if (step === 0 && sA && eA && sB && eB) {
        if (mouseX > width/4-60 && mouseX < width/4+60 && mouseY > height-70 && mouseY < height-30) {
            step = 1; animProgress = 0; return;
        }
    }
    if (step === 3 && mode === 'SUB') {
        let bx = width*0.75-70, by = height-60;
        if (mouseX > bx && mouseX < bx+140 && mouseY > by && mouseY < by+40) {
            isReversed = true; step = 4; return;
        }
    }
    
    // 그리기 및 조작 판정
    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    } else if (step === 2) {
        let originR = createVector(width*0.75 + (offsetR ? offsetR.x : 0), height/2 + (offsetR ? offsetR.y : 0));
        let vA = (sA && eA) ? p5.Vector.sub(eA, sA) : createVector(0,0);
        let currentMS = p5.Vector.lerp(originR, p5.Vector.add(originR, vA), mSPercent);
        if (dist(mouseX, mouseY, currentMS.x, currentMS.y) < 50) isDragging = true;
    } else if (step === 4) {
        isPanning = true; 
    }
}

function mouseDragged() {
    if (step === 0) {
        let cx = constrain(mouseX, 10, width/2-10);
        if (sA && !sB) eA.set(cx, mouseY);
        else if (sB) eB.set(cx, mouseY);
    } else if (isDragging && step === 2) {
        let originR = createVector(width*0.75 + offsetR.x, height/2 + offsetR.y);
        let vA = p5.Vector.sub(eA, sA);
        let dir = vA.copy().normalize();
        let relM = p5.Vector.sub(createVector(mouseX, mouseY), originR);
        let projection = relM.dot(dir);
        mSPercent = constrain(projection / vA.mag(), 0, 1);
    } else if (isPanning && step === 4) {
        let dx = mouseX - pmouseX;
        let dy = mouseY - pmouseY;
        if (mouseX < width/2) offsetL.add(createVector(dx, dy));
        else offsetR.add(createVector(dx, dy));
    }
}

function mouseReleased() { isDragging = false; isPanning = false; }

window.changeMode = function(m) { resetSimulation(); mode = m; }
window.resetSimulation = function() { 
    sA=null; eA=null; sB=null; eB=null; 
    mSPercent=0; offsetL=null; offsetR=null; step=0; 
    isReversed=false; animProgress=0; mode='NONE'; 
}

function drawArrow(v1, v2, c, label) {
    if (!v1 || !v2) return;
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,10,-4); line(0,0,10,4); pop();
    noStroke(); fill(c); text(label, (v1.x+v2.x)/2, (v1.y+v2.y)/2-15);
}
