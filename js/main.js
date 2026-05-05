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

function getUpgradeCost(key, level) {
    const info = UPG_INFO[key];
    let mult = (key === 'atk' || key === 'def' || key === 'hp') ? 1.2 : 1.4;
    let cost = 15 * Math.pow(mult, level);
    return Math.floor(cost * info.mult);
}

let db = null;
let userId = null;
let appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let cloudSaveData = null;
let fsSetDoc = null;
let fsDeleteDoc = null;
let fsDoc = null;

async function initFirebase() {
    try {
        const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
        if (!firebaseConfigStr) return;
        
        const firebaseConfig = JSON.parse(firebaseConfigStr);
        
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
        const { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
        const { getFirestore, doc, setDoc, getDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        db = getFirestore(app);
        fsSetDoc = setDoc;
        fsDeleteDoc = deleteDoc;
        fsDoc = doc;
        
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                const docRef = doc(db, 'artifacts', appId, 'users', userId, 'saves', 'infiniteShooterSave');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data && data.player && data.player.hp > 0) {
                        cloudSaveData = data;
                        const continueBtn = document.getElementById('continue-btn');
                        if (continueBtn && !isGameRunning) continueBtn.style.display = 'block';
                    }
                }
            }
        });
    } catch (e) {
        console.error("Firebase init failed", e);
    }
}
initFirebase();

let canvas, ctx, bgCanvas, bgCtx, menuCanvas, menuCtx, HUD, JOYSTICK_AREA;
let width, height, isGameRunning = false, lastTime = 0;
let joystick = { active: false, x: 0, y: 0, startX: 0, startY: 0, lastX: 1, lastY: 0 };
let player, entities = [], projectiles = [], gems = [], boxes = [], items = [], fx = [];
let gameTime = 0, kills = 0, level = 1, exp = 0, nextLevelExp = 100, spawnTimer = 0, shake = 0, boxSpawnTimer = 0, bossRewardTimer = 0;
let currentChoices = [], selectedIdx = -1;
let isTimeStopped = false, timeStopTimer = 0;
let gameOptions = { bgmOn: true, sfxOn: true };
let invVisible = true;
 
let gameScale = 1.0;
let eventFlags = { gameCleared: false, reaperSpawned: false };
 
let lastWaveMin = 0, lastBossMin = 0, autoSaveTimer = 0;
let dogSpawnCount = 0;
let koalaSpawnCount = 0;
 
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null, bgmInterval = null;
 
function initAudio() { if(!audioCtx) audioCtx = new AudioContext(); if(audioCtx.state === 'suspended') audioCtx.resume(); }
function playTone(freq, type, dur, vol, slideFreq=null) {
    if(!gameOptions.sfxOn || !audioCtx) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if(slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, audioCtx.currentTime + dur);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + dur);
}
function sfxShoot() { playTone(600, 'square', 0.1, 0.02, 300); }
function sfxHit() { playTone(150, 'sawtooth', 0.1, 0.03, 50); }
function sfxLevelUp() { playTone(440, 'square', 0.1, 0.05); setTimeout(()=>playTone(554, 'square', 0.1, 0.05), 100); setTimeout(()=>playTone(659, 'square', 0.2, 0.05), 200); }
function sfxCollect() { playTone(880, 'sine', 0.05, 0.03); }
function sfxWarning() { playTone(200, 'sawtooth', 0.5, 0.05); }

function startBGM() {
    if(!gameOptions.bgmOn || !audioCtx) return; stopBGM();
    const notes = [220, 261, 329, 261, 392, 329, 261, 220]; let noteIdx = 0;
    bgmInterval = setInterval(() => {
        if(!isGameRunning) return;
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'triangle'; osc.frequency.value = notes[noteIdx] / 2;
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        noteIdx = (noteIdx + 1) % notes.length;
    }, 250);
}
function stopBGM() { if(bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; } }
function toggleAudio(type) {
    if(type==='bgm') { gameOptions.bgmOn = !gameOptions.bgmOn; document.getElementById('bgm-toggle').className = `toggle-btn ${gameOptions.bgmOn?'on':''}`; document.getElementById('bgm-toggle').innerText = gameOptions.bgmOn?'ON':'OFF'; if(gameOptions.bgmOn && isGameRunning) startBGM(); else stopBGM(); }
    if(type==='sfx') { gameOptions.sfxOn = !gameOptions.sfxOn; document.getElementById('sfx-toggle').className = `toggle-btn ${gameOptions.sfxOn?'on':''}`; document.getElementById('sfx-toggle').innerText = gameOptions.sfxOn?'ON':'OFF'; }
}

function toggleInventory() {
    invVisible = !invVisible; const inv = document.getElementById('inventory-container'), btn = document.getElementById('inv-toggle-btn');
    if(invVisible) { inv.style.transform = 'scaleY(1)'; inv.style.opacity = '1'; btn.innerText = '▼ 가방 닫기'; } 
    else { inv.style.transform = 'scaleY(0)'; inv.style.opacity = '0'; btn.innerText = '▲ 가방 열기'; }
}

function checkSaveExists() {
    if (cloudSaveData) return true;
    try {
        const saveStr = localStorage.getItem('infiniteShooterSave');
        if (saveStr) {
            const parsed = JSON.parse(saveStr);
            if (parsed && parsed.player && parsed.player.hp > 0) return true;
        }
    } catch(e) {}
    return false;
}

async function saveGame() {
    if (!isGameRunning || !player || player.hp <= 0) return;
    try {
        const saveData = {
            gameTime: gameTime || 0,
            kills: kills || 0,
            level: level || 1,
            exp: exp || 0,
            nextLevelExp: nextLevelExp || 100,
            spawnTimer: spawnTimer || 0,
            boxSpawnTimer: boxSpawnTimer || 0,
            bossRewardTimer: bossRewardTimer || 0,
            eventFlags: eventFlags || { gameCleared: false, reaperSpawned: false },
            lastWaveMin: lastWaveMin || 0,
            lastBossMin: lastBossMin || 0,
            runGold: runGold || 0,
            runUpgrades: runUpgrades || { atk: 0, def: 0, hp: 0, regen: 0, speed: 0, aspd: 0, exp: 0 },
            currentDifficulty: currentDifficulty || 'EASY',
            dogSpawnCount: dogSpawnCount || 0,
            koalaSpawnCount: koalaSpawnCount || 0,
            player: {
                x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, speed: player.speed, size: player.size,
                weapons: player.weapons || [], accessories: player.accessories || [], evolvedWeapons: player.evolvedWeapons || [],
                stats: player.stats || { atk: 1.0, cooldown: 1.0, area: 1.0, expBonus: 1.0, def: 0.0, regen: 0.0, pickup: 1.0 },
                lookX: player.lookX || 6, lookY: player.lookY || 0
            },
            entities: (entities || []).map(e => ({ id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, speed: e.speed, dmg: e.dmg, size: e.size, color: e.color, name: e.name, kbX: e.kbX || 0, kbY: e.kbY || 0, isBoss: e.isBoss || false, type: e.type, vx: e.vx || 0, vy: e.vy || 0, kbResist: e.kbResist || 0, state: e.state || 'normal', chargeTimer: e.chargeTimer || 0, cooldown: e.cooldown || 0 })),
            gems: gems || [],
            boxes: boxes || [],
            items: items || []
        };
        
        if (db && userId && fsSetDoc && fsDoc) {
            const docRef = fsDoc(db, 'artifacts', appId, 'users', userId, 'saves', 'infiniteShooterSave');
            await fsSetDoc(docRef, saveData);
            cloudSaveData = saveData;
        }
        
        try {
            localStorage.setItem('infiniteShooterSave', JSON.stringify(saveData));
        } catch(e) {}
    } catch (e) {
        console.error("Save failed", e);
    }
}

async function clearSave() {
    cloudSaveData = null;
    if (db && userId && fsDeleteDoc && fsDoc) {
        try {
            const docRef = fsDoc(db, 'artifacts', appId, 'users', userId, 'saves', 'infiniteShooterSave');
            await fsDeleteDoc(docRef);
        } catch(e) {}
    }
    try { localStorage.removeItem('infiniteShooterSave'); } catch(e) {}
}

function init() {
    canvas = document.getElementById('gameCanvas'); ctx = canvas.getContext('2d');
    bgCanvas = document.getElementById('bgCanvas'); bgCtx = bgCanvas.getContext('2d');
    menuCanvas = document.getElementById('menu-canvas'); menuCtx = menuCanvas.getContext('2d');
    HUD = document.getElementById('hud'); JOYSTICK_AREA = document.getElementById('joystick-area');
    resize(); window.addEventListener('resize', resize);
    
    let p = 0;
    const inv = setInterval(() => { 
        p += 4; document.querySelector('.loader-bar').style.width = p + '%'; 
        if(p >= 100) { clearInterval(inv); showOverlay('main-menu'); } 
    }, 15);
    setupInput();
}

function resize() { 
    const container = document.getElementById('game-container'); width = container.clientWidth; height = container.clientHeight; 
    if(canvas) { 
        canvas.width = width; canvas.height = height; bgCanvas.width = width; bgCanvas.height = height; menuCanvas.width = width; menuCanvas.height = height; 
        gameScale = width / 700; 
        if(!isGameRunning && !document.getElementById('main-menu').classList.contains('hidden')) drawMainMenu();
    } 
}
 
function showOverlay(id) { 
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden')); 
    if(id) {
        document.getElementById(id).classList.remove('hidden');
        if(id === 'main-menu') {
            const continueBtn = document.getElementById('continue-btn');
            if (continueBtn) {
                continueBtn.style.display = checkSaveExists() ? 'block' : 'none';
            }
            drawMainMenu();
        }
    }
}
 
