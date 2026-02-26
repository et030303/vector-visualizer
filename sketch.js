// 마우스를 눌렀을 때: 시작점 고정
function mousePressed() {
    if (mode === 'NONE') return;

    if (step === 0) {
        // 첫 번째 벡터 A가 없다면 A의 시작점 설정
        if (!sA) {
            sA = createVector(mouseX, mouseY);
            eA = createVector(mouseX, mouseY); // 시작과 동시에 끝점도 일단 같은 곳으로
        } 
        // A는 있는데 B가 없다면 B의 시작점 설정 (단, 오른쪽 칸에서 그리도록 유도 가능)
        else if (eA && !sB) {
            sB = createVector(mouseX, mouseY);
            eB = createVector(mouseX, mouseY);
        }
    } 
    // 조작 단계(step 1)에서 벡터 이동
    else if (step === 1 && mS) {
        if (dist(mouseX, mouseY, mS.x, mS.y) < 40) {
            isDragging = true;
        }
    }
}

// 마우스를 누른 채 움직일 때: 끝점을 실시간 업데이트
function mouseDragged() {
    if (mode === 'NONE') return;

    if (step === 0) {
        // A를 그리는 중 (sA는 있고 아직 sB는 없을 때)
        if (sA && !sB) {
            eA.set(mouseX, mouseY);
        } 
        // B를 그리는 중
        else if (sB) {
            eB.set(mouseX, mouseY);
        }
    } 
    // 벡터 이동 중
    else if (isDragging) {
        let dx = mouseX - pmouseX; // 이전 프레임 마우스 위치와의 차이
        let dy = mouseY - pmouseY;
        mS.add(dx, dy);
        mE.add(dx, dy);
    }
}

// 마우스를 뗐을 때: 드래그 종료 및 다음 단계 버튼 활성화
function mouseReleased() {
    isDragging = false;
    
    // 두 벡터가 모두 그려졌다면 '다음' 버튼 보여주기
    if (step === 0 && eA && eB) {
        // 너무 짧게 그려진 경우 방지 (최소 길이 5 이상)
        if (dist(sA.x, sA.y, eA.x, eA.y) > 5 && dist(sB.x, sB.y, eB.x, eB.y) > 5) {
            document.getElementById('next-btn').style.display = 'block';
        }
    }
}
