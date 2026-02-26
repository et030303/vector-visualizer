let mode = 'NONE';
let step = 0; 
let sA, eA, sB, eB;
let mS, mE; 
let isDragging = false;
let isSnapped = false;
let groupOffset; 

function setup() {
    let canvas = createCanvas(1000, 600);
    canvas.parent('canvas-container');
    textAlign(CENTER, CENTER);
}

function draw() {
    background(25);
    drawLayout();

    if (mode === 'NONE') {
        fill(120); textSize(20);
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
    text("PANEL 1: 결과 및 시점 통합", width/4, 25);
    text("PANEL 2: 조작 및 가이드", width*0.75, 25);
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
    
    // 조작용 초기 위치 (살짝 아래쪽 배치)
    mS = createVector(width*0.75 + groupOffset.x - 50, height/2 + groupOffset.y + 100);
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

        drawArrow(originL, p5.Vector.add(originL, vB), color(100, 100, 255, 150), "B");
        drawArrow(originL, p5.Vector.add(originL, vA), color(255, 100, 100, isSnapped || mode==='DOT' ? 255 : 100), "A");
        
        if (isSnapped) {
            let resVec = (mode === 'ADD') ? p5.Vector.add(vA, vB) : p5.Vector.sub(vA, vB);
            if (mode !== 'DOT') drawArrow(originL, p5.Vector.add(originL, resVec), color(200, 0, 255), "결과");
            else {
                fill(255, 165, 0); textSize(20);
                text("내적 완료", width/4, height - 50);
            }
        }
    }
}

function renderRightPanel() {
    let originR = createVector(width*0.75 + groupOffset.x, height/2 + groupOffset.y);
    let vA = p5.Vector.sub(eA, sA);
    let vB = p5.Vector.sub(eB, sB);
    let target = p5.Vector.add(originR, vB); 

    drawArrow(originR, target, color(100, 100, 255), "B (고정)");

    if (mode === 'ADD' || mode === 'SUB') {
        if (!isSnapped) {
            fill(255, 200, 0); noStroke(); text("A를 B의 끝점으로 옮기세요", width*0.75, height - 40);
            let blink = abs(sin(frameCount * 0.1)) * 255;
            fill(255, 255, 0, blink); ellipse(target.x, target.y, 15, 15); // 목표점
            fill(255, 100, 100); ellipse(mS.x, mS.y, 10, 10); // A의 시점

            if (dist(mS.x, mS.y, target.x, target.y) < 25) {
                mS.set(target.x, target.y); mE = p5.Vector.add(mS, vA); isSnapped = true;
            }
        } else if (mode === 'SUB') {
            let minusB_E = p5.Vector.add(mS, p5.Vector.sub(originR, target));
            drawArrow(mS, minusB_E, color(100, 100, 255, 200), "-B");
        }
        drawArrow(mS, mE, color(255, 100, 100), "A");
    } else if (mode === 'DOT') {
        drawArrow(originR, p5.Vector.add(originR, vA), color(255, 100, 100), "A");
        drawDotProcess(originR, p5.Vector.add(originR, vA), target);
        isSnapped = true;
    }
}

function drawNextButton() {
    let bx = width/4 - 60, by = height - 70;
    fill(40, 180, 100); rect(bx, by, 120, 40, 5);
    fill(255); textSize(15); text("다음 단계 ➔", width/4, height - 50);
}

function mousePressed() {
    if (mode === 'NONE') return;
    if (step === 0 && eA && eB) {
        if (mouseX > width/4-60 && mouseX < width/4+60 && mouseY > height-70 && mouseY < height-30) {
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
        mS.add(mouseX - pmouseX, mouseY - pmouseY);
        mE.add(mouseX - pmouseX, mouseY - pmouseY);
    }
}

function mouseReleased() { isDragging = false; }

window.changeMode = function(m) {
    sA=eA=sB=eB=mS=mE=groupOffset=null; step=0; isSnapped=false; mode = m;
}

function resetAll() { window.changeMode('NONE'); }

function drawArrow(v1, v2, c, label) {
    stroke(c); fill(c); strokeWeight(3);
    line(v1.x, v1.y, v2.x, v2.y);
    let angle = atan2(v1.y-v2.y, v1.x-v2.x);
    push(); translate(v2.x, v2.y); rotate(angle);
    line(0,0,10,-4); line(0,0,10,4); pop();
    noStroke(); textSize(12);
    text(label + " ("+round(dist(v1.x,v1.y,v2.x,v2.y)/10)+")", (v1.x+v2.x)/2, (v1.y+v2.y)/2-15);
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
