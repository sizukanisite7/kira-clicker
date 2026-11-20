'use strict';

// ===== データ定義 =====
const GENS = [
  { id: 'nail',   icon: 'nail', name: 'ネイルチップ',     desc: '爪先からキラが溢れる',       base: 15,      kps: 0.1 },
  { id: 'sticker',icon: 'sticker', name: 'デコシール',       desc: 'なんでも貼ってキラ化',       base: 100,     kps: 1 },
  { id: 'purikura',icon: 'purikura', name: 'プリ機',           desc: '盛れた写真からキラ抽出',     base: 1100,    kps: 8 },
  { id: 'tapioca',icon: 'tapioca', name: 'タピオカ屋',       desc: 'タピの粒が全部キラ',         base: 12000,   kps: 47 },
  { id: 'shop',   icon: 'shop', name: '原宿ショップ',     desc: '行列がキラを生む',           base: 130000,  kps: 260 },
  { id: 'live',   icon: 'live', name: '推しのライブ会場', desc: 'ペンライトの光を回収',       base: 1.4e6,   kps: 1400 },
  { id: 'mirror', icon: 'mirror', name: '衛星ミラーボール', desc: '宇宙からキラを照射',         base: 2e7,     kps: 7800 },
  { id: 'galaxy', icon: 'galaxy', name: 'ギャルクシー',     desc: '銀河まるごとデコ盛り',       base: 3.3e8,   kps: 44000 },
  { id: 'multi',  icon: 'multi', name: '並行世界のウチ',   desc: '別の世界線のウチも集めてる', base: 5.1e9,   kps: 260000 },
];
const GROWTH = 1.15;

// アップグレード: 自動生成
const UPS = [];
UPS.push(
  { id: 'c1', icon: 'sparkles', name: '盛れる指先', desc: 'タップ威力 ×2', cost: 100, req: s => s.totalClicks >= 10, apply: e => e.clickMul *= 2 },
  { id: 'c2', icon: 'star', name: 'ジェルネイル', desc: 'タップ威力 ×2', cost: 5000, req: s => s.totalClicks >= 100, apply: e => e.clickMul *= 2 },
  { id: 'c3', icon: 'growing', name: 'ハートの手', desc: 'タップ威力 ×2', cost: 1e5, req: s => s.totalClicks >= 500, apply: e => e.clickMul *= 2 },
  { id: 'cp1', icon: 'dizzy', name: 'キラ連動タップ', desc: 'タップに毎秒生産の1%を追加', cost: 5e4, req: s => s.totalClicks >= 300, apply: e => e.clickPct += 0.01 },
  { id: 'cp2', icon: 'shooting', name: 'ギャルの本気タップ', desc: 'タップに毎秒生産の2%を追加', cost: 5e6, req: s => s.totalClicks >= 1500, apply: e => e.clickPct += 0.02 },
  { id: 'cp3', icon: 'revolving', name: '愛が重いタップ', desc: 'タップに毎秒生産の4%を追加', cost: 5e8, req: s => s.totalClicks >= 4000, apply: e => e.clickPct += 0.04 },
  { id: 'g1', icon: 'clover', name: 'ラッキー体質', desc: 'ラッキーハートが出やすくなる', cost: 7.7e5, req: s => s.hearts >= 3, apply: e => e.heartRate *= 0.6 },
);
const TIERS = [[1, 10], [5, 5], [25, 50], [50, 500], [100, 5e4], [150, 5e6]];
for (const g of GENS) {
  TIERS.forEach(([need, mul], i) => {
    UPS.push({
      id: `${g.id}_${i}`, icon: g.icon, name: `${g.name} 超盛り Lv${i + 1}`,
      desc: `${g.name}の生産 ×2（${need}個以上で解放）`,
      cost: g.base * mul,
      req: s => (s.gens[g.id] || 0) >= need,
      apply: e => e.genMul[g.id] *= 2,
    });
  });
}
UPS.sort((a, b) => a.cost - b.cost);

