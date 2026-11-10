// 픽셀 아바타 그리기. 24x34 격자에 사각형을 찍고, 외곽선을 둘러 캐시한다.
const AV_W = 24;
const AV_H = 34;
const SPRITE_W = AV_W + 2;
const SPRITE_H = AV_H + 2;

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
    ctx.fillStyle = c;
    ctx.fillRect(flip ? AV_W - x - w : x, y, w, h);
  };
  const both = (x, y, w, h, c) => {
    R(x, y, w, h, c);
    R(AV_W - x - w, y, w, h, c);
  };
  const skin = SPEC.colors.skin[av.skin];
  const skinD = shade(skin, 0.86);
  const hc = SPEC.colors.hairColor[av.hairColor];
  const hd = shade(hc, 0.78);
  const tc = SPEC.colors.topColor[av.topColor];
  const td = shade(tc, 0.82);
  const bc = SPEC.colors.bottomColor[av.bottomColor];
  const bd = shade(bc, 0.82);
  const INK = '#2b2233';

  const bw = [8, 10, 12][av.body];
  const bx = 12 - bw / 2;
  const lw = [3, 4, 5][av.body];

  const hairBack = () => {
    if (av.hair === 2) R(4, 6, 16, 17, hd);
    if (av.hair === 3) {
      both(2, 8, 3, 9, hc);
      both(2, 16, 3, 1, hd);
      both(4, 8, 1, 2, '#ff6b8f');
    }
    if (av.hair === 4) {
      R(18, 6, 4, 3, hc);
      R(19, 9, 4, 8, hc);
      R(20, 16, 2, 2, hd);
    }
  };

  if (!back) hairBack();

  // 다리와 하의
  const lift = [0, frame === 1 ? 1 : 0, frame === 2 ? 1 : 0];
  const legX = [0, 11 - lw, 13];
  for (const i of [1, 2]) {
    const up = lift[i];
    const legColor = av.bottom === 1 || av.bottom === 2 ? skin : bc;
    R(legX[i], 27, lw, 4 - up, legColor);
    if (av.bottom === 1) R(legX[i], 27, lw, 1, bc);
    R(legX[i], 31 - up, lw, 2, INK);
    R(legX[i], 31 - up, lw, 1, '#4a4058');
  }
  if (av.bottom === 2) {
    R(bx, 25, bw, 2, bc);
    R(bx - 1, 27, bw + 2, 2, bc);
    R(bx - 1, 28, bw + 2, 1, bd);
  } else {
    R(bx, 25, bw, 2, bc);
    R(11, 26, 2, 1, bd);
  }

  // 몸통과 팔
  R(bx, 16, bw, 9, tc);
  R(bx, 24, bw, 1, td);
  const sleeve = av.top === 4 ? 0 : av.top === 1 || av.top === 3 ? 6 : 3;
  const armDy = [0, frame === 1 ? 1 : frame === 2 ? -1 : 0, frame === 2 ? 1 : frame === 1 ? -1 : 0];
  const armX = [0, bx - 2, bx + bw];
  for (const i of [1, 2]) {
    const y = 16 + Math.max(0, armDy[i]);
    R(armX[i], y, 2, 8, skin);
    if (sleeve) R(armX[i], y, 2, sleeve, i === 1 ? tc : td);
  }
  if (!back) {
    if (av.top === 1) {
      R(bx + 2, 21, bw - 4, 2, td);
      R(11, 17, 1, 2, '#ffffff');
      R(13, 17, 1, 2, '#ffffff');
    }
    if (av.top === 2) for (const y of [18, 20, 22]) R(bx, y, bw, 1, shade(tc, 0.7));
    if (av.top === 3) {
      R(10, 16, 1, 1, '#ffffff');
      R(13, 16, 1, 1, '#ffffff');
      for (const y of [18, 20, 22]) R(12, y, 1, 1, shade(tc, 0.6));
    }
    if (av.top === 4) R(10, 16, 4, 1, skin);
  } else if (av.top === 1) {
    R(9, 16, 6, 2, td);
  }
  if (av.bottom === 3) {
    R(bx + 1, 16, 2, 9, bc);
    R(bx + bw - 3, 16, 2, 9, bc);
    if (!back) R(bx + 1, 20, bw - 2, 5, bc);
    else R(bx + 1, 22, bw - 2, 3, bc);
  }

  // 머리
  R(6, 4, 12, 1, skin);
  R(5, 5, 14, 10, skin);
  R(6, 15, 12, 1, skinD);

  if (!back) {
    // 얼굴
    const f = av.face;
    if (f === 0 || f === 4) both(8, 10, 2, 2, INK);
    if (f === 1) {
      both(8, 9, 2, 3, INK);
      R(8, 9, 1, 1, '#ffffff');
      R(14, 9, 1, 1, '#ffffff');
    }
    if (f === 2) {
      both(7, 11, 1, 1, INK);
      both(8, 10, 1, 1, INK);
      both(9, 11, 1, 1, INK);
    }
    if (f === 3) both(8, 11, 2, 1, INK);
    if (f === 4) both(7, 8, 3, 1, hd);
    if (f === 5) {
      R(8, 10, 2, 2, INK);
      R(14, 11, 2, 1, INK);
    }
    if (av.gender === 0 && f !== 2) both(7, 10, 1, 1, INK);
    if (f === 1 || f === 2 || f === 5) both(6, 12, 2, 1, '#ff9aa8');
    if (f === 5) R(11, 13, 2, 2, '#c4455a');
    else if (f === 4) R(10, 13, 3, 1, '#a8566a');
    else R(11, 13, 2, 1, '#c4455a');

    // 앞머리
    const cap = () => {
      R(6, 3, 12, 1, hc);
      R(5, 4, 14, 3, hc);
    };
    switch (av.hair) {
      case 0:
        cap();
        both(4, 5, 2, 5, hc);
        R(5, 7, 4, 1, hc);
        break;
      case 1:
        cap();
        both(4, 5, 2, 11, hc);
        R(5, 7, 14, 1, hc);
        both(4, 15, 2, 1, hd);
        break;
      case 2:
        cap();
        both(4, 5, 2, 12, hc);
        both(5, 7, 5, 1, hc);
        break;
      case 3:
        cap();
        both(4, 5, 1, 4, hc);
        R(5, 7, 14, 1, hc);
        break;
      case 4:
        cap();
        both(4, 5, 1, 4, hc);
        R(5, 7, 6, 1, hc);
        break;
      case 5:
        cap();
        both(4, 5, 1, 3, hc);
        R(7, 1, 2, 2, hc);
        R(11, 0, 2, 3, hc);
        R(15, 1, 2, 2, hc);
        break;
      case 6:
        cap();
        R(9, 0, 6, 3, hc);
        R(10, 2, 4, 1, hd);
        both(4, 5, 2, 6, hc);
        both(5, 7, 3, 1, hc);
        break;
      case 7:
        R(6, 3, 12, 1, hd);
        R(5, 4, 14, 2, hd);
        break;
      case 8:
        R(4, 1, 16, 2, hc);
        R(3, 3, 18, 5, hc);
        both(3, 8, 2, 4, hc);
        for (const [x, y] of [[6, 2], [10, 4], [15, 2], [18, 5], [4, 6], [12, 6]]) R(x, y, 1, 1, hd);
        break;
    }
  } else {
    // 뒷모습: 머리카락이 머리를 덮는다
    if (av.hair === 7) {
      R(6, 3, 12, 1, hd);
      R(5, 4, 14, 6, hd);
    } else {
      R(6, 3, 12, 1, hc);
      R(5, 4, 14, 11, hc);
      R(6, 15, 12, 1, hd);
    }
    if (av.hair === 1) both(4, 5, 2, 11, hc);
    if (av.hair === 2) {
      R(4, 5, 16, 18, hc);
      R(4, 22, 16, 1, hd);
    }
    if (av.hair === 5) {
      R(7, 1, 2, 2, hc);
      R(11, 0, 2, 3, hc);
      R(15, 1, 2, 2, hc);
    }
    if (av.hair === 6) R(9, 0, 6, 3, hc);
    if (av.hair === 8) {
      R(4, 1, 16, 2, hc);
      R(3, 3, 18, 9, hc);
    }
    hairBack();
  }

  // 악세서리
  if (av.acc === 1 && !back) {
    for (const x of [7, 13]) {
      R(x, 9, 4, 1, INK);
      R(x, 12, 4, 1, INK);
      R(x, 9, 1, 4, INK);
      R(x + 3, 9, 1, 4, INK);
    }
    R(11, 10, 2, 1, INK);
  }
  if (av.acc === 2) {
    R(14, 2, 2, 3, '#ff4f7b');
    R(18, 2, 2, 3, '#ff4f7b');
    R(16, 3, 2, 1, '#d93863');
  }
  if (av.acc === 3) {
    R(7, 1, 10, 1, '#3f7fe0');
    R(5, 2, 14, 3, '#3f7fe0');
    if (!back) R(4, 5, 16, 1, '#2c5fb5');
  }
  if (av.acc === 4 && !back) {
    R(5, 4, 3, 1, '#ffffff');
    R(6, 3, 1, 3, '#ffffff');
    R(6, 4, 1, 1, '#ffc93d');
  }
  if (av.acc === 5) {
    R(5, 2, 14, 1, INK);
    both(3, 7, 2, 4, '#ff5a5a');
    both(4, 3, 1, 4, INK);
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
  out = document.createElement('canvas');
  out.width = SPRITE_W;
  out.height = SPRITE_H;
  const o = out.getContext('2d');
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) o.drawImage(tmp, dx, dy);
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = '#2b2233';
  o.fillRect(0, 0, SPRITE_W, SPRITE_H);
  o.globalCompositeOperation = 'source-over';
  o.drawImage(tmp, 1, 1);
  if (spriteCache.size > 2000) spriteCache.clear();
  spriteCache.set(key, out);
  return out;
}
