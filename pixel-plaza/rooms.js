// 방 정의. map[y][x] 한 글자가 타일 하나.
//   .  기본 바닥      =  포인트 바닥(길/러그/댄스플로어)
//   T 나무  o 꽃덤불  M 버섯 의자  B 벤치  F 분수  L 가로등  S 광고판
//   C 카운터  D 케이크 진열대  k 책장  t 테이블  c 의자  s 소파  p 화분
//   P 스피커  J 디제이 부스
// 가구 그림은 public/scene.js 의 FURN 에 있다.
const WALKABLE = '.=';

const ROOMS = {
  plaza: {
    name: '광장',
    outdoor: true,
    bg: '#8fd3ff',
    floorKind: 'grass',
    altKind: 'bevel',
    palette: { a: '#a8e28c', b: '#9edb82', c: '#fbf0d8', d: '#f3e5c6', side: '#c79a6b' },
    spawn: [6, 8],
    map: [
      'ToT.S...S.ToT',
      'o...........o',
      'T..L.....L..T',
      '....o===o....',
      '...o=====o...',
      '.B..=====..B.',
      '....==F==....',
      '.B..=====..B.',
      '...o=====o...',
      '....o===o....',
      'M..L.....L..M',
      'o...........o',
      'ToM.......MoT',
    ],
    portals: [
      { x: 12, y: 6, to: 'cafe', tx: 8, ty: 5, label: '카페' },
      { x: 6, y: 12, to: 'lounge', tx: 5, ty: 8, label: '라운지' },
    ],
  },
  cafe: {
    name: '카페',
    bg: '#cdeaf8',
    floorKind: 'bevel',
    altKind: 'flat',
    palette: { a: '#fff4e2', b: '#fde8cc', c: '#ffc4d4', d: '#ffb6c9', side: '#e0bd94' },
    wall: { paper: ['#ffe6ee', '#ffd6e2'], pattern: 'stripe', wains: '#fff6e6', trim: '#ffffff', winA: [3, 4], winB: [2, 6] },
    spawn: [8, 5],
    map: [
      'CDC..S.kkp',
      '..........',
      '.tc..tc...',
      '..........',
      'p.====....',
      '..====....',
      '..====.tc.',
      '..........',
      'ss......p.',
      '..........',
    ],
    portals: [{ x: 9, y: 5, to: 'plaza', tx: 11, ty: 6, label: '광장' }],
  },
  lounge: {
    name: '라운지',
    disco: true,
    bg: '#2f2a52',
    floorKind: 'bevel',
    altKind: 'bevel',
    palette: { a: '#7469bd', b: '#6a5fb2', c: '#ff8fc4', d: '#7fd4ff', side: '#453d78' },
    wall: { paper: ['#6a61a8', '#8178c4'], pattern: 'dot', wains: '#4f4788', trim: '#b8b0e8', night: true, winA: [6], winB: [3, 4] },
    spawn: [5, 8],
    map: [
      'PJJP.S..Sp',
      '..........',
      '..........',
      '..====..tc',
      '..====....',
      '..====..ss',
      '..====....',
      'L.........',
      'ss......p.',
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
