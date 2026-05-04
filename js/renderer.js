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
    
    // 1. 캐릭터 위치를 정수로 변환하여 흔들림 방지
    cCtx.translate(Math.floor(px), Math.floor(py));

    if (hitTimer > 0 && Math.floor(time * 30) % 2 === 0) {
        cCtx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
    }

    if (playerSprite.complete && playerSprite.width > 0) {
        const cols = 14;
        const rows = 8;
        
        // 중요: 프레임 크기를 무조건 정수로 계산합니다.
        const frameW = Math.floor(playerSprite.width / cols);
        const frameH = Math.floor(playerSprite.height / rows);

        // 방향 계산
        let angle = Math.atan2(lookY, lookX);
        let octant = Math.round(8 * angle / (2 * Math.PI) + 8) % 8;
        const rowMap = [3, 7, 1, 6, 2, 4, 0, 5];
        let currentRow = rowMap[octant];

        // 2. 애니메이션 프레임 인덱스를 정수로 강제 고정
        // time이 밀리초 단위라면 속도를 조절(예: 0.01)하여 너무 빠르지 않게 잡습니다.
        let currentCol = 0;
        if (isMoving) {
            // Math.floor를 통해 0, 1, 2... 처럼 정수 단위로만 점프하게 만듭니다.
            currentCol = Math.floor(time * 12) % cols; 
        }

        // 3. 소수점 오차를 완전히 제거하기 위해 모든 좌표에 Math.floor 적용
        // 이 부분이 "스크롤" 현상을 막는 핵심 인터페이스 로직입니다.
        const sx = Math.floor(currentCol * frameW);
        const sy = Math.floor(currentRow * frameH);

        // 화면에 그려질 크기 (정수로 고정)
        const drawSize = 64; 

        // 4. drawImage의 모든 인자를 정수로 전달하여 픽셀 밀림을 방지합니다.
        cCtx.drawImage(
            playerSprite,
            sx, sy, frameW, frameH,
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
