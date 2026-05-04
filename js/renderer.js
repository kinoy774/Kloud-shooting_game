export function drawGrid(bgCtx, camX, camY, width, height, gameScale) {
    bgCtx.fillStyle = '#2d5a27'; 
    bgCtx.fillRect(0, 0, width, height); 
    bgCtx.strokeStyle = '#24471f'; 
    bgCtx.lineWidth = 4;
    const TILE = 150 * gameScale;
    const offsetX = -(camX * gameScale) % TILE;
    const offsetY = -(camY * gameScale) % TILE;
    
    bgCtx.beginPath();
    for(let x = offsetX; x < width; x += TILE) { bgCtx.moveTo(x, 0); bgCtx.lineTo(x, height); }
    for(let y = offsetY; y < height; y += TILE) { bgCtx.moveTo(0, y); bgCtx.lineTo(width, y); }
    bgCtx.stroke();
}

export function drawActualPlayer(cCtx, playerSprite, px, py, time = 0, isMoving = false, hitTimer = 0, lookX = 0, lookY = 0) {
    cCtx.save();
    cCtx.translate(Math.floor(px), Math.floor(py));

    if (hitTimer > 0 && Math.floor(time * 30) % 2 === 0) {
        cCtx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
    }

    // playerSprite 존재 여부 및 로드 상태 확인 (안전 장치)
    if (playerSprite && playerSprite.complete && playerSprite.width > 0) {
        const cols = 16;
        const rows = 8;
        const frameW = playerSprite.width / cols;
        const frameH = playerSprite.height / rows;

        let angle = Math.atan2(lookY, lookX);
        let octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
        const rowMap = [3, 7, 1, 6, 2, 4, 0, 5];
        let currentRow = rowMap[octant];

        let currentCol = 0;
        if (isMoving) {
            currentCol = Math.floor(time * 12) % cols; 
        }

        const sx = Math.floor(currentCol * frameW);
        const sy = Math.floor(currentRow * frameH);
        const drawSize = 64; 

        cCtx.drawImage(
            playerSprite,
            sx, sy, Math.floor(frameW), Math.floor(frameH),
            Math.floor(-drawSize / 2), 
            Math.floor(-drawSize / 2 - 10), 
            drawSize, 
            drawSize
        );
    } else {
        // 이미지 로딩 전 임시 원형 표시
        cCtx.fillStyle = '#fff';
        cCtx.beginPath(); 
        cCtx.arc(0, -15, 20, 0, Math.PI * 2); 
        cCtx.fill();
    }
    cCtx.restore();
}

export function drawFallbackAnimal(cCtx, type, s, time, state = 'normal') {
    // (기존 동물 그리기 로직 유지)
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
    // ... 나머지 동물 조건들 생략 ...
    else {
        cCtx.fillStyle = '#333'; cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
    }
}

export function drawActualMonster(cCtx, px, py, type, s, time = 0, hpRate = null, vx = 0, vy = 1, state = 'normal') {
    cCtx.save(); 
    cCtx.translate(px, py);
    let bounceY = 0;
    if (state !== 'charging') bounceY = Math.abs(Math.sin(time * 12 + px)) * -3; 
    let flipX = vx < 0 ? -1 : 1;
    
    cCtx.translate(0, bounceY); 
    cCtx.strokeStyle = '#000'; 
    cCtx.lineWidth = 4; 
    cCtx.scale(flipX, 1);

    if (type === 'boss_1') {
        cCtx.fillStyle = '#f39c12'; cCtx.beginPath(); cCtx.moveTo(-s/2, -s/3); cCtx.lineTo(-s/1.2, -s); cCtx.lineTo(0, -s/2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.moveTo(s/2, -s/3); cCtx.lineTo(s/1.2, -s); cCtx.lineTo(0, -s/2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#e67e22'; cCtx.beginPath(); cCtx.arc(0, 0, s/2, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.fillStyle = '#c0392b'; cCtx.beginPath(); cCtx.arc(-s/4, -s/6, s/8, 0, Math.PI*2); cCtx.fill(); cCtx.stroke(); cCtx.beginPath(); cCtx.arc(s/4, -s/6, s/8, 0, Math.PI*2); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.ellipse(-s/4, -s/6, s/20, s/10, 0, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.ellipse(s/4, -s/6, s/20, s/10, 0, 0, Math.PI*2); cCtx.fill();
    } else if (type === 'reaper') {
        cCtx.fillStyle = '#2c3e50'; cCtx.beginPath(); cCtx.arc(0, -s/4, s/2, Math.PI, 0); cCtx.lineTo(s/2, s/2); cCtx.lineTo(-s/2, s/2); cCtx.closePath(); cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000'; cCtx.beginPath(); cCtx.arc(0, -s/4, s/3, 0, Math.PI*2); cCtx.fill(); cCtx.fillStyle = '#e74c3c'; cCtx.beginPath(); cCtx.arc(-s/8, -s/4, s/15, 0, Math.PI*2); cCtx.fill(); cCtx.beginPath(); cCtx.arc(s/8, -s/4, s/15, 0, Math.PI*2); cCtx.fill();
    } else { 
        // 수정: state 매개변수까지 정확히 전달
        drawFallbackAnimal(cCtx, type, s, time, state); 
    }
    
    if (hpRate !== null) {
        cCtx.fillStyle = '#000'; cCtx.fillRect(-s/2 - 2, -s/2 - 16, s + 4, 10);
        cCtx.fillStyle = '#ff4757'; cCtx.fillRect(-s/2, -s/2 - 14, s * Math.max(0, hpRate), 6);
    }
    cCtx.restore();
}
