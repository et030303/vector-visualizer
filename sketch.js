let mode = 'NONE';
let step = 0; 
let sA, eA, sB, eB;
let mS, mE; // 조작용 벡터 A
let isDragging = false;
let isSnapped = false;
let groupOffset; 

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

    if (step === 1 && !groupOffset) {
        calculateBalanceOffset();
    }

    renderLeftPanel();
    if (step === 0 && eA && eB) drawNextButton();
    if (step >= 1) renderRightPanel();
}

function drawLayout() {
    stroke(60); strokeWeight(1);
    line(width/2, 0, width/2, height);
    noStroke(); fill(100); textSize(13);
    text("PANEL 1: 최종 결과", width/4, 25);
    text("PANEL 2: 벡터 조작 (B 종점으로 이동)", width*0.75, 25);
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
    
    // 조작용 A의 시작 위치 초기화 (B의 시점과 일치시킨 상태에서 시작)
    mS = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
    mE = p5.Vector.add(mS, vA);
}

function renderLeftPanel() {
    let originL = createVector(width/4 + (groupOffset?.x || 0), height/2 + (groupOffset?.y || 0));
    
    if (step === 0) {
        if (sA && eA) drawArrow(sA, eA, color(255, 100, 100), "A");
        if (sB && eB) drawArrow(sB, eB, color(100, 100, 255), "B");
    } else {
        let vA = p5.Vector.sub(eA, sA);
        let vB = p5.Vector.sub(eB, sB);
        
        // 왼쪽 칸 가이드: 시점이 일치된 기본 벡터들
        drawArrow(originL, p5.Vector.add(originL, vB), color(100, 100, 255, 150), "B");
        drawArrow(originL, p5.Vector.add(originL, vA), color(255, 100, 100, 150), "A");
        
        // [수정] 완료 시 왼쪽 칸에도 결과 표시
        if (isSnapped) {
            let resVec = (mode === 'ADD') ? p5.Vector.add(vA, vB) : p5.Vector.sub(vA, vB);
            let resColor = (mode === 'ADD') ? color(200, 0, 255) : color(0, 200, 100);
            if (mode !== 'DOT') drawArrow(originL, p5.Vector.add(originL, resVec), resColor, "결과");
        }
    }
}

function renderRightPanel() {
    let originR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    let target = p5.Vector.add(originR, vB); 

    // B 벡터 (고정 레일)
    drawArrow(originR, target, color(100, 100, 255), "B");

    if (mode === 'ADD' || mode === 'SUB') {
        if (!isSnapped) {
            // 가이드 UI
            let blink = abs(sin(frameCount * 0.1)) * 255;
            stroke(255, 255, 0, blink); noFill();
            ellipse(target.x, target.y, 20, 20); 
            
            fill(255, 200, 0); noStroke();
            text("A의 시작점을 B의 끝으로 드래그하세요", width*0.75, height - 40);
        }

        // 자석 효과: 종점에 도달하면 스냅 및 고정
        if (!isSnapped && dist(mS.x, mS.y, target.x, target.y) < 20) {
            mS.set(target.x, target.y);
            isSnapped = true;
        }

        // 조작 중이거나 고정된 A 표시
        let currentAE = p5.Vector.add(mS, vA);
        drawArrow(mS, currentAE, color(255, 100, 100), isSnapped ? "A (고정)" : "A");
        fill(255, 100, 100); ellipse(mS.x, mS.y, 10, 10); 

        // [수정] 완료 시 오른쪽 칸에도 결과 표시
        if (isSnapped) {
            if (mode === 'ADD') {
                drawArrow(originR, currentAE, color(200, 0, 255), "A+B (합)");
            } else if (mode === 'SUB') {
                let minusB_E = p5.Vector.add(mS, p5.Vector.sub(originR, target));
                drawArrow(mS, minusB_E, color(100, 100, 255), "-B");
                drawArrow(originR, currentAE, color(0, 200, 100), "A-B (차)");
            }
        }
    } else if (mode === 'DOT') {
        drawArrow(originR, p5.Vector.add(originR, vA), color(255, 100, 100), "A");
        drawDotProcess(originR, p5.Vector.add(originR, vA), target);
        isSnapped = true;
    }
}

function mouseDragged() {
    if (step === 0) {
        let cx = constrain(mouseX, 10, width/2 - 10);
        if (sA && !sB) eA.set(cx, mouseY);
        else if (sB) eB.set(cx, mouseY);
    } else if (isDragging && !isSnapped) {
        // B 벡터 선상으로 이동 제한 (Projection)
        let originR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
        let targetR = p5.Vector.add(originR, p5.Vector.sub(eB, sB));
        
        let mouseVec = createVector(mouseX, mouseY);
        let dir = p5.Vector.sub(targetR, originR);
        let relMouse = p5.Vector.sub(mouseVec, originR);
        
        let dMag = dir.mag();
        dir.normalize();
        let sp = relMouse.dot(dir);
        sp = constrain(sp, 0, dMag); // B의 시작점과 끝점 사이로 제한
        
        mS = p5.Vector.add(originR, dir.mult(sp));
    }
}

function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0 && eA && eB) {
        let bx = width/4 - 60, by = height - 70;
        if (mouseX > bx && mouseX < bx+120 && mouseY > by && mouseY < by+40) {
            step = 1; return;
        }
    }
    if (step === 0 && mouseX < width/2) {
        if (!sA) { sA = createVector(mouseX, mouseY); eA = sA.copy(); }
        else if (!sB) { sB = createVector(mouseX, mouseY); eB = sB.copy(); }
    } else if (step === 1 && !isSnapped) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 50) isDragging = true;
    }
}

function mouseReleased() { isDragging = false; }

function drawNextButton() {
    let bx = width/4 - 60, by = height - 70;
    fill(40, 180, 100); rect(bx, by, 120, 40, 5);
    fill(255); textSize(14); text("다음 단계 ➔", width/4, height - 50);
}

window.changeMode = function(m) { 
    sA=eA=sB=eB=mS=mE=groupOffset=null; step=0; isSnapped=false; mode = m; 
}

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,10,-4); line(0,0,10,4); pop();
    noStroke(); text(label, (v1.x+v2.x)/2, (v1.y+v2.y)/2-15);
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
    fill(255, 165, 0); text("평행성분: " + round(projMag/10), pPoint.x, pPoint.y + 25);
}
