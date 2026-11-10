// 픽셀 미니미 그리기. 대각선(오른쪽 아래)을 바라보는 캐릭터를 격자에 찍고,
// 외곽선을 둘러 캐시한다. 왼쪽을 볼 때는 좌우 반전, 위쪽으로 걸을 때는 뒷모습을 쓴다.
// 몸은 가로 0..31, 세로 0..41 좌표에 그리고, 날개·귀·풍선이 들어가도록 사방에 여백을 둔다.
const AV_PADX = 8;
const AV_PADY = 9;
const AV_W = 32 + AV_PADX * 2;
const AV_H = 42 + AV_PADY;
const SPRITE_W = AV_W + 2;
const SPRITE_H = AV_H + 2;
const AV_FOOT = 42 + AV_PADY; // 스프라이트 안에서 발바닥 높이
const AV_HEAD = AV_PADY; // 스프라이트 안에서 머리 꼭대기 높이

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
  av.skin = Math.floor(Math.random() * 5); // 랜덤은 자연스러운 피부색 위주
  if (Math.random() < 0.35) av.acc = 0;
  if (Math.random() < 0.5) av.back = 0;
  if (Math.random() < 0.6) av.hand = 0;
  return av;
}

function paintAvatar(ctx, av, back, frame, flip) {
  const R = (x, y, w, h, c) => {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = c;
    ctx.fillRect(flip ? AV_W - (x + AV_PADX) - w : x + AV_PADX, y + AV_PADY, w, h);
  };
  // 몸 중심(x=16) 기준 좌우 대칭으로 두 번 그린다
  const both = (x, y, w, h, c) => {
    R(x, y, w, h, c);
    R(32 - x - w, y, w, h, c);
  };
  // 모서리를 깎은 둥근 사각형 (x0..x1, y0..y1 포함, 높이 5 이상)
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
  const eye = SPEC.colors.eyeColor[av.eyeColor];
  const eyeL = shade(eye, 1.5);
  const hc = SPEC.colors.hairColor[av.hairColor];
  const hd = shade(hc, 0.76);
  const hl = shade(hc, 1.22);
  const tc = SPEC.colors.topColor[av.topColor];
  const td = shade(tc, 0.8);
  const bc = SPEC.colors.bottomColor[av.bottomColor];
  const bd = shade(bc, 0.8);
  const INK = '#3a2a40';
  const PINK = '#ff6f9c';
  const WHITE = '#ffffff';
  const WHITE_D = '#dcdcea';
  const GOLD = '#ffd23f';

  const bw = [6, 8, 10][av.body];
  const bx = 16 - bw / 2;
  const lw = [2, 3, 4][av.body];
  const liftN = frame === 1 ? 1 : 0;
  const liftF = frame === 2 ? 1 : 0;
  const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const top = av.top;
  const bot = av.bottom;
  const bare = [1, 2, 4, 5, 6].includes(bot);
  const whiteBody = top === 5 || top === 9; // 세일러복·케이프는 흰 블라우스 바탕
  const bodyC = whiteBody ? WHITE : tc;
  const bodyD = whiteBody ? WHITE_D : td;
  // 소매: 길이와 색, 소매 끝단 색
  const slLen = top === 4 ? 0 : [1, 6, 8].includes(top) ? 7 : top === 9 ? 5 : top === 3 ? 7 : 3;
  const slC = top === 5 ? WHITE : tc;
  const slD = top === 5 ? WHITE_D : td;
  const cuff = top === 5 ? tc : top === 7 || top === 8 ? WHITE : null;

  // ---- 등에 다는 것 (앞모습에서는 몸 뒤에 깔린다) ----
  const backItem = () => {
    if (av.back === 1) {
      both(2, 19, 7, 3, WHITE);
      both(0, 21, 9, 4, WHITE);
      both(1, 25, 8, 3, WHITE);
      both(3, 28, 5, 2, WHITE_D);
      both(1, 24, 3, 1, WHITE_D);
      both(4, 27, 3, 1, WHITE_D);
    }
    if (av.back === 2) {
      const w1 = '#6b4a9c';
      const w2 = '#4a3272';
      both(3, 17, 2, 3, w1);
      both(1, 19, 8, 3, w1);
      both(0, 22, 9, 3, w1);
      both(0, 25, 2, 3, w1);
      both(3, 25, 2, 2, w1);
      both(6, 25, 3, 3, w1);
      both(2, 21, 1, 4, w2);
      both(5, 21, 1, 4, w2);
    }
    if (av.back === 3) {
      both(0, 16, 9, 8, '#ffb3d9');
      both(1, 15, 6, 1, '#ffb3d9');
      both(2, 24, 7, 6, '#c9a8ff');
      both(3, 30, 4, 1, '#c9a8ff');
      both(2, 18, 3, 3, WHITE);
      both(4, 26, 2, 2, WHITE);
      both(0, 16, 1, 8, '#ff8fc4');
    }
    if (av.back === 4) {
      if (back) {
        round(10, 21, 21, 33, '#ff7a7a');
        R(12, 27, 8, 5, '#e05c5c');
        R(15, 28, 2, 1, GOLD);
        R(12, 20, 8, 2, '#e05c5c');
      } else {
        R(bx - 3, 23, 2, 8, '#e05c5c');
        R(bx + bw + 1, 23, 2, 8, '#c94a4a');
      }
    }
    if (av.back === 5) {
      round(-4, 22, 3, 35, '#f5a04a');
      R(1, 32, 7, 4, '#f5a04a');
      R(3, 36, 5, 1, '#d98432');
      R(-2, 22, 4, 1, WHITE);
      R(-3, 23, 6, 3, WHITE);
      R(-4, 28, 1, 5, '#d98432');
    }
    if (av.back === 6) {
      R(4, 35, 6, 2, hc);
      R(2, 30, 2, 6, hc);
      R(3, 27, 2, 3, hc);
      R(4, 26, 2, 1, hd);
    }
  };

  // ---- 손에 든 것 ----
  const handItem = () => {
    const hx = bx - 3;
    if (av.hand === 1) {
      const sx = bx + bw + 4;
      R(sx, 9, 1, 22, '#f2f2fa');
      R(bx + bw + 1, 30, 4, 1, '#f2f2fa');
      round(sx - 4, -4, sx + 4, 7, '#ff7f9f');
      R(sx - 2, -2, 2, 3, '#ffc2d4');
      R(sx - 1, 8, 3, 1, '#e05c80');
    }
    if (av.hand === 2) {
      R(hx, 24, 1, 7, WHITE);
      round(hx - 3, 17, hx + 3, 23, '#ff8fc4');
      dots([[hx - 1, 19], [hx, 19], [hx + 1, 20], [hx, 21], [hx - 1, 21]], WHITE);
    }
    if (av.hand === 3) {
      R(hx, 21, 1, 10, '#ffe9a8');
      R(hx, 13, 1, 7, GOLD);
      R(hx - 3, 16, 7, 1, GOLD);
      R(hx - 2, 15, 5, 3, GOLD);
      R(hx - 1, 14, 3, 5, GOLD);
      R(hx - 1, 15, 1, 1, '#fff6c0');
    }
    if (av.hand === 4) {
      const t = '#c98f5c';
      R(hx - 4, 25, 2, 2, t);
      R(hx + 1, 25, 2, 2, t);
      round(hx - 4, 26, hx + 2, 31, t);
      R(hx - 3, 32, 5, 4, t);
      R(hx - 2, 33, 3, 2, '#e8c49a');
      dots([[hx - 2, 28], [hx, 28]], INK);
      R(hx - 2, 29, 3, 2, '#e8c49a');
      R(hx - 1, 29, 1, 1, INK);
    }
  };

  if (!back) backItem();
  if (back) handItem();

  // ---- 머리카락 중 몸 뒤로 가는 부분 ----
  if (!back) {
    if (av.hair === 2) {
      R(5, 12, 11, 19, hc);
      R(5, 12, 1, 19, hd);
      R(6, 31, 9, 1, hd);
    }
    if (av.hair === 10) {
      R(5, 12, 12, 18, hc);
      R(4, 16, 2, 5, hc);
      R(4, 25, 2, 4, hc);
      R(6, 30, 9, 1, hd);
    }
    if (av.hair === 3) {
      round(25, 10, 30, 24, hc);
      R(30, 13, 1, 9, hd);
      R(26, 24, 3, 1, hd);
    }
    if (av.hair === 4) {
      round(0, 6, 7, 22, hc);
      R(0, 9, 1, 10, hd);
      R(2, 22, 4, 1, hd);
      R(3, 9, 2, 1, hl);
    }
  }

  // ---- 다리와 신발 ----
  const SHOES = [
    ['#f6f2fa', '#b8aec4'],
    ['#9a6a48', '#6e4930'],
    ['#3a2a40', '#241a2a'],
    ['#ff9fc0', '#d9739a'],
    ['#5b5bd6', '#3f3fa8'],
    ['#ffd93d', '#d9ae1a'],
  ][av.shoes];
  const leg = (x, len, lift, near) => {
    const legC = bot === 7 ? (near ? bc : bd) : bare ? (near ? skin : skinD) : near ? bc : bd;
    const n = len - lift;
    R(x, 35, lw, n, legC);
    if (bot === 1) R(x, 35, lw, 1, near ? bc : bd);
    const end = 35 + n; // 신발 시작 높이
    if (bare || bot === 7) {
      if (av.shoes === 3) R(x, 36, lw, n - 1, near ? WHITE : WHITE_D);
      if (av.shoes === 4) {
        R(x, 36, lw, n - 1, near ? WHITE : WHITE_D);
        for (let y = 36; y < end; y += 2) R(x, y, lw, 1, PINK);
      }
      if (av.shoes === 2) R(x, end - 1, lw, 1, near ? WHITE : WHITE_D);
    }
    if (av.shoes === 1 || av.shoes === 5) R(x, end - 2, lw, 2, near ? SHOES[0] : SHOES[1]);
    R(x, end, lw + 1, 2, near ? SHOES[0] : shade(SHOES[0], 0.86));
    R(x, end + 1, lw + 1, 1, SHOES[1]);
  };

  // 먼 쪽 팔
  const fax = bx + bw - 1;
  const fay = 23 - swing;
  R(fax, fay, 2, 9, skinD);
  R(fax, fay, 2, slLen, slD);
  if (cuff && slLen) R(fax, fay + slLen - 1, 2, 1, shade(cuff, 0.86));

  leg(bx + bw - lw, 3, liftF, false);
  leg(bx, 4, liftN, true);

  // ---- 엉덩이/치마 ----
  if (bot === 2) {
    R(bx, 32, bw, 2, bc);
    R(bx - 1, 34, bw + 2, 3, bc);
    R(bx + bw - 1, 32, 2, 5, bd);
    R(bx - 1, 36, bw + 2, 1, bd);
  } else if (bot === 4) {
    R(bx - 1, 32, bw + 2, 5, bc);
    for (let x = bx; x < bx + bw + 1; x += 2) R(x, 33, 1, 4, bd);
    R(bx - 1, 32, bw + 2, 1, shade(bc, 1.12));
  } else if (bot === 5) {
    R(bx - 1, 32, bw + 2, 2, bc);
    R(bx - 2, 33, bw + 4, 1, WHITE);
    R(bx - 2, 34, bw + 4, 2, bc);
    R(bx - 2, 36, bw + 4, 1, WHITE);
    for (let x = bx - 2; x < bx + bw + 2; x += 2) R(x, 36, 1, 1, WHITE_D);
    R(bx + bw, 34, 2, 2, bd);
  } else if (bot === 6) {
    R(bx - 1, 32, bw + 2, 4, bc);
    R(bx - 1, 36, lw + 1, 1, bd);
    R(bx + bw - lw, 36, lw + 1, 1, bd);
    R(bx + bw - 1, 32, 2, 4, bd);
    R(bx, 33, 2, 1, shade(bc, 1.14));
  } else if (bot === 7) {
    R(bx, 32, bw, 2, bc);
    R(bx - 1, 34, bw + 2, 5, bc);
    R(bx + bw - 1, 32, 2, 7, bd);
    R(bx - 1, 38, bw + 2, 1, bd);
    for (let x = bx; x < bx + bw; x += 3) R(x, 35, 1, 3, bd);
  } else {
    R(bx, 32, bw, 3, bc);
    R(bx + bw - 2, 32, 2, 3, bd);
    R(bx + lw, 34, bw - 2 * lw, 1, bd);
  }

  // ---- 몸통 ----
  R(14, 21, 4, 1, skinD);
  R(bx, 22, bw, 10, bodyC);
  R(bx + bw - 2, 22, 2, 10, bodyD);
  R(bx, 31, bw, 1, bodyD);
  if (top === 2) for (const y of [24, 26, 28, 30]) R(bx, y, bw, 1, shade(tc, 0.7));
  if (!back) {
    if (top === 0) {
      R(14, 22, 4, 1, td);
      const print = av.topColor === 0 ? PINK : WHITE;
      dots([[14, 25], [16, 25], [15, 27]], print);
      R(14, 26, 3, 1, print);
    }
    if (top === 1) {
      R(bx + 1, 22, bw - 2, 1, td);
      R(bx + 1, 27, bw - 3, 3, td);
      R(15, 23, 1, 3, WHITE);
      R(17, 23, 1, 3, WHITE);
    }
    if (top === 3) {
      R(13, 22, 2, 1, WHITE);
      R(17, 22, 2, 1, WHITE);
      R(15, 22, 2, 2, '#e0495c');
      R(15, 24, 2, 4, '#ff6b7f');
      R(15, 28, 1, 1, '#ff6b7f');
    }
    if (top === 4) {
      R(14, 22, 4, 1, skin);
      R(bx, 22, 1, 2, skin);
    }
    if (top === 6) {
      R(15, 22, 2, 10, '#fff8f0');
      R(14, 22, 1, 10, td);
      for (const y of [24, 27, 30]) R(17, y, 1, 1, '#ffe08a');
    }
    if (top === 7) {
      R(bx, 22, bw, 2, WHITE);
      for (let x = bx; x < bx + bw; x += 2) R(x, 23, 1, 1, WHITE_D);
      R(15, 24, 2, 7, WHITE);
      for (const y of [25, 27, 29]) R(16, y, 1, 1, WHITE_D);
      R(15, 23, 2, 1, PINK);
    }
    if (top === 8) {
      R(15, 22, 2, 5, WHITE);
      R(14, 22, 1, 5, td);
      R(17, 22, 1, 5, td);
      R(15, 23, 1, 3, '#e0495c');
      R(16, 28, 1, 1, GOLD);
      R(16, 30, 1, 1, GOLD);
      R(bx + 1, 25, 2, 1, GOLD);
    }
  } else {
    if (top === 1) R(12, 22, 8, 3, td);
    if (top === 5) {
      R(bx, 22, bw, 4, tc);
      R(bx + 1, 24, bw - 2, 1, WHITE);
    }
  }
  if (bot === 3) {
    R(bx + 1, 22, 1, 5, bc);
    R(bx + bw - 2, 22, 1, 5, bc);
    R(bx + 1, back ? 28 : 26, bw - 2, back ? 4 : 6, bc);
    if (!back) R(bx + 2, 27, 1, 1, '#ffe08a');
  }

  // ---- 가까운 쪽 팔 ----
  const nay = 22 + Math.max(0, swing);
  R(bx - 2, nay, 3, 9, skin);
  R(bx - 2, nay, 3, slLen, slC);
  R(bx, nay + 1, 1, 8, skinD);
  R(bx, nay + 1, 1, Math.max(0, slLen - 1), slD);
  if (top === 7) R(bx - 3, nay, 1, 2, tc); // 퍼프 소매
  if (cuff && slLen) R(bx - 2, nay + slLen - 1, 3, 1, cuff);

  // ---- 팔 위에 덮이는 옷 장식 ----
  if (top === 5 && !back) {
    R(bx - 2, 22, bw + 4, 2, tc);
    R(bx - 1, 24, 3, 1, tc);
    R(bx + bw - 2, 24, 3, 1, td);
    R(bx - 1, 23, bw + 2, 1, WHITE);
    R(14, 22, 4, 2, skin);
    R(15, 24, 2, 2, '#ff5c7a');
    dots([[14, 26], [17, 26]], '#ff5c7a');
  }
  if (top === 9) {
    R(bx - 3, 22, bw + 6, 5, tc);
    R(bx + bw + 1, 22, 2, 5, td);
    R(bx - 3, 27, bw + 6, 1, WHITE);
    for (let x = bx - 3; x < bx + bw + 3; x += 2) R(x, 27, 1, 1, WHITE_D);
    if (!back) {
      R(14, 22, 4, 2, GOLD);
      R(15, 23, 2, 2, '#e0a800');
    }
  }

  // ---- 머리 ----
  round(8, 6, 23, 20, skin);
  R(11, 20, 10, 1, skinD);
  R(23, 10, 1, 8, skinD);

  const cap = () => {
    R(10, 2, 12, 1, hc);
    R(8, 3, 16, 1, hc);
    R(7, 4, 18, 1, hc);
    R(6, 5, 20, 5, hc);
    R(6, 10, 5, 8, hc);
    R(7, 18, 3, 1, hd);
    R(6, 7, 1, 11, hd);
    R(23, 10, 3, 4, hc);
    R(25, 8, 1, 6, hd);
    R(11, 4, 7, 1, hl);
    R(19, 4, 2, 1, hl);
    R(10, 5, 2, 1, hl);
  };

  if (!back) {
    // 얼굴: 눈동자 색이 들어간 큰 눈
    const f = av.face;
    const openEye = (x, w, y) => {
      R(x, y, w, 1, INK);
      R(x, y + 1, 1, 15 - y - 1, INK);
      R(x + 1, y + 1, w - 1, 15 - y - 1, eye);
      R(x + w - 1, y + 1, 1, 1, WHITE);
      R(x + 1, 15, w - 1, 1, eyeL);
    };
    const arc = (x) => dots([[x, 14], [x + 1, 13], [x + 2, 14]], INK);
    if (f === 0 || f === 4) {
      openEye(12, 3, 12);
      openEye(19, 2, 12);
    }
    if (f === 1) {
      openEye(12, 3, 11);
      openEye(19, 2, 11);
      R(13, 14, 1, 1, WHITE);
    }
    if (f === 2) {
      arc(12);
      R(13, 13, 2, 1, INK);
      R(15, 14, 1, 1, INK);
      arc(19);
    }
    if (f === 3) {
      R(12, 13, 3, 1, INK);
      R(13, 14, 2, 1, eye);
      R(19, 13, 2, 1, INK);
      R(20, 14, 1, 1, eye);
    }
    if (f === 4) {
      R(11, 10, 4, 1, hd);
      R(19, 10, 3, 1, hd);
    }
    if (f === 5) {
      openEye(12, 3, 12);
      arc(19);
    }
    if (av.gender === 0 && (f === 0 || f === 1 || f === 4 || f === 5)) {
      R(11, f === 1 ? 11 : 12, 1, 1, INK);
      if (f !== 5) R(21, f === 1 ? 11 : 12, 1, 1, INK);
    }
    if (f !== 4) {
      R(10, 17, 2, 1, '#ff9fb0');
      R(21, 17, 2, 1, '#ff9fb0');
    }
    if (f === 2 || f === 5) R(16, 17, 2, 2, '#d0556a');
    else if (f === 4) R(16, 18, 3, 1, '#b0607a');
    else R(16, 18, 2, 1, '#d0556a');

    // 앞머리
    switch (av.hair) {
      case 0:
        cap();
        R(11, 10, 10, 1, hc);
        R(11, 11, 5, 1, hc);
        R(11, 12, 2, 1, hc);
        break;
      case 1:
        cap();
        R(11, 10, 12, 2, hc);
        dots([[13, 11], [17, 11], [21, 11]], hd);
        R(6, 10, 6, 13, hc);
        R(6, 10, 1, 13, hd);
        R(7, 23, 4, 1, hd);
        R(23, 10, 3, 11, hc);
        R(25, 10, 1, 11, hd);
        R(23, 21, 2, 1, hd);
        break;
      case 2:
        cap();
        R(11, 10, 4, 2, hc);
        R(19, 10, 4, 2, hc);
        R(15, 10, 4, 1, hc);
        R(6, 10, 5, 16, hc);
        R(6, 10, 1, 16, hd);
        R(23, 10, 3, 13, hc);
        R(25, 10, 1, 13, hd);
        R(23, 23, 2, 1, hd);
        break;
      case 3:
        cap();
        R(11, 10, 12, 1, hc);
        dots([[12, 11], [15, 11], [18, 11], [21, 11]], hc);
        round(0, 10, 6, 26, hc);
        R(0, 13, 1, 10, hd);
        R(2, 26, 3, 1, hd);
        R(2, 13, 1, 4, hl);
        R(5, 10, 2, 3, PINK);
        R(25, 11, 1, 2, PINK);
        break;
      case 4:
        cap();
        R(11, 10, 8, 1, hc);
        R(11, 11, 3, 1, hc);
        R(6, 8, 2, 2, PINK);
        break;
      case 5:
        cap();
        R(11, 10, 2, 2, hc);
        R(15, 10, 2, 2, hc);
        R(19, 10, 2, 1, hc);
        R(9, 0, 3, 2, hc);
        R(14, -1, 3, 3, hc);
        R(19, 0, 3, 2, hc);
        R(5, 2, 2, 3, hc);
        R(24, 2, 2, 3, hc);
        break;
      case 6:
        cap();
        round(12, -3, 19, 3, hc);
        R(13, 3, 6, 1, hd);
        R(13, -2, 3, 1, hl);
        R(11, 10, 5, 1, hc);
        R(18, 10, 5, 1, hc);
        break;
      case 7:
        R(9, 5, 14, 1, hd);
        R(8, 6, 16, 3, hd);
        R(8, 9, 3, 4, hd);
        break;
      case 8:
        round(4, 0, 27, 10, hc);
        round(3, 7, 10, 16, hc);
        round(22, 7, 28, 14, hc);
        R(11, 10, 12, 1, hc);
        R(9, 2, 5, 1, hl);
        R(16, 1, 4, 1, hl);
        dots([[7, 6], [13, 7], [19, 6], [24, 8], [5, 12], [16, 9], [22, 4], [8, 13]], hd);
        break;
      case 9:
        cap();
        round(3, -1, 10, 6, hc);
        round(21, -1, 28, 6, hc);
        R(5, 0, 2, 1, hl);
        R(23, 0, 2, 1, hl);
        R(4, 6, 6, 1, hd);
        R(22, 6, 6, 1, hd);
        R(11, 10, 12, 1, hc);
        dots([[12, 11], [16, 11], [20, 11]], hc);
        break;
      case 10:
        cap();
        R(11, 10, 9, 2, hc);
        R(11, 12, 3, 1, hc);
        R(5, 10, 6, 6, hc);
        R(4, 16, 6, 6, hc);
        R(5, 22, 6, 6, hc);
        R(4, 28, 5, 3, hc);
        R(4, 16, 1, 6, hd);
        R(5, 22, 1, 6, hd);
        R(23, 10, 3, 6, hc);
        R(24, 16, 3, 6, hc);
        R(23, 22, 3, 5, hc);
        R(26, 16, 1, 6, hd);
        R(24, 27, 2, 1, hd);
        R(7, 14, 1, 4, hl);
        break;
    }
  } else {
    // 뒷모습: 머리카락이 머리를 덮고, 오른쪽에 볼만 살짝 보인다
    if (av.hair === 7) {
      R(9, 5, 14, 1, hd);
      R(8, 6, 15, 8, hd);
    } else {
      round(6, 2, 25, 20, hc);
      R(23, 13, 2, 5, skin);
      R(6, 7, 1, 11, hd);
      R(9, 20, 14, 1, hd);
      R(10, 5, 9, 1, hl);
      R(9, 6, 2, 1, hl);
    }
    if (av.hair === 1) {
      R(6, 18, 19, 5, hc);
      R(7, 23, 17, 1, hd);
    }
    if (av.hair === 2) {
      R(6, 12, 19, 19, hc);
      R(6, 12, 1, 19, hd);
      R(7, 31, 17, 1, hd);
    }
    if (av.hair === 3) {
      round(0, 10, 6, 26, hc);
      round(25, 10, 31, 26, hc);
      R(5, 10, 2, 3, PINK);
      R(24, 10, 2, 3, PINK);
    }
    if (av.hair === 4) {
      round(12, 8, 19, 27, hc);
      R(12, 11, 1, 13, hd);
      R(13, 7, 6, 2, PINK);
    }
    if (av.hair === 5) {
      R(9, 0, 3, 2, hc);
      R(14, -1, 3, 3, hc);
      R(19, 0, 3, 2, hc);
    }
    if (av.hair === 6) {
      round(12, -3, 19, 3, hc);
      R(13, 3, 6, 1, hd);
    }
    if (av.hair === 8) {
      round(3, 0, 28, 18, hc);
      dots([[7, 6], [13, 7], [19, 6], [24, 9], [9, 13], [16, 11], [22, 14]], hd);
    }
    if (av.hair === 9) {
      round(3, -1, 10, 6, hc);
      round(21, -1, 28, 6, hc);
      R(4, 6, 6, 1, hd);
      R(22, 6, 6, 1, hd);
    }
    if (av.hair === 10) {
      R(5, 12, 21, 16, hc);
      R(4, 16, 23, 6, hc);
      R(6, 28, 5, 3, hc);
      R(13, 28, 6, 2, hc);
      R(21, 28, 4, 3, hc);
      R(4, 16, 1, 6, hd);
      dots([[9, 16], [15, 18], [20, 15], [11, 23], [18, 24]], hd);
    }
  }

  // ---- 머리 장식 ----
  const a = av.acc;
  if (a === 1 && !back) {
    const rim = '#7a5a8c';
    R(11, 16, 5, 1, rim);
    R(11, 11, 1, 6, rim);
    R(15, 11, 1, 6, rim);
    R(11, 11, 5, 1, rim);
    R(18, 16, 4, 1, rim);
    R(18, 11, 1, 6, rim);
    R(21, 11, 1, 6, rim);
    R(18, 11, 4, 1, rim);
    R(16, 13, 2, 1, rim);
  }
  if (a === 2) {
    R(7, 1, 4, 5, PINK);
    R(13, 1, 4, 5, PINK);
    R(11, 2, 2, 3, '#d93863');
    R(8, 2, 1, 2, '#ffb3cc');
    R(14, 2, 1, 2, '#ffb3cc');
  }
  if (a === 3) {
    R(10, 0, 12, 1, '#5b9bff');
    R(8, 1, 16, 2, '#5b9bff');
    R(6, 3, 20, 5, '#5b9bff');
    R(23, 3, 3, 5, '#3f7fe0');
    R(10, 1, 6, 1, '#8fbcff');
    if (!back) {
      R(15, 8, 13, 2, '#3f7fe0');
      R(15, 9, 13, 1, '#2c5fb5');
      R(12, 4, 3, 3, WHITE);
    }
  }
  if (a === 4 && !back) {
    R(9, 4, 1, 7, WHITE);
    R(6, 7, 7, 1, WHITE);
    R(7, 5, 5, 5, WHITE);
    R(8, 6, 3, 3, '#ffd0e0');
    R(9, 7, 1, 1, '#ffc93d');
  }
  if (a === 5) {
    R(9, 1, 14, 1, INK);
    R(7, 2, 2, 1, INK);
    R(23, 2, 2, 1, INK);
    R(6, 3, 1, 6, INK);
    R(25, 3, 1, 6, INK);
    R(5, 9, 3, 6, '#ff6b6b');
    R(5, 9, 1, 6, '#d94545');
    R(24, 9, 3, 5, '#d94545');
  }
  if (a === 6) {
    for (const [x0, dir] of [[6, 1], [25, -1]]) {
      R(x0 + (dir > 0 ? 2 : -2), -3, 1, 1, hc);
      R(dir > 0 ? x0 + 1 : x0 - 3, -2, 3, 1, hc);
      R(dir > 0 ? x0 : x0 - 4, -1, 5, 2, hc);
      R(dir > 0 ? x0 : x0 - 5, 1, 6, 2, hc);
      R(dir > 0 ? x0 + 2 : x0 - 2, -1, 1, 3, '#ffb3cc');
    }
  }
  if (a === 7) {
    round(8, -8, 12, 3, WHITE);
    R(9, -6, 3, 8, '#ffc2d4');
    round(19, -7, 23, 3, WHITE);
    R(20, -5, 3, 7, '#ffc2d4');
    R(8, -4, 1, 7, WHITE_D);
  }
  if (a === 8) {
    R(10, -5, 12, 1, '#fff0a0');
    R(8, -4, 3, 1, '#fff0a0');
    R(21, -4, 3, 1, '#fff0a0');
    R(8, -3, 2, 1, GOLD);
    R(22, -3, 2, 1, GOLD);
    R(10, -2, 12, 1, GOLD);
  }
  if (a === 9) {
    R(11, -1, 10, 4, GOLD);
    R(11, -3, 2, 2, GOLD);
    R(15, -4, 2, 3, GOLD);
    R(19, -3, 2, 2, GOLD);
    R(11, 2, 10, 1, '#e0a800');
    R(15, 0, 2, 1, '#ff5c7a');
    dots([[12, 0], [19, 0]], '#7fd4ff');
  }
  if (a === 10) {
    round(5, -1, 24, 5, '#e05a6a');
    R(6, 5, 18, 1, '#b8404f');
    R(15, -3, 2, 2, '#e05a6a');
    R(8, 0, 6, 1, '#ff8a96');
  }
  if (a === 11) {
    const w1 = '#5a4690';
    R(16, -8, 3, 2, w1);
    R(14, -6, 6, 3, w1);
    R(12, -3, 9, 3, w1);
    R(9, 0, 14, 3, w1);
    R(3, 3, 26, 2, w1);
    R(4, 5, 24, 1, '#3f3068');
    R(9, 2, 14, 1, GOLD);
    R(18, -7, 1, 1, '#8f7bd0');
  }
  if (a === 12) {
    both(8, 0, 2, 3, '#e04a5a');
    both(7, -2, 2, 2, '#e04a5a');
    both(7, -3, 1, 1, '#ff8a96');
  }
  if (a === 13) {
    both(5, -1, 6, 5, hc);
    both(6, -2, 4, 1, hc);
    both(7, 0, 3, 3, '#ffc2a8');
  }

  if (back) backItem();
  if (!back) handItem();
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
