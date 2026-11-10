// 방 정의. map[y][x] 한 글자가 타일 하나.
//   .  기본 바닥      =  포인트 바닥(길/러그/댄스플로어)
//   T 나무  B 벤치  F 분수  L 가로등  S 광고판
//   C 카운터  k 책장  t 테이블  c 의자  s 소파  p 화분
const WALKABLE = '.=';

const ROOMS = {
  plaza: {
    name: '광장',
    outdoor: true,
    palette: { a: '#8fd67a', b: '#84cc70', c: '#f0e2c0', d: '#e6d6b0', side: '#6aa85a' },
    spawn: [6, 8],
    map: [
      'T..S.....S..T',
      '.............',
      '..L.......L..',
      '.....===.....',
      '....=====....',
      '..B.=====.B..',
      '....==F==....',
      '..B.=====.B..',
      '....=====....',
      '.....===.....',
      '..L.......L..',
      '.............',
      'T...........T',
    ],
    portals: [
      { x: 12, y: 6, to: 'cafe', tx: 8, ty: 5, label: '카페' },
      { x: 6, y: 12, to: 'lounge', tx: 5, ty: 8, label: '라운지' },
    ],
  },
  cafe: {
    name: '카페',
    palette: { a: '#f6e7cf', b: '#eedcbe', c: '#e9a9a0', d: '#e39c92', side: '#b89a78', wallA: '#ffe9c9', wallB: '#f3d6ad' },
    spawn: [8, 5],
    map: [
      'CCC..S..kk',
      '..........',
      '..tc..tc..',
      '..........',
      'p........p',
      '..tc..ss..',
      '..........',
      '..======..',
      'p........p',
      '..........',
    ],
    portals: [{ x: 9, y: 5, to: 'plaza', tx: 11, ty: 6, label: '광장' }],
  },
  lounge: {
    name: '라운지',
    disco: true,
    palette: { a: '#4a4470', b: '#433d66', c: '#ff7ac8', d: '#7ad7ff', side: '#2e2a4a', wallA: '#5d5590', wallB: '#4d467c' },
    spawn: [5, 8],
    map: [
      'p.S....S.p',
      '..........',
      '..ssss....',
      '..........',
      '..====..t.',
      '..====..c.',
      '..====....',
      '..........',
      'ss......L.',
      '..........',
    ],
    portals: [{ x: 5, y: 9, to: 'plaza', tx: 6, ty: 11, label: '광장' }],
  },
};

for (const [id, r] of Object.entries(ROOMS)) {
  r.id = id;
  r.h = r.map.length;
  r.w = r.map[0].length;
  r.signs = [];
  r.map.forEach((row, y) => {
    if (row.length !== r.w) throw new Error(`room ${id} row ${y} has wrong width`);
    [...row].forEach((ch, x) => {
      if (ch === 'S') r.signs.push({ x, y, slot: `${id}-${r.signs.length + 1}` });
    });
  });
  for (const p of r.portals) {
    if (!walkable(r, p.x, p.y)) throw new Error(`room ${id} portal on blocked tile`);
    const dest = ROOMS[p.to];
    if (!dest || !WALKABLE.includes(dest.map[p.ty][p.tx])) throw new Error(`room ${id} portal target invalid`);
  }
}

function walkable(room, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < room.w && y < room.h && WALKABLE.includes(room.map[y][x]);
}

module.exports = { ROOMS, walkable };