const ACHS = [
  { id: 'k1', icon: 'sparkles', name: 'はじめてのキラ', desc: '累計1キラ', test: s => s.totalKira >= 1 },
  { id: 'k2', icon: 'dizzy', name: 'キラ見習い', desc: '累計1,000キラ', test: s => s.totalKira >= 1e3 },
  { id: 'k3', icon: 'star', name: 'キラ職人', desc: '累計100万キラ', test: s => s.totalKira >= 1e6 },
  { id: 'k4', icon: 'crown', name: 'キラの女王', desc: '累計10億キラ', test: s => s.totalKira >= 1e9 },
  { id: 'k5', icon: 'galaxy', name: '宇宙一のギャル', desc: '累計1兆キラ', test: s => s.totalKira >= 1e12 },
  { id: 't1', icon: 'ribbon', name: '連打デビュー', desc: '100回タップ', test: s => s.totalClicks >= 100 },
  { id: 't2', icon: 'fire', name: '指が止まらん', desc: '1,000回タップ', test: s => s.totalClicks >= 1000 },
  { id: 't3', icon: 'collision', name: '腱鞘炎注意', desc: '10,000回タップ', test: s => s.totalClicks >= 10000 },
  { id: 'p1', icon: 'volt', name: '自動化の時代', desc: '毎秒10キラ', test: (s, e) => e.kps >= 10 },
  { id: 'p2', icon: 'rocket', name: '止まらない流れ', desc: '毎秒1万キラ', test: (s, e) => e.kps >= 1e4 },
  { id: 'p3', icon: 'shooting', name: 'キラの洪水', desc: '毎秒1億キラ', test: (s, e) => e.kps >= 1e8 },
  { id: 'h1', icon: 'heart', name: 'ラッキー！', desc: 'ラッキーハートを捕まえる', test: s => s.hearts >= 1 },
  { id: 'h2', icon: 'arrowheart', name: '運命の人', desc: 'ラッキーハートを10回捕まえる', test: s => s.hearts >= 10 },
  { id: 'r1', icon: 'cycle', name: '生まれ変わり', desc: 'はじめて転生する', test: s => s.prestiges >= 1 },
  { id: 'a1', icon: 'store', name: 'オーナー', desc: '全種類の施設を1つ以上持つ', test: s => GENS.every(g => (s.gens[g.id] || 0) >= 1) },
  { id: 'a2', icon: 'city', name: 'デコ盛り帝国', desc: '施設を合計500個', test: s => Object.values(s.gens).reduce((a, b) => a + b, 0) >= 500 },
];
// 実績1個ごとに生産+2%
const ACH_BONUS = 0.02;

// ===== 状態 =====
const SAVE_KEY = 'kira-clicker-save-v1';
function freshState(keep = {}) {
  return {
    kira: 0, totalKira: 0, runKira: 0, totalClicks: 0, hearts: 0,
    gens: {}, ups: [], achs: keep.achs || [],
    oshi: keep.oshi || 0, prestiges: keep.prestiges || 0,
    lastTick: Date.now(), buffUntil: 0, buffMul: 1,
  };
}
let S = freshState();
let E = {}; // 派生値
let buyN = 1;

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) S = Object.assign(freshState(), JSON.parse(raw));
  } catch (_) { /* セーブ無しでも動く */ }
}
function save(manual) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    if (manual) flash('セーブしたよ〜', 'sparkles');
  } catch (_) { if (manual) flash('セーブできなかった…', 'lock'); }
}