function saveOptionsAndBack() { showOverlay('main-menu'); }

function returnToMenu() {
    if (HUD) HUD.style.display = 'none';
    const invWrap = document.getElementById('inventory-wrapper');
    if (invWrap) invWrap.style.display = 'none';
    showOverlay('main-menu');
}

function openInGameShop() {
    if (!isGameRunning) return; 
    saveGame(); 
    isGameRunning = false; 
    document.getElementById('in-game-shop-screen').classList.remove('hidden');
    renderInGameShop();
}
 
function closeInGameShop() {
    document.getElementById('in-game-shop-screen').classList.add('hidden');
    isGameRunning = true; lastTime = performance.now(); requestAnimationFrame(gameLoop);
}
 
function renderInGameShop() {
    document.getElementById('shop-gold-display').innerText = `현재 보유 금화: 🪙 ${runGold}`;
    const container = document.getElementById('shop-list-container');
    container.innerHTML = '';

    for (const [key, info] of Object.entries(UPG_INFO)) {
        const currentLv = runUpgrades[key] || 0;
        const maxLv = info.maxLv;
        const cost = currentLv < maxLv ? getUpgradeCost(key, currentLv) : 'MAX';
        const btnDisabled = (currentLv >= maxLv || runGold < cost) ? 'disabled' : '';
        const btnText = currentLv >= maxLv ? 'MAX' : `🪙 ${cost}`;
        
        const div = document.createElement('div');
        div.className = 'upg-row';
        div.innerHTML = `
            <div class="upg-info">
                <div class="upg-name">${info.icon} ${info.name} <span class="upg-level">(LV ${currentLv}/${maxLv})</span></div>
                <div style="font-size:0.8rem; color:#bbb; font-family: 'Pretendard', sans-serif;">${info.desc} <span style="color:#2ed573;">[적용중: ${info.getVal(currentLv)}]</span></div>
            </div>
            <button class="upg-buy-btn" onclick="buyInGameUpgrade('${key}')" ${btnDisabled}>${btnText}</button>
        `;
        container.appendChild(div);
    }
}

function buyInGameUpgrade(key) {
    const currentLv = runUpgrades[key] || 0;
    const info = UPG_INFO[key];
    if (currentLv >= info.maxLv) return;
    const cost = getUpgradeCost(key, currentLv);
    if (runGold >= cost) {
        runGold -= cost;
        runUpgrades[key] = currentLv + 1;
        recalculateStats();
        renderInGameShop();
        updateHUD();
    }
}

function recalculateStats() {
    let oldMaxHp = player.maxHp;

    player.maxHp = 180 + (runUpgrades.hp * 15);
    player.speed = 2.5 * (1 + runUpgrades.speed * 0.015);

    player.stats = {
        atk: 1.0 + (runUpgrades.atk * 0.02) + (level * 0.05),
        cooldown: 1.0 + (runUpgrades.aspd * 0.016),
        area: 1.0,
        expBonus: 1.0 + (runUpgrades.exp * 0.03),
        def: runUpgrades.def * 0.02,
        regen: runUpgrades.regen * 0.63,
        pickup: 1.0
    };

    player.accessories.forEach(a => {
        const d = ACC_DATA.find(ad => ad.id === a.id);
        if (d) {
            if (a.id === 'hp_up') player.maxHp += d.growth * a.level;
            else if (a.id === 'speed_up') player.speed += d.growth * a.level;
            else if (a.id === 'atk_up') player.stats.atk += d.growth * a.level;
            else if (a.id === 'cooldown_down') player.stats.cooldown += d.growth * a.level;
            else if (a.id === 'area_up') player.stats.area += d.growth * a.level;
            else if (a.id === 'exp_up') player.stats.expBonus += d.growth * a.level;
            else if (a.id === 'pickup_up') player.stats.pickup += d.growth * a.level;
            else if (a.id === 'def_up') player.stats.def += d.growth * a.level;
            else if (a.id === 'regen_up') player.stats.regen += d.growth * a.level;
        }
    });

    player.stats.def = player.stats.def * 0.7;
    player.stats.def = Math.min(player.stats.def, 0.5);
    player.stats.regen = player.stats.regen * 0.9;

    if (player.maxHp > oldMaxHp) player.hp += (player.maxHp - oldMaxHp);
    player.hp = Math.min(player.maxHp, player.hp);
}

function drawMainMenu() {
    menuCtx.clearRect(0, 0, width, height);
    const skyGrad = menuCtx.createLinearGradient(0, 0, 0, height*0.6);
    skyGrad.addColorStop(0, '#2c3e50'); skyGrad.addColorStop(1, '#34495e');
    menuCtx.fillStyle = skyGrad; menuCtx.fillRect(0, 0, width, height*0.6);
    menuCtx.fillStyle = '#f1c40f'; menuCtx.beginPath(); menuCtx.arc(width*0.8, height*0.2, 50, 0, Math.PI*2); menuCtx.fill();
    menuCtx.fillStyle = '#27ae60'; menuCtx.fillRect(0, height*0.6, width, height*0.4);
    menuCtx.strokeStyle = '#000'; menuCtx.lineWidth = 6;
    menuCtx.beginPath(); menuCtx.moveTo(0, height*0.6); menuCtx.lineTo(width, height*0.6); menuCtx.stroke();
    
    let cx = width / 2; let cy = height * 0.7;
    drawActualMonster(menuCtx, cx - 140, cy + 30, 'bear', 65, 0, null, 1, 0, 'normal'); 
    drawActualMonster(menuCtx, cx + 130, cy + 10, 'cat', 45, 0, null, -1, 0, 'normal');
    drawActualMonster(menuCtx, cx - 80, cy + 90, 'snake', 40, 0, null, 1, 0, 'normal');
    drawActualMonster(menuCtx, cx + 110, cy + 80, 'rabbit', 35, 0, null, -1, 0, 'normal');
    drawActualPlayer(menuCtx, playerSprite, cx, cy, 0, false, 0, 0, 1);
}

function startGame(isContinue = false, diff = 'EASY') {
    initAudio(); showOverlay(null); HUD.style.display = 'block'; JOYSTICK_AREA.style.display = 'none';
    const invWrap = document.getElementById('inventory-wrapper'); if (invWrap) invWrap.style.display = 'flex';
    
    if (isContinue) {
        let saved = cloudSaveData;
        if (!saved) {
            try {
                const localStr = localStorage.getItem('infiniteShooterSave');
                if (localStr) saved = JSON.parse(localStr);
            } catch(e){}
        }
        
        if (saved && saved.player && saved.player.hp > 0) {
            gameTime = saved.gameTime; kills = saved.kills; level = saved.level; exp = saved.exp; nextLevelExp = saved.nextLevelExp;
            spawnTimer = saved.spawnTimer || 0; boxSpawnTimer = saved.boxSpawnTimer || 0;
            bossRewardTimer = saved.bossRewardTimer || 0;
            eventFlags = saved.eventFlags || { gameCleared: false, reaperSpawned: false };
            lastWaveMin = saved.lastWaveMin || 0; lastBossMin = saved.lastBossMin || 0;
            
            runGold = saved.runGold || 0;
            runUpgrades = saved.runUpgrades || { atk: 0, def: 0, hp: 0, regen: 0, speed: 0, aspd: 0, exp: 0 };
            
            currentDifficulty = saved.currentDifficulty || 'EASY';
            setDifficultyParams(currentDifficulty);
            dogSpawnCount = saved.dogSpawnCount || 0;
            koalaSpawnCount = saved.koalaSpawnCount || 0;
            
            player = { ...saved.player, hitTimer: 0, isMoving: false };
            entities = saved.entities || []; gems = saved.gems || []; boxes = saved.boxes || []; items = saved.items || [];
            projectiles = []; fx = [];
            recalculateStats();
            
            autoSaveTimer = 0; updateInventoryUI(); updateHUD();
            isGameRunning = true; lastTime = performance.now(); startBGM(); requestAnimationFrame(gameLoop);
            return;
        }
    } 
    
    startNewGame(diff);
    autoSaveTimer = 0; updateInventoryUI(); updateHUD();
    isGameRunning = true; lastTime = performance.now(); startBGM(); requestAnimationFrame(gameLoop);
}

function startNewGame(diff) {
    clearSave(); 
    setDifficultyParams(diff);
    gameTime = 0; kills = 0; level = 1; exp = 0; nextLevelExp = 100; shake = 0; boxSpawnTimer = 0; bossRewardTimer = 0;
    entities = []; projectiles = []; gems = []; boxes = []; items = []; fx = [];
    runGold = 0;
    runUpgrades = { atk: 0, def: 0, hp: 0, regen: 0, speed: 0, aspd: 0, exp: 0 };
    dogSpawnCount = 0; koalaSpawnCount = 0;
    
    eventFlags = { gameCleared: false, reaperSpawned: false };
    lastWaveMin = 0; lastBossMin = 0; isTimeStopped = false; timeStopTimer = 0;
    
    player = {
        x: 0, y: 0, hp: 180, maxHp: 180, speed: 2.5, size: 40,
        weapons: [{id:'sword', level:1, timer:0}], accessories: [], evolvedWeapons: [],
        stats: { atk: 1.0, cooldown: 1.0, area: 1.0, expBonus: 1.0, def: 0.0, regen: 0.0, pickup: 1.0 },
        hitTimer: 0, lookX: 6, lookY: 0, isMoving: false
    };
    recalculateStats();
}

