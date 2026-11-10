(() => {
  const $ = (id) => document.getElementById(id);
  const world = $('world');
  const overlay = $('overlay');
  const wctx = world.getContext('2d');
  const octx = overlay.getContext('2d');

  const HALF_W = 16; // 타일 반너비(저해상도 픽셀)
  const HALF_H = 8;
  const WALK_SPEED = 4.5; // 초당 타일
  const BUBBLE_MS = 5500;
  const WALKABLE = '.=';
  const FONT = '"Pretendard","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif';

  // 가구는 전부 "상자 쌓기"로 표현한다: [x, y, w, h, z0, z1, color] (x,y,w,h 는 타일 단위)
  const FURN = {
    T: [[0.4, 0.4, 0.2, 0.2, 0, 10, '#8a5a3b'], [0.1, 0.1, 0.8, 0.8, 10, 22, '#4caf50'], [0.25, 0.25, 0.5, 0.5, 22, 31, '#66c466']],
    B: [[0.1, 0.25, 0.8, 0.5, 3, 6, '#c98a4b'], [0.1, 0.25, 0.8, 0.12, 6, 13, '#b57a3f']],
    F: [[0, 0, 1, 1, 0, 5, '#b9c2cc'], [0.12, 0.12, 0.76, 0.76, 5, 6, '#5cc8ff'], [0.4, 0.4, 0.2, 0.2, 6, 16, '#d5dbe2'], [0.3, 0.3, 0.4, 0.4, 16, 18, '#8fdcff']],
    L: [[0.42, 0.42, 0.16, 0.16, 0, 26, '#555b6e'], [0.32, 0.32, 0.36, 0.36, 26, 32, '#ffe37a']],
    S: [[0.44, 0.44, 0.12, 0.12, 0, 20, '#6b6478']],
    C: [[0, 0.1, 1, 0.8, 0, 13, '#b07a4a'], [0, 0.05, 1, 0.9, 13, 15, '#f1e4cf']],
    k: [[0, 0.1, 1, 0.5, 0, 30, '#8a5a3b'], [0.06, 0.6, 0.88, 0.03, 3, 10, '#e85d75'], [0.06, 0.6, 0.88, 0.03, 12, 19, '#5b8def'], [0.06, 0.6, 0.88, 0.03, 21, 28, '#f2c14e']],
    t: [[0.42, 0.42, 0.16, 0.16, 0, 9, '#9a6b42'], [0.1, 0.1, 0.8, 0.8, 9, 11, '#e9c28f'], [0.42, 0.42, 0.16, 0.16, 11, 14, '#ffffff']],
    c: [[0.25, 0.25, 0.5, 0.5, 0, 6, '#e8796b'], [0.25, 0.25, 0.5, 0.12, 6, 14, '#d86455']],
    s: [[0, 0.15, 1, 0.75, 0, 7, '#7a8fe0'], [0, 0.15, 1, 0.22, 7, 14, '#6a7fd0']],
    p: [[0.3, 0.3, 0.4, 0.4, 0, 6, '#c96f4a'], [0.2, 0.2, 0.6, 0.6, 6, 16, '#3fa55a'], [0.32, 0.32, 0.36, 0.36, 16, 22, '#58c070']],
  };

  let ws = null;
  let rooms = null;
  let sponsors = {};
  let room = null;
  let myId = null;
  let joined = false;
  const players = new Map();
  let avatar = loadAvatar();
  let scale = 2;
  let lowW = 0;
  let lowH = 0;
  let camX = 0;
  let camY = 0;
  let camSnap = true;
  let hover = null;
  let bannerRects = [];

  // ---------- 저장 ----------
  function loadAvatar() {
    try {
      const saved = specValidate(JSON.parse(localStorage.getItem('pp.avatar')));
      if (saved) return saved;
    } catch {}
    return randomAvatar();
  }
  function persist() {
    try {
      localStorage.setItem('pp.avatar', JSON.stringify(avatar));
      localStorage.setItem('pp.name', $('nameInput').value.trim());
    } catch {}
  }

  // ---------- 캐릭터 만들기 화면 ----------
  const OPTION_LABELS = { gender: '성별', body: '체형', face: '얼굴', hair: '머리 모양', top: '상의', bottom: '하의', acc: '악세서리' };
  const COLOR_LABELS = { skin: '피부색', hairColor: '머리 색', topColor: '상의 색', bottomColor: '하의 색' };
  const ORDER = ['gender', 'body', 'skin', 'face', 'hair', 'hairColor', 'top', 'topColor', 'bottom', 'bottomColor', 'acc'];
  const refreshers = [];

  function buildCreator() {
    const box = $('options');
    for (const key of ORDER) {
      const row = document.createElement('div');
      row.className = 'opt';
      const label = document.createElement('span');
      label.className = 'label';
      row.append(label);
      if (SPEC.options[key]) {
        const names = SPEC.options[key];
        label.textContent = OPTION_LABELS[key];
        const st = document.createElement('div');
        st.className = 'stepper';
        const prev = document.createElement('button');
        const val = document.createElement('span');
        const next = document.createElement('button');
        prev.type = next.type = 'button';
        prev.textContent = '◀';
        next.textContent = '▶';
        prev.setAttribute('aria-label', `${OPTION_LABELS[key]} 이전`);
        next.setAttribute('aria-label', `${OPTION_LABELS[key]} 다음`);
        val.className = 'val';
        const step = (d) => {
          avatar[key] = (avatar[key] + d + names.length) % names.length;
          refreshCreator();
        };
        prev.onclick = () => step(-1);
        next.onclick = () => step(1);
        st.append(prev, val, next);
        row.append(st);
        refreshers.push(() => (val.textContent = names[avatar[key]]));
      } else {
        const colors = SPEC.colors[key];
        label.textContent = COLOR_LABELS[key];
        const sw = document.createElement('div');
        sw.className = 'swatches';
        const btns = colors.map((c, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.style.background = c;
          b.setAttribute('aria-label', `${COLOR_LABELS[key]} ${i + 1}`);
          b.onclick = () => {
            avatar[key] = i;
            refreshCreator();
          };
          sw.append(b);
          return b;
        });
        row.append(sw);
        refreshers.push(() => btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === avatar[key]))));
      }
      box.append(row);
    }
    try {
      $('nameInput').value = localStorage.getItem('pp.name') || '';
    } catch {}
    $('btnRandom').onclick = () => {
      avatar = randomAvatar();
      refreshCreator();
    };
    $('btnEnter').onclick = submitCreator;
    $('nameInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitCreator();
    });
    $('btnDress').onclick = () => {
      $('creatorHint').textContent = '옷을 갈아입고 적용을 눌러 주세요';
      $('btnEnter').textContent = '적용';
      $('nameRow').hidden = true;
      $('creator').hidden = false;
    };
    refreshCreator();
  }

  function refreshCreator() {
    refreshers.forEach((f) => f());
  }

  function drawPreview(t) {
    const pv = $('preview').getContext('2d');
    pv.clearRect(0, 0, SPRITE_W, SPRITE_H);
    const frame = Math.floor(t / 260) % 4;
    pv.drawImage(getSprite(avatar, false, frame === 1 ? 1 : frame === 3 ? 2 : 0, false), 0, 0);
  }

  function submitCreator() {
    const name = $('nameInput').value.trim();
    if (joined) {
      persist();
      send({ t: 'avatar', avatar });
      $('creator').hidden = true;
      return;
    }
    if (!name) {
      $('status').textContent = '닉네임을 입력해 주세요.';
      $('nameInput').focus();
      return;
    }
    if (!ws || ws.readyState !== 1 || !rooms) {
      $('status').textContent = '서버에 연결하는 중이에요. 잠시만요…';
      return;
    }
    persist();
    $('status').textContent = '';
    send({ t: 'join', name, avatar });
  }

  // ---------- 네트워크 ----------
  function send(msg) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
  }

  function connect() {
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
    ws.onmessage = (e) => {
      let m;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      const fn = onMsg[m.t];
      if (fn) fn(m);
    };
    ws.onclose = () => {
      if (joined) $('lost').hidden = false;
      else $('status').textContent = '서버에 연결할 수 없어요. 새로고침해 주세요.';
    };
  }

  function addPlayer(p) {
    players.set(p.id, { id: p.id, name: p.name, avatar: p.avatar, px: p.x, py: p.y, path: [], back: false, flip: false, bubble: null });
  }

  const onMsg = {
    welcome(m) {
      rooms = m.rooms;
      sponsors = m.sponsors || {};
    },
    error(m) {
      $('status').textContent = m.msg;
    },
    you(m) {
      myId = m.id;
      joined = true;
      $('creator').hidden = true;
      $('hud').hidden = false;
      $('chat').hidden = false;
    },
    room(m) {
      room = rooms[m.id];
      players.clear();
      m.players.forEach(addPlayer);
      camSnap = true;
      hover = null;
      $('roomName').textContent = room.name;
      updateCount();
      logLine(null, `${room.name}에 들어왔어요.`);
    },
    join(m) {
      addPlayer(m.p);
      updateCount();
      logLine(null, `${m.p.name} 님이 들어왔어요.`);
    },
    leave(m) {
      players.delete(m.id);
      updateCount();
    },
    move(m) {
      const p = players.get(m.id);
      if (!p) return;
      const start = p.path.length ? p.path[0] : { x: Math.round(p.px), y: Math.round(p.py) };
      const path = findPath(start, m);
      if (!path) {
        p.path = [];
        p.px = m.x;
        p.py = m.y;
      } else {
        p.path = p.path.length ? [p.path[0], ...path] : path;
      }
    },
    chat(m) {
      const p = players.get(m.id);
      if (p) p.bubble = { text: m.text, until: performance.now() + BUBBLE_MS };
      logLine(m.name, m.text);
    },
    avatar(m) {
      const p = players.get(m.id);
      if (p) p.avatar = m.avatar;
    },
  };

  function updateCount() {
    $('roomCount').textContent = `${players.size}명`;
  }

  function logLine(name, text) {
    const log = $('log');
    const div = document.createElement('div');
    if (name === null) {
      div.className = 'sys';
      div.textContent = text;
    } else {
      const b = document.createElement('b');
      b.textContent = name;
      div.append(b, document.createTextNode(text));
    }
    log.append(div);
    while (log.children.length > 60) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  // ---------- 방/길찾기 ----------
  function tileAt(x, y) {
    return x >= 0 && y >= 0 && x < room.w && y < room.h ? room.map[y][x] : null;
  }
  function walkable(x, y) {
    const ch = tileAt(x, y);
    return ch !== null && WALKABLE.includes(ch);
  }
  function portalAt(x, y) {
    return room.portals.find((p) => p.x === x && p.y === y);
  }

  function findPath(from, to) {
    if (from.x === to.x && from.y === to.y) return [];
    const key = (x, y) => y * room.w + x;
    const prev = new Map([[key(from.x, from.y), null]]);
    const queue = [[from.x, from.y]];
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      if (x === to.x && y === to.y) {
        const path = [];
        let cur = [x, y];
        while (cur && !(cur[0] === from.x && cur[1] === from.y)) {
          path.unshift({ x: cur[0], y: cur[1] });
          cur = prev.get(key(cur[0], cur[1]));
        }
        return path;
      }
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!walkable(nx, ny) || prev.has(key(nx, ny))) continue;
        prev.set(key(nx, ny), [x, y]);
        queue.push([nx, ny]);
      }
    }
    return null;
  }

  function stepPlayers(dt) {
    for (const p of players.values()) {
      let budget = WALK_SPEED * dt;
      while (p.path.length && budget > 0) {
        const n = p.path[0];
        const dx = n.x - p.px;
        const dy = n.y - p.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.001) {
          // 화면 기준: +x 오른쪽 아래, +y 왼쪽 아래, -x 왼쪽 위, -y 오른쪽 위
          if (Math.abs(dx) >= Math.abs(dy)) {
            p.back = dx < 0;
            p.flip = dx < 0;
          } else {
            p.back = dy < 0;
            p.flip = dy > 0;
          }
        }
        if (dist <= budget) {
          p.px = n.x;
          p.py = n.y;
          budget -= dist;
          p.path.shift();
          if (!p.path.length && p.id === myId && portalAt(n.x, n.y)) send({ t: 'portal' });
        } else {
          p.px += (dx / dist) * budget;
          p.py += (dy / dist) * budget;
          budget = 0;
        }
      }
    }
  }

  // ---------- 그리기 ----------
  const iso = (x, y) => [Math.round((x - y) * HALF_W + camX), Math.round((x + y) * HALF_H + camY)];

  function poly(ctx, pts, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  function box(x, y, w, h, z0, z1, color) {
    const a = iso(x, y);
    const b = iso(x + w, y);
    const c = iso(x + w, y + h);
    const d = iso(x, y + h);
    const up = (p, z) => [p[0], p[1] - z];
    poly(wctx, [up(d, z1), up(c, z1), up(c, z0), up(d, z0)], shade(color, 0.82));
    poly(wctx, [up(c, z1), up(b, z1), up(b, z0), up(c, z0)], shade(color, 0.66));
    poly(wctx, [up(a, z1), up(b, z1), up(c, z1), up(d, z1)], color);
  }

  function floorColor(x, y, ch, t) {
    const pal = room.palette;
    const odd = (x + y) % 2;
    if (ch === '=') {
      if (room.disco) {
        const hue = (Math.floor(t / 600) * 47 + x * 67 + y * 131) % 360;
        return `hsl(${hue},85%,${odd ? 66 : 60}%)`;
      }
      return odd ? pal.c : pal.d;
    }
    return odd ? pal.a : pal.b;
  }

  function drawRoom(t) {
    const pal = room.palette;
    const { w, h } = room;
    // 벽 (실내만)
    if (!room.outdoor) {
      const H = 44;
      const o = iso(0, 0);
      const r = iso(w, 0);
      const l = iso(0, h);
      poly(wctx, [o, r, [r[0], r[1] - H], [o[0], o[1] - H]], pal.wallA);
      poly(wctx, [o, l, [l[0], l[1] - H], [o[0], o[1] - H]], pal.wallB);
      poly(wctx, [o, r, [r[0], r[1] - 5], [o[0], o[1] - 5]], shade(pal.wallA, 0.8));
      poly(wctx, [o, l, [l[0], l[1] - 5], [o[0], o[1] - 5]], shade(pal.wallB, 0.8));
    }
    // 바닥 두께
    const T = 7;
    const bl = iso(0, h);
    const bb = iso(w, h);
    const br = iso(w, 0);
    poly(wctx, [bl, bb, [bb[0], bb[1] + T], [bl[0], bl[1] + T]], shade(pal.side, 0.9));
    poly(wctx, [bb, br, [br[0], br[1] + T], [bb[0], bb[1] + T]], shade(pal.side, 0.72));
    // 타일
    const pulse = 0.5 + 0.5 * Math.sin(t / 300);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = room.map[y][x];
        const [sx, sy] = iso(x, y);
        const diamond = [[sx, sy], [sx + HALF_W, sy + HALF_H], [sx, sy + HALF_H * 2], [sx - HALF_W, sy + HALF_H]];
        poly(wctx, diamond, floorColor(x, y, WALKABLE.includes(ch) ? ch : '.', t));
        if (portalAt(x, y)) {
          wctx.globalAlpha = 0.55 + 0.35 * pulse;
          poly(wctx, diamond, '#fff6a8');
          wctx.globalAlpha = 1;
        }
        if (hover && hover.x === x && hover.y === y && walkable(x, y)) {
          wctx.globalAlpha = 0.35;
          poly(wctx, diamond, '#ffffff');
          wctx.globalAlpha = 1;
        }
      }
    }
  }

  function drawEntities(t) {
    const list = [];
    for (let y = 0; y < room.h; y++) {
      for (let x = 0; x < room.w; x++) {
        const def = FURN[room.map[y][x]];
        if (def) list.push({ depth: x + y, order: 0, def, x, y });
      }
    }
    for (const p of players.values()) list.push({ depth: p.px + p.py, order: 1, p });
    list.sort((a, b) => a.depth - b.depth || a.order - b.order);
    for (const e of list) {
      if (e.def) {
        for (const [bx, by, bw, bh, z0, z1, color] of e.def) box(e.x + bx, e.y + by, bw, bh, z0, z1, color);
      } else {
        const p = e.p;
        const [fx, fy] = iso(p.px + 0.5, p.py + 0.5);
        wctx.fillStyle = 'rgba(30,20,40,.25)';
        wctx.fillRect(fx - 7, fy - 2, 14, 4);
        wctx.fillRect(fx - 5, fy - 3, 10, 6);
        const walking = p.path.length > 0;
        const frame = walking ? (Math.floor(t / 130) % 2 ? 1 : 2) : 0;
        const bob = walking && frame === 1 ? 1 : 0;
        wctx.drawImage(getSprite(p.avatar, p.back, frame, p.flip), fx - SPRITE_W / 2, fy - SPRITE_H + 2 - bob);
        p.sx = fx;
        p.sy = fy - SPRITE_H;
      }
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxW) {
    const lines = [];
    let line = '';
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > maxW && line) {
        lines.push(line);
        line = ch === ' ' ? '' : ch;
      } else {
        line += ch;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawOverlay(now) {
    const dpr = window.devicePixelRatio || 1;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, overlay.width, overlay.height);
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.lineJoin = 'round';

    // 포털 안내
    octx.font = `700 12px ${FONT}`;
    for (const pt of room.portals) {
      const [x, y] = iso(pt.x + 0.5, pt.y + 0.5);
      const label = `${pt.label} ▸`;
      const w = octx.measureText(label).width + 12;
      octx.fillStyle = 'rgba(43,34,51,.8)';
      roundRect(octx, x * scale - w / 2, y * scale - 9, w, 18, 6);
      octx.fill();
      octx.fillStyle = '#fff6a8';
      octx.fillText(label, x * scale, y * scale + 1);
    }

    // 광고판
    bannerRects = [];
    for (const s of room.signs) {
      const sp = sponsors[s.slot] || { title: '광고 문의', sub: '', color: '#888' };
      const [x, y] = iso(s.x + 0.5, s.y + 0.5);
      octx.font = `700 13px ${FONT}`;
      const tw = octx.measureText(sp.title).width;
      octx.font = `11px ${FONT}`;
      const sw = sp.sub ? octx.measureText(sp.sub).width : 0;
      const w = Math.max(tw, sw) + 20;
      const h = sp.sub ? 38 : 24;
      const bx = x * scale - w / 2;
      const by = (y - 20) * scale - h;
      octx.fillStyle = sp.color || '#888';
      octx.strokeStyle = '#2b2233';
      octx.lineWidth = 2;
      roundRect(octx, bx, by, w, h, 6);
      octx.fill();
      octx.stroke();
      octx.fillStyle = '#fff';
      octx.font = `700 13px ${FONT}`;
      octx.fillText(sp.title, x * scale, by + (sp.sub ? 13 : 12));
      if (sp.sub) {
        octx.font = `11px ${FONT}`;
        octx.fillText(sp.sub, x * scale, by + 28);
      }
      bannerRects.push({ x: bx, y: by, w, h, slot: s.slot, url: sp.url });
    }

    // 이름표
    const sorted = [...players.values()].filter((p) => p.sx !== undefined).sort((a, b) => a.sy - b.sy);
    octx.font = `700 12px ${FONT}`;
    for (const p of sorted) {
      const x = p.sx * scale;
      const y = p.sy * scale - 8;
      octx.strokeStyle = '#2b2233';
      octx.lineWidth = 3;
      octx.strokeText(p.name, x, y);
      octx.fillStyle = p.id === myId ? '#fff6a8' : '#ffffff';
      octx.fillText(p.name, x, y);
    }

    // 말풍선
    octx.font = `13px ${FONT}`;
    for (const p of sorted) {
      if (!p.bubble) continue;
      if (now > p.bubble.until) {
        p.bubble = null;
        continue;
      }
      const lines = wrapText(octx, p.bubble.text, 170);
      const w = Math.max(...lines.map((l) => octx.measureText(l).width)) + 18;
      const h = lines.length * 17 + 10;
      const x = Math.max(w / 2 + 4, Math.min(window.innerWidth - w / 2 - 4, p.sx * scale));
      const y = p.sy * scale - 22 - h;
      octx.fillStyle = '#ffffff';
      octx.strokeStyle = '#2b2233';
      octx.lineWidth = 2;
      roundRect(octx, x - w / 2, y, w, h, 8);
      octx.fill();
      octx.stroke();
      octx.beginPath();
      octx.moveTo(p.sx * scale - 5, y + h - 1);
      octx.lineTo(p.sx * scale, y + h + 6);
      octx.lineTo(p.sx * scale + 5, y + h - 1);
      octx.fill();
      octx.stroke();
      octx.fillRect(p.sx * scale - 4, y + h - 3, 8, 3);
      octx.fillStyle = '#2b2233';
      lines.forEach((l, i) => octx.fillText(l, x, y + 14 + i * 17));
    }
  }

  function resize() {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    scale = cw >= 1000 && ch >= 700 ? 3 : 2;
    lowW = Math.ceil(cw / scale);
    lowH = Math.ceil(ch / scale);
    world.width = lowW;
    world.height = lowH;
    world.style.width = `${lowW * scale}px`;
    world.style.height = `${lowH * scale}px`;
    overlay.width = Math.round(cw * dpr);
    overlay.height = Math.round(ch * dpr);
    overlay.style.width = `${cw}px`;
    overlay.style.height = `${ch}px`;
    camSnap = true;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!$('creator').hidden) drawPreview(now);
    if (room) {
      stepPlayers(dt);
      const me = players.get(myId);
      const fx = me ? me.px + 0.5 : room.w / 2;
      const fy = me ? me.py + 0.5 : room.h / 2;
      const tx = lowW / 2 - (fx - fy) * HALF_W;
      const ty = lowH / 2 - (fx + fy) * HALF_H + 8;
      if (camSnap) {
        camX = tx;
        camY = ty;
        camSnap = false;
      } else {
        const k = 1 - Math.pow(0.002, dt);
        camX += (tx - camX) * k;
        camY += (ty - camY) * k;
      }
      wctx.fillStyle = room.outdoor ? '#9fd8ff' : '#2b2440';
      wctx.fillRect(0, 0, lowW, lowH);
      drawRoom(now);
      drawEntities(now);
      drawOverlay(now);
    }
    requestAnimationFrame(frame);
  }

  // ---------- 입력 ----------
  function tileFromEvent(e) {
    const a = (e.clientX / scale - Math.round(camX)) / HALF_W;
    const b = (e.clientY / scale - Math.round(camY)) / HALF_H;
    return { x: Math.floor((a + b) / 2), y: Math.floor((b - a) / 2) };
  }

  overlay.addEventListener('pointermove', (e) => {
    if (room && e.pointerType === 'mouse') hover = tileFromEvent(e);
  });
  overlay.addEventListener('pointerleave', () => (hover = null));
  overlay.addEventListener('pointerdown', (e) => {
    if (!room || !joined) return;
    const hit = bannerRects.find((r) => e.clientX >= r.x && e.clientX <= r.x + r.w && e.clientY >= r.y && e.clientY <= r.y + r.h);
    if (hit) {
      if (hit.url && /^https?:\/\//i.test(hit.url)) {
        send({ t: 'ad', slot: hit.slot });
        window.open(hit.url, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    const tile = tileFromEvent(e);
    if (walkable(tile.x, tile.y)) send({ t: 'move', x: tile.x, y: tile.y });
    $('chatInput').blur();
  });

  $('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('chatInput');
    const text = input.value.trim();
    if (text) send({ t: 'chat', text });
    input.value = '';
  });

  window.addEventListener('resize', resize);
  buildCreator();
  resize();
  connect();
  requestAnimationFrame(frame);
})();
