const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { ROOMS, walkable } = require('./rooms');
const { specValidate } = require('./public/spec');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MAX_CLIENTS = 300;
const NAME_MAX = 10;
const CHAT_MAX = 80;
const CHAT_INTERVAL_MS = 700;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

let sponsors = {};
try {
  sponsors = JSON.parse(fs.readFileSync(path.join(__dirname, 'sponsors.json'), 'utf8'));
} catch (err) {
  console.warn('sponsors.json 을 읽지 못했습니다:', err.message);
}

const stats = { peak: 0, adClicks: {} };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/stats') {
    const perRoom = {};
    for (const id of Object.keys(ROOMS)) perRoom[id] = 0;
    for (const ws of wss.clients) if (ws.p) perRoom[ws.p.room]++;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ online: online(), peak: stats.peak, rooms: perRoom, adClicks: stats.adClicks }));
    return;
  }
  let rel;
  try {
    rel = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (rel === '/') rel = '/index.html';
  const file = path.join(PUBLIC, rel);
  if (file !== PUBLIC && !file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 2048 });
let nextId = 1;

function online() {
  let n = 0;
  for (const ws of wss.clients) if (ws.p) n++;
  return n;
}

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function broadcast(roomId, msg, except) {
  const data = JSON.stringify(msg);
  for (const ws of wss.clients) {
    if (ws !== except && ws.p && ws.p.room === roomId && ws.readyState === 1) ws.send(data);
  }
}

function pub(p) {
  return { id: p.id, name: p.name, avatar: p.avatar, x: p.x, y: p.y };
}

function cleanText(s, max) {
  if (typeof s !== 'string') return '';
  return s.replace(new RegExp('[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u2028-\\u202e]', 'g'), '').trim().slice(0, max);
}

// 스폰 지점에 사람이 겹치지 않게 주변 빈 타일 중 하나를 고른다.
function scatter(room, x, y) {
  const spots = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (walkable(room, nx, ny) && !room.portals.some((p) => p.x === nx && p.y === ny)) spots.push([nx, ny]);
    }
  }
  return spots[Math.floor(Math.random() * spots.length)] || [x, y];
}

function enterRoom(ws, roomId, x, y) {
  const p = ws.p;
  const room = ROOMS[roomId];
  [p.x, p.y] = scatter(room, x, y);
  p.room = roomId;
  const players = [];
  for (const other of wss.clients) if (other.p && other.p.room === roomId) players.push(pub(other.p));
  send(ws, { t: 'room', id: roomId, players });
  broadcast(roomId, { t: 'join', p: pub(p) }, ws);
}

const handlers = {
  join(ws, m) {
    if (ws.p) return;
    const avatar = specValidate(m.avatar);
    const name = cleanText(m.name, NAME_MAX);
    if (!avatar || !name) return send(ws, { t: 'error', msg: '닉네임과 캐릭터를 확인해 주세요.' });
    if (online() >= MAX_CLIENTS) return send(ws, { t: 'error', msg: '지금은 접속자가 많아요. 잠시 후 다시 시도해 주세요.' });
    ws.p = { id: nextId++, name, avatar, room: null, x: 0, y: 0, lastChat: 0 };
    send(ws, { t: 'you', id: ws.p.id });
    const room = ROOMS.plaza;
    enterRoom(ws, 'plaza', room.spawn[0], room.spawn[1]);
    stats.peak = Math.max(stats.peak, online());
  },
  move(ws, m) {
    const p = ws.p;
    if (!p || !walkable(ROOMS[p.room], m.x, m.y)) return;
    p.x = m.x;
    p.y = m.y;
    broadcast(p.room, { t: 'move', id: p.id, x: p.x, y: p.y });
  },
  portal(ws) {
    const p = ws.p;
    if (!p) return;
    const portal = ROOMS[p.room].portals.find((q) => q.x === p.x && q.y === p.y);
    if (!portal) return;
    broadcast(p.room, { t: 'leave', id: p.id }, ws);
    enterRoom(ws, portal.to, portal.tx, portal.ty);
  },
  chat(ws, m) {
    const p = ws.p;
    if (!p) return;
    const now = Date.now();
    if (now - p.lastChat < CHAT_INTERVAL_MS) return;
    const text = cleanText(m.text, CHAT_MAX);
    if (!text) return;
    p.lastChat = now;
    broadcast(p.room, { t: 'chat', id: p.id, name: p.name, text });
  },
  avatar(ws, m) {
    const p = ws.p;
    const avatar = specValidate(m.avatar);
    if (!p || !avatar) return;
    p.avatar = avatar;
    broadcast(p.room, { t: 'avatar', id: p.id, avatar });
  },
  ad(ws, m) {
    if (!ws.p || typeof m.slot !== 'string' || !Object.hasOwn(sponsors, m.slot)) return;
    stats.adClicks[m.slot] = (stats.adClicks[m.slot] || 0) + 1;
  },
};

wss.on('connection', (ws) => {
  ws.p = null;
  ws.alive = true;
  ws.budget = 40;
  ws.on('pong', () => (ws.alive = true));
  ws.on('error', () => {});
  send(ws, { t: 'welcome', rooms: ROOMS, sponsors });

  ws.on('message', (raw, isBinary) => {
    if (isBinary) return;
    if (--ws.budget < 0) return ws.terminate(); // 초당 메시지 한도 초과
    let m;
    try {
      m = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!m || typeof m !== 'object' || !Object.hasOwn(handlers, m.t)) return;
    handlers[m.t](ws, m);
  });

  ws.on('close', () => {
    if (ws.p) broadcast(ws.p.room, { t: 'leave', id: ws.p.id }, ws);
    ws.p = null;
  });
});

setInterval(() => {
  for (const ws of wss.clients) ws.budget = 40;
}, 1000);

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) {
      ws.terminate();
      continue;
    }
    ws.alive = false;
    ws.ping();
  }
}, 30000);

server.listen(PORT, () => console.log(`픽셀광장 서버 실행 중: http://localhost:${PORT}`));
