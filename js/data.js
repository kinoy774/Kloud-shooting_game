export const UPG_INFO = {
    atk: { name: '공격력 증폭', icon: '⚔️', desc: '무기 피해량 증가', maxLv: 100, getVal: (lv) => `+${lv * 2}%`, mult: 1 },
    def: { name: '단단한 피부', icon: '🛡️', desc: '받는 피해량 감소', maxLv: 50, getVal: (lv) => `-${lv * 1}%`, mult: 1 },
    hp: { name: '생명력 훈련', icon: '❤️', desc: '최대 체력 증가', maxLv: 100, getVal: (lv) => `+${lv * 15}`, mult: 1 },
    regen: { name: '자연 치유', icon: '✨', desc: '초당 체력 회복', maxLv: 50, getVal: (lv) => `+${(lv * 0.63).toFixed(1)}/초`, mult: 1 },
    speed: { name: '날렵한 발걸음', icon: '👟', desc: '이동 속도 증가', maxLv: 20, getVal: (lv) => `+${lv * 1.5}%`, mult: 3 },
    aspd: { name: '신속의 손놀림', icon: '⚡', desc: '공격 속도 증가', maxLv: 20, getVal: (lv) => `+${(lv * 1.6).toFixed(1)}%`, mult: 3 },
    exp: { name: '경험치 증폭', icon: '📖', desc: '경험치 획득량 증가', maxLv: 10, getVal: (lv) => `+${lv * 3}%`, mult: 1 }
};

export const WEAPONS_DATA = [
    { id: 'sword', name: '빛의 검', icon: '⚔️', type: '무기', maxLevel: 5, baseAtk: 84, baseRange: 130, baseSpeed: 0.864, color: '#fff', combo: '체력 증진', levels: ["전방으로 1개의 참격을 날립니다.", "참격의 크기가 커지고 공격 속도가 증가합니다.", "전방과 후방으로 동시에 참격을 날립니다.", "참격의 피해량과 범위가 대폭 확장됩니다.", "3연속으로 참격을 날리며 적을 크게 밀쳐냅니다."] },
    { id: 'axe', name: '회전 도끼', icon: '🪓', type: '무기', maxLevel: 5, baseAtk: 72, baseRange: 150, baseSpeed: 0.72, color: '#ccc', combo: '거대 구슬', levels: ["캐릭터 주변을 1바퀴 도는 도끼를 던집니다.", "동시에 2개의 도끼가 회전합니다.", "도끼의 회전 속도와 범위가 증가합니다.", "동시에 3개의 도끼가 회전합니다.", "거대한 4개의 도끼가 빠르게 회전하며 분쇄합니다."] },
    { id: 'spear', name: '찌르기 창', icon: '🔱', type: '무기', maxLevel: 5, baseAtk: 132, baseRange: 280, baseSpeed: 0.648, color: '#e0e0e0', combo: '힘의 반지', levels: ["전방을 향해 1번 강하게 찌릅니다.", "창의 사거리가 길어집니다.", "전방과 후방을 동시에 찌릅니다.", "전방을 3갈래로 넓게 찌릅니다.", "사방을 동시에 찌르는 광역 공격을 합니다."] },
    { id: 'pistol', name: '속사 권총', icon: '🔫', type: '무기', maxLevel: 5, baseAtk: 60, baseRange: 450, baseSpeed: 1.44, color: '#ffea00', combo: '신속 신발', levels: ["빠른 속도의 탄환을 1발 발사합니다.", "부채꼴 모양으로 2발을 동시에 발사합니다.", "탄환이 적을 1회 관통하며 3발을 발사합니다.", "부채꼴 모양으로 4발을 발사합니다.", "엄청난 속도로 관통하는 탄환을 5발 난사합니다."] },
    { id: 'wand', name: '마법 지팡이', icon: '🪄', type: '무기', maxLevel: 5, baseAtk: 114, baseRange: 450, baseSpeed: 0.576, color: '#ff6600', combo: '시계', levels: ["가까운 적을 추적하는 마법 구체를 1개 쏩니다.", "구체의 이동 속도와 피해량이 증가합니다.", "마법 구체를 동시에 2개 발사합니다.", "구체가 적중 시 주변에 폭발 피해를 입힙니다.", "거대 폭발을 일으키는 구체를 3개 발사합니다."] },
    { id: 'bow', name: '나무 활', icon: '🏹', type: '무기', maxLevel: 5, baseAtk: 78, baseRange: 500, baseSpeed: 0.792, color: '#d35400', combo: '지혜 책', levels: ["적을 2마리까지 관통하는 화살을 1발 쏩니다.", "화살의 관통 횟수가 4회로 증가합니다.", "전방과 후방으로 화살을 동시에 발사합니다.", "화살의 속도와 크기가 커집니다.", "사방으로 모든 적을 관통하는 거대 화살을 쏩니다."] },
    { id: 'boomerang', name: '부메랑', icon: '🪃', type: '무기', maxLevel: 5, baseAtk: 66, baseRange: 220, baseSpeed: 1.08, color: '#0984e3', combo: '자석', levels: ["돌아오는 부메랑 1개를 던집니다.", "부메랑의 사거리와 비행 속도가 증가합니다.", "동시에 2개의 부메랑을 던집니다.", "부메랑 크기가 커지고 적을 전부 관통합니다.", "사방으로 4개의 거대 부메랑을 던집니다."] },
    { id: 'molotov', name: '화염병', icon: '🍾', type: '무기', maxLevel: 5, baseAtk: 11, baseRange: 150, baseSpeed: 0.504, color: '#e17055', combo: '강철 갑옷', levels: ["불타는 구역을 남기는 화염병을 1개 던집니다.", "화염 구역의 크기가 넓어집니다.", "화염병 2개를 동시에 투척합니다.", "불꽃의 지속 시간과 틱 피해량이 증가합니다.", "3개의 화염병을 던져 거대한 불바다를 만듭니다."] },
    { id: 'laser', name: '에너지 빔', icon: '🔦', type: '무기', maxLevel: 5, baseAtk: 96, baseRange: 500, baseSpeed: 0.432, color: '#00cec9', combo: '재생 물약', levels: ["적을 꿰뚫는 레이저를 1줄기 발사합니다.", "레이저의 굵기와 타격 횟수가 증가합니다.", "2줄기의 레이저를 동시에 발사합니다.", "레이저의 사거리가 매우 길어집니다.", "4방향으로 거대 레이저를 발사하여 화면을 휩씁니다."] }
];

