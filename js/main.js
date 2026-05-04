import { UPG_INFO, WEAPONS_DATA, ACC_DATA, EVOLVE_DATA, SPAWN_TIMELINE, MONSTERS_DATA } from './data.js';
import { dist, getNearestEnemy } from './physics.js';
import { spawnEnemy, spawnBoss, spawnBox } from './entities.js';
import { drawGrid, drawActualPlayer, drawFallbackAnimal, drawActualMonster } from './renderer.js';

// 주인공 캐릭터 이미지 로드
const playerSprite = new Image();
playerSprite.src = './character/주인공.png';

// 인게임 빌드업 상점 및 난이도 변수
let runGold = 0;           
let runUpgrades = { atk: 0, def: 0, hp: 0, regen: 0, speed: 0, aspd: 0, exp: 0 };

@@ -359,199 +360,7 @@ function drawMainMenu() {
    drawActualMonster(menuCtx, cx + 130, cy + 10, 'cat', 45, 0, null, -1, 0, 'normal');
    drawActualMonster(menuCtx, cx - 80, cy + 90, 'snake', 40, 0, null, 1, 0, 'normal');
    drawActualMonster(menuCtx, cx + 110, cy + 80, 'rabbit', 35, 0, null, -1, 0, 'normal');
    drawActualPlayer(menuCtx, cx, cy, 0, false, 0, 0, 1);
}

function drawActualPlayer(cCtx, px, py, time = 0, isMoving = false, hitTimer = 0, lookX = 0, lookY = 0) {
    cCtx.save();
    cCtx.translate(px, py);

    let isLeft = lookX < 0;
    cCtx.scale(isLeft ? -1 : 1, 1);

    if (hitTimer > 0 && Math.floor(time * 30) % 2 === 0) {
        cCtx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)';
    }

    let walkPhase = isMoving ? time * 18 : 0;
    let legSwing = Math.sin(walkPhase) * 30;
    let armSwing = Math.sin(walkPhase) * 40;
    let bounceY = isMoving ? Math.abs(Math.sin(walkPhase)) * -4 : 0;
    let breathY = !isMoving ? Math.sin(time * 5) * 1.5 : 0;
    let headTilt = isMoving ? Math.sin(walkPhase) * 5 : Math.sin(time * 3) * 2;

    if (playerSprite.complete && playerSprite.width > 0) {
        let qW = playerSprite.width / 2;
        let qH = playerSprite.height / 2;
        
        let baseSize = 40;

        cCtx.translate(0, bounceY + breathY);

        cCtx.save();
        cCtx.translate(6, -25);
        cCtx.rotate(-armSwing * Math.PI / 180);
        cCtx.drawImage(playerSprite, qW + qW/2, 0, qW/2, qH, -baseSize/4, 0, baseSize/2, baseSize * 0.9);
        cCtx.restore();

        cCtx.save();
        cCtx.translate(4, -12);
        cCtx.rotate(-legSwing * Math.PI / 180);
        cCtx.drawImage(playerSprite, qW/2, qH, qW/2, qH, -baseSize/4, 0, baseSize/2, baseSize * 0.8);
        cCtx.restore();

        cCtx.save();
        cCtx.translate(0, -25);
        cCtx.drawImage(playerSprite, qW, qH, qW, qH, -baseSize/2, -baseSize/2, baseSize, baseSize);
        cCtx.restore();

        cCtx.save();
        cCtx.translate(-4, -12);
        cCtx.rotate(legSwing * Math.PI / 180);
        cCtx.drawImage(playerSprite, 0, qH, qW/2, qH, -baseSize/4, 0, baseSize/2, baseSize * 0.8);
        cCtx.restore();

        cCtx.save();
        cCtx.translate(-6, -25);
        cCtx.rotate(armSwing * Math.PI / 180);
        cCtx.drawImage(playerSprite, qW, 0, qW/2, qH, -baseSize/4, 0, baseSize/2, baseSize * 0.9);
        cCtx.restore();

        cCtx.save();
        cCtx.translate(0, -35);
        cCtx.rotate(headTilt * Math.PI / 180);
        cCtx.drawImage(playerSprite, 0, 0, qW, qH, -baseSize * 0.65, -baseSize * 1.1, baseSize * 1.3, baseSize * 1.3);
        cCtx.restore();

    } else {
        let wobble = isMoving ? Math.sin(time * 15) * 0.15 : 0; 
        let skewX = isMoving ? Math.cos(time * 15) * 0.1 : 0; 
        cCtx.translate(0, bounceY);
        cCtx.transform(1, 0, skewX, 1, 0, 0); 
        cCtx.rotate(wobble);

        cCtx.fillStyle = '#fff';
        cCtx.strokeStyle = '#000';
        cCtx.lineWidth = 5;
        cCtx.beginPath();
        cCtx.roundRect(-14, -8, 28, 28, 10);
        cCtx.fill(); cCtx.stroke();
        cCtx.beginPath();
        cCtx.arc(0, -28, 24, 0, Math.PI * 2);
        cCtx.fill(); cCtx.stroke();
        cCtx.fillStyle = '#000';
        cCtx.beginPath(); cCtx.arc(8, -30, 3, 0, Math.PI*2); cCtx.fill();
    }

    cCtx.restore();
}