function showWarning(text, sub) {
    sfxWarning(); const banner = document.getElementById('warning-banner');
    document.getElementById('warning-text').innerText = text; document.getElementById('warning-sub').innerText = sub;
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
        for(let i=0; i<45 * diffSpawnMult; i++) spawnEnemyWrapper(true);
    }
    if (currentMin > 0 && currentMin % 5 === 0 && currentMin < 20 && lastBossMin !== currentMin) {
        lastBossMin = currentMin; showWarning("보스 출현!", "거대한 적이 접근합니다!"); spawnBossWrapper();
    }
    if (currentMin >= 20 && !eventFlags.reaperSpawned) {
        eventFlags.reaperSpawned = true; showWarning("사신 강림", "생존 시간 종료. 운명을 맞이하세요.");
        entities.push({ id: 'reaper', hp: 9999999, speed: 5.0, dmg: 9999, size: 90, name: '사신', color: '#111', x: player.x + Math.max(width, height), y: player.y, maxHp: 9999999, kbX: 0, kbY: 0, isBoss: true, type: 'enemy', vx: 0, vy: 0, kbResist: 0, state: 'normal' });
    }
}

function checkHitRadius(x, y, r, dmg, kbMult, slowEffect, isContinuous = false) {
    for(let e of entities) {
        if(e.type==='enemy' && dist(x,y,e.x,e.y) < r + e.size) {
            e.hp -= (e.id === 'reaper' ? 0 : dmg);
            if(!isContinuous && e.id !== 'reaper' && kbMult > 0) { 
                let ang = Math.atan2(e.y - y, e.x - x);
                let kbAmount = 7.5 * kbMult * (1 - (e.kbResist || 0));
                e.kbX += Math.cos(ang) * kbAmount; 
                e.kbY += Math.sin(ang) * kbAmount; 
            }
            if (slowEffect && e.id !== 'reaper') {
                e.slowTimer = slowEffect.duration;
                e.slowRatio = Math.max(e.slowRatio || 0, slowEffect.ratio);
            }
            if(!isContinuous) sfxHit();
        }
    }
    boxes.forEach(b => { if (b.hitDelay <= 0 && dist(x, y, b.x, b.y) < r + b.size) { b.hp -= 1; b.hitDelay = 0.1; sfxHit(); } });
}

function checkHit(centerAngle, spread, range, dmg, kbMult, slowEffect) {
    for (let i = entities.length - 1; i >= 0; i--) {
        let e = entities[i]; if(e.type !== 'enemy') continue;
        let d = dist(player.x, player.y, e.x, e.y);
        if (d < range + e.size) {
            const ang = Math.atan2(e.y - player.y, e.x - player.x);
            let diff = Math.abs(ang - centerAngle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff <= spread / 2) { 
                e.hp -= (e.id === 'reaper' ? 0 : dmg); 
                if (e.id !== 'reaper' && kbMult > 0) { 
                    let kbAmount = 10 * kbMult * (1 - (e.kbResist || 0));
                    e.kbX = Math.cos(ang) * kbAmount; e.kbY = Math.sin(ang) * kbAmount; 
                }
                if (slowEffect && e.id !== 'reaper') {
                    e.slowTimer = slowEffect.duration;
                    e.slowRatio = Math.max(e.slowRatio || 0, slowEffect.ratio);
                }
                fx.push({ type: 'spark', x: e.x, y: e.y, life: 0.2, color: '#fff' }); sfxHit();
            }
        }
    }
    boxes.forEach(b => { 
        if (b.hitDelay <= 0 && dist(player.x, player.y, b.x, b.y) < range + b.size) { 
            const ang = Math.atan2(b.y - player.y, b.x - player.x);
            let diff = Math.abs(ang - centerAngle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff <= spread / 2) { b.hp -= 1; b.hitDelay = 0.1; sfxHit(); }
        } 
    });
}

function attack(w, isEvolved = false) {
    const d = isEvolved ? EVOLVE_DATA.find(ev => ev.id === w.id) : WEAPONS_DATA.find(wd => wd.id === w.id);
    const levelDmgBonus = w.id === 'molotov' ? 13 : 97;
    const dmg = (isEvolved ? d.baseAtk : (d.baseAtk + (w.level - 1) * levelDmgBonus)) * player.stats.atk;
    const range = (isEvolved ? 250 : (d.baseRange + (w.level - 1) * 20)) * player.stats.area;
    const angle = Math.atan2(joystick.lastY, joystick.lastX);
    sfxShoot();

    let kbMult = 0;
    if(w.id === 'sword' || w.id === 'evolved_sword' || w.id === 'bow') kbMult = 0.5;
    else if(w.id === 'axe') kbMult = 0.25;
    else if(w.id === 'evolved_axe') kbMult = 0.15;
    else if(w.id === 'spear') kbMult = 0.75;

    let slowEffect = null;
    if(w.id === 'molotov' || w.id === 'evolved_molotov') slowEffect = { ratio: 0.2, duration: 1.0 };
    else if(w.id === 'laser' || w.id === 'evolved_laser') slowEffect = { ratio: 0.55, duration: 1.5 };

    if (!isEvolved) {
        if (d.id === 'sword') {
            let counts = [1, 1, 2, 2, 3][w.level-1], angles = [angle];
            if(counts === 2) angles = [angle, angle+Math.PI];
            if(counts === 3) angles = [angle, angle+Math.PI, angle];
            angles.forEach((a, idx) => {
                setTimeout(() => { 
                    fx.push({ type: 'arc', x: player.x, y: player.y, r: range, angle: a, life: 0.3, color: d.color, maxLife: 0.3 }); 
                    checkHit(a, Math.PI * 1.2, range, dmg * (idx===2?1.5:1), kbMult, slowEffect); 
                }, idx * 150);
            });
        }
        else if(d.id === 'axe') {
            let counts = [1, 2, 2, 3, 4][w.level-1];
            for(let i=0; i<counts; i++) fx.push({ type: 'circle', x: player.x, y: player.y, r: range + i*20, life: 0.4, color: d.color, maxLife: 0.4 });
            checkHit(0, Math.PI * 2, range + (counts-1)*20, dmg, kbMult, slowEffect);
        }
        else if (d.id === 'spear') {
            let angles = [angle];
            if(w.level >= 3) angles.push(angle + Math.PI); if(w.level >= 4) angles.push(angle - 0.3, angle + 0.3); if(w.level >= 5) angles = [angle, angle+Math.PI/2, angle+Math.PI, angle-Math.PI/2];
            angles.forEach((a) => { 
                fx.push({ type: 'line', x: player.x, y: player.y, r: range*1.5, angle: a, life: 0.2, color: d.color, maxLife: 0.2 }); 
                checkHit(a, 0.4, range*1.5, dmg, kbMult, slowEffect); 
            });
        }
        else if (d.id === 'pistol') {
            let counts = [1, 2, 3, 4, 5][w.level-1], pierceCnt = w.level >= 3 ? 1 : 0; if(w.level >= 5) pierceCnt = 3;
            let pSpeed = (40 + (w.level===5?10:0)) * 60; 
            for(let i=0; i<counts; i++) { 
                const off = (i - (counts-1)/2) * 0.2; 
                projectiles.push({ x: player.x, y: player.y, vx: Math.cos(angle+off), vy: Math.sin(angle+off), speed: pSpeed, dmg, life: range / pSpeed, type: 'bullet', color: d.color, pierce: pierceCnt, kbMult, slowEffect }); 
            }
        }
        else if(d.id === 'wand') {
            let counts = [1, 1, 2, 2, 3][w.level-1], isSplash = w.level >= 4;
            let hSpeed = (20 + w.level*2) * 60; 
            for(let i=0; i<counts; i++) { 
                const target = getNearestEnemy(player, entities), off = (i - (counts-1)/2) * 0.5; 
                projectiles.push({ x: player.x, y: player.y, vx: Math.cos(angle+off), vy: Math.sin(angle+off), speed: hSpeed, dmg, life: (range * 1.5) / hSpeed, type: 'homing', color: d.color, pierce: 0, target: target, isSplash: isSplash, kbMult, slowEffect }); 
            }
        }
        else if(d.id === 'bow') {
            let pierceCnt = [2, 4, 4, 6, 8][w.level-1], angles = [angle];
            let bSpeed = 30 * 60; 
            if(w.level >= 3) angles.push(angle + Math.PI); if(w.level >= 5) angles = [angle, angle+Math.PI/2, angle+Math.PI, angle-Math.PI/2];
            angles.forEach(a => { 
                projectiles.push({ x: player.x, y: player.y, vx: Math.cos(a), vy: Math.sin(a), speed: bSpeed, dmg, life: range / bSpeed, type: 'arrow', color: d.color, pierce: pierceCnt, kbMult, slowEffect }); 
            });
        }
        else if (d.id === 'boomerang') {
            let counts = [1, 1, 2, 2, 4][w.level-1], pierceCnt = w.level >= 4 ? 99 : 2, angles = [angle];
            let bmSpeed = (25 + w.level*3) * 60; 
            if(counts === 2) angles = [angle - 0.5, angle + 0.5]; if(counts === 4) angles = [angle, angle+Math.PI/2, angle+Math.PI, angle-Math.PI/2];
            angles.forEach(a => { 
                projectiles.push({ x: player.x, y: player.y, vx: Math.cos(a), vy: Math.sin(a), speed: bmSpeed, dmg, life: 4.0, type: 'boomerang', color: d.color, pierce: pierceCnt, returnTimer: 0.6 + w.level*0.1, kbMult, slowEffect }); 
            });
        }
        else if (d.id === 'molotov') {
            let counts = [1, 1, 2, 2, 3][w.level-1];
            let mSpeed = 20 * 60; 
            for(let i=0; i<counts; i++) { 
                let rx = player.x + Math.cos(angle) * (range + i*40) + (Math.random()-0.5)*100, ry = player.y + Math.sin(angle) * (range + i*40) + (Math.random()-0.5)*100; 
                projectiles.push({ x: player.x, y: player.y, targetX: rx, targetY: ry, speed: mSpeed, dmg, life: 1.0, type: 'molotov', color: d.color, pierce: 0, aoe: 100 + w.level*15, duration: 2.0 + w.level*0.5, kbMult, slowEffect }); 
            }
        }
        else if (d.id === 'laser') {
            let counts = [1, 1, 2, 2, 4][w.level-1], angles = [angle];
            if(counts === 2) angles = [angle - 0.2, angle + 0.2]; if(counts === 4) angles = [angle, angle+Math.PI/2, angle+Math.PI, angle-Math.PI/2];
            angles.forEach(a => { 
                fx.push({ type: 'laser_line', x: player.x, y: player.y, r: range*1.8, angle: a, life: 0.3, color: d.color, maxLife: 0.3, thickness: 20 + w.level*5 }); 
                checkHit(a, 0.2, range*1.8, dmg, kbMult, slowEffect); 
            });
        }
    } 
    else {
        if (d.logic === 'divine_wave') {
            let dwSpeed = 25 * 60; 
            for(let i=0; i<8; i++) { 
                let a = (Math.PI*2/8) * i; 
                projectiles.push({ x: player.x, y: player.y, vx: Math.cos(a), vy: Math.sin(a), speed: dwSpeed, dmg: dmg, life: range / dwSpeed, type: 'divine_wave', color: d.color, pierce: 999, angle: a, kbMult, slowEffect }); 
            }
        } else if (d.logic === 'earthquake') {
            for(let i=0; i<3; i++) { 
                let rx = player.x + (Math.random()-0.5)*500, ry = player.y + (Math.random()-0.5)*500; 
                fx.push({ type: 'earthquake', x: rx, y: ry, r: 250, life: 0.6, color: d.color, maxLife: 0.6 }); 
                checkHitRadius(rx, ry, 250, dmg, kbMult, slowEffect); 
            }
        } else if (d.logic === 'lightning_strike') {
            for(let i=0; i<6; i++) { 
                let target = entities[Math.floor(Math.random()*entities.length)]; 
                if(target && target.type === 'enemy') { 
                    fx.push({ type: 'lightning', x: target.x, y: target.y, life: 0.4, color: d.color, maxLife: 0.4 }); 
                    checkHitRadius(target.x, target.y, 180, dmg, kbMult, slowEffect); 
                } 
            }
        } else if (d.logic === 'death_blossom') {
            let dbSpeed = 45 * 60; 
            for(let i=0; i<16; i++) { 
                let a = (Math.PI*2/16) * i + gameTime*5; 
                projectiles.push({ x: player.x, y: player.y, vx: Math.cos(a), vy: Math.sin(a), speed: dbSpeed, dmg: dmg, life: range / dbSpeed, type: 'bullet', color: d.color, pierce: 3, kbMult, slowEffect }); 
            }
        } else if (d.logic === 'black_hole') {
            projectiles.push({ x: player.x, y: player.y, vx: Math.cos(angle), vy: Math.sin(angle), speed: 8.0 * 60, dmg: dmg*0.2, life: 2.0, type: 'black_hole', color: d.color, pierce: 999, kbMult, slowEffect });
        } else if (d.logic === 'sun_strike') {
            for(let i=0; i<8; i++) { 
                let rx = player.x + (Math.random()-0.5)*1200, ry = player.y - 800 - Math.random()*300; 
                projectiles.push({ x: rx, y: ry, vx: 0, vy: 1, speed: 45 * 60, dmg: dmg, life: 3.0, type: 'sun_strike', color: d.color, pierce: 999, kbMult, slowEffect }); 
            }
        } else if (d.logic === 'buzzsaw') {
            for(let i=0; i<3; i++) { 
                projectiles.push({ x: player.x, y: player.y, angleOffset: (Math.PI*2/3)*i, radius: 250, dmg: dmg, life: 4.0, type: 'buzzsaw', color: d.color, pierce: 999, kbMult, slowEffect }); 
            }
        } else if (d.logic === 'hellfire') {
            for(let i=0; i<5; i++) { 
                let rx = player.x + (Math.random()-0.5)*1000, ry = player.y + (Math.random()-0.5)*1000; 
                fx.push({ type: 'fire_zone', x: rx, y: ry, r: 250, life: 2.0, color: d.color, maxLife: 2.0, dmg: dmg, kbMult, slowEffect }); 
            }
        } else if (d.logic === 'doom_beam') {
            fx.push({ type: 'doom_beam', x: player.x, y: player.y, r: 1500, angle: gameTime*2, life: 0.3, color: d.color, maxLife: 0.3, thickness: 120 }); 
            checkHit(gameTime*2, 0.4, 1500, dmg, kbMult, slowEffect);
            fx.push({ type: 'doom_beam', x: player.x, y: player.y, r: 1500, angle: gameTime*2 + Math.PI, life: 0.3, color: d.color, maxLife: 0.3, thickness: 120 }); 
            checkHit(gameTime*2 + Math.PI, 0.4, 1500, dmg, kbMult, slowEffect);
        }
    }
}

