export function dist(x1, y1, x2, y2) { 
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2); 
}

export function getNearestEnemy(player, entities) {
    let nearest = null, minDist = Infinity;
    for (let i = 0; i < entities.length; i++) {
        if(entities[i].type !== 'enemy') continue;
        let d = dist(player.x, player.y, entities[i].x, entities[i].y);
        if (d < minDist) { minDist = d; nearest = entities[i]; }
    }
    return nearest;
}
