import { UPG_INFO, WEAPONS_DATA, ACC_DATA, EVOLVE_DATA, SPAWN_TIMELINE, MONSTERS_DATA } from './data.js';
import { dist, getNearestEnemy } from './physics.js';
import { spawnEnemy, spawnBoss, spawnBox } from './entities.js';
import { drawGrid, drawActualPlayer, drawFallbackAnimal, drawActualMonster } from './renderer.js';

const playerSprite = new Image();
playerSprite.src = './character/주인공.png';

let runGold = 0;           
let runUpgrades = { atk: 0, def: 0, hp: 0, regen: 0, speed: 0, aspd: 0, exp: 0 };
let currentDifficulty = 'EASY';
let diffHpMult = 1.0, diffAtkMult = 1.0, diffSpeedBonus = 0, diffSpawnMult = 1.0;
 
function setDifficultyParams(diff) {
    currentDifficulty = diff;
    if(diff === 'EASY') { diffHpMult = 1.0; diffAtkMult = 1.0; diffSpeedBonus = 0; diffSpawnMult = 1.0; }
    if(diff === 'NORMAL') { diffHpMult = 1.2; diffAtkMult = 1.2; diffSpeedBonus = 0; diffSpawnMult = 1.1; }
    if(diff === 'HARD') { diffHpMult = 1.5; diffAtkMult = 1.5; diffSpeedBonus = 0.2; diffSpawnMult = 1.3; }
}

let canvas, ctx, bgCanvas, bgCtx, menuCanvas, menuCtx, HUD, JOYSTICK_AREA;
let width, height, isGameRunning = false, lastTime = 0;
let joystick = { active: false, x: 0, y: 0, startX: 0, startY: 0, lastX: 1, lastY: 0 };
let player, entities = [], projectiles = [], gems = [], boxes = [], items = [], fx = [];
let gameTime = 0, kills = 0, level = 1, exp = 0, nextLevelExp = 100, spawnTimer = 0, shake = 0, lastShakeTime = 0;
let gameOptions = { bgmOn: true, sfxOn: true };

// 화면 흔들림 발생 빈도 조절 함수
function triggerShake(intensity, duration) {
    if (gameTime - lastShakeTime < 1.0) return; // 약 1초마다 한 번만 흔들림 허용
    shake = intensity;
    lastShakeTime = gameTime;
}

function init() {
    canvas = document.getElementById('gameCanvas'); ctx = canvas.getContext('2d');
    bgCanvas = document.getElementById('bgCanvas'); bgCtx = bgCanvas.getContext('2d');
    menuCanvas = document.getElementById('menu-canvas'); menuCtx = menuCanvas.getContext('2d');
    HUD = document.getElementById('hud'); JOYSTICK_AREA = document.getElementById('joystick-area');
    resize(); window.addEventListener('resize', resize);
    
    let p = 0;
    const loaderInterval = setInterval(() => { 
        p += 5; document.querySelector('.loader-bar').style.width = p + '%'; 
        if(p >= 100) { clearInterval(loaderInterval); showOverlay('main-menu'); } 
    }, 20);
    setupInput();
}

function resize() { 
    const container = document.getElementById('game-container'); width = container.clientWidth; height = container.clientHeight; 
    if(canvas) { 
        canvas.width = width; canvas.height = height; bgCanvas.width = width; bgCanvas.height = height; menuCanvas.width = width; menuCanvas.height = height; 
        let gameScale = width / 700; 
        if(!isGameRunning && !document.getElementById('main-menu').classList.contains('hidden')) drawMainMenu();
    } 
}

function startNewGame(diff) {
    setDifficultyParams(diff);
    gameTime = 0; kills = 0; level = 1; exp = 0; nextLevelExp = 100;
    entities = []; projectiles = []; gems = []; boxes = []; items = []; fx = [];
    runGold = 0;
    player = {
        x: 0, y: 0, hp: 180, maxHp: 180, speed: 2.9, // 기존 2.7에서 0.2 상향
        weapons: [{id:'sword', level:1, timer:0}], accessories: [], evolvedWeapons: [],
        stats: { atk: 1.0, cooldown: 1.0, area: 1.0, expBonus: 1.0, def: 0.0, regen: 0.0, pickup: 1.0 },
        hitTimer: 0, lookX: 6, lookY: 0, isMoving: false
    };
}

function gameLoop(now) { 
    if (!isGameRunning) return; 
    const dt = Math.min((now - lastTime) / 1000, 0.1); 
    lastTime = now; update(dt); draw(); requestAnimationFrame(gameLoop); 
}

function update(dt) {
    gameTime += dt;
    player.x += joystick.x * player.speed; player.y += joystick.y * player.speed;
    if(player.hitTimer > 0) player.hitTimer -= dt;
    if(shake > 0) shake -= dt * 10;

    // 몬스터 업데이트 시 피격 체크 후 triggerShake 호출
    entities.forEach(e => {
        // ... (이동 로직)
        if(dist(player.x, player.y, e.x, e.y) < e.size/2 + 20 && player.hitTimer <= 0) {
            player.hp -= Math.max(1, e.dmg * (1 - player.stats.def));
            player.hitTimer = 0.25;
            triggerShake(15, 0.2); // 과도한 흔들림 방지 적용
        }
    });
}

function draw() {
    const camX = player.x - (width / 2), camY = player.y - (height / 2);
    drawGrid(bgCtx, camX, camY, width, height, 1.0); 
    ctx.save(); 
    if(shake > 0) ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2); 
    ctx.clearRect(0, 0, width, height);
    // ... (그리기 로직 호출 시 hitTimer 전달)
    drawActualPlayer(ctx, playerSprite, player.x-camX, player.y-camY, gameTime, player.isMoving, player.hitTimer, player.lookX, player.lookY);
    ctx.restore();
}

// 초기화 실행
init();

// 전역 함수 등록
window.startGame = (isContinue, diff) => { 
    if(!isContinue) startNewGame(diff); 
    isGameRunning = true; lastTime = performance.now(); requestAnimationFrame(gameLoop); 
    showOverlay(null); 
};
window.showOverlay = (id) => { 
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden')); 
    if(id) document.getElementById(id).classList.remove('hidden'); 
};
window.toggleInventory = () => { /* 인벤토리 토글 로직 */ };