function gameLoop(now) { if (!isGameRunning) return; const dt = Math.min((now - lastTime) / 1000, 0.1); lastTime = now; update(dt); draw(); requestAnimationFrame(gameLoop); }

function update(dt) {
    gameTime += dt; checkEvents(); 
    
    autoSaveTimer += dt;
    if (autoSaveTimer >= 3) { saveGame(); autoSaveTimer = 0; }

    // 플레이어 이동 속도 보정 (dt 적용)
    player.x += joystick.x * player.speed * dt * 60; 
    player.y += joystick.y * player.speed * dt * 60; 
    
    player.hp = Math.min(player.maxHp, player.hp + (0.525 + player.stats.regen) * dt);
    player.lookX = joystick.lastX; player.lookY = joystick.lastY; player.isMoving = (Math.abs(joystick.x) > 0.05 || Math.abs(joystick.y) > 0.05);

    if(player.hitTimer > 0) player.hitTimer -= dt; if(shake > 0) shake -= dt * 25;
    if (isTimeStopped) { timeStopTimer -= dt; if (timeStopTimer <= 0) isTimeStopped = false; }
    
    if (bossRewardTimer > 0) {
        bossRewardTimer -= dt;
        if (bossRewardTimer <= 0) {
            showLevelUp(true);
        }
    }
    
    spawnTimer -= dt; if(spawnTimer <= 0) { spawnEnemyWrapper(); spawnTimer = Math.max(0.1, 1.0 - (gameTime / 60) * 0.08) / diffSpawnMult; }
    boxSpawnTimer += dt; if(boxSpawnTimer >= 45) { spawnBoxWrapper(); boxSpawnTimer = 0; }
    
    player.weapons.forEach(w => { 
        w.timer += dt; const d = WEAPONS_DATA.find(wd=>wd.id===w.id);
        const speedMod = player.stats.cooldown * d.baseSpeed * (w.level>=2 && w.id==='sword'? 1.2 : 1);
        if (w.timer >= 1.0 / speedMod) { attack(w, false); w.timer = 0; } 
    });
    player.evolvedWeapons.forEach(w => { 
        w.timer += dt; if (w.timer >= 0.7 / player.stats.cooldown) { attack(w, true); w.timer = 0; } 
    });
    
    for (let i = entities.length - 1; i >= 0; i--) {
        let e = entities[i]; if(e.type !== 'enemy') continue;
        e.kbX = (e.kbX || 0) * 0.8; e.kbY = (e.kbY || 0) * 0.8;
        
        if (!isTimeStopped || e.id === 'reaper') {
            e.slowTimer = (e.slowTimer || 0) - dt;
            let currentSpeed = e.speed;
            if (e.slowTimer > 0) currentSpeed = e.speed * (1 - (e.slowRatio || 0));

            let d = dist(player.x, player.y, e.x, e.y);
            if (d === 0) d = 1;
            let vx = (player.x - e.x)/d, vy = (player.y - e.y)/d;
            
            // 몬스터 이동 로직에 dt 적용
            if (e.id === 'cat') {
                if (e.state === 'normal') {
                    if (e.cooldown > 0) e.cooldown -= dt;
                    if (d <= 300 && e.cooldown <= 0) {
                        e.state = 'charging'; e.chargeTimer = 2.0; e.vx = 0; e.vy = 0;
                    } else {
                        e.vx = vx; e.vy = vy; 
                        e.x += (vx * currentSpeed * dt * 60) + e.kbX; 
                        e.y += (vy * currentSpeed * dt * 60) + e.kbY;
                    }
                } else if (e.state === 'charging') {
                    e.chargeTimer -= dt;
                    if (e.chargeTimer <= 0) {
                        e.state = 'dashing'; e.dashTimer = 0.7; e.dashVx = vx; e.dashVy = vy;
                    }
                } else if (e.state === 'dashing') {
                    e.dashTimer -= dt;
                    // 대시 속도 보정
                    e.x += (e.dashVx * 7 * dt * 60) + e.kbX; 
                    e.y += (e.dashVy * 7 * dt * 60) + e.kbY;
                    if (e.dashTimer <= 0) { e.state = 'normal'; e.cooldown = 2.0; }
                }
            } else if (e.id === 'panda') {
                let bambooRange = 500;
                if (e.state === 'normal') {
                    if (e.cooldown > 0) e.cooldown -= dt;
                    if (d <= bambooRange && e.cooldown <= 0) {
                        e.state = 'charging'; e.chargeTimer = 2.0; e.vx = 0; e.vy = 0;
                    } else {
                        e.vx = vx; e.vy = vy; 
                        e.x += (vx * currentSpeed * dt * 60) + e.kbX; 
                        e.y += (vy * currentSpeed * dt * 60) + e.kbY;
                    }
                } else if (e.state === 'charging') {
                    e.chargeTimer -= dt;
                    if (e.chargeTimer <= 0) {
                        let bSpeed = 5 * 60; 
                        projectiles.push({ 
                            x: e.x, y: e.y, vx: vx, vy: vy, 
                            speed: bSpeed, dmg: e.dmg, 
                            life: bambooRange / bSpeed, 
                            type: 'enemy_bamboo', color: '#27ae60' 
                        });
                        
                        if (d <= bambooRange) {
                            e.state = 'charging'; e.chargeTimer = 2.0; e.vx = 0; e.vy = 0;
                        } else {
                            e.state = 'normal'; e.cooldown = 0;
                        }
                    }
                }
            } else {
                e.vx = vx; e.vy = vy; 
                e.x += (vx * currentSpeed * dt * 60) + e.kbX; 
                e.y += (vy * currentSpeed * dt * 60) + e.kbY;
            }

            if(d < e.size/2 + 20 && player.hitTimer <= 0) { 
                let finalDmg = Math.max(1, e.dmg * (1 - player.stats.def)); player.hp -= finalDmg; 
                player.hitTimer = 0.25; 
                shake = 10; 
                if(player.hp <= 0) gameOver(e.id === 'reaper'); 
            }
        }
        if(e.hp <= 0) { 
            kills++; 
            if(!e.isBoss && e.id !== 'reaper') {
                gems.push({ x: e.x, y: e.y, exp: e.maxHp / 5, isMagnetized: false }); 
                let dropGold = Math.floor(e.maxHp / 25) + 1; 
                dropGold = Math.ceil(dropGold * 0.7);
                runGold += dropGold; 
            }
            if(e.isBoss) { 
                player.hp = player.maxHp; 
                showToast("🍎 체력 전부 회복!");
                
                const index = Math.min(SPAWN_TIMELINE.length - 1, Math.floor(gameTime / 80));
                const type = MONSTERS_DATA.find(m => m.id === SPAWN_TIMELINE[index]) || MONSTERS_DATA[0];
                const tb = 1 + (gameTime / 60) * 0.5;
                const normalMaxHp = type.hp * tb * diffHpMult;
                let dropGold = Math.floor(normalMaxHp / 25) + 1;
                dropGold = Math.ceil(dropGold * 0.7);
                const bossGold = dropGold * 20;
                
                runGold += bossGold; 
                showWarning("보스 처치 완료!", `금화 ${bossGold} 획득! 3초 후 보너스 무기를 선택합니다.`); 
                bossRewardTimer = 3.0;
            }
            entities.splice(i, 1); 
        }
    }
    
    for (let i = boxes.length - 1; i >= 0; i--) {
        let b = boxes[i]; if (b.hitDelay > 0) b.hitDelay -= dt;
        if (b.hp <= 0) { let type = Math.random(); let it = 'heal'; if(type > 0.6) it = 'magnet'; else if(type > 0.3) it = 'stop'; items.push({ x: b.x, y: b.y, itemType: it }); boxes.splice(i, 1); }
    }
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        if (p.type === 'enemy_bamboo') {
            let d = dist(p.x, p.y, player.x, player.y);
            if (d < 25 && player.hitTimer <= 0) {
                let finalDmg = Math.max(1, p.dmg * (1 - player.stats.def));
                player.hp -= finalDmg; player.hitTimer = 0.25; shake = 7;
                if(player.hp <= 0) gameOver();
                p.life = 0;
            }
        } else if (p.type === 'black_hole') {
            for (let j = entities.length - 1; j >= 0; j--) {
                let e = entities[j]; if(e.type !== 'enemy') continue;
                let d = dist(p.x, p.y, e.x, e.y);
                if (d < 150 && !e.isBoss && e.id !== 'reaper') { let a = Math.atan2(p.y - e.y, p.x - e.x); if (d > 10) { e.kbX = Math.cos(a) * 2.5; e.kbY = Math.sin(a) * 2.5; } else { e.kbX = 0; e.kbY = 0; } }
                if (d < 60) { e.hp -= (e.id === 'reaper' ? 0 : p.dmg * dt * 10); if(Math.random() > 0.8) fx.push({ type: 'spark', x: e.x, y: e.y, life: 0.1, color: '#9b59b6' }); }
            }
            boxes.forEach(b => { if (b.hitDelay <= 0 && dist(p.x, p.y, b.x, b.y) < 60) { b.hp -= 1; b.hitDelay = 0.5; sfxHit(); } });
        } else if (p.type === 'buzzsaw') {
            p.angleOffset += dt * 4; p.x = player.x + Math.cos(p.angleOffset) * p.radius; p.y = player.y + Math.sin(p.angleOffset) * p.radius; 
            checkHitRadius(p.x, p.y, 60, p.dmg * dt * 5, p.kbMult, p.slowEffect, true);
        } else if (p.type === 'molotov') {
            let d = dist(p.x, p.y, p.targetX, p.targetY);
            if (d <= p.speed * dt + 5) { 
                fx.push({ type: 'fire_zone', x: p.targetX, y: p.targetY, r: p.aoe, life: p.duration, color: p.color, maxLife: p.duration, dmg: p.dmg, kbMult: p.kbMult, slowEffect: p.slowEffect }); 
                p.life = 0; 
            } else { p.vx = (p.targetX - p.x)/d; p.vy = (p.targetY - p.y)/d; }
        } else if (p.type === 'boomerang') {
            p.returnTimer -= dt;
            if(p.returnTimer <= 0) { 
                let d = dist(p.x, p.y, player.x, player.y); 
                if(d < p.speed * dt + 10) p.life = 0; 
                else { p.vx = (player.x - p.x)/d; p.vy = (player.y - p.y)/d; }
            }
            let hitRadius = 25;
            for (let j = entities.length - 1; j >= 0; j--) {
                let e = entities[j]; if(e.type !== 'enemy') continue;
                if(dist(p.x, p.y, e.x, e.y) < e.size + hitRadius && (!p.hitList?.includes(e) || p.returnTimer <= 0)) { 
                    e.hp -= (e.id === 'reaper' ? 0 : p.dmg); 
                    if (e.id !== 'reaper' && (p.kbMult || 0) > 0) { 
                        let kbAmount = 5 * p.kbMult * (1 - (e.kbResist || 0));
                        e.kbX = p.vx * kbAmount; e.kbY = p.vy * kbAmount; 
                    } 
                    if (p.slowEffect && e.id !== 'reaper') {
                        e.slowTimer = p.slowEffect.duration;
                        e.slowRatio = Math.max(e.slowRatio || 0, p.slowEffect.ratio);
                    }
                    sfxHit();
                    if(!p.hitList) p.hitList = []; p.hitList.push(e); if(p.returnTimer > 0) { p.pierce--; if(p.pierce < 0) p.returnTimer = 0; } fx.push({ type: 'spark', x: p.x, y: p.y, life: 0.15, color: p.color }); 
                }
            }
        } else {
            if (p.target && entities.includes(p.target)) { const a = Math.atan2(p.target.y - p.y, p.target.x - p.x); p.vx += Math.cos(a) * 0.4; p.vy += Math.sin(a) * 0.4; const m = Math.sqrt(p.vx*p.vx + p.vy*p.vy); p.vx /= m; p.vy /= m; }
            let hitRadius = (p.type === 'divine_wave') ? 50 : (p.type === 'bullet' ? 10 : (p.type === 'homing' ? 12 : 15));
            for (let j = entities.length - 1; j >= 0; j--) {
                let e = entities[j]; if(e.type !== 'enemy') continue;
                if(dist(p.x, p.y, e.x, e.y) < e.size + hitRadius && !p.hitList?.includes(e)) { 
                    e.hp -= (e.id === 'reaper' ? 0 : p.dmg); 
                    if (e.id !== 'reaper' && (p.kbMult || 0) > 0) { 
                        let kbAmount = 9 * p.kbMult * (1 - (e.kbResist || 0));
                        e.kbX = p.vx * kbAmount; e.kbY = p.vy * kbAmount; 
                    } 
                    if (p.slowEffect && e.id !== 'reaper') {
                        e.slowTimer = p.slowEffect.duration;
                        e.slowRatio = Math.max(e.slowRatio || 0, p.slowEffect.ratio);
                    }
                    sfxHit();
                    if(!p.hitList) p.hitList = []; p.hitList.push(e); p.pierce--; if(p.pierce < 0) p.life = 0; 
                    fx.push({ type: 'spark', x: p.x, y: p.y, life: 0.15, color: p.color }); if(p.isSplash) fx.push({ type: 'circle', x: p.x, y: p.y, r: 140, life: 0.25, color: p.color, maxLife: 0.25 }); 
                }
            }
            for (let k = boxes.length - 1; k >= 0; k--) {
                let b = boxes[k]; if (b.hitDelay <= 0 && dist(p.x, p.y, b.x, b.y) < b.size + hitRadius && !p.hitList?.includes(b)) {
                    b.hp -= 1; b.hitDelay = 0.1; sfxHit(); if(!p.hitList) p.hitList = []; p.hitList.push(b); p.pierce--; if(p.pierce < 0) p.life = 0; fx.push({ type: 'spark', x: b.x, y: b.y, life: 0.15, color: p.color });
                }
            }
        }
        if(p.type !== 'buzzsaw' && p.type !== 'fire_zone') { 
            p.x += p.vx * p.speed * dt; 
            p.y += p.vy * p.speed * dt; 
        }
        p.life -= dt; if(p.life <= 0) projectiles.splice(i, 1);
    }

    for (let i = gems.length - 1; i >= 0; i--) {
        let g = gems[i]; let d = dist(player.x, player.y, g.x, g.y); let pickupRange = 84 * player.stats.pickup;
        // 보석 수집 이동 보정
        if (g.isMagnetized || d < pickupRange) { 
            g.isMagnetized = true; 
            const ang = Math.atan2(player.y - g.y, player.x - g.x); 
            g.x += Math.cos(ang) * 22 * dt * 60; 
            g.y += Math.sin(ang) * 22 * dt * 60; 
        }
        if(d < 50) { gainExp(g.exp); gems.splice(i, 1); sfxCollect(); }
    }

    for (let i = items.length - 1; i >= 0; i--) { let it = items[i]; if (dist(player.x, player.y, it.x, it.y) < 55) { useItem(it.itemType); items.splice(i, 1); sfxCollect(); } }

    for (let i = fx.length - 1; i >= 0; i--) { 
        let f = fx[i]; 
        if(f.type === 'fire_zone') { 
            if(Math.random() > 0.8) fx.push({ type: 'spark', x: f.x + (Math.random()-0.5)*f.r, y: f.y + (Math.random()-0.5)*f.r, life: 0.2, color: '#ffea00' }); 
            checkHitRadius(f.x, f.y, f.r, f.dmg * dt * 4, f.kbMult, f.slowEffect, true); 
        }
        f.life -= dt; if(f.life <= 0) fx.splice(i, 1); 
    }
    updateHUD();
}

