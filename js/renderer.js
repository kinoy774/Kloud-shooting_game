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

    // 강력한 피격 번쩍임 효과 (빨간색 필터 강화)
    if (hitTimer > 0) {
        if (Math.floor(time * 25) % 2 === 0) {
            cCtx.filter = 'brightness(1.2) sepia(1) hue-rotate(-50deg) saturate(30) contrast(1.2)';
        }
    }

    let walkCycle = isMoving ? time * 15 : 0;
    let bounceY = isMoving ? Math.abs(Math.sin(walkCycle)) * -4 : 0;
    let breathY = !isMoving ? Math.sin(time * 3) * 1.5 : 0;
    let swing = Math.sin(walkCycle);
    cCtx.translate(0, bounceY + breathY);

    let bodyX = lookX * 6;     
    let headX = lookX * 12;    
    let eyeX = headX + (lookX * 3);
    let eyeY = -45 + (lookY * 4);

    cCtx.lineWidth = 4;
    cCtx.strokeStyle = '#000';
    cCtx.fillStyle = '#fff';

    const drawLimb = (x, y, w, h, angle) => {
        cCtx.save();
        cCtx.translate(x, y);
        cCtx.rotate(angle * Math.PI / 180);
        cCtx.beginPath();
        cCtx.roundRect(-w / 2, 0, w, h, w / 2);
        cCtx.fill(); cCtx.stroke();
        cCtx.restore();
    };

    let side = 0;
    if (lookX > 0.1) side = 1;      
    else if (lookX < -0.1) side = -1; 
    let isLookingUp = lookY < -0.4;

    // 1. 먼 쪽 팔다리 (몸 뒤)
    if (isLookingUp) {
        drawLimb(-15 + bodyX, -8, 12, 16, swing * 20); 
        drawLimb(15 + bodyX, -8, 12, 16, -swing * 20); 
        drawLimb(-22 + bodyX, -28, 10, 20, swing * 25); 
        drawLimb(22 + bodyX, -28, 10, 20, -swing * 25); 
    } else {
        if (side === 1) { // 오른쪽 볼 때 오른쪽 부위가 뒤로
            drawLimb(15 + bodyX, -8, 12, 16, -swing * 20); 
            drawLimb(22 + bodyX, -28, 10, 20, -swing * 25); 
        } else if (side === -1) { // 왼쪽 볼 때 왼쪽 부위가 뒤로
            drawLimb(-15 + bodyX, -8, 12, 16, swing * 20); 
            drawLimb(-22 + bodyX, -28, 10, 20, swing * 25); 
        } else { 
            drawLimb(-15, -8, 12, 16, swing * 20);
            drawLimb(15, -8, 12, 16, -swing * 20);
        }
    }

    // 2. 몸체 (눈사람 형태)
    cCtx.beginPath(); cCtx.arc(bodyX, -22, 24, 0, Math.PI * 2); cCtx.fill(); cCtx.stroke();
    cCtx.beginPath(); cCtx.arc(headX, -48, 18, 0, Math.PI * 2); cCtx.fill(); cCtx.stroke();

    // 3. 눈동자
    if (!isLookingUp) {
        cCtx.fillStyle = '#000';
        let eyeSpacing = 8 - Math.abs(lookX) * 2; 
        cCtx.beginPath(); cCtx.ellipse(eyeX - eyeSpacing, eyeY, 3.5, 7.5, 0, 0, Math.PI * 2); cCtx.fill();
        cCtx.beginPath(); cCtx.ellipse(eyeX + eyeSpacing, eyeY, 3.5, 7.5, 0, 0, Math.PI * 2); cCtx.fill();
    }

    // 4. 가까운 쪽 팔다리 (몸 앞)
    if (!isLookingUp) {
        cCtx.fillStyle = '#fff';
        if (side === 1) { // 오른쪽 볼 때 왼쪽 팔다리가 앞
            drawLimb(-15 + bodyX, -8, 12, 16, swing * 20);
            drawLimb(-22 + bodyX, -28, 10, 20, swing * 25);
        } else if (side === -1) { // 왼쪽 볼 때 오른쪽 팔다리가 앞
            drawLimb(15 + bodyX, -8, 12, 16, -swing * 20);
            drawLimb(22 + bodyX, -28, 10, 20, -swing * 25);
        } else { 
            drawLimb(-22, -28, 10, 20, swing * 25);
            drawLimb(22, -28, 10, 20, -swing * 25);
        }
    }
    cCtx.restore();
}

export function drawActualMonster(cCtx, px, py, type, s, time = 0, hpRate = null, vx = 0, vy = 1, state = 'normal', hitTimer = 0) {
    cCtx.save(); 
    cCtx.translate(px, py);
    if (hitTimer > 0) {
        if (Math.floor(time * 25) % 2 === 0) {
            cCtx.filter = 'brightness(1.1) sepia(1) hue-rotate(-50deg) saturate(25) contrast(1.2)';
        }
    }
    let bounceY = (state !== 'charging') ? Math.abs(Math.sin(time * 12 + px)) * -3 : 0; 
    let flipX = vx < 0 ? -1 : 1;
    cCtx.translate(0, bounceY); 
    cCtx.strokeStyle = '#000'; cCtx.lineWidth = 4; cCtx.scale(flipX, 1);
    
    // ... 몬스터 그리기 하단 로직 동일 ...
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

export function drawFallbackAnimal(cCtx, type, s, time, state = 'normal') {
    // 기존 동물 그리기 로직 (동일)
}