// ===== 計算 =====
function recompute() {
  E = { clickMul: 1, clickPct: 0, heartRate: 1, genMul: {} };
  GENS.forEach(g => E.genMul[g.id] = 1);
  S.ups.forEach(id => { const u = UPS.find(x => x.id === id); if (u) u.apply(E); });
  E.globalMul = (1 + S.oshi * 0.01) * (1 + S.achs.length * ACH_BONUS);
  const buff = Date.now() < S.buffUntil ? S.buffMul : 1;
  E.buff = buff;
  E.kps = GENS.reduce((sum, g) => sum + (S.gens[g.id] || 0) * g.kps * E.genMul[g.id], 0) * E.globalMul * buff;
  E.kpc = (1 * E.clickMul * E.globalMul + E.kps * E.clickPct) * buff;
}
function genCost(g, n) {
  const owned = S.gens[g.id] || 0;
  // 等比数列の和
  return g.base * Math.pow(GROWTH, owned) * (Math.pow(GROWTH, n) - 1) / (GROWTH - 1);
}
function oshiGain() {
  // 累計 runKira 1e9 で1、平方根でスケール
  return Math.floor(Math.sqrt(S.runKira / 1e9));
}

const UNITS = [[1e16, '京'], [1e12, '兆'], [1e8, '億'], [1e4, '万']];
function fmt(n) {
  if (n < 10) return String(Math.floor(n * 10) / 10);
  if (n < 1000) return String(Math.floor(n));
  if (n < 1e4) return Math.floor(n).toLocaleString('ja-JP');
  if (n >= 1e20) return n.toExponential(2);
  for (const [v, u] of UNITS) if (n >= v) { const x = n / v; return x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0) + u; }
}

// ===== 行動 =====
function gain(x) { S.kira += x; S.totalKira += x; S.runKira += x; }

function clickGem(ev) {
  recompute();
  gain(E.kpc);
  S.totalClicks++;
  const r = ev.currentTarget.getBoundingClientRect();
  const x = ev.clientX || r.left + r.width / 2, y = ev.clientY || r.top + r.height / 2;
  popText(x, y, '+' + fmt(E.kpc));
  sparks(x, y);
  const g = $('gem'); g.classList.remove('hit'); void g.offsetWidth; g.classList.add('hit');
  render();
}
function buyGen(g) {
  const c = genCost(g, buyN);
  if (S.kira < c) return;
  S.kira -= c;
  S.gens[g.id] = (S.gens[g.id] || 0) + buyN;
  render(true);
}
function buyUp(u) {
  if (S.kira < u.cost || S.ups.includes(u.id)) return;
  S.kira -= u.cost;
  S.ups.push(u.id);
  flash(`${u.name} ゲット！`, u.icon);
  render(true);
}
function prestige() {
  const g = oshiGain();
  if (g < 1) return;
  if (!confirm(`転生すると施設とアップグレードがリセットされるよ！\n代わりに推しパワー +${g}（全生産 +${g}%）がもらえる。転生する！？`)) return;
  S = freshState({ achs: S.achs, oshi: S.oshi + g, prestiges: S.prestiges + 1 });
  flash(`転生！推しパワー +${g}`, 'cycle');
  save();
  render(true);
}

// ===== ラッキーハート =====
let nextHeart = Date.now() + rand(60, 150) * 1000;
function rand(a, b) { return a + Math.random() * (b - a); }
function spawnHeart() {
  const b = document.createElement('button');
  b.id = 'golden'; b.innerHTML = ic('heart'); b.setAttribute('aria-label', 'ラッキーハート');
  b.style.left = rand(5, 85) + 'vw'; b.style.top = rand(15, 80) + 'vh';
  b.onclick = () => {
    S.hearts++;
    if (Math.random() < 0.5) {
      S.buffUntil = Date.now() + 30000; S.buffMul = 7;
      flash('フィーバー！30秒間 生産×7', 'fire');
    } else {
      recompute();
      const bonus = Math.max(E.kps * 900, E.kpc * 50, 100);
      const amt = Math.min(bonus, S.kira * 0.25 + 100);
      gain(amt);
      flash(`ラッキー！+${fmt(amt)} キラ`, 'heart');
    }
    b.remove(); render(true);
  };
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 13000);
}

