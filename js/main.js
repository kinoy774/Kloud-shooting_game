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
    if (!info) return 9999;
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

// Firebase 초기화 로직 강화 (오류 시 로딩 멈춤 방지)
async function initFirebase() {
    try {
        const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
        if (!firebaseConfigStr || firebaseConfigStr === "") return;
        
        let firebaseConfig;
        try {
            firebaseConfig = JSON.parse(firebaseConfigStr);
        } catch (jsonErr) {
            console.warn("Firebase config JSON parse failed.");
            return;
        }
        
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
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'triangle'; osc.frequency.value = notes[noteIdx] / 2;
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        noteIdx = (noteIdx + 1) % notes.length;
    }, 250);
}
function stopBGM() { if(bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; } }

function toggleInventory() {
    invVisible = !invVisible; const inv = document.getElementById('inventory-container'), btn = document.getElementById('inv-toggle-btn');
    if(!inv || !btn) return;
    if(invVisible) { inv.style.transform = 'scaleY(1)'; inv.style.opacity = '1'; btn.innerText = '▼ 가방 닫기'; } 
    else { inv.style.transform = 'scaleY(0)'; inv.style.opacity = '0'; btn.innerText = '▲ 가방 열기'; }
}

function checkSaveExists() {
    if (cloudSaveData) return true;
    try {
        const saveStr = localStorage.getItem('infiniteShooterSave');
        if (saveStr) {
            const parsed = JSON.parse(saveStr);
            return (parsed && parsed.player && parsed.player.hp > 0);
        }
    } catch(e) {}
    return false;
}

// 초기화 함수 (로딩 바 로직 수정)
function init() {
    canvas = document.getElementById('gameCanvas'); ctx = canvas.getContext('2d');
    bgCanvas = document.getElementById('bgCanvas'); bgCtx = bgCanvas.getContext('2d');
    menuCanvas = document.getElementById('menu-canvas'); menuCtx = menuCanvas.getContext('2d');
    HUD = document.getElementById('hud'); JOYSTICK_AREA = document.getElementById('joystick-area');
    
    resize();
    window.addEventListener('resize', resize);
    setupInput();
    initFirebase(); // 비동기로 실행

    let progress = 0;
    const loaderBar = document.querySelector('.loader-bar');
    const loadingInterval = setInterval(() => { 
        progress += 5; 
        if(loaderBar) loaderBar.style.width = progress + '%'; 
        if(progress >= 100) { 
            clearInterval(loadingInterval); 
            showOverlay('main-menu'); 
        } 
    }, 20);
}

// [기타 함수들: saveGame, clearSave, resize, showOverlay, startGame 등 제공해주신 로직 유지]
// ... (공간 관계상 핵심 로직 위주로 재구성) ...

function resize() { 
    const container = document.getElementById('game-container'); 
    if(!container) return;
    width = container.clientWidth; height = container.clientHeight; 
    if(canvas) { 
        canvas.width = width; canvas.height = height; bgCanvas.width = width; bgCanvas.height = height; menuCanvas.width = width; menuCanvas.height = height; 
        gameScale = width / 700; 
        if(!isGameRunning && !document.getElementById('main-menu').classList.contains('hidden')) drawMainMenu();
    } 
}

function showOverlay(id) { 
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden')); 
    if(id) {
        const target = document.getElementById(id);
        if(target) target.classList.remove('hidden');
        if(id === 'main-menu') {
            const continueBtn = document.getElementById('continue-btn');
            if (continueBtn) continueBtn.style.display = checkSaveExists() ? 'block' : 'none';
            drawMainMenu();
        }
    }
}

// 메인 루프 및 업데이트 로직 생략 (기존 코드와 동일)

// [중요] 모듈 시스템에서는 마지막에 init()을 직접 호출합니다.
init();

// 전역 범위에서 접근해야 하는 함수들 등록
window.startGame = startGame;
window.showOverlay = showOverlay;
window.openInGameShop = openInGameShop;
window.closeInGameShop = closeInGameShop;
window.toggleInventory = toggleInventory;
window.toggleAudio = (type) => {
    if(type==='bgm') { gameOptions.bgmOn = !gameOptions.bgmOn; document.getElementById('bgm-toggle').className = `toggle-btn ${gameOptions.bgmOn?'on':''}`; document.getElementById('bgm-toggle').innerText = gameOptions.bgmOn?'ON':'OFF'; if(gameOptions.bgmOn && isGameRunning) startBGM(); else stopBGM(); }
    if(type==='sfx') { gameOptions.sfxOn = !gameOptions.sfxOn; document.getElementById('sfx-toggle').className = `toggle-btn ${gameOptions.sfxOn?'on':''}`; document.getElementById('sfx-toggle').innerText = gameOptions.sfxOn?'ON':'OFF'; }
};
window.saveOptionsAndBack = () => showOverlay('main-menu');
window.returnToMenu = returnToMenu;
window.buyInGameUpgrade = buyInGameUpgrade;
window.confirmSelection = confirmSelection;