function draw() {
    const camX = player.x - (width / 2) / gameScale, camY = player.y - (height / 2) / gameScale;
    drawGrid(bgCtx, camX, camY, width, height, gameScale); 

    ctx.save(); 
    if(shake > 0) ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2); 
    ctx.clearRect(0, 0, width, height); ctx.scale(gameScale, gameScale);
    
    let renderables = [];
    entities.forEach(e => renderables.push(e)); boxes.forEach(b => renderables.push({...b, type: 'box'})); items.forEach(it => renderables.push({...it, type: 'item'})); renderables.push({...player, isPlayer: true}); renderables.sort((a, b) => a.y - b.y);

    gems.forEach(g => { ctx.fillStyle = '#00d2ff'; ctx.strokeStyle = '#000'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(g.x-camX, g.y-camY, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke(); });

    fx.forEach(f => { 
        ctx.save(); ctx.globalAlpha = f.life / (f.maxLife || 0.2); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (f.type === 'arc') { ctx.strokeStyle = '#000'; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(f.x-camX, f.y-camY, f.r, f.angle-1.5, f.angle+1.5); ctx.stroke(); ctx.strokeStyle = f.color; ctx.lineWidth = 30; ctx.beginPath(); ctx.arc(f.x-camX, f.y-camY, f.r, f.angle-1.5, f.angle+1.5); ctx.stroke(); } 
        else if (f.type === 'circle') { ctx.strokeStyle = '#000'; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(f.x-camX, f.y-camY, f.r, 0, Math.PI*2); ctx.stroke(); ctx.strokeStyle = f.color; ctx.lineWidth = 30; ctx.beginPath(); ctx.arc(f.x-camX, f.y-camY, f.r, 0, Math.PI*2); ctx.stroke(); } 
        else if (f.type === 'line' || f.type === 'laser_line' || f.type === 'doom_beam') { let t = f.thickness || 20; let to = t+10; ctx.strokeStyle = '#000'; ctx.lineWidth = to; ctx.beginPath(); ctx.moveTo(f.x-camX, f.y-camY); ctx.lineTo(f.x-camX+Math.cos(f.angle)*f.r, f.y-camY+Math.sin(f.angle)*f.r); ctx.stroke(); ctx.strokeStyle = f.color; ctx.lineWidth = t; ctx.beginPath(); ctx.moveTo(f.x-camX, f.y-camY); ctx.lineTo(f.x-camX+Math.cos(f.angle)*f.r, f.y-camY+Math.sin(f.angle)*f.r); ctx.stroke(); if(f.type === 'doom_beam') { ctx.strokeStyle = '#fff'; ctx.lineWidth = t/3; ctx.stroke(); } } 
        else if (f.type === 'spark') { const sr = 25*(f.life/0.2); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(f.x-camX, f.y-camY, sr+5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x-camX, f.y-camY, sr, 0, Math.PI*2); ctx.fill(); } 
        else if (f.type === 'earthquake') { ctx.strokeStyle = f.color; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(f.x-camX, f.y-camY, f.r * (1 - f.life/f.maxLife), 0, Math.PI*2); ctx.stroke(); ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(f.x-camX, f.y-camY, f.r * (1 - f.life/f.maxLife)*0.5, 0, Math.PI*2); ctx.stroke(); }
        else if (f.type === 'lightning') { ctx.strokeStyle = f.color; ctx.lineWidth = 40; ctx.beginPath(); ctx.moveTo(f.x-camX, f.y-camY - 1000); ctx.lineTo(f.x-camX + (Math.random()-0.5)*100, f.y-camY - 500); ctx.lineTo(f.x-camX, f.y-camY); ctx.stroke(); ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(f.x-camX, f.y-camY, 150, 50, 0, 0, Math.PI*2); ctx.fill(); }
        else if (f.type === 'fire_zone') { ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(f.x-camX, f.y-camY, f.r, f.r*0.6, 0, 0, Math.PI*2); ctx.fill(); }
        ctx.restore(); 
    });

    renderables.forEach(r => {
        if (r.type === 'box') { ctx.fillStyle = '#d35400'; ctx.strokeStyle='#000'; ctx.lineWidth=5; ctx.fillRect(r.x-camX-25, r.y-camY-25, 50, 50); ctx.strokeRect(r.x-camX-25, r.y-camY-25, 50, 50); ctx.font = '40px sans-serif'; ctx.textAlign='center'; ctx.fillText('📦', r.x-camX, r.y-camY+15); } 
        else if (r.type === 'item') { ctx.fillStyle = '#fff'; ctx.strokeStyle='#000'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(r.x-camX, r.y-camY, 25, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.font = '30px sans-serif'; ctx.textAlign='center'; ctx.fillText(r.itemType === 'heal' ? '🍎' : (r.itemType === 'magnet' ? '🧲' : '⏱️'), r.x-camX, r.y-camY+10); } 
        else if (r.type === 'enemy') { drawActualMonster(ctx, r.x-camX, r.y-camY, r.id, r.size, gameTime, r.hp / r.maxHp, r.vx || 0, r.vy || 1, r.state || 'normal'); } 
        else if (r.isPlayer) { drawActualPlayer(ctx, playerSprite, r.x-camX, r.y-camY, gameTime, r.isMoving, r.hitTimer, r.lookX, r.lookY); }
    });

    projectiles.forEach(p => { 
        ctx.save(); ctx.translate(p.x - camX, p.y - camY);
        if (p.type === 'black_hole' && p.life < 0.5) {
            const scale = Math.max(0, p.life * 2);
            ctx.scale(scale, scale);
        }
        
        if(p.type === 'enemy_bamboo') {
            ctx.fillStyle = '#2ecc71'; ctx.strokeStyle = '#27ae60'; ctx.lineWidth = 4;
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.fillRect(-15, -4, 30, 8); ctx.strokeRect(-15, -4, 30, 8);
            ctx.fillStyle = '#145a32'; ctx.fillRect(-5, -4, 2, 8); ctx.fillRect(5, -4, 2, 8);
        }
        else if(p.type === 'divine_wave') { ctx.rotate(p.angle); ctx.strokeStyle = '#000'; ctx.lineWidth = 30; ctx.beginPath(); ctx.arc(0, 0, 100, -0.8, 0.8); ctx.stroke(); ctx.strokeStyle = p.color; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(0, 0, 100, -0.8, 0.8); ctx.stroke(); }
        else if (p.type === 'black_hole') { ctx.rotate(gameTime * 10); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = p.color; ctx.lineWidth = 15; ctx.beginPath(); ctx.arc(0, 0, 90 + Math.sin(gameTime*20)*10, 0, Math.PI*2); ctx.stroke(); }
        else if (p.type === 'sun_strike') { ctx.strokeStyle = '#000'; ctx.lineWidth = 35; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 60); ctx.stroke(); ctx.strokeStyle = p.color; ctx.lineWidth = 25; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 60); ctx.stroke(); }
        else if (p.type === 'buzzsaw') { ctx.rotate(gameTime * -20); ctx.fillStyle = '#b2bec3'; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = p.color; ctx.lineWidth = 15; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI*2); ctx.stroke(); }
        else if (p.type === 'molotov') { ctx.rotate(gameTime * 15); ctx.font = '30px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🍾', 0, 0); }
        else if (p.type === 'boomerang') { ctx.rotate(gameTime * 15); const s = 25; ctx.strokeStyle = '#000'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(0, s); ctx.lineTo(s, -s); ctx.stroke(); ctx.strokeStyle = p.color; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(0, s); ctx.lineTo(s, -s); ctx.stroke(); }
        else if (p.type === 'bullet') { 
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill(); 
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke(); 
        }
        else if (p.type === 'arrow') {
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();
            ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(15, 0); ctx.stroke();
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(15, -6); ctx.lineTo(25, 0); ctx.lineTo(15, 6); ctx.fill(); ctx.stroke();
        }
        else if (p.type === 'homing') {
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
        }
        else { 
            const s = p.isEvolved ? 25 : 18; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, s+5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI*2); ctx.fill(); 
        }
        ctx.restore();
    });

    const viewW = width / gameScale, viewH = height / gameScale, hw = viewW / 2, hh = viewH / 2;
    boxes.forEach(b => {
        const screenX = b.x - camX, screenY = b.y - camY;
        if (screenX < 0 || screenX > viewW || screenY < 0 || screenY > viewH) {
            const dx = screenX - hw, dy = screenY - hh, angle = Math.atan2(dy, dx);
            let edgeX = hw, edgeY = hh; const pad = 40, tan = Math.tan(angle), ratio = hw / hh;
            if (Math.abs(tan) > 1/ratio) { if (dy > 0) { edgeY = viewH - pad; edgeX = hw + (hh - pad)/tan; } else { edgeY = pad; edgeX = hw - (hh - pad)/tan; } } 
            else { if (dx > 0) { edgeX = viewW - pad; edgeY = hh + (hw - pad)*tan; } else { edgeX = pad; edgeY = hh - (hw - pad)*tan; } }

            ctx.save(); ctx.translate(edgeX, edgeY); ctx.rotate(angle);
            ctx.fillStyle = '#ff4757'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-10, 15); ctx.lineTo(-5, 0); ctx.lineTo(-10, -15); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.translate(-25, 0); ctx.rotate(-angle); ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('📦', 0, 0); ctx.restore();
        }
    });
    ctx.restore();
}