// ===== 表示 =====
const $ = id => document.getElementById(id);
const ic = (n, cls = '') => `<img class="ic ${cls}" src="assets/icons/${n}.png" alt="" draggable="false">`;
const COST = n => `<span class="cost">${ic('gem', 'mini')}${fmt(n)}</span>`;
function popText(x, y, t) {
  const d = document.createElement('div');
  d.className = 'pop'; d.textContent = t;
  d.style.left = (x - 20) + 'px'; d.style.top = (y - 30) + 'px';
  document.body.appendChild(d); setTimeout(() => d.remove(), 900);
}
function sparks(x, y) {
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('div');
    s.className = 'spark'; s.innerHTML = ic(['sparkles', 'star', 'growing', 'gem'][i % 4]);
    const a = Math.random() * Math.PI * 2, d = rand(40, 90);
    s.style.left = (x - 14) + 'px'; s.style.top = (y - 14) + 'px';
    s.style.setProperty('--dx', Math.cos(a) * d + 'px');
    s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    document.body.appendChild(s); setTimeout(() => s.remove(), 700);
  }
}
let toastTimer;
function flash(msg, icon = 'sparkles') {
  const t = $('toast'); t.innerHTML = ic(icon); t.append(msg); t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function li(cls, html, onClick) {
  const el = document.createElement('li');
  el.className = 'item ' + cls; el.innerHTML = html;
  if (onClick) el.onclick = onClick;
  return el;
}

let lastStructure = '';
function render(force) {
  recompute();
  checkAchs();
  $('kira').textContent = fmt(S.kira);
  $('kps').textContent = fmt(E.kps);
  const left = Math.ceil((S.buffUntil - Date.now()) / 1000);
  $('buff').hidden = E.buff <= 1;
  if (E.buff > 1) $('buffText').textContent = `フィーバー ×${E.buff} ・ ${left}秒`;
  document.body.classList.toggle('fever', E.buff > 1);
  $('kpc').textContent = fmt(E.kpc);
  $('oshi').textContent = fmt(S.oshi);
  $('oshiBonus').textContent = fmt(S.oshi);
  const og = oshiGain();
  $('oshiGain').textContent = fmt(og);
  $('prestigeBtn').disabled = og < 1;
  $('achCount').textContent = `${S.achs.length}/${ACHS.length}`;
  document.title = `${fmt(S.kira)} キラ | キラキラクリッカー`;

  // 表示する項目が変わった時だけDOMを作り直す
  const visGens = GENS.filter((g, i) => i === 0 || (S.gens[GENS[i - 1].id] || 0) > 0 || S.totalKira >= g.base * 0.5);
  const visUps = UPS.filter(u => !S.ups.includes(u.id) && u.req(S));
  const structure = visGens.map(g => g.id + (S.gens[g.id] || 0)).join() + '|' + visUps.map(u => u.id).join() + '|' + S.achs.length + '|' + buyN;
  if (force || structure !== lastStructure) {
    lastStructure = structure;
    const gl = $('gens'); gl.innerHTML = '';
    visGens.forEach(g => {
      const each = g.kps * E.genMul[g.id] * E.globalMul;
      const el = li('gen', `<div class="icon">${ic(g.icon)}</div>
        <div class="info"><div class="name">${g.name}</div>
        <div class="desc">${g.desc} ・ 1個 ${fmt(each)}/秒</div>
        ${COST(genCost(g, buyN))}<div class="bar"><i></i></div></div>
        <div class="count">${S.gens[g.id] || 0}</div>`, () => buyGen(g));
      el.dataset.gen = g.id; gl.appendChild(el);
    });
    const ul = $('ups'); ul.innerHTML = '';
    if (!visUps.length) ul.appendChild(li('note', '<div class="info"><div class="desc">今買えるアップグレードはないよ〜。施設を増やそ！</div></div>'));
    visUps.forEach(u => {
      const el = li('up', `<div class="icon">${ic(u.icon)}</div>
        <div class="info"><div class="name">${u.name}</div><div class="desc">${u.desc}</div>
        ${COST(u.cost)}</div>`, () => buyUp(u));
      el.dataset.cost = u.cost; ul.appendChild(el);
    });
    const al = $('achs'); al.innerHTML = '';
    al.appendChild(li('note', `<div class="info"><div class="desc">実績1個につき全生産 +${ACH_BONUS * 100}%！</div></div>`));
    ACHS.forEach(a => {
      const got = S.achs.includes(a.id);
      al.appendChild(li(got ? 'done ach' : 'locked ach', `<div class="icon">${ic(got ? a.icon : 'lock')}</div>
        <div class="info"><div class="name">${a.name}</div><div class="desc">${a.desc}</div></div>`));
    });
  }
  // 買えるかどうかだけ毎フレーム更新
  document.querySelectorAll('#gens .item').forEach(el => {
    const g = GENS.find(x => x.id === el.dataset.gen);
    const c = genCost(g, buyN);
    el.classList.toggle('locked', S.kira < c);
    el.querySelector('.bar i').style.width = Math.min(100, S.kira / c * 100) + '%';
  });
  document.querySelectorAll('#ups .item.up').forEach(el => {
    el.classList.toggle('locked', S.kira < +el.dataset.cost);
  });
}
function checkAchs() {
  for (const a of ACHS) {
    if (!S.achs.includes(a.id) && a.test(S, E)) {
      S.achs.push(a.id);
      flash(`実績解除：${a.name}`, a.icon);
    }
  }
}

// ===== ループ =====
function tick() {
  const now = Date.now();
  let dt = (now - S.lastTick) / 1000;
  S.lastTick = now;
  if (dt > 0) {
    recompute();
    gain(E.kps * dt);
  }
  if (now >= nextHeart) {
    spawnHeart();
    nextHeart = now + rand(60, 150) * 1000 * E.heartRate;
  }
  render();
}

// ===== 起動 =====
load();
// オフライン収入（最大8時間、50%）
{
  const away = Math.min((Date.now() - S.lastTick) / 1000, 8 * 3600);
  S.lastTick = Date.now();
  S.buffUntil = 0;
  recompute();
  const earned = E.kps * away * 0.5;
  if (earned >= 1 && away > 30) {
    gain(earned);
    setTimeout(() => flash(`おかえり〜！留守中に ${fmt(earned)} キラ集めといたよ`, 'revolving'), 300);
  }
}
$('gem').addEventListener('click', clickGem);
$('prestigeBtn').onclick = prestige;
$('saveBtn').onclick = () => save(true);
$('resetBtn').onclick = () => {
  if (confirm('ほんとに全部消しちゃう！？推しパワーも実績も消えるよ！？')) {
    S = freshState(); save(); render(true); flash('まっさらになったよ', 'sparkles');
  }
};
document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  ['gens', 'ups', 'achs'].forEach(id => $(id).classList.toggle('hidden', id !== t.dataset.tab));
  $('buyMode').classList.toggle('hidden', t.dataset.tab !== 'gens');
});
document.querySelectorAll('#buyMode button').forEach(b => b.onclick = () => {
  buyN = +b.dataset.n;
  document.querySelectorAll('#buyMode button').forEach(x => x.classList.toggle('active', x === b));
  render(true);
});
setInterval(tick, 100);
setInterval(save, 10000);
window.addEventListener('beforeunload', () => save());
render(true);

// ===== 背景の星 =====
(() => {
  const cv = $('stars'), cx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [], w, h;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
    stars = Array.from({ length: Math.round(innerWidth * innerHeight / 9000) }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 1.2 + .3) * dpr,
      p: Math.random() * Math.PI * 2, s: Math.random() * .002 + .0006,
    }));
  }
  function draw(t) {
    cx.clearRect(0, 0, w, h);
    cx.fillStyle = '#fff';
    for (const st of stars) {
      cx.globalAlpha = .25 + .75 * Math.abs(Math.sin(st.p + t * st.s));
      cx.beginPath(); cx.arc(st.x, st.y, st.r, 0, Math.PI * 2); cx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  addEventListener('resize', resize); resize(); requestAnimationFrame(draw);
})();