export const ACC_DATA = [
    { id: 'hp_up', name: '체력 증진', icon: '❤️', type: '보조', maxLevel: 4, desc: '최대 체력이 증가하고 약간 회복됩니다.', growth: 75, effect: 'hp', pair: '빛의 검' },
    { id: 'speed_up', name: '신속 신발', icon: '👟', type: '보조', maxLevel: 4, desc: '이동 속도가 눈에 띄게 증가합니다.', growth: 0.2, effect: 'speed', pair: '속사 권총' },
    { id: 'atk_up', name: '힘의 반지', icon: '💍', type: '보조', maxLevel: 4, desc: '무기가 가하는 피해량이 증가합니다.', growth: 0.2, effect: 'atk', pair: '찌르기 창' },
    { id: 'cooldown_down', name: '시계', icon: '⏳', type: '보조', maxLevel: 4, desc: '무기의 공격 빈도가 빨라집니다.', growth: 0.2, effect: 'cooldown', pair: '마법 지팡이' },
    { id: 'area_up', name: '거대 구슬', icon: '📏', type: '보조', maxLevel: 4, desc: '공격 크기 및 사거리가 확장됩니다.', growth: 0.2, effect: 'area', pair: '회전 도끼' },
    { id: 'exp_up', name: '지혜 책', icon: '📖', type: '보조', maxLevel: 4, desc: '획득하는 경험치 양이 증가합니다.', growth: 0.3, effect: 'exp', pair: '나무 활' },
    { id: 'pickup_up', name: '자석', icon: '🧲', type: '보조', maxLevel: 4, desc: '아이템과 보석을 끌어당기는 범위가 증가합니다.', growth: 0.4, effect: 'pickup', pair: '부메랑' },
    { id: 'def_up', name: '강철 갑옷', icon: '🛡️', type: '보조', maxLevel: 4, desc: '적에게 받는 피해량이 눈에 띄게 감소합니다.', growth: 0.05, effect: 'def', pair: '화염병' },
    { id: 'regen_up', name: '재생 물약', icon: '🧪', type: '보조', maxLevel: 4, desc: '시간이 지날수록 체력을 지속적으로 회복합니다.', growth: 2.1, effect: 'regen', pair: '에너지 빔' }
];

