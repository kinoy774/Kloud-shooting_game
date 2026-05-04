export function drawGrid(bgCtx, camX, camY, width, height, gameScale) {
    bgCtx.fillStyle = '#2d5a27'; bgCtx.fillRect(0, 0, width, height); bgCtx.strokeStyle = '#24471f'; bgCtx.lineWidth = 4;
    const TILE = 150 * gameScale, offsetX = -(camX * gameScale) % TILE, offsetY = -(camY * gameScale) % TILE;
    bgCtx.beginPath();
    for(let x = offsetX; x < width; x += TILE) { bgCtx.moveTo(x, 0); bgCtx.lineTo(x, height); }
    for(let y = offsetY; y < height; y += TILE) { bgCtx.moveTo(0, y); bgCtx.lineTo(width, y); }
    bgCtx.stroke();
}

export function drawActualPlayer(cCtx, playerSprite, px, py, time = 0, isMoving = false, hitTimer = 0, lookX = 0, lookY = 0) {
    cCtx.save();
    
    // 1. 캐릭터 위치를 정수로 고정 (픽셀 흔들림 방지)
    cCtx.translate(Math.floor(px), Math.floor(py));

    if (hitTimer > 0 && Math.floor(time * 30) % 2 === 0) {
        cCtx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
    }

    if (playerSprite.complete && playerSprite.width > 0) {
        // 💡 사용자 확인 결과: 16x8 규격 적용
        const cols = 16;
        const rows = 8;
        
        // 이미지 전체 크기를 열/행 수로 나누어 정확한 한 칸의 크기를 구함
        const frameW = playerSprite.width / cols;
        const frameH = playerSprite.height / rows;

        // 조이스틱 방향 계산 (8방향)
        let angle = Math.atan2(lookY, lookX);
        let octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
        
        // 8방향 시트 행 매핑 (이미지 순서에 따라 조정 가능)
        const rowMap = [3, 7, 1, 6, 2, 4, 0, 5];
        let currentRow = rowMap[octant];

        // 2. 애니메이션 프레임 결정 (무조건 정수로 계산)
        let currentCol = 0;
        if (isMoving) {
            // time에 따라 0부터 15까지 정수로 딱딱 끊겨서 변함
            currentCol = Math.floor(time * 12) % cols; 
        }

        // 3. 자를 위치(sx, sy) 계산 시 Math.floor를 사용하여 0.1픽셀의 오차도 허용하지 않음
        const sx = Math.floor(currentCol * frameW);
        const sy = Math.floor(currentRow * frameH);

        // 화면에 출력할 크기
        const drawSize = 64; 

        // 4. 드로우 이미지 호출 (모든 수치를 정수화하여 스크롤 현상 차단)
        cCtx.drawImage(
            playerSprite,
            sx, sy, Math.floor(frameW), Math.floor(frameH),
            Math.floor(-drawSize / 2), 
            Math.floor(-drawSize / 2 - 10), 
            drawSize, 
            drawSize
        );
    } else {
        cCtx.fillStyle = '#fff';
        cCtx.beginPath(); 
        cCtx.arc(0, -15, 20, 0, Math.PI * 2); 
        cCtx.fill();
    }

    cCtx.restore();
}
export function drawFallbackAnimal(cCtx, type, s, time, state = 'normal') {
    if(type === 'mouse') {
        cCtx.fillStyle = '#b2bec3'; cCtx.beginPath(); cCtx.arc(-s/2.5, -s/2.5, s/3, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(s/2.5, -s/2.5, s/3, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#fab1a0'; cCtx.beginPath(); cCtx.arc(-s/2.5, -s/2.5, s/5, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/2.5, -s/2.5, s/5, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#b2bec3'; cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.fillStyle = '#e17055'; cCtx.beginPath(); cCtx.arc(0, s/6, s/10, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(-s/5, -s/8, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/5, -s/8, s/12, 0, Math.PI*2); cCtx.fill();
    } 
    else if (type === 'rabbit') {
        cCtx.fillStyle = '#dfe6e9'; cCtx.beginPath(); cCtx.ellipse(-s/4, -s/1.5, s/6, s/2.5, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.ellipse(s/4, -s/1.5, s/6, s/2.5, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#ff7675'; cCtx.beginPath(); cCtx.ellipse(-s/4, -s/1.5, s/10, s/3, 0, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.ellipse(s/4, -s/1.5, s/10, s/3, 0, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#dfe6e9'; cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.fillStyle = '#fff'; cCtx.fillRect(-s/8, s/8, s/8, s/6); cCtx.strokeRect(-s/8, s/8, s/8, s/6); cCtx.fillRect(0, s/8, s/8, s/6); cCtx.strokeRect(0, s/8, s/8, s/6);
        cCtx.fillStyle = '#d63031'; cCtx.beginPath(); cCtx.arc(-s/5, -s/8, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/5, -s/8, s/12, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'snake') {
        cCtx.fillStyle = '#55efc4'; cCtx.beginPath(); cCtx.ellipse(0, s/6, s/1.8, s/3, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(0, -s/6, s/2.5, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.strokeStyle = '#ff7675'; cCtx.lineWidth = 3; cCtx.beginPath(); cCtx.moveTo(0, s/6); cCtx.lineTo(0, s/2.5); cCtx.lineTo(-s/8, s/2); cCtx.moveTo(0, s/2.5); cCtx.lineTo(s/8, s/2); cCtx.stroke();
        cCtx.strokeStyle = '#000'; cCtx.lineWidth = 4; cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.ellipse(-s/6, -s/5, s/16, s/10, 0, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.ellipse(s/6, -s/5, s/16, s/10, 0, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'cat') {
        cCtx.fillStyle = state === 'charging' ? '#ff4757' : '#e17055'; 
        if (state === 'charging') cCtx.scale(1, 0.85);
        cCtx.beginPath(); cCtx.moveTo(-s/2, -s/4); cCtx.lineTo(-s/4, -s/1.5); cCtx.lineTo(0, -s/2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.moveTo(s/2, -s/4); cCtx.lineTo(s/4, -s/1.5); cCtx.lineTo(0, -s/2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#ffeaa7'; cCtx.beginPath(); cCtx.ellipse(-s/5, -s/8, s/10, s/6, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.ellipse(s/5, -s/8, s/10, s/6, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.ellipse(-s/5, -s/8, s/20, s/8, 0, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.ellipse(s/5, -s/8, s/20, s/8, 0, 0, Math.PI*2); cCtx.fill();
        cCtx.beginPath(); cCtx.moveTo(-s/4, s/8); cCtx.lineTo(-s/1.5, s/12); cCtx.stroke(); cCtx.beginPath(); cCtx.moveTo(-s/4, s/5); cCtx.lineTo(-s/1.5, s/4); cCtx.stroke(); cCtx.beginPath(); cCtx.moveTo(s/4, s/8); cCtx.lineTo(s/1.5, s/12); cCtx.stroke(); cCtx.beginPath(); cCtx.moveTo(s/4, s/5); cCtx.lineTo(s/1.5, s/4); cCtx.stroke();
    }
    else if (type === 'dog') {
        cCtx.fillStyle = '#ccae62'; cCtx.beginPath(); cCtx.ellipse(-s/2.2, 0, s/6, s/2.5, Math.PI/6, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.ellipse(s/2.2, 0, s/6, s/2.5, -Math.PI/6, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#f5f6fa'; cCtx.beginPath(); cCtx.ellipse(0, s/6, s/2.5, s/4, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(0, s/10, s/10, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(-s/5, -s/6, s/14, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/5, -s/6, s/14, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'bear') {
        cCtx.fillStyle = '#6d4c41'; cCtx.beginPath(); cCtx.arc(-s/2.5, -s/2.5, s/4, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(s/2.5, -s/2.5, s/4, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#d7ccc8'; cCtx.beginPath(); cCtx.ellipse(0, s/6, s/3, s/4, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.ellipse(0, s/10, s/8, s/12, 0, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(-s/5, -s/8, s/14, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/5, -s/8, s/14, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'giraffe') {
        cCtx.fillStyle = '#f1c40f'; cCtx.beginPath(); cCtx.ellipse(0, -s/1.5, s/3, s, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(0, -s*1.5, s/2.5, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#8e44ad'; cCtx.beginPath(); cCtx.arc(0, -s*1.5 + s/8, s/6, 0, Math.PI*2); cCtx.fill(); cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(-s/6, -s*1.6, s/15, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/6, -s*1.6, s/15, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#e67e22'; cCtx.beginPath(); cCtx.arc(0, -s/1.5, s/5, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(-s/8, -s/2.5, s/6, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'koala') {
        cCtx.fillStyle = '#7f8fa6'; cCtx.beginPath(); cCtx.arc(-s/1.8, -s/2.5, s/2.5, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(s/1.8, -s/2.5, s/2.5, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#f5f6fa'; cCtx.beginPath(); cCtx.arc(-s/1.8, -s/2.5, s/4, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/1.8, -s/2.5, s/4, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#7f8fa6'; cCtx.beginPath(); cCtx.arc(0, 0, s/1.8, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.fillStyle = '#2f3640'; cCtx.beginPath(); cCtx.ellipse(0, 0, s/4, s/3, 0, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(-s/4, -s/5, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/4, -s/5, s/12, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'panda') {
        if (state === 'charging') cCtx.scale(1, 0.85);
        cCtx.fillStyle = '#fff'; cCtx.beginPath(); cCtx.arc(0, 0, s/1.5, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(-s/2, -s/2, s/4, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/2, -s/2, s/4, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.ellipse(-s/4, -s/8, s/5, s/4, -Math.PI/6, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.ellipse(s/4, -s/8, s/5, s/4, Math.PI/6, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#fff'; cCtx.beginPath(); cCtx.arc(-s/4, -s/8, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/4, -s/8, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(0, s/6, s/8, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'hippo') {
        cCtx.fillStyle = '#b8e994'; cCtx.beginPath(); cCtx.arc(-s/2.5, -s/1.5, s/6, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(s/2.5, -s/1.5, s/6, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(0, -s/4, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#ffb8b8'; cCtx.beginPath(); cCtx.ellipse(0, s/4, s/1.2, s/1.8, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(-s/4, s/8, s/10, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/4, s/8, s/10, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(-s/5, -s/3, s/15, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/5, -s/3, s/15, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'crocodile') {
        cCtx.fillStyle = '#009432'; cCtx.beginPath(); cCtx.ellipse(0, 0, s/2.5, s, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(-s/4, -s/1.5, s/5, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(s/4, -s/1.5, s/5, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#f1c40f'; cCtx.beginPath(); cCtx.arc(-s/4, -s/1.5, s/8, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/4, -s/1.5, s/8, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(-s/4, -s/1.5, s/15, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/4, -s/1.5, s/15, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(-s/6, s/2, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/6, s/2, s/12, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'lion') {
        cCtx.fillStyle = '#e67e22'; cCtx.beginPath(); cCtx.arc(0, 0, s/1.1, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.fillStyle = '#f39c12'; cCtx.beginPath(); cCtx.arc(0, 0, s/1.6, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#ecf0f1'; cCtx.beginPath(); cCtx.ellipse(0, s/6, s/3, s/4, 0, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(0, s/8, s/10, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(-s/5, -s/6, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/5, -s/6, s/12, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'tiger') {
        cCtx.fillStyle = '#e67e22'; cCtx.beginPath(); cCtx.arc(-s/2.5, -s/2.5, s/4, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(s/2.5, -s/2.5, s/4, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(0, 0, s/1.5, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#ecf0f1'; cCtx.beginPath(); cCtx.ellipse(0, s/4, s/2.5, s/4, 0, 0, Math.PI*2); cCtx.fill();
        cCtx.fillStyle = '#000'; cCtx.fillRect(-s/6, -s/1.5, s/3, s/6); cCtx.fillRect(-s/1.5, -s/8, s/4, s/8); cCtx.fillRect(s/2.5, -s/8, s/4, s/8);
        cCtx.beginPath(); cCtx.arc(0, s/6, s/10, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(-s/4, -s/6, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/4, -s/6, s/12, 0, Math.PI*2); cCtx.fill();
    }
    else if (type === 'elephant') {
        cCtx.fillStyle = '#718093'; cCtx.beginPath(); cCtx.ellipse(-s/1.5, -s/6, s/2, s/1.5, -Math.PI/8, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.ellipse(s/1.5, -s/6, s/2, s/1.5, Math.PI/8, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.beginPath(); cCtx.arc(0, -s/4, s/1.4, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.ellipse(0, s/2, s/4, s/1.2, 0, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(-s/3, -s/4, s/12, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/3, -s/4, s/12, 0, Math.PI*2); cCtx.fill();
    } else {
        cCtx.fillStyle = '#333'; cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
    }
}

export function drawActualMonster(cCtx, px, py, type, s, time = 0, hpRate = null, vx = 0, vy = 1, state = 'normal') {
    cCtx.save(); cCtx.translate(px, py);
    let bounceY = 0;
    if (state !== 'charging') bounceY = Math.abs(Math.sin(time * 12 + px)) * -3; 
    let flipX = vx < 0 ? -1 : 1;
    
    cCtx.translate(0, bounceY); cCtx.strokeStyle = '#000'; cCtx.lineWidth = 4; cCtx.scale(flipX, 1);
    if (type === 'boss_1') {
        cCtx.fillStyle = '#f39c12'; cCtx.beginPath(); cCtx.moveTo(-s/2, -s/3); cCtx.lineTo(-s/1.2, -s); cCtx.lineTo(0, -s/2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.moveTo(s/2, -s/3); cCtx.lineTo(s/1.2, -s); cCtx.lineTo(0, -s/2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#e67e22'; cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.fillStyle = '#c0392b'; cCtx.beginPath(); cCtx.arc(-s/4, -s/6, s/8, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(s/4, -s/6, s/8, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.ellipse(-s/4, -s/6, s/20, s/10, 0, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.ellipse(s/4, -s/6, s/20, s/10, 0, 0, Math.PI*2); cCtx.fill();
    } else if (type === 'reaper') {
        cCtx.fillStyle = '#2c3e50'; cCtx.beginPath(); cCtx.arc(0, -s/4, s/2, Math.PI, 0); cCtx.lineTo(s/2, s/2); cCtx.lineTo(-s/2, s/2); cCtx.closePath(); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(0, -s/4, s/3, 0, Math.PI*2); cCtx.fill(); cCtx.fillStyle = '#e74c3c'; cCtx.beginPath(); cCtx.arc(-s/8, -s/4, s/15, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/8, -s/4, s/15, 0, Math.PI*2); cCtx.fill();
    } else { 
        drawFallbackAnimal(cCtx, type, s, time, state); 
    }
    
    if (hpRate !== null) {
        cCtx.fillStyle = '#000'; cCtx.fillRect(-s/2 - 2, -s/2 - 16, s + 4, 10);
        cCtx.fillStyle = '#ff4757'; cCtx.fillRect(-s/2, -s/2 - 14, s * Math.max(0, hpRate), 6);
    }
    cCtx.restore();
}