function drawFallbackAnimal(cCtx, type, s, time, state = 'normal') {
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

function drawActualMonster(cCtx, px, py, type, s, time = 0, hpRate = null, vx = 0, vy = 1, state = 'normal') {
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
    drawActualPlayer(menuCtx, playerSprite, cx, cy, 0, false, 0, 0, 1);
}

function startGame(isContinue = false, diff = 'EASY') {
@@ -625,69 +434,35 @@ function showWarning(text, sub) {
    banner.classList.add('show'); setTimeout(() => banner.classList.remove('show'), 3500);
}

function spawnEnemyWrapper(isWave = false) {
    const counts = spawnEnemy(entities, player, gameTime, gameScale, width, height, diffHpMult, diffAtkMult, diffSpeedBonus, diffSpawnMult, dogSpawnCount, koalaSpawnCount, isTimeStopped, isWave);
    dogSpawnCount = counts.dogCount;
    koalaSpawnCount = counts.koalaCount;
}

function spawnBossWrapper() {
    spawnBoss(entities, player, gameTime, gameScale, width, height, diffHpMult, diffAtkMult, diffSpeedBonus);
}

function spawnBoxWrapper() {
    spawnBox(boxes, player, width, height);
}

function checkEvents() {
    const currentMin = Math.floor(gameTime / 60);
    if (currentMin > 0 && currentMin % 3 === 0 && currentMin < 20 && lastWaveMin !== currentMin) {
        lastWaveMin = currentMin; showWarning("대규모 웨이브!", "적들이 사방에서 몰려옵니다!"); 
        for(let i=0; i<45 * diffSpawnMult; i++) spawnEnemy(true);
        for(let i=0; i<45 * diffSpawnMult; i++) spawnEnemyWrapper(true);
    }
    if (currentMin > 0 && currentMin % 5 === 0 && currentMin < 20 && lastBossMin !== currentMin) {
        lastBossMin = currentMin; showWarning("보스 출현!", "거대한 적이 접근합니다!"); spawnBoss();
        lastBossMin = currentMin; showWarning("보스 출현!", "거대한 적이 접근합니다!"); spawnBossWrapper();
    }
    if (currentMin >= 20 && !eventFlags.reaperSpawned) {
        eventFlags.reaperSpawned = true; showWarning("사신 강림", "생존 시간 종료. 운명을 맞이하세요.");
        entities.push({ id: 'reaper', hp: 9999999, speed: 5.0, dmg: 9999, size: 90, name: '사신', color: '#111', x: player.x + Math.max(width, height), y: player.y, maxHp: 9999999, kbX: 0, kbY: 0, isBoss: true, type: 'enemy', vx: 0, vy: 0, kbResist: 0, state: 'normal' });
    }
}

function spawnEnemy(isWave = false) {
    if (isTimeStopped && !isWave) return;
    const index = Math.min(SPAWN_TIMELINE.length - 1, Math.floor(gameTime / 80)); 
    let spawnId = SPAWN_TIMELINE[index];
    
    if (spawnId === 'dog') {
        dogSpawnCount++;
        if (dogSpawnCount >= 10) { spawnId = 'cat'; dogSpawnCount = 0; }
    } else if (spawnId === 'koala') {
        koalaSpawnCount++;
        if (koalaSpawnCount >= 10) { spawnId = 'panda'; koalaSpawnCount = 0; }
    }
    
    const type = MONSTERS_DATA.find(m => m.id === spawnId) || MONSTERS_DATA[0];
    const ang = Math.random() * Math.PI * 2, d = Math.max(width, height) / gameScale * 0.8, tb = 1 + (gameTime / 60) * 0.5;
    
    entities.push({ 
        ...type, x: player.x + Math.cos(ang) * d, y: player.y + Math.sin(ang) * d, 
        maxHp: type.hp * tb * diffHpMult, hp: type.hp * tb * diffHpMult, 
        dmg: type.dmg * diffAtkMult, speed: type.speed + diffSpeedBonus,
        kbX: 0, kbY: 0, isBoss: false, type: 'enemy', vx: 0, vy: 0, kbResist: type.kbResist || 0,
        state: 'normal', chargeTimer: 0, dashTimer: 0, dashVx: 0, dashVy: 0, cooldown: 0
    });
}

function spawnBoss() {
    const ang = Math.random() * Math.PI * 2, d = Math.max(width, height) / gameScale * 0.7;
    const index = Math.min(SPAWN_TIMELINE.length - 1, Math.floor(gameTime / 80)); 
    const type = MONSTERS_DATA.find(m => m.id === SPAWN_TIMELINE[index]) || MONSTERS_DATA[0];
    const tb = 1 + (gameTime / 60) * 0.5;
    const normalHp = type.hp * tb * diffHpMult;
    const bossHp = normalHp * 20;

    entities.push({ id: 'boss_1', hp: bossHp, speed: 3.0 + diffSpeedBonus, dmg: 60 * diffAtkMult, size: 130, name: '심연 가디언', color: '#ffb142', x: player.x + Math.cos(ang) * d, y: player.y + Math.sin(ang) * d, maxHp: bossHp, kbX: 0, kbY: 0, isBoss: true, type: 'enemy', vx: 0, vy: 0, kbResist: 0.7, state: 'normal' });
}

function spawnBox() { const a = Math.random() * Math.PI * 2, d = Math.max(width, height) * 0.6; boxes.push({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, hp: 3, hitDelay: 0, size: 55, icon: '📦' }); }

function getNearestEnemy() {
    let nearest = null, minDist = Infinity;
    for (let i = 0; i < entities.length; i++) {
        if(entities[i].type !== 'enemy') continue;
        let d = dist(player.x, player.y, entities[i].x, entities[i].y);
        if (d < minDist) { minDist = d; nearest = entities[i]; }
    }
    return nearest;
}

function checkHitRadius(x, y, r, dmg, kbMult, slowEffect, isContinuous = false) {
    for(let e of entities) {
        if(e.type==='enemy' && dist(x,y,e.x,e.y) < r + e.size) {
@@ -793,7 +568,7 @@ function attack(w, isEvolved = false) {
            let counts = [1, 1, 2, 2, 3][w.level-1], isSplash = w.level >= 4;
            let hSpeed = (20 + w.level*2) * 60; 
            for(let i=0; i<counts; i++) { 
                const target = getNearestEnemy(), off = (i - (counts-1)/2) * 0.5; 
                const target = getNearestEnemy(player, entities), off = (i - (counts-1)/2) * 0.5; 
                projectiles.push({ x: player.x, y: player.y, vx: Math.cos(angle+off), vy: Math.sin(angle+off), speed: hSpeed, dmg, life: (range * 1.5) / hSpeed, type: 'homing', color: d.color, pierce: 0, target: target, isSplash: isSplash, kbMult, slowEffect }); 
            }
        }
@@ -904,8 +679,8 @@ function update(dt) {
        }
    }

    spawnTimer -= dt; if(spawnTimer <= 0) { spawnEnemy(); spawnTimer = Math.max(0.1, 1.0 - (gameTime / 60) * 0.08) / diffSpawnMult; }
    boxSpawnTimer += dt; if(boxSpawnTimer >= 45) { spawnBox(); boxSpawnTimer = 0; }
    spawnTimer -= dt; if(spawnTimer <= 0) { spawnEnemyWrapper(); spawnTimer = Math.max(0.1, 1.0 - (gameTime / 60) * 0.08) / diffSpawnMult; }
    boxSpawnTimer += dt; if(boxSpawnTimer >= 45) { spawnBoxWrapper(); boxSpawnTimer = 0; }

    player.weapons.forEach(w => { 
        w.timer += dt; const d = WEAPONS_DATA.find(wd=>wd.id===w.id);
@@ -1123,18 +898,9 @@ function update(dt) {
    updateHUD();
}

function drawGrid(camX, camY) {
    bgCtx.fillStyle = '#2d5a27'; bgCtx.fillRect(0, 0, width, height); bgCtx.strokeStyle = '#24471f'; bgCtx.lineWidth = 4;
    const TILE = 150 * gameScale, offsetX = -(camX * gameScale) % TILE, offsetY = -(camY * gameScale) % TILE;
    bgCtx.beginPath();
    for(let x = offsetX; x < width; x += TILE) { bgCtx.moveTo(x, 0); bgCtx.lineTo(x, height); }
    for(let y = offsetY; y < height; y += TILE) { bgCtx.moveTo(0, y); bgCtx.lineTo(width, y); }
    bgCtx.stroke();
}

function draw() {
    const camX = player.x - (width / 2) / gameScale, camY = player.y - (height / 2) / gameScale;
    drawGrid(camX, camY); 
    drawGrid(bgCtx, camX, camY, width, height, gameScale); 

    ctx.save(); 
    if(shake > 0) ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2); 
@@ -1161,7 +927,7 @@ function draw() {
        if (r.type === 'box') { ctx.fillStyle = '#d35400'; ctx.strokeStyle='#000'; ctx.lineWidth=5; ctx.fillRect(r.x-camX-25, r.y-camY-25, 50, 50); ctx.strokeRect(r.x-camX-25, r.y-camY-25, 50, 50); ctx.font = '40px sans-serif'; ctx.textAlign='center'; ctx.fillText('📦', r.x-camX, r.y-camY+15); } 
        else if (r.type === 'item') { ctx.fillStyle = '#fff'; ctx.strokeStyle='#000'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(r.x-camX, r.y-camY, 25, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.font = '30px sans-serif'; ctx.textAlign='center'; ctx.fillText(r.itemType === 'heal' ? '🍎' : (r.itemType === 'magnet' ? '🧲' : '⏱️'), r.x-camX, r.y-camY+10); } 
        else if (r.type === 'enemy') { drawActualMonster(ctx, r.x-camX, r.y-camY, r.id, r.size, gameTime, r.hp / r.maxHp, r.vx || 0, r.vy || 1, r.state || 'normal'); } 
        else if (r.isPlayer) { drawActualPlayer(ctx, r.x-camX, r.y-camY, gameTime, r.isMoving, r.hitTimer, r.lookX, r.lookY); }
        else if (r.isPlayer) { drawActualPlayer(ctx, playerSprite, r.x-camX, r.y-camY, gameTime, r.isMoving, r.hitTimer, r.lookX, r.lookY); }
    });

    projectiles.forEach(p => { 
@@ -1367,7 +1133,6 @@ function gainExp(a) {
        showLevelUp(); 
    } 
}
function dist(x1, y1, x2, y2) { return Math.sqrt((x2-x1)**2 + (y2-y1)**2); }

function updateHUD() { 
    const m = Math.floor(gameTime/60), s = Math.floor(gameTime%60); 