export const EVOLVE_DATA = [
    { id: 'evolved_sword', name: '신성한 심판', icon: '✨', baseAtk: 2184, logic: 'divine_wave', color: '#fffb00', origin: 'sword', desc: '8방향으로 거대한 빛의 참격을 방출합니다.' },
    { id: 'evolved_axe', name: '대지의 파괴자', icon: '🌋', baseAtk: 1680, logic: 'earthquake', color: '#ff9d00', origin: 'axe', desc: '무작위 위치에 강력한 지진파를 일으킵니다.' },
    { id: 'evolved_spear', name: '천공의 창', icon: '⚡', baseAtk: 2688, logic: 'lightning_strike', color: '#a200ff', origin: 'spear', desc: '다수의 적에게 즉시 벼락을 내리꽂습니다.' },
    { id: 'evolved_pistol', name: '심연의 소멸자', icon: '🔥', baseAtk: 1176, logic: 'death_blossom', color: '#ff0000', origin: 'pistol', desc: '나선형의 관통 탄막을 사방에 흩뿌립니다.' },
    { id: 'evolved_wand', name: '차원 폭발자', icon: '💎', baseAtk: 705, logic: 'black_hole', color: '#00f2ff', origin: 'wand', desc: '적을 빨아들여 지속 피해를 주는 블랙홀 발사.' },
    { id: 'evolved_bow', name: '태양의 화살', icon: '☀️', baseAtk: 2352, logic: 'sun_strike', color: '#ffea00', origin: 'bow', desc: '하늘에서 무수한 빛의 기둥이 비처럼 쏟아집니다.' },
    { id: 'evolved_boomerang', name: '무한 톱니바퀴', icon: '⚙️', baseAtk: 756, logic: 'buzzsaw', color: '#74b9ff', origin: 'boomerang', desc: '캐릭터 주변을 끝없이 회전하는 거대 톱니바퀴를 생성합니다.' },
    { id: 'evolved_molotov', name: '지옥불 지대', icon: '🌋', baseAtk: 329, logic: 'hellfire', color: '#d63031', origin: 'molotov', desc: '맵 전체에 무작위로 거대한 불기둥을 끝없이 소환합니다.' },
    { id: 'evolved_laser', name: '파멸의 광선', icon: '☄️', baseAtk: 1680, logic: 'doom_beam', color: '#55efc4', origin: 'laser', desc: '사방을 회전하며 모든 것을 쓸어버리는 거대 레이저를 발사합니다.' }
];

export const SPAWN_TIMELINE = ['mouse', 'rabbit', 'snake', 'dog', 'bear', 'giraffe', 'koala', 'hippo', 'crocodile', 'lion', 'tiger', 'elephant'];

export const MONSTERS_DATA = [
    { id: 'mouse', icon: '', hp: 45, speed: 1.6, dmg: 8, size: 30, color: '#b2bec3', name: '생쥐', kbResist: 0.2 },
    { id: 'rabbit', icon: '', hp: 90, speed: 2.2, dmg: 12, size: 32, color: '#dfe6e9', name: '토끼', kbResist: 0.2 },
    { id: 'snake', icon: '', hp: 200, speed: 1.4, dmg: 18, size: 36, color: '#55efc4', name: '뱀', kbResist: 0.2 },
    { id: 'cat', icon: '', hp: 300, speed: 2.1, dmg: 25, size: 38, color: '#fab1a0', name: '고양이', kbResist: 0.2 },
    { id: 'dog', icon: '', hp: 600, speed: 2.0, dmg: 35, size: 42, color: '#ccae62', name: '강아지', kbResist: 0.25 },
    { id: 'bear', icon: '', hp: 2160, speed: 2.3, dmg: 90, size: 70, color: '#b71540', name: '곰', kbResist: 0.25 },
    { id: 'giraffe', icon: '', hp: 3600, speed: 2.5, dmg: 113, size: Math.floor(75 * 0.7), color: '#f1c40f', name: '기린', kbResist: 0.3 },
    { id: 'koala', icon: '', hp: 5400, speed: 2.2, dmg: 135, size: Math.floor(60 * 0.7), color: '#7f8fa6', name: '코알라', kbResist: 0.3 },
    { id: 'panda', icon: '', hp: 7800, speed: 2.4, dmg: 165, size: Math.floor(80 * 0.7), color: '#fff', name: '팬더', kbResist: 0.35 },
    { id: 'hippo', icon: '', hp: 10800, speed: 2.1, dmg: 195, size: Math.floor(90 * 0.7), color: '#b8e994', name: '하마', kbResist: 0.35 },
    { id: 'crocodile', icon: '', hp: 15600, speed: 2.6, dmg: 240, size: Math.floor(85 * 0.7), color: '#009432', name: '악어', kbResist: 0.35 },
   { id: 'lion', icon: '', hp: 22800, speed: 3.2, dmg: 300, size: Math.floor(80 * 0.7), color: '#f39c12', name: '사자', kbResist: 0.25 },
{ id: 'tiger', icon: '', hp: 33600, speed: 3.5, dmg: 375, size: Math.floor(85 * 0.7), color: '#e67e22', name: '호랑이', kbResist: 0.25 },
{ id: 'elephant', icon: '', hp: 54000, speed: 2.0, dmg: 512, size: Math.floor(110 * 0.7), color: '#718093', name: '코끼리', kbResist: 0.4 }
];