function showLevelUp(isBossReward = false) {
    saveGame(); 
    isGameRunning = false; selectedIdx = -1; sfxLevelUp();
    document.getElementById('item-detail-panel').classList.add('hidden'); document.getElementById('confirm-select-btn').disabled = true;
    
    document.getElementById('level-up-title').innerText = isBossReward ? "보너스 무기 선택!" : "LEVEL UP!";
    
    let pool = []; currentChoices = [];
    
    EVOLVE_DATA.forEach(ev => { 
        const hasW = player.weapons.find(w => w.id === ev.origin && w.level >= 5), wD = WEAPONS_DATA.find(wd => wd.id === ev.origin), hasA = player.accessories.find(a => ACC_DATA.find(ad => ad.id === a.id).pair === wD.name && a.level >= 4); 
        const alreadyEvolved = player.evolvedWeapons.find(ew => ew.id === ev.id);
        if (hasW && hasA && !alreadyEvolved) pool.push({ ...ev, type: '진화', isEvolve: true }); 
    });
    WEAPONS_DATA.forEach(w => { 
        if (player.evolvedWeapons.some(ew => EVOLVE_DATA.find(e => e.id === ew.id).origin === w.id)) return;
        const ow = player.weapons.find(o => o.id === w.id); if (!ow || ow.level < w.maxLevel) if (player.weapons.length < 4 || ow) pool.push(w); 
    });
    ACC_DATA.forEach(a => { 
        if (player.evolvedWeapons.some(ew => a.pair === WEAPONS_DATA.find(wd => wd.id === EVOLVE_DATA.find(e => e.id === ew.id).origin).name)) return;
        const oa = player.accessories.find(o => o.id === a.id); if (!oa || oa.level < a.maxLevel) if (player.accessories.length < 4 || oa) pool.push(a); 
    });
    
    while(currentChoices.length < 3 && pool.length > 0) currentChoices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    if(currentChoices.length === 0) { isGameRunning = true; lastTime = performance.now(); requestAnimationFrame(gameLoop); useItem('heal'); return; }

    const container = document.getElementById('choice-container'); container.innerHTML = '';
    currentChoices.forEach((item, idx) => {
        const ownedW = player.weapons.find(w => w.id === item.id), ownedA = player.accessories.find(a => a.id === item.id), curLv = ownedW ? ownedW.level : (ownedA ? ownedA.level : 0);
        const card = document.createElement('div'); card.className = `card ${item.isEvolve ? 'evolve-choice' : ''}`; card.id = `card-${idx}`;
        const descText = item.isEvolve ? item.desc : (item.type === '무기' ? item.levels[curLv] : item.desc), lvBadge = item.isEvolve ? 'MAX' : 'LV.' + curLv;
        const typeLabel = item.isEvolve ? '🌟 궁극 진화' : (item.type === '무기' ? '⚔️ 무기' : '🎒 보조');
        const typeColor = item.isEvolve ? 'var(--evolve-color)' : (item.type === '무기' ? 'var(--weapon-color)' : 'var(--acc-color)');
        
        card.innerHTML = `
            <div class="icon-display">${item.icon}</div>
            <div class="card-info">
                <div style="font-size: 0.75rem; color: ${typeColor}; font-weight: 900; margin-bottom: 2px;">[${typeLabel}]</div>
                <div style="display: flex; justify-content: space-between; align-items: center;"><span class="name-display">${item.name}</span><span style="font-size: 0.8rem; background: #000; color: #fff; padding: 2px 8px; border-radius: 6px;">${lvBadge}</span></div>
                <div class="desc-display">${descText}</div>
            </div>
        `;
        card.onclick = () => selectCard(idx); container.appendChild(card);
    });
    showOverlay('level-up-screen');
}

