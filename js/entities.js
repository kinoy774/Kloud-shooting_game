import { SPAWN_TIMELINE, MONSTERS_DATA } from './data.js';

export function spawnEnemy(entities, player, gameTime, gameScale, width, height, diffHpMult, diffAtkMult, diffSpeedBonus, diffSpawnMult, dogSpawnCount, koalaSpawnCount, isTimeStopped, isWave = false) {
    if (isTimeStopped && !isWave) return { dogCount: dogSpawnCount, koalaCount: koalaSpawnCount };
    const index = Math.min(SPAWN_TIMELINE.length - 1, Math.floor(gameTime / 80)); 
    let spawnId = SPAWN_TIMELINE[index];
    
    let newDog = dogSpawnCount;
    let newKoala = koalaSpawnCount;

    if (spawnId === 'dog') {
        newDog++;
        if (newDog >= 10) { spawnId = 'cat'; newDog = 0; }
    } else if (spawnId === 'koala') {
        newKoala++;
        if (newKoala >= 10) { spawnId = 'panda'; newKoala = 0; }
    }
    
    const type = MONSTERS_DATA.find(m => m.id === spawnId) || MONSTERS_DATA[0];
    const ang = Math.random() * Math.PI * 2, d = Math.max(width, height) / gameScale * 0.8, tb = 1 + (gameTime / 60) * 0.2;
    
    entities.push({ 
        ...type, x: player.x + Math.cos(ang) * d, y: player.y + Math.sin(ang) * d, 
        maxHp: type.hp * tb * diffHpMult, hp: type.hp * tb * diffHpMult, 
        dmg: type.dmg * diffAtkMult, speed: type.speed + diffSpeedBonus,
        kbX: 0, kbY: 0, isBoss: false, type: 'enemy', vx: 0, vy: 0, kbResist: type.kbResist || 0,
        state: 'normal', chargeTimer: 0, dashTimer: 0, dashVx: 0, dashVy: 0, cooldown: 0
    });0

    return { dogCount: newDog, koalaCount: newKoala };
}

export function spawnBoss(entities, player, gameTime, gameScale, width, height, diffHpMult, diffAtkMult, diffSpeedBonus) {
    const ang = Math.random() * Math.PI * 2, d = Math.max(width, height) / gameScale * 0.7;
    const index = Math.min(SPAWN_TIMELINE.length - 1, Math.floor(gameTime / 80)); 
    const type = MONSTERS_DATA.find(m => m.id === SPAWN_TIMELINE[index]) || MONSTERS_DATA[0];
    const tb = 1 + (gameTime / 60) * 0.2;
    const normalHp = type.hp * tb * diffHpMult;
    const bossHp = normalHp * 20;

    entities.push({ id: 'boss_1', hp: bossHp, speed: 3.0 + diffSpeedBonus, dmg: 60 * diffAtkMult, size: 130, name: '심연 가디언', color: '#ffb142', x: player.x + Math.cos(ang) * d, y: player.y + Math.sin(ang) * d, maxHp: bossHp, kbX: 0, kbY: 0, isBoss: true, type: 'enemy', vx: 0, vy: 0, kbResist: 0.7, state: 'normal' });
}

export function spawnBox(boxes, player, width, height) { 
    const a = Math.random() * Math.PI * 2, d = Math.max(width, height) * 0.6; 
    boxes.push({ x: player.x + Math.cos(a) * d, y: player.y + Math.sin(a) * d, hp: 3, hitDelay: 0, size: 55, icon: '📦' }); 
}
