// 방 그림: 픽셀이 뭉개지지 않게 직접 한 줄씩 칠하는 아이소메트릭 그리기 도구,
// 가구 스프라이트, 바닥 타일, 벽지/창문이 있는 방 배경.
const Scene = (() => {
  const HW = 16;
  const HH = 8;
  const OUTLINE = '#5a4352';

  function fillConvex(ctx, pts, color) {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
    ctx.fillStyle = color;
    for (let y = minY; y < maxY; y++) {
      const sy = y + 0.5;
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) {
          const x = a[0] + ((sy - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
          lo = Math.min(lo, x);
          hi = Math.max(hi, x);
        }
      }
      if (hi > lo) ctx.fillRect(Math.round(lo), y, Math.round(hi) - Math.round(lo), 1);
    }
  }

  const P = (ox, oy, x, y, z) => [Math.round(ox + (x - y) * HW), Math.round(oy + (x + y) * HH - z)];

  function box(ctx, ox, oy, x, y, w, h, z0, z1, color) {
    const a1 = P(ox, oy, x, y, z1);
    const b1 = P(ox, oy, x + w, y, z1);
    const c1 = P(ox, oy, x + w, y + h, z1);
    const d1 = P(ox, oy, x, y + h, z1);
    const b0 = P(ox, oy, x + w, y, z0);
    const c0 = P(ox, oy, x + w, y + h, z0);
    const d0 = P(ox, oy, x, y + h, z0);
    fillConvex(ctx, [d1, c1, c0, d0], shade(color, 0.86));
    fillConvex(ctx, [c1, b1, b0, c0], shade(color, 0.7));
    fillConvex(ctx, [a1, b1, c1, d1], color);
  }

  function ell(ctx, cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    for (let dy = -ry; dy <= ry; dy++) {
      const hw = Math.round(rx * Math.sqrt(1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5))));
      if (hw > 0) ctx.fillRect(cx - hw, cy + dy, hw * 2, 1);
    }
  }

  function ball(ctx, cx, cy, rx, ry, color) {
    ell(ctx, cx, cy, rx, ry, shade(color, 0.78));
    ell(ctx, cx - 1, cy - 1, rx - 1, ry - 1, color);
    ell(ctx, cx - Math.round(rx / 3), cy - Math.round(ry / 3), Math.max(1, Math.floor(rx / 3)), Math.max(1, Math.floor(ry / 3)), shade(color, 1.14));
  }

  // ---------- 가구 ----------
  // ['b', x, y, w, h, z0, z1, color]   상자 (x,y,w,h 는 타일 단위, z 는 픽셀)
  // ['o', x, y, z, rx, ry, color]      둥근 덩어리 (중심 높이 z)
  // ['r', x, y, z, dx, dy, w, h, color] 화면 기준 작은 사각형 (장식)
  const WOOD = '#e0aa74';
  const WOOD_D = '#c78f5c';
  const CREAM = '#fff6e6';
  const legs = (x0, y0, x1, y1, z, color) => [
    ['b', x0, y0, 0.1, 0.1, 0, z, color],
    ['b', x1, y0, 0.1, 0.1, 0, z, color],
    ['b', x0, y1, 0.1, 0.1, 0, z, color],
    ['b', x1, y1, 0.1, 0.1, 0, z, color],
  ];
  const books = () => {
    const out = [];
    const colors = ['#ff8fa8', '#7fb4ff', '#ffd76a', '#8fe0a0', '#c79bff', '#ff9f6a'];
    [3, 13, 23].forEach((z, row) => {
      out.push(['b', 0.04, 0.55, 0.92, 0.04, z, z + 8, '#8f6742']);
      for (let i = 0; i < 6; i++) {
        const tall = 5 + ((i * 3 + row * 2) % 3);
        out.push(['b', 0.07 + i * 0.145, 0.58, 0.13, 0.04, z, z + tall, colors[(i + row * 2) % colors.length]]);
      }
    });
    return out;
  };

  const FURN = {
    T: [
      ['b', 0.42, 0.42, 0.16, 0.16, 0, 14, '#a8744a'],
      ['o', 0.5, 0.5, 24, 14, 11, '#63c466'],
      ['o', 0.28, 0.62, 19, 8, 7, '#56b85c'],
      ['o', 0.66, 0.38, 22, 8, 7, '#56b85c'],
      ['o', 0.5, 0.5, 36, 9, 8, '#7ed67a'],
      ['r', 0.5, 0.5, 24, -8, 0, 2, 2, '#ff6b7f'],
      ['r', 0.5, 0.5, 24, 5, 3, 2, 2, '#ff6b7f'],
      ['r', 0.5, 0.5, 36, 2, -2, 2, 2, '#ff6b7f'],
    ],
    o: [
      ['o', 0.5, 0.5, 7, 11, 7, '#6fcd6c'],
      ['r', 0.5, 0.5, 7, -7, -2, 2, 2, '#ff8fb5'],
      ['r', 0.5, 0.5, 7, -1, -5, 2, 2, '#ffffff'],
      ['r', 0.5, 0.5, 7, 4, -1, 2, 2, '#ffe066'],
      ['r', 0.5, 0.5, 7, -3, 2, 2, 2, '#ffe066'],
      ['r', 0.5, 0.5, 7, 6, 3, 2, 2, '#ff8fb5'],
    ],
    M: [
      ['b', 0.36, 0.36, 0.28, 0.28, 0, 7, CREAM],
      ['o', 0.5, 0.5, 11, 10, 6, '#ff7f8f'],
      ['r', 0.5, 0.5, 11, -6, -1, 2, 2, '#ffffff'],
      ['r', 0.5, 0.5, 11, 0, -4, 3, 2, '#ffffff'],
      ['r', 0.5, 0.5, 11, 4, 1, 2, 2, '#ffffff'],
    ],
    B: [
      ...legs(0.08, 0.25, 0.82, 0.62, 5, WOOD_D),
      ['b', 0.04, 0.2, 0.92, 0.56, 5, 8, WOOD],
      ['b', 0.04, 0.2, 0.92, 0.1, 8, 17, WOOD],
      ['b', 0.1, 0.34, 0.8, 0.38, 8, 10, '#ffb3c6'],
    ],
    F: [
      ['b', 0.02, 0.02, 0.96, 0.96, 0, 6, '#dfe5ef'],
      ['b', 0.12, 0.12, 0.76, 0.76, 6, 7, '#7fd4ff'],
      ['b', 0.43, 0.43, 0.14, 0.14, 7, 19, '#eef1f7'],
      ['b', 0.3, 0.3, 0.4, 0.4, 19, 22, '#dfe5ef'],
      ['b', 0.35, 0.35, 0.3, 0.3, 22, 23, '#9fe0ff'],
      ['o', 0.5, 0.5, 27, 2, 3, '#d5f2ff'],
      ['r', 0.5, 0.5, 7, -8, 2, 2, 1, '#ffffff'],
      ['r', 0.5, 0.5, 7, 6, 4, 2, 1, '#ffffff'],
    ],
    L: [
      ['b', 0.38, 0.38, 0.24, 0.24, 0, 3, '#7b7690'],
      ['b', 0.46, 0.46, 0.08, 0.08, 3, 30, '#8d88a3'],
      ['o', 0.5, 0.5, 35, 6, 6, '#fff0a0'],
      ['r', 0.5, 0.5, 35, -4, -8, 8, 2, '#7b7690'],
    ],
    S: [
      ['b', 0.45, 0.45, 0.1, 0.1, 0, 22, '#c9a27a'],
      ['o', 0.5, 0.5, 24, 3, 3, '#ffd76a'],
    ],
    C: [
      ['b', 0, 0.1, 1, 0.8, 0, 14, '#ffd9b0'],
      ['b', 0, 0.86, 1, 0.04, 2, 12, '#ffc48f'],
      ['b', 0, 0.05, 1, 0.9, 14, 16, CREAM],
      ['b', 0.36, 0.36, 0.2, 0.2, 16, 20, '#ffffff'],
      ['r', 0.46, 0.46, 20, -2, -1, 4, 1, '#c98a5c'],
    ],
    D: [
      ['b', 0, 0.1, 1, 0.8, 0, 9, '#ffd9b0'],
      ['b', 0.04, 0.14, 0.92, 0.72, 9, 20, '#d6f1ff'],
      ['b', 0.02, 0.12, 0.96, 0.76, 20, 21, CREAM],
      ['b', 0.14, 0.8, 0.26, 0.07, 10, 15, '#ff9fb8'],
      ['b', 0.56, 0.8, 0.26, 0.07, 10, 15, '#ffe08a'],
      ['r', 0.27, 0.87, 15, -1, -2, 2, 2, '#ff5c7a'],
      ['r', 0.69, 0.87, 15, -1, -2, 2, 2, '#ffffff'],
    ],
    k: [['b', 0, 0.05, 1, 0.5, 0, 34, '#d9a877'], ['b', 0, 0.03, 1, 0.56, 34, 36, CREAM], ...books()],
    t: [
      ['b', 0.44, 0.44, 0.12, 0.12, 0, 9, WOOD_D],
      ['b', 0.08, 0.08, 0.84, 0.84, 9, 11, '#fff0f4'],
      ['b', 0.05, 0.05, 0.9, 0.9, 11, 12, '#ffffff'],
      ['b', 0.3, 0.5, 0.16, 0.16, 12, 15, '#ffffff'],
      ['r', 0.38, 0.58, 15, -2, -1, 4, 1, '#c98a5c'],
      ['b', 0.56, 0.26, 0.2, 0.2, 12, 15, '#ffb3c6'],
      ['r', 0.66, 0.36, 15, -1, -3, 2, 2, '#ff5c7a'],
    ],
    c: [
      ...legs(0.26, 0.26, 0.64, 0.64, 6, WOOD_D),
      ['b', 0.24, 0.24, 0.52, 0.52, 6, 9, '#ffb3c6'],
      ['b', 0.24, 0.24, 0.52, 0.08, 9, 19, WOOD],
      ['b', 0.3, 0.32, 0.4, 0.02, 11, 17, '#ffb3c6'],
    ],
    s: [
      ['b', 0, 0.12, 1, 0.8, 0, 6, '#a9bcf7'],
      ['b', 0.03, 0.32, 0.94, 0.58, 6, 9, '#c6d3ff'],
      ['b', 0, 0.12, 1, 0.2, 6, 17, '#98adf2'],
      ['b', 0.3, 0.34, 0.4, 0.1, 9, 15, '#fff0a0'],
    ],
    p: [
      ['b', 0.32, 0.32, 0.36, 0.36, 0, 7, '#f5ad86'],
      ['b', 0.28, 0.28, 0.44, 0.44, 7, 9, '#ffc4a3'],
      ['o', 0.5, 0.5, 17, 9, 8, '#63c466'],
      ['o', 0.4, 0.58, 25, 5, 5, '#7ed67a'],
      ['o', 0.62, 0.42, 22, 4, 4, '#7ed67a'],
    ],
    P: [
      ['b', 0.15, 0.15, 0.7, 0.7, 0, 30, '#5b5378'],
      ['o', 0.5, 0.9, 21, 5, 5, '#b8b0d8'],
      ['o', 0.5, 0.9, 9, 6, 6, '#b8b0d8'],
      ['r', 0.5, 0.9, 21, -3, -2, 2, 2, '#3a3352'],
      ['r', 0.5, 0.9, 9, -3, -2, 3, 3, '#3a3352'],
    ],
    J: [
      ['b', 0, 0.2, 1, 0.6, 0, 14, '#8f7bff'],
      ['b', 0, 0.82, 1, 0.02, 3, 11, '#ffd76a'],
      ['b', 0, 0.15, 1, 0.7, 14, 16, '#4a4370'],
      ['o', 0.3, 0.5, 17, 5, 2, '#2e2944'],
      ['o', 0.72, 0.5, 17, 5, 2, '#2e2944'],
      ['r', 0.3, 0.5, 17, -1, -1, 2, 1, '#ff8fb5'],
      ['r', 0.72, 0.5, 17, -1, -1, 2, 1, '#7fd4ff'],
    ],
  };

  const FURN_OX = 32;
  const FURN_OY = 88;
  const furnCache = {};
  function furn(ch) {
    if (furnCache[ch] !== undefined) return furnCache[ch];
    const def = FURN[ch];
    if (!def) return (furnCache[ch] = null);
    const tmp = document.createElement('canvas');
    tmp.width = 64;
    tmp.height = 112;
    const ctx = tmp.getContext('2d');
    for (const d of def) {
      if (d[0] === 'b') box(ctx, FURN_OX, FURN_OY, d[1], d[2], d[3], d[4], d[5], d[6], d[7]);
      else if (d[0] === 'o') {
        const [cx, cy] = P(FURN_OX, FURN_OY, d[1], d[2], d[3]);
        ball(ctx, cx, cy, d[4], d[5], d[6]);
      } else {
        const [cx, cy] = P(FURN_OX, FURN_OY, d[1], d[2], d[3]);
        ctx.fillStyle = d[8];
        ctx.fillRect(cx + d[4], cy + d[5], d[6], d[7]);
      }
    }
    return (furnCache[ch] = { canvas: outlineSprite(tmp, OUTLINE), ax: FURN_OX + 1, ay: FURN_OY + 1 });
  }

  // ---------- 바닥 타일 ----------
  const tileCache = new Map();
  // kind: 'flat' | 'bevel' | 'grass'. 캔버스 32x16, 타일 꼭대기가 (16,0).
  function tile(color, kind, seed = 0) {
    const key = `${color}|${kind}|${seed}`;
    let cv = tileCache.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = 32;
    cv.height = 16;
    const ctx = cv.getContext('2d');
    const top = [16, 0];
    const right = [32, 8];
    const bottom = [16, 16];
    const left = [0, 8];
    fillConvex(ctx, [top, right, bottom, left], color);
    const hex = color[0] === '#';
    if (kind === 'bevel' && hex) {
      fillConvex(ctx, [left, bottom, [16, 15], [2, 8]], shade(color, 0.9));
      fillConvex(ctx, [bottom, right, [30, 8], [16, 15]], shade(color, 0.9));
      fillConvex(ctx, [top, [16, 1], [2, 8], left], shade(color, 1.06));
      fillConvex(ctx, [top, right, [30, 8], [16, 1]], shade(color, 1.06));
    }
    if (kind === 'grass' && hex) {
      let s = seed * 9301 + 49297;
      const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < 5; i++) {
        const u = rnd() * 0.8 + 0.1;
        const v = rnd() * 0.8 + 0.1;
        const x = Math.round(16 + (u - v) * 14);
        const y = Math.round((u + v) * 7);
        ctx.fillStyle = shade(color, i % 2 ? 0.9 : 1.07);
        ctx.fillRect(x, y, 2, 1);
      }
      if (seed % 7 === 3) {
        const c = ['#ffffff', '#ffd0e0', '#fff0a0'][seed % 3];
        ctx.fillStyle = c;
        ctx.fillRect(14, 7, 3, 1);
        ctx.fillRect(15, 6, 1, 3);
        ctx.fillStyle = '#ffc93d';
        ctx.fillRect(15, 7, 1, 1);
      }
    }
    if (tileCache.size > 600) tileCache.clear();
    tileCache.set(key, cv);
    return cv;
  }

  // ---------- 벽 ----------
  const WALL_H = 58;
  function wallColor(room, u, v, wins) {
    const wl = room.wall;
    if (v >= WALL_H - 3) return wl.trim;
    if (v < 2) return shade(wl.wains, 0.8);
    const k = u >> 5;
    const uu = u & 31;
    if (wins.includes(k) && uu >= 4 && uu <= 27 && v >= 20 && v <= 47) {
      if (v < 22) return shade(wl.trim, 0.86); // 창턱
      if (uu < 6 || uu > 25 || v < 24 || v > 45 || uu === 15 || uu === 16 || v === 35) return wl.trim;
      if (wl.night) {
        const star = (uu * 7 + v * 13) % 23 === 0;
        return star ? '#fff6c0' : v > 40 ? '#3d3a78' : '#2c2960';
      }
      const cloud = v >= 37 && v <= 39 && uu >= 8 && uu <= 13;
      const cloud2 = v >= 28 && v <= 29 && uu >= 18 && uu <= 23;
      return cloud || cloud2 ? '#ffffff' : v > 40 ? '#d2f1ff' : '#aee2ff';
    }
    if (v < 13) return uu === 0 ? shade(wl.wains, 0.9) : wl.wains;
    if (v === 13 || v === 14) return wl.trim;
    if (wl.pattern === 'dot') return (u & 7) === 3 && (v & 7) === 3 ? wl.paper[1] : wl.paper[0];
    return (u >> 3) & 1 ? wl.paper[1] : wl.paper[0];
  }

  const bgCache = {};
  function background(room) {
    if (bgCache[room.id]) return bgCache[room.id];
    const { w, h } = room;
    const pal = room.palette;
    const wallH = room.outdoor ? 0 : WALL_H;
    const slab = room.outdoor ? 16 : 8;
    const cv = document.createElement('canvas');
    cv.width = (w + h) * HW + 4;
    cv.height = wallH + 4 + (w + h) * HH + slab + 2;
    const ox = h * HW + 2;
    const oy = wallH + 4;
    const ctx = cv.getContext('2d');

    box(ctx, ox, oy, 0, 0, w, h, -slab, 0, pal.side);
    if (room.outdoor) {
      // 잔디가 흙 위로 살짝 덮인 느낌
      const lip = shade(pal.b, 0.84);
      fillConvex(ctx, [P(ox, oy, 0, h, 0), P(ox, oy, w, h, 0), P(ox, oy, w, h, -4), P(ox, oy, 0, h, -4)], lip);
      fillConvex(ctx, [P(ox, oy, w, h, 0), P(ox, oy, w, 0, 0), P(ox, oy, w, 0, -4), P(ox, oy, w, h, -4)], shade(pal.b, 0.72));
    } else {
      const wl = room.wall;
      for (let i = 0; i < w * HW; i++) {
        const base = oy + (i >> 1);
        for (let v = 0; v < WALL_H; v++) {
          ctx.fillStyle = wallColor(room, i, v, wl.winA || []);
          ctx.fillRect(ox + i, base - 1 - v, 1, 1);
        }
      }
      for (let i = 0; i < h * HW; i++) {
        const base = oy + (i >> 1);
        for (let v = 0; v < WALL_H; v++) {
          const c = wallColor(room, i, v, wl.winB || []);
          ctx.fillStyle = c[0] === '#' ? shade(c, 0.91) : c;
          ctx.fillRect(ox - 1 - i, base - 1 - v, 1, 1);
        }
      }
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = room.map[y][x];
        const alt = ch === '=' && !room.disco;
        const odd = (x + y) % 2;
        const color = alt ? (odd ? pal.c : pal.d) : odd ? pal.a : pal.b;
        const kind = alt ? room.altKind : room.floorKind;
        const [sx, sy] = P(ox, oy, x, y, 0);
        ctx.drawImage(tile(color, kind, x * 31 + y * 17), sx - HW, sy);
      }
    }
    return (bgCache[room.id] = { canvas: cv, ox, oy });
  }

  return { furn, tile, background, ell };
})();