function selectCard(idx) {
    selectedIdx = idx; document.querySelectorAll('.card').forEach(c => c.classList.remove('selected')); document.getElementById(`card-${idx}`).classList.add('selected');
    document.getElementById('confirm-select-btn').disabled = false;
    
    const item = currentChoices[idx], comboEl = document.getElementById('detail-combo'), statsBox = document.getElementById('detail-stats-box'), perkBox = document.getElementById('detail-perk'), panel = document.getElementById('item-detail-panel');
    panel.classList.remove('hidden'); statsBox.innerHTML = ''; comboEl.innerHTML = ''; if(perkBox) { perkBox.classList.add('hidden'); perkBox.innerHTML = ''; } statsBox.style.display = 'grid';
    
    if (item.isEvolve) {
        statsBox.innerHTML = `<div style="grid-column: 1 / -1; color: #a55eea; text-align: center;">🌟 궁극 진화 메커니즘 개방!</div>`;
        if(perkBox) { perkBox.classList.remove('hidden'); perkBox.innerHTML = `🌟 진화 고유 능력:<br>${item.desc}<br><br>💡 (기존 무기와 보조 아이템이 합쳐집니다.)`; }
    } else if (item.type === '무기') {
        const owned = player.weapons.find(w => w.id === item.id), curLv = owned ? owned.level : 0, nextLv = curLv + 1;
        const levelDmgBonus = item.id === 'molotov' ? 13 : 97;
        const getAtk = (lv) => Math.floor(item.baseAtk + Math.max(0, lv - 1) * levelDmgBonus);
        const getRange = (lv) => Math.floor(item.baseRange + Math.max(0, lv - 1) * 20);
        
        let stats = [ { label: '⚔️ 피해량', cur: curLv > 0 ? getAtk(curLv) : '-', next: getAtk(nextLv) }, { label: '📏 공격 크기', cur: curLv > 0 ? getRange(curLv) : '-', next: getRange(nextLv) } ];

        if (item.id === 'sword') { const counts = [1, 1, 2, 2, 3]; const speeds = [100, 120, 120, 120, 120]; stats.push({ label: '🗡️ 참격 수', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); stats.push({ label: '⚡ 공격 속도', cur: curLv > 0 ? speeds[curLv-1]+'%' : '-', next: speeds[nextLv-1]+'%' }); } 
        else if (item.id === 'axe') { const counts = [1, 2, 2, 3, 4]; stats.push({ label: '🪓 도끼 개수', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); } 
        else if (item.id === 'spear') { const counts = [1, 1, 2, 3, 4]; stats.push({ label: '🔱 공격 방향', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); } 
        else if (item.id === 'pistol') { const counts = [1, 2, 3, 4, 5]; const pierces = [0, 0, 1, 1, 3]; stats.push({ label: '🔫 탄환 수', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); stats.push({ label: '💨 관통 횟수', cur: curLv > 0 ? pierces[curLv-1] : '-', next: pierces[nextLv-1] }); } 
        else if (item.id === 'wand') { const counts = [1, 1, 2, 2, 3]; const splash = ['없음', '없음', '없음', '폭발', '대폭발']; stats.push({ label: '🪄 구체 수', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); stats.push({ label: '💥 특수 효과', cur: curLv > 0 ? splash[curLv-1] : '-', next: splash[nextLv-1] }); } 
        else if (item.id === 'bow') { const pierces = [2, 4, 4, 6, 8]; const counts = [1, 1, 2, 2, 4]; stats.push({ label: '🏹 발사 방향', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); stats.push({ label: '💨 관통 횟수', cur: curLv > 0 ? pierces[curLv-1] : '-', next: pierces[nextLv-1] }); } 
        else if (item.id === 'boomerang') { const counts = [1, 1, 2, 2, 4]; stats.push({ label: '🪃 던지기 수', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); } 
        else if (item.id === 'molotov') { const counts = [1, 1, 2, 2, 3]; stats.push({ label: '🍾 화염병 수', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); } 
        else if (item.id === 'laser') { const counts = [1, 1, 2, 2, 4]; stats.push({ label: '🔦 줄기 수', cur: curLv > 0 ? counts[curLv-1] : '-', next: counts[nextLv-1] }); }

        stats.forEach(s => { statsBox.innerHTML += `<div class="stat-row"><span>${s.label}</span><span>${s.cur} <span class="stat-up">→ ${s.next}</span></span></div>`; });
        if(perkBox) { perkBox.classList.remove('hidden'); perkBox.innerHTML = `🌟 특성 강화 내용:<br>${item.levels[curLv]}`; }
        if (item.combo) comboEl.innerHTML = `🔗 진화 조건 필요 보조 아이템: <span style="color:#e17055;">${item.combo}</span>`;
    } else {
        const owned = player.accessories.find(a => a.id === item.id), curLv = owned ? owned.level : 0, nextLv = curLv + 1;
        let currentStr = '-', nextStr = '-';
        if(item.effect === 'hp' || item.effect === 'regen') { currentStr = curLv > 0 ? `+${item.growth * curLv}` : '-'; nextStr = `+${item.growth * nextLv}`; } 
        else { currentStr = curLv > 0 ? `+${Math.round(item.growth * curLv * 100)}%` : '-'; nextStr = `+${Math.round(item.growth * nextLv * 100)}%`; }

        statsBox.innerHTML = `<div class="stat-row"><span>🌟 적용 레벨</span><span>LV.${curLv} <span class="stat-up">→ LV.${nextLv}</span></span></div><div class="stat-row"><span>📈 총 증가량</span><span>${currentStr} <span class="stat-up">→ ${nextStr}</span></span></div>`;
        if(perkBox) { perkBox.classList.remove('hidden'); perkBox.innerHTML = `💡 특성 상세 설명:<br>${item.desc}`; }
        if (item.pair) comboEl.innerHTML = `🔗 진화 조건 필요 무기 아이템: <span style="color:#e17055;">${item.pair}</span>`;
    }
    if (!item.combo && !item.pair && item.isEvolve) comboEl.innerHTML = '';
}

function confirmSelection() { 
    if(selectedIdx === -1) return; const item = currentChoices[selectedIdx]; 
    if (item.isEvolve) { 
        const wIdx = player.weapons.findIndex(w => w.id === item.origin), wD = WEAPONS_DATA.find(wd => wd.id === item.origin), aIdx = player.accessories.findIndex(a => ACC_DATA.find(ad => ad.id === a.id).pair === wD.name); 
        player.weapons.splice(wIdx, 1); player.accessories.splice(aIdx, 1); player.evolvedWeapons.push({ id: item.id, timer: 0 }); 
        showWarning("✨ 궁극 진화! ✨", `${item.name} 획득!`); 
    } else { 
        addOrUpgrade(item.id); 
    } 
    updateInventoryUI(); showOverlay(null); isGameRunning = true; lastTime = performance.now(); requestAnimationFrame(gameLoop); 
}
 
function addOrUpgrade(id) { 
    const isW = WEAPONS_DATA.some(w => w.id === id), list = isW ? player.weapons : player.accessories, owned = list.find(i => i.id === id); 
    if (owned) owned.level++; else if (list.length < 4) list.push({ id, level: 1, timer: 0 }); 
    recalculateStats(); 
}
 
function updateInventoryUI() { 
    const evRow = document.getElementById('evolved-inv-row'), wsRow = document.getElementById('weapon-inv-row'), asRow = document.getElementById('acc-inv-row');
    evRow.innerHTML = ''; wsRow.innerHTML = ''; asRow.innerHTML = ''; 
    let wCount = 0;
    
    player.evolvedWeapons.forEach((w) => { 
        const d = EVOLVE_DATA.find(ev => ev.id === w.id);
        evRow.innerHTML += `<div class="inv-slot evolved">${d.icon}<div class="lv-tag">MAX</div></div>`;
    }); 
    player.weapons.forEach((w) => { 
        if(wCount < 4) { 
            const d = WEAPONS_DATA.find(wd => wd.id === w.id); const lvText = w.level >= d.maxLevel ? 'MAX' : 'LV' + w.level;
            wsRow.innerHTML += `<div class="inv-slot">${d.icon}<div class="lv-tag">${lvText}</div></div>`; wCount++;
        } 
    }); 
    player.accessories.forEach((a) => { 
        const d = ACC_DATA.find(ad => ad.id === a.id); const lvText = a.level >= d.maxLevel ? 'MAX' : 'LV' + a.level;
        asRow.innerHTML += `<div class="inv-slot">${d.icon}<div class="lv-tag">${lvText}</div></div>`;
    }); 
}
 
function showToast(msg) { const t = document.getElementById('toast-msg'); t.innerText = msg; t.style.opacity = 1; setTimeout(() => t.style.opacity = 0, 2000); }
function useItem(type) { 
    if (type === 'heal') { player.hp = Math.min(player.maxHp, player.hp + 90); showToast("🍎 체력 회복!"); } 
    else if (type === 'magnet') { gems.forEach(g => g.isMagnetized = true); showToast("🧲 모든 보석 획득!"); } 
    else if (type === 'stop') { isTimeStopped = true; timeStopTimer = 8; showToast("⏱️ 시간 정지!"); } 
}
 
function gainExp(a) { 
    exp += a * player.stats.expBonus; 
    if(exp >= nextLevelExp) { 
        level++; 
        exp = 0; 
        nextLevelExp = Math.floor(nextLevelExp * 1.35); 
        recalculateStats();
        showLevelUp(); 
    } 
}
 
function updateHUD() { 
    const m = Math.floor(gameTime/60), s = Math.floor(gameTime%60); 
    document.getElementById('timer').innerText = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; 
    document.getElementById('level-display').innerText = `LV. ${level}`; 
    document.getElementById('exp-bar').style.width = (exp/nextLevelExp*100)+'%'; 
    
    const hpBar = document.getElementById('hp-bar'); hpBar.style.width = (player.hp/player.maxHp*100)+'%'; 
    if (player.hitTimer > 0 && Math.floor(gameTime * 30) % 2 === 0) { hpBar.style.background = '#ff4757'; hpBar.style.boxShadow = '0 0 10px #ff4757'; } 
    else { hpBar.style.background = 'var(--hp-color)'; hpBar.style.boxShadow = 'none'; }

    document.getElementById('kill-count').innerText = `💀 ${kills}`; 
    document.getElementById('gold-display').innerText = `🪙 ${runGold}`; 
}
 
function gameOver(isReaperDeath = false) { 
    if (!isGameRunning) return;
    isGameRunning = false; stopBGM(); showOverlay('game-over-screen'); 
    
    clearSave(); 
    
    if (eventFlags.gameCleared || isReaperDeath) {
        document.getElementById('end-title').innerText = "게임 클리어!"; document.getElementById('end-title').style.color = "#ffd700";
    } else {
        document.getElementById('end-title').innerText = "전투 불능"; document.getElementById('end-title').style.color = "var(--hp-color)";
    }
    document.getElementById('result-stats').innerText = `기록: ${Math.floor(gameTime/60)}분 ${Math.floor(gameTime%60)}초 생존 / 처치 수: ${kills}`; 
}
 
function setupInput() { 
    const container = document.getElementById('game-container');
    const hs = (e) => { 
        if (!isGameRunning) return;
        if (e.target.closest('button') || e.target.closest('.card') || e.target.closest('#inventory-wrapper') || e.target.closest('.hud-box')) return;
        const r = container.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; 
        joystick.active = true; joystick.startX = t.clientX - r.left; joystick.startY = t.clientY - r.top; 
        JOYSTICK_AREA.style.left = joystick.startX + 'px'; JOYSTICK_AREA.style.top = joystick.startY + 'px'; JOYSTICK_AREA.style.display = 'block';
    }; 
    const hm = (e) => { 
        if (!joystick.active || !isGameRunning) return; 
        if (e.cancelable) e.preventDefault(); 
        const r = container.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; 
        let curX = t.clientX - r.left, curY = t.clientY - r.top, dx = curX - joystick.startX, dy = curY - joystick.startY;
        let d = Math.sqrt(dx*dx + dy*dy), max = 60; 
        if (d > max) { dx *= max/d; dy *= max/d; } 
        document.getElementById('joystick-stick').style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; 
        joystick.x = dx/max; joystick.y = dy/max; if (d > 5) { joystick.lastX = joystick.x; joystick.lastY = joystick.y; } 
    }; 
    const he = () => { 
        joystick.active = false; joystick.x = 0; joystick.y = 0; 
        document.getElementById('joystick-stick').style.transform = `translate(-50%, -50%)`; JOYSTICK_AREA.style.display = 'none';
    }; 
    container.addEventListener('mousedown', hs); window.addEventListener('mousemove', hm, { passive: false }); window.addEventListener('mouseup', he); 
    container.addEventListener('touchstart', hs, { passive: false }); window.addEventListener('touchmove', hm, { passive: false }); window.addEventListener('touchend', he); 
}
 
window.onload = init;

window.startGame = startGame;
window.showOverlay = showOverlay;
window.openInGameShop = openInGameShop;
window.closeInGameShop = closeInGameShop;
window.toggleInventory = toggleInventory;
window.toggleAudio = toggleAudio;
window.saveOptionsAndBack = saveOptionsAndBack;
window.returnToMenu = returnToMenu;
window.buyInGameUpgrade = buyInGameUpgrade;
window.confirmSelection = confirmSelection;
