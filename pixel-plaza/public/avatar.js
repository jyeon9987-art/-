// 픽셀 미니미 그리기. 32x48 격자에 대각선(오른쪽 아래)을 바라보는 캐릭터를 찍고,
// 외곽선을 둘러 캐시한다. 왼쪽을 볼 때는 좌우 반전, 위쪽으로 걸을 때는 뒷모습을 쓴다.
const AV_W = 32;
const AV_H = 48;
const SPRITE_W = AV_W + 2;
const SPRITE_H = AV_H + 2;
const AV_FOOT = 42; // 스프라이트 안에서 발바닥 높이

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

function randomAvatar() {
  const av = {};
  for (const group of [SPEC.options, SPEC.colors]) {
    for (const key of Object.keys(group)) av[key] = Math.floor(Math.random() * group[key].length);
  }
  av.skin = Math.floor(Math.random() * 6); // 랜덤은 자연스러운 피부색 위주
  if (Math.random() < 0.5) av.acc = 0;
  return av;
}

function paintAvatar(ctx, av, back, frame, flip) {
  const R = (x, y, w, h, c) => {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = c;
    ctx.fillRect(flip ? AV_W - x - w : x, y, w, h);
  };
  // 모서리를 깎은 둥근 사각형 (x0..x1, y0..y1 포함)
  const round = (x0, y0, x1, y1, c) => {
    R(x0 + 2, y0, x1 - x0 - 3, 1, c);
    R(x0 + 1, y0 + 1, x1 - x0 - 1, 1, c);
    R(x0, y0 + 2, x1 - x0 + 1, y1 - y0 - 3, c);
    R(x0 + 1, y1 - 1, x1 - x0 - 1, 1, c);
    R(x0 + 2, y1, x1 - x0 - 3, 1, c);
  };
  const dots = (list, c) => list.forEach(([x, y]) => R(x, y, 1, 1, c));

  const skin = SPEC.colors.skin[av.skin];
  const skinD = shade(skin, 0.85);
  const hc = SPEC.colors.hairColor[av.hairColor];
  const hd = shade(hc, 0.76);
  const hl = shade(hc, 1.22);
  const tc = SPEC.colors.topColor[av.topColor];
  const td = shade(tc, 0.8);
  const bc = SPEC.colors.bottomColor[av.bottomColor];
  const bd = shade(bc, 0.8);
  const INK = '#3a2a40';
  const PINK = '#ff6f9c';

  const bw = [6, 8, 10][av.body];
  const bx = 16 - bw / 2;
  const lw = [2, 3, 4][av.body];
  const liftN = frame === 1 ? 1 : 0;
  const liftF = frame === 2 ? 1 : 0;
  const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const sleeve = av.top === 4 ? 0 : av.top === 1 || av.top === 3 ? 7 : 3;
  const bare = av.bottom === 1 || av.bottom === 2;

  // ---- 머리카락 중 몸 뒤로 가는 부분 ----
  if (!back) {
    if (av.hair === 2) {
      R(6, 12, 10, 19, hc);
      R(6, 12, 1, 19, hd);
      R(7, 31, 8, 1, hd);
    }
    if (av.hair === 3) round(24, 11, 28, 23, hd);
    if (av.hair === 4) {
      round(2, 7, 8, 21, hc);
      R(2, 10, 1, 9, hd);
      R(4, 20, 3, 1, hd);
    }
  }

  // ---- 먼 쪽 팔, 다리 ----
  const fax = bx + bw - 1;
  const fay = 23 - swing;
  R(fax, fay, 2, 9, skinD);
  R(fax, fay, 2, sleeve, td);

  const fx = bx + bw - lw;
  R(fx, 35, lw, 3 - liftF, bare ? skinD : bd);
  if (av.bottom === 1) R(fx, 35, lw, 1, bd);
  R(fx, 38 - liftF, lw + 1, 2, '#d3cadb');
  R(fx, 39 - liftF, lw + 1, 1, '#a79bb5');

  // ---- 가까운 쪽 다리 ----
  R(bx, 35, lw, 4 - liftN, bare ? skin : bc);
  if (av.bottom === 1) R(bx, 35, lw, 1, bc);
  R(bx, 39 - liftN, lw + 1, 2, '#f6f2fa');
  R(bx, 40 - liftN, lw + 1, 1, '#b8aec4');

  // ---- 엉덩이/치마 ----
  if (av.bottom === 2) {
    R(bx, 32, bw, 2, bc);
    R(bx - 1, 34, bw + 2, 3, bc);
    R(bx + bw - 1, 32, 2, 5, bd);
    R(bx - 1, 36, bw + 2, 1, bd);
  } else {
    R(bx, 32, bw, 3, bc);
    R(bx + bw - 2, 32, 2, 3, bd);
    R(bx + lw, 34, bw - 2 * lw, 1, bd);
  }

  // ---- 몸통 ----
  R(14, 21, 4, 1, skinD);
  R(bx, 22, bw, 10, tc);
  R(bx + bw - 2, 22, 2, 10, td);
  R(bx, 31, bw, 1, td);
  if (av.top === 2) for (const y of [24, 26, 28, 30]) R(bx, y, bw, 1, shade(tc, 0.7));
  if (!back) {
    if (av.top === 0) R(14, 22, 4, 1, td);
    if (av.top === 1) {
      R(bx + 1, 22, bw - 2, 1, td);
      R(bx + 2, 27, bw - 5, 3, td);
      R(15, 23, 1, 3, '#ffffff');
      R(17, 23, 1, 3, '#ffffff');
    }
    if (av.top === 3) {
      R(13, 22, 2, 1, '#ffffff');
      R(17, 22, 2, 1, '#ffffff');
      for (const y of [24, 26, 28, 30]) R(16, y, 1, 1, shade(tc, 0.6));
    }
    if (av.top === 4) {
      R(14, 22, 4, 1, skin);
      R(bx, 22, 1, 2, skin);
    }
  } else if (av.top === 1) {
    R(12, 22, 8, 3, td);
  }
  if (av.bottom === 3) {
    R(bx + 2, 22, 1, 5, bc);
    R(bx + bw - 3, 22, 1, 5, bc);
    R(bx + 1, back ? 28 : 26, bw - 3, back ? 4 : 6, bc);
    if (!back) R(bx + 3, 27, 1, 1, '#ffe08a');
  }

  // ---- 가까운 쪽 팔 ----
  const nay = 22 + Math.max(0, swing);
  R(bx - 2, nay, 3, 9, skin);
  R(bx - 2, nay, 3, sleeve, tc);
  R(bx, nay + 1, 1, 8, skinD);
  R(bx, nay + 1, 1, Math.max(0, sleeve - 1), td);

  // ---- 머리 ----
  round(8, 6, 23, 20, skin);
  R(11, 20, 10, 1, skinD);
  R(23, 10, 1, 8, skinD);

  const cap = () => {
    R(9, 3, 14, 1, hc);
    R(8, 4, 16, 1, hc);
    R(7, 5, 18, 5, hc);
    R(7, 10, 4, 7, hc);
    R(8, 17, 3, 1, hd);
    R(7, 8, 1, 9, hd);
    R(23, 10, 2, 3, hc);
    R(11, 5, 6, 1, hl);
    R(18, 5, 2, 1, hl);
  };

  if (!back) {
    // 얼굴
    const f = av.face;
    const hlEye = () => {
      R(13, 12, 1, 1, '#ffffff');
      R(19, 12, 1, 1, '#ffffff');
    };
    if (f === 0 || f === 4) {
      R(13, 12, 2, 3, INK);
      R(19, 12, 2, 3, INK);
      hlEye();
    }
    if (f === 1) {
      R(12, 11, 3, 4, INK);
      R(19, 11, 2, 4, INK);
      R(12, 11, 1, 1, '#ffffff');
      R(19, 11, 1, 1, '#ffffff');
      R(14, 14, 1, 1, '#9fd0ff');
      R(20, 14, 1, 1, '#9fd0ff');
    }
    if (f === 2) dots([[12, 13], [13, 12], [14, 12], [15, 13], [19, 13], [20, 12], [21, 13]], INK);
    if (f === 3) {
      R(12, 13, 3, 1, INK);
      R(19, 13, 2, 1, INK);
      R(13, 14, 1, 1, INK);
      R(19, 14, 1, 1, INK);
    }
    if (f === 4) {
      R(12, 10, 3, 1, hd);
      R(19, 10, 3, 1, hd);
    }
    if (f === 5) {
      R(13, 12, 2, 3, INK);
      R(13, 12, 1, 1, '#ffffff');
      dots([[19, 13], [20, 12], [21, 13]], INK);
    }
    if (av.gender === 0 && f !== 2 && f !== 3) {
      R(f === 1 ? 11 : 12, 12, 1, 1, INK);
      if (f !== 5) R(21, 12, 1, 1, INK);
    }
    if (f !== 4) {
      R(11, 16, 2, 1, '#ff9fb0');
      R(21, 16, 2, 1, '#ff9fb0');
    }
    if (f === 2 || f === 5) R(16, 17, 2, 2, '#d0556a');
    else if (f === 4) R(16, 17, 3, 1, '#b0607a');
    else R(16, 17, 2, 1, '#d0556a');

    // 앞머리
    switch (av.hair) {
      case 0:
        cap();
        R(11, 10, 9, 1, hc);
        R(11, 11, 4, 1, hc);
        break;
      case 1:
        cap();
        R(11, 10, 12, 2, hc);
        R(7, 10, 5, 12, hc);
        R(7, 10, 1, 12, hd);
        R(8, 22, 4, 1, hd);
        R(23, 10, 2, 10, hc);
        R(23, 20, 2, 1, hd);
        break;
      case 2:
        cap();
        R(11, 10, 4, 2, hc);
        R(19, 10, 4, 2, hc);
        R(15, 10, 4, 1, hc);
        R(7, 10, 4, 14, hc);
        R(7, 10, 1, 14, hd);
        R(23, 10, 2, 12, hc);
        R(23, 22, 2, 1, hd);
        break;
      case 3:
        cap();
        R(11, 10, 12, 1, hc);
        dots([[12, 11], [15, 11], [18, 11], [21, 11]], hc);
        round(2, 11, 7, 25, hc);
        R(2, 14, 1, 9, hd);
        R(4, 25, 2, 1, hd);
        R(6, 11, 2, 3, PINK);
        R(24, 12, 1, 2, PINK);
        break;
      case 4:
        cap();
        R(11, 10, 8, 1, hc);
        R(11, 11, 3, 1, hc);
        R(7, 9, 2, 2, PINK);
        break;
      case 5:
        cap();
        R(11, 10, 2, 2, hc);
        R(15, 10, 2, 2, hc);
        R(19, 10, 2, 1, hc);
        R(9, 1, 3, 2, hc);
        R(14, 0, 3, 3, hc);
        R(19, 1, 3, 2, hc);
        R(6, 3, 2, 3, hc);
        break;
      case 6:
        cap();
        round(12, -1, 19, 4, hc);
        R(13, 4, 6, 1, hd);
        R(13, 0, 3, 1, hl);
        R(11, 10, 5, 1, hc);
        R(18, 10, 5, 1, hc);
        break;
      case 7:
        R(9, 5, 14, 1, hd);
        R(8, 6, 16, 3, hd);
        R(8, 9, 3, 4, hd);
        break;
      case 8:
        round(5, 1, 26, 10, hc);
        round(4, 8, 10, 15, hc);
        round(22, 8, 27, 13, hc);
        R(11, 10, 12, 1, hc);
        R(9, 3, 5, 1, hl);
        R(16, 2, 4, 1, hl);
        dots([[7, 6], [13, 7], [19, 6], [24, 8], [6, 12], [16, 9], [22, 4]], hd);
        break;
    }
  } else {
    // 뒷모습: 머리카락이 머리를 덮고, 오른쪽에 볼만 살짝 보인다
    if (av.hair === 7) {
      R(9, 5, 14, 1, hd);
      R(8, 6, 15, 8, hd);
    } else {
      round(7, 3, 24, 20, hc);
      R(22, 13, 2, 5, skin);
      R(7, 8, 1, 10, hd);
      R(10, 20, 12, 1, hd);
      R(10, 6, 9, 1, hl);
    }
    if (av.hair === 1) {
      R(7, 18, 17, 4, hc);
      R(8, 22, 15, 1, hd);
    }
    if (av.hair === 2) {
      R(7, 12, 17, 19, hc);
      R(7, 12, 1, 19, hd);
      R(8, 31, 15, 1, hd);
    }
    if (av.hair === 3) {
      round(2, 11, 7, 25, hc);
      round(24, 11, 29, 25, hc);
      R(6, 11, 2, 3, PINK);
      R(24, 11, 2, 3, PINK);
    }
    if (av.hair === 4) {
      round(12, 9, 19, 26, hc);
      R(12, 12, 1, 12, hd);
      R(13, 8, 6, 2, PINK);
    }
    if (av.hair === 5) {
      R(9, 1, 3, 2, hc);
      R(14, 0, 3, 3, hc);
      R(19, 1, 3, 2, hc);
    }
    if (av.hair === 6) {
      round(12, -1, 19, 4, hc);
      R(13, 4, 6, 1, hd);
    }
    if (av.hair === 8) {
      round(4, 1, 27, 17, hc);
      dots([[7, 6], [13, 7], [19, 6], [24, 9], [9, 13], [16, 11], [22, 14]], hd);
    }
  }

  // ---- 악세서리 ----
  if (av.acc === 1 && !back) {
    const rim = '#7a5a8c';
    R(11, 15, 6, 1, rim);
    R(11, 11, 1, 5, rim);
    R(16, 11, 1, 5, rim);
    R(18, 15, 5, 1, rim);
    R(18, 11, 1, 5, rim);
    R(22, 11, 1, 5, rim);
    R(11, 10, 6, 1, rim);
    R(18, 10, 5, 1, rim);
    R(17, 12, 1, 1, rim);
  }
  if (av.acc === 2) {
    R(8, 2, 3, 4, PINK);
    R(13, 2, 3, 4, PINK);
    R(11, 3, 2, 2, '#d93863');
  }
  if (av.acc === 3) {
    R(10, 1, 12, 1, '#5b9bff');
    R(8, 2, 16, 2, '#5b9bff');
    R(7, 4, 18, 4, '#5b9bff');
    R(22, 4, 3, 4, '#3f7fe0');
    R(10, 2, 6, 1, '#8fbcff');
    if (!back) {
      R(15, 8, 12, 2, '#3f7fe0');
      R(15, 9, 12, 1, '#2c5fb5');
    }
  }
  if (av.acc === 4 && !back) {
    R(10, 5, 1, 5, '#ffffff');
    R(8, 7, 5, 1, '#ffffff');
    R(9, 6, 3, 3, '#ffffff');
    R(10, 7, 1, 1, '#ffc93d');
  }
  if (av.acc === 5) {
    R(9, 2, 14, 1, INK);
    R(7, 3, 2, 1, INK);
    R(23, 3, 2, 1, INK);
    R(7, 4, 1, 5, INK);
    R(24, 4, 1, 5, INK);
    R(6, 9, 3, 6, '#ff6b6b');
    R(6, 9, 1, 6, '#d94545');
    R(24, 9, 2, 5, '#d94545');
  }
}

const spriteCache = new Map();

// 외곽선까지 포함한 스프라이트 캔버스를 돌려준다. (SPRITE_W x SPRITE_H)
function getSprite(av, back, frame, flip) {
  const key = `${Object.values(av).join(',')}|${back ? 1 : 0}${frame}${flip ? 1 : 0}`;
  let out = spriteCache.get(key);
  if (out) return out;
  const tmp = document.createElement('canvas');
  tmp.width = AV_W;
  tmp.height = AV_H;
  paintAvatar(tmp.getContext('2d'), av, back, frame, flip);
  out = outlineSprite(tmp, '#4a3548');
  if (spriteCache.size > 2000) spriteCache.clear();
  spriteCache.set(key, out);
  return out;
}

// 그림 둘레에 1픽셀 외곽선을 두른 새 캔버스 (사방 1픽셀씩 커진다)
function outlineSprite(src, color) {
  const out = document.createElement('canvas');
  out.width = src.width + 2;
  out.height = src.height + 2;
  const o = out.getContext('2d');
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) o.drawImage(src, dx, dy);
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = color;
  o.fillRect(0, 0, out.width, out.height);
  o.globalCompositeOperation = 'source-over';
  o.drawImage(src, 1, 1);
  return out;
}
