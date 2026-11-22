// このファイルは tools/build_global.mjs で 作った もの（直接 直さない。直すのは lib/puppet.js）
// 使い方：MiruMiru.load('miruko') → 部品。MiruMiru.size(部品, 高さ) → [はば, 高さ]。MiruMiru.draw(canvas, 部品, pose)
(function () {
// ミル子ちゃん・ミルンくんを 部品ごとに 描く（2026-11-21 だいすけ「目の 向き・目を 閉じる・手の 角度・前と 後ろ。てんてんみたいに なめらかに 動いて ほしい。3D に まではしなくて いい」）。
// 元の 絵は ＳＣＴＶ各種素材の miruko.svg・mirun.svg（assets/svg に 写した もの。元の ファイルは さわらない）。
// SVG の 部品（path・polygon）を 1つずつ Path2D に して、canvas に 同じ 順番で 描く。描くのは 同期（コマごとに 静止画と 動画が 同じに なる ように）。
// ここでは 部品を 読みこんで そのまま 描く ところまで。表情・手・後ろ姿は、下の 関数に 少しずつ 足す

// 部品の 番号（tools/svgparts.mjs の 一覧で 確かめた もの）
const PARTS = {
  miruko: { face: [7, 8, 11, 12, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 34, 35], logo: [46, 47, 48, 49], headLine: [9, 10], body: 0, bodyLine: 1, arms: [[2, 3], [4, 5]], skin: 6, eyeWhite: [7, 8], pupilS: [11, 17], pupilC: [12], sparkS: [31], sparkC: [21, 22], outS: 30, outC: 29, lashes: [23, 24, 25, 26], ow: 1.56 },
  mirun: { face: [11, 12, 15, 16, 17, 18, 19, 20, 21, 26, 27, 28], logo: [6, 7, 8, 9], headLine: [13, 14], body: 0, bodyLine: 1, arms: [[2, 3], [4, 5]], skin: 10, eyeWhite: [11, 12], pupilS: [16, 27], pupilC: [18], sparkS: [], sparkC: [19], outS: 26, outC: 17, lashes: [], ow: 1.74 },
};

// SVG の 文字を 部品の 並びに する（ページに 一度 置いて、色や 線の 太さは ブラウザの 計算した 値を 使う）
function parsePuppet(svgText) {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:10px;height:10px;overflow:hidden';
  host.innerHTML = svgText; document.body.appendChild(host);
  const svg = host.querySelector('svg'), vb = svg.viewBox.baseVal;
  const els = [...svg.querySelectorAll('path,polygon')];
  const parts = els.map((e) => {
    const cs = getComputedStyle(e);
    let d = e.getAttribute('d');
    if (e.tagName === 'polygon') { const p = e.getAttribute('points').trim().split(/[\s,]+/).map(Number); d = 'M' + p.reduce((s, v, i) => s + (i % 2 ? ',' : (i ? 'L' : '')) + v, '') + 'Z'; }
    const col = (c) => (c && c !== 'none' && !c.startsWith('rgba(0, 0, 0, 0)') ? c : null);
    return { d, path: new Path2D(d), fill: col(cs.fill), stroke: col(cs.stroke), sw: parseFloat(cs.strokeWidth) || 0, cap: cs.strokeLinecap, join: cs.strokeLinejoin, rule: cs.fillRule === 'evenodd' ? 'evenodd' : 'nonzero', el: e };
  });
  return { parts, vb: { x: vb.x, y: vb.y, w: vb.width, h: vb.height }, host, svg };
}

function drawPart(g, p) {
  if (p.fill) { g.fillStyle = p.fill; g.fill(p.path, p.rule); }
  if (p.stroke && p.sw > 0) { g.strokeStyle = p.stroke; g.lineWidth = p.sw; g.lineCap = p.cap; g.lineJoin = p.join; g.stroke(p.path); }
}

// そのまま 描く（元の 絵と 同じに なるかを 確かめる ため）。g は 2d の 描き先、W・H は 画素
function drawRest(g, P, W, H) {
  g.save(); g.clearRect(0, 0, W, H); g.scale(W / P.vb.w, H / P.vb.h); g.translate(-P.vb.x, -P.vb.y);
  for (const p of P.parts) drawPart(g, p);
  g.restore();
}

// ---- 目の 形を 割り出す（1回だけ）----
// 白目の だ円（中心・半径）と、S の 線の 通り道（だ円）・線の 太さ・あいて いる 所を、元の 線の 点から 求める
function fitEllipse(pts) {
  // 軸が まっすぐな だ円：a x² + b y² + c x + d y = 1
  let M = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], v = [0, 0, 0, 0];
  for (const [x, y] of pts) { const r = [x * x, y * y, x, y]; for (let i = 0; i < 4; i++) { v[i] += r[i]; for (let j = 0; j < 4; j++) M[i][j] += r[i] * r[j]; } }
  // 4元の 連立方程式（ガウスの 消去法）
  const A = M.map((row, i) => [...row, v[i]]);
  for (let i = 0; i < 4; i++) { let p = i; for (let k = i + 1; k < 4; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k; [A[i], A[p]] = [A[p], A[i]];
    for (let k = 0; k < 4; k++) if (k !== i) { const f = A[k][i] / A[i][i]; for (let j = i; j < 5; j++) A[k][j] -= f * A[i][j]; } }
  const [a, b, c, d] = A.map((r, i) => r[4] / r[i]);
  const cx = -c / (2 * a), cy = -d / (2 * b), k = 1 + a * cx * cx + b * cy * cy;
  return { cx, cy, rx: Math.sqrt(k / a), ry: Math.sqrt(k / b) };
}
function samplePath(el, n = 600) {
  const L = el.getTotalLength(), out = [];
  for (let i = 0; i < n; i++) { const p = el.getPointAtLength(L * i / n); out.push([p.x, p.y]); }
  return out;
}
function analyzeEyes(P, name) {
  const Q = PARTS[name], wb = Q.eyeWhite.map((i) => P.parts[i].el.getBBox());
  const white = wb.map((b) => ({ cx: b.x + b.width / 2, cy: b.y + b.height / 2, rx: b.width / 2, ry: b.height / 2 }));
  // S の 線：点を だ円で 表して、だ円から 内がわに 大きく 外れる 点（横棒）を のぞいて もう一度 合わせる
  const sp = samplePath(P.parts[Q.outS].el, 900), W0 = white[0];
  let pts = sp.filter(([x, y]) => ((x - W0.cx) / W0.rx) ** 2 + ((y - W0.cy) / W0.ry) ** 2 > .7);
  const E = fitEllipse(pts);
  const rr = ([x, y]) => Math.hypot((x - E.cx) / E.rx, (y - E.cy) / E.ry);
  pts = pts.filter((p) => Math.abs(rr(p) - 1) < .2);
  // 線の 太さ：だ円から 外がわの 点と 内がわの 点の 開き
  const dev = pts.map((p) => (rr(p) - 1) * Math.min(E.rx, E.ry)).sort((a, b) => a - b);
  const sw = dev[Math.floor(dev.length * .97)] - dev[Math.floor(dev.length * .03)];
  // あいて いる 所：だ円の 角度で 点が 無い 範囲（2か所）
  const bins = new Array(360).fill(0);
  for (const [x, y] of pts) { let t = Math.atan2((y - E.cy) / E.ry, (x - E.cx) / E.rx) * 180 / Math.PI; bins[(Math.round(t) + 360) % 360]++; }
  const gaps = []; let st = -1;
  for (let i = 0; i < 720; i++) { const on = bins[i % 360] > 0; if (!on && st < 0) st = i; if (on && st >= 0) { if (i - st >= 4 && st < 360) gaps.push([st, i]); st = -1; } }
  // 横棒の 高さ（S の 線の 中で、だ円の 内がわに ある 点の y の まん中）
  const barPts = sp.filter((p) => rr(p) < .75), barY = barPts.reduce((s, p) => s + p[1], 0) / Math.max(1, barPts.length);
  return { white, S: { ...E, sw, gaps, barY } };
}

// 横棒の 無い S：だ円の 線を、あいて いる 2か所と 横棒の 所で 切った 2本の 弧で 描く。
// 弧の はしは、横棒が つながって いた 高さ（左は 上の 弧、右は 下の 弧）
function drawBarlessS(g, S, col) {
  const tb = Math.asin(Math.max(-1, Math.min(1, (S.barY - S.cy) / S.ry)));
  const R = Math.PI / 180, [g1, g2] = S.gaps;
  g.save(); g.strokeStyle = col; g.lineWidth = S.sw; g.lineCap = 'round';
  // あいて いる 所の はし（線の 太さの 半分 だけ 内がわ ＝ 丸い はしが 元の はしと 同じ 位置）
  const cap = S.sw / 2 / Math.min(S.rx, S.ry);
  // 上の 弧：左の 横棒の 高さ（π−tb）から 上を 回って、右上の あき（g の 始まり）まで
  const upEnd = (g1[0] > 180 ? g1[0] : g2[0]) * R - cap, loEnd = (g1[0] > 180 ? g2[0] : g1[0]) * R - cap;
  g.beginPath(); g.ellipse(S.cx, S.cy, S.rx, S.ry, 0, Math.PI - tb, upEnd); g.stroke();
  // 下の 弧：右の 横棒の 高さ（tb）から 下を 回って、左下の あき まで
  g.beginPath(); g.ellipse(S.cx, S.cy, S.rx, S.ry, 0, tb, loEnd); g.stroke();
  g.restore();
}

// ---- 黒目を 動かす ための 形 ----
// S の 目の 黒目は 横棒の 所で 上下 2つに 切れた 部品。切り口（まっすぐな 辺）を のぞいた 点で 1つの だ円に 組み直す。
// 切れ目の 帯（横棒の 下の 白い すじ）は 動かさず、元の 位置に 白で 描く（動かない 時は 元の 絵と 同じ）
function pupilInfo(P, Q) {
  const up = samplePath(P.parts[Q.pupilS[0]].el, 300), lo = samplePath(P.parts[Q.pupilS[1]].el, 300);
  const yUp = Math.max(...up.map((p) => p[1])), yLo = Math.min(...lo.map((p) => p[1]));
  const pts = [...up.filter((p) => p[1] < yUp - .4), ...lo.filter((p) => p[1] > yLo + .4)];
  const S = fitEllipse(pts), b = P.parts[Q.pupilC[0]].el.getBBox();
  return { S, band: [yUp, yLo], C: { cx: b.x + b.width / 2, cy: b.y + b.height / 2, rx: b.width / 2, ry: b.height / 2 } };
}

// ---- 手（腕）：ポンチョの ように 体ごと 曲げる ----
// ---- 腕（2026-11-21 だいすけ「わきの 部分も 全部が 一枚つなぎ」。公式の 手を 上げた 絵 ミルン左向き.ai を 見本に）----
// 公式の 上げた 腕には しわの 線も 手の 出っぱりも 無く、腕の 下の 線が わきから 体の 横へ そのまま つながる。
// しわの 線は「腕の 内がわの ふち」と みなす。体（胴）の 横は しわの 線、腕は しわの 線より 外の 部分。
// 腕を しわの 上の はし（わき）を 中心に 回すと、わきが 開く。胴と 腕を 同じ 色で 塗り、外がわの 線だけを 描くので、つなぎ目の 線は 出ない
const ARM_N = 90, SIDE_N = 60, SHOULDER_LAG = 0;
function resample(pts, n) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const out = []; let j = 0;
  for (let i = 0; i < n; i++) { const t = L[L.length - 1] * i / (n - 1); while (j < L.length - 2 && L[j + 1] < t) j++; const w = (t - L[j]) / ((L[j + 1] - L[j]) || 1); out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * w, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * w]); }
  return out;
}
// 公式の 手を 上げた 絵（ＳＣＴＶ各種素材/ミルン左向き.ai の 体の 線。mirun.svg の 座標に 直した もの：頭・すそ・下ろした 腕が 重なる 倍率 0.31877）
const RAISE_D = 'M18.78 141.76C18.51 142.25 18.71 144.90 18.98 145.39C25.42 156.98 64.90 175.00 62.58 189.15C62.58 189.15 57.11 203.89 55.49 207.86C57.19 203.69 51.83 216.01 52.21 220.95C52.22 221.02 52.22 221.08 52.21 221.15C52.17 221.85 51.76 225.52 47.46 228.33C47.41 228.36 47.36 228.39 47.30 228.42C46.36 228.91 37.31 233.71 42.09 236.41C42.22 236.48 42.36 236.53 42.51 236.56C45.64 237.26 81.07 244.97 112.68 244.85C112.68 244.85 114.14 244.87 116.73 244.84C119.32 244.85 120.77 244.82 120.77 244.82C152.36 244.70 187.33 236.72 190.47 235.99C190.62 235.95 190.77 235.90 190.90 235.82C195.53 233.08 186.19 228.35 185.25 227.88C185.20 227.86 185.15 227.83 185.10 227.80C180.65 225.02 180.04 221.35 179.96 220.66C179.95 220.59 179.95 220.53 179.95 220.46C180.02 217.16 179.03 212.56 178.35 209.84C178.08 208.75 178.97 207.72 180.09 207.82C198.96 209.52 190.65 201.81 190.65 201.81C186.23 197.81 180.33 192.79 180.33 192.79C181.52 193.50 183.00 192.51 182.80 191.13C180.37 174.96 164.02 163.30 160.11 160.72C159.61 160.39 158.96 160.36 158.43 160.65C143.68 168.56 128.48 171.25 114.78 171.32C100.80 171.36 85.13 168.69 69.67 160.54L23.28 139.15C23.03 139.04 22.73 138.98 22.38 138.97C20.95 138.92 19.65 139.80 19.07 141.11L18.78 141.76Z';
// ミルンくんの 元の 絵の わき（しわの 上の はし）と 手の 先までの 長さ、頭の だ円（はだの 部品の 外わく）
const RAISE_TOP = [66.59, 186.12], RAISE_LEN = Math.hypot(38.9 - 66.59, 205.44 - 186.12), RAISE_HEAD = [111.7, 86.53, 92.39, 84.93];
function raiseRef(P) {
  if (raiseRef.c) return raiseRef.c;
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'path'); t.setAttribute('d', RAISE_D); P.svg.appendChild(t);
  const s = samplePath(t, 1200), n = s.length; t.remove();
  const dd = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  // わき（ミルンくんの わきに いちばん 近い 点）と 手の 先（いちばん 左）
  let ia = 0, it = 0; s.forEach((p, i) => { if (dd(p, RAISE_TOP) < dd(s[ia], RAISE_TOP)) ia = i; if (p[0] < s[it][0]) it = i; });
  const steps = (dir) => { let k = 0; for (let i = it; i !== ia; i = (i + dir + n) % n) k++; return k; }, du = steps(1) < steps(-1) ? 1 : -1;
  // 腕の 上の ふちは、頭の 中へ 少し 入った 所まで（頭に かくれる）
  const [hx, hy, hrx, hry] = RAISE_HEAD, eh = (p) => ((p[0] - hx) / (hrx - 3)) ** 2 + ((p[1] - hy) / (hry - 3)) ** 2;
  let ish = it, best = it; for (let k = 0; k < n / 2; k++) { ish = (ish - du + n) % n; if (eh(s[ish]) < eh(s[best])) best = ish; if (eh(s[ish]) < 1) break; }
  if (eh(s[ish]) >= 1) ish = best;
  const seg = (i0, i1, dir) => { const r = []; for (let i = i0; ; i = (i + dir + n) % n) { r.push(s[i]); if (i === i1) break; } return r; };
  const A = resample(seg(ish, it, du), ARM_N), B = resample(seg(it, ia, du), ARM_N).slice(1), pa = s[ia];
  // わきから 下へ 体の 横の 線（すそ まで 半周 ぶん。使う 長さは 腕ごとに 決める）
  const side = seg(ia, (ia + du * Math.floor(n / 3) + n) % n, du).map((p) => [p[0] - pa[0], p[1] - pa[1]]);
  return (raiseRef.c = { arm: [...A, ...B].map((p) => [p[0] - pa[0], p[1] - pa[1]]), side, len: RAISE_LEN });
}
function armRig(P, Q) {
  const body = P.parts[Q.body], ns = 'http://www.w3.org/2000/svg';
  // 体の 塗りの 1つ目の 輪（外の 形）。残りは しわの 小さな 塗り
  const main = body.d.split(/(?=M)/)[0], tmp = document.createElementNS(ns, 'path'); tmp.setAttribute('d', main); P.svg.appendChild(tmp);
  const sil = samplePath(tmp, 1400); tmp.remove();
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const sides = [0, 1].map((sg) => {
    const ce = samplePath(P.parts[Q.arms[sg][0]].el, 300);
    // しわの 両はし（いちばん 離れた 2点）。上が わき（top）、下が 手の 所（bot）
    let best = [0, 0, -1]; for (let i = 0; i < ce.length; i += 3) for (let j = i + 1; j < ce.length; j += 3) { const v = d2(ce[i], ce[j]); if (v > best[2]) best = [i, j, v]; }
    let [top, bot] = [ce[best[0]], ce[best[1]]]; if (top[1] > bot[1]) [top, bot] = [bot, top];
    // しわの まん中の 線：軸に 沿って 区切り、それぞれ 平均
    const ax = [bot[0] - top[0], bot[1] - top[1]], L2 = ax[0] ** 2 + ax[1] ** 2, K = 14, bins = Array.from({ length: K }, () => [0, 0, 0]);
    for (const p of ce) { const t = ((p[0] - top[0]) * ax[0] + (p[1] - top[1]) * ax[1]) / L2, k = Math.min(K - 1, Math.max(0, Math.floor(t * K))); bins[k][0] += p[0]; bins[k][1] += p[1]; bins[k][2]++; }
    const crease = [top, ...bins.filter((b) => b[2]).map((b) => [b[0] / b[2], b[1] / b[2]]), bot];
    const out = sg === 0 ? -1 : 1;
    // 手の 所（しわの 下の はしに いちばん 近い 外の 線の 点）と、肩（わきに いちばん 近い、わきより 上で 外がわの 点）
    let iNb = 0, iSh = -1; sil.forEach((p, i) => { if (d2(p, bot) < d2(sil[iNb], bot)) iNb = i; });
    sil.forEach((p, i) => { if (p[1] < top[1] - 1 && (p[0] - top[0]) * out > 0 && (iSh < 0 || d2(p, top) < d2(sil[iSh], top))) iSh = i; });
    // 肩から 手までの 外の 線（いちばん 外に 出た 点＝手の 先を 通る 向き）
    const n = sil.length, walk = (dir) => { const r = []; for (let i = iSh; ; i = (i + dir + n) % n) { r.push(sil[i]); if (i === iNb) break; } return r; };
    const fw = walk(1), bw = walk(-1), far = (r) => Math.max(...r.map((p) => p[0] * out));
    const dir = far(fw) >= far(bw) ? 1 : -1, armSil = dir === 1 ? fw : bw, rest = dir === 1 ? bw : fw;
    // 肩の なだらかな 所（頭の 中から 肩の 点 iSh まで）も 腕に 入れる（腕と いっしょに 動き、上げると 頭の 後ろへ 入る）
    // 顔の 中か：はだの 部品の 本当の 形で 見る（顔の 下の 方は だ円から ずれて いて、だ円で 見ると 首を 通りこして 反対の 肩まで 行って しまった）。
    // 体の 上の ふちは 顔の 下の ふちに 沿って いるので、顔の ふちから 2 以内に 入った 所を 接点（顔に かくれ はじめる 所）と する
    const skinPath = P.parts[Q.skin].path, hc = (() => { const b = P.parts[Q.skin].el.getBBox(); return [b.x + b.width / 2, b.y + b.height / 2]; })();
    const tctx = armRig.ctx || (armRig.ctx = document.createElement('canvas').getContext('2d'));
    const inHead = (p) => { const dx = p[0] - hc[0], dy = p[1] - hc[1], l = Math.hypot(dx, dy) || 1; return tctx.isPointInPath(skinPath, p[0] - dx / l * 2, p[1] - dy / l * 2); };
    let iH = iSh; for (let k = 0; k < n / 4 && !inHead(sil[iH]); k++) iH = (iH - dir + n) % n;
    const upper = []; for (let i = iH; i !== iSh; i = (i + dir + n) % n) upper.push(sil[i]);
    // 腕：肩 → 外の 線 → 手の 先 → 手の 所 → しわ（下から 上）→ わき。手の 先（いちばん 外）で 2つに 分け、それぞれ 同じ 数の 点に する
    const ti = armSil.reduce((b, p, i) => (p[0] * out > armSil[b][0] * out ? i : b), 0), tip = armSil[ti];
    const arm = [...resample([...upper, ...armSil.slice(0, ti + 1)], ARM_N), ...resample([...armSil.slice(ti), ...crease.slice().reverse()], ARM_N).slice(1)];
    // 上げきった 形（公式の 絵の 腕）：わきを 合わせ、腕の 長さの 比で 大きさを 合わせる。右の 腕は 左右 反転
    const ref = raiseRef(P), k = Math.sqrt(d2(tip, top)) / ref.len;
    const goal = ref.arm.map(([x, y]) => [top[0] + (sg === 0 ? x : -x) * k, top[1] + y * k]);
    // 体の 横：しわ と、手の 所から 少し 下（iJ）までの 外の 線。上げると 公式の 体の 横の 線へ 寄せる（手の 出っぱりの 段が 消える）
    let iJ = iNb; for (let L = 0, lim = Math.sqrt(d2(top, bot)) * .9; L < lim; ) { const j = (iJ + dir + n) % n; L += Math.sqrt(d2(sil[iJ], sil[j])); iJ = j; }
    const idx = new Set(); for (let i = iH; ; i = (i + dir + n) % n) { idx.add(i); if (i === iJ) break; }
    const below = []; for (let i = iNb; ; i = (i + dir + n) % n) { below.push(sil[i]); if (i === iJ) break; }
    const sideRest = resample([...crease, ...below], SIDE_N);
    // 公式の 線を この 腕の 大きさ・向きに 直し、iJ に いちばん 近い 所で 切る
    const offS = ref.side.map(([x, y]) => [top[0] + (sg === 0 ? x : -x) * k, top[1] + y * k]);
    let ie = 0; offS.forEach((p, i) => { if (d2(p, sil[iJ]) < d2(offS[ie], sil[iJ])) ie = i; });
    const sideGoal = resample(offS.slice(0, ie + 1), SIDE_N);
    return { top, bot, crease, arm, goal, tip, out, iSh, iH, iNb, iJ, idx, upper, sideRest, sideGoal, jn: sil[iH], neck: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((k) => sil[(iH - k * dir + n * 2) % n]), jnIn: (() => { const p = sil[iH], dx = hc[0] - p[0], dy = hc[1] - p[1], l = Math.hypot(dx, dy); return [p[0] + dx / l * 8, p[1] + dy / l * 8]; })() };
  });
  // 胴：外の 線を すそから 1周 たどり、左右の 腕の 部分を しわに 置きかえる
  const n = sil.length; let i0 = 0; sil.forEach((p, i) => { if (p[1] > sil[i0][1]) i0 = i; });
  const torso = [], done = new Set();
  for (let k = 0, i = i0; k < n; k++, i = (i + 1) % n) {
    const S = sides.find((S) => S.idx.has(i));
    if (!S) { torso.push(sil[i]); continue; }
    if (done.has(S)) continue;
    done.add(S);
    // 体の 横は 描く 時に 腕の 角度で 決める（ここでは 目印だけ）
    torso.push({ side: sides.indexOf(S), rev: i !== S.iH });
  }
  // 外の 線の 太さの 半分（元の 絵と 画素で 比べて いちばん 近い 値。PARTS の ow）
  return { sides, torso, ow: Q.ow };
}
function drawArmsBody(g, P, Q, arms, opt = {}) {
  const R = P.rig || (P.rig = armRig(P, Q)), bodyCol = P.parts[Q.body].fill, lineCol = P.parts[Q.bodyLine].fill;
  const rot = (p, c, a) => { const s = Math.sin(a), k = Math.cos(a), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * k - dy * s, c[1] + dx * s + dy * k]; };
  const fills = [], armPts = [];
  // 胴：体の 横は、上げるに つれて 公式の 線へ（下の はしは 元の 線に つなぐ）
  const sideAt = (S, u) => S.sideRest.map((p, i) => { const w = u * (1 - smooth(.75, 1, i / (SIDE_N - 1))); return [p[0] + (S.sideGoal[i][0] - p[0]) * w, p[1] + (S.sideGoal[i][1] - p[1]) * w]; });
  // 胴の 肩の 角は 腕の つけ根（腕の 1点目）と 同じ 所に する（はみ出さない）。腕を 計算した 後で 組む
  const shoulder = [];
  const torsoNow = () => R.torso.flatMap((q) => { if (!q.side && q.side !== 0) return [q]; const S = R.sides[q.side], u = Math.min(1, Math.max(0, arms[q.side] || 0));
    const pts = [shoulder[q.side], ...sideAt(S, u)]; return q.rev ? pts.reverse() : pts; });
  R.sides.forEach((S, sg) => {
    // a：0＝元の 絵、1＝公式の 上げた 腕。わきを 中心に、点ごとに 角度と 距離を 少しずつ 公式の 形へ 寄せる（まっすぐ 寄せると 途中で 腕が 縮む）。
    // 1 より 大きい 分は、公式の 形の まま さらに 回す
    const a = Math.max(0, arms[sg] || 0), u = Math.min(1, a), extra = (a - u) * (sg === 0 ? 1 : -1), c = S.top;
    const pol = (p, o = c) => [Math.hypot(p[0] - o[0], p[1] - o[1]), Math.atan2(p[1] - o[1], p[0] - o[0])];
    // 腕の 形を 寄せる 時の 中心は 肩の つけ根（体の 線が 顔に かくれる 所から 少し 顔の 中へ 入った 点。ちょうど 接点に 置くと、近くの 点の 向きが 乱れて 線が V字に 折れた）。わきを 中心に すると、肩の 上が 顔の 方へ 大きく 持ち上がり、
    // 肩を すくめた ように 見えた（2026-11-21 だいすけ「腕を 上げた 時、肩が 凄く 上がって いる ように 見える」）
    const cp = opt.armPivot === 'pit' ? c : S.jnIn;
    // 肩に 近い 点ほど 遅れて 動く（2026-11-21 だいすけ「腕を 上げる 時に 肩の 顔との 接点が ずれて おかしい」）。
    // 途中では 肩の 線が 首の つけ根から 外へ 出てから 腕へ 上がり、顔との 接点が ずり上がらない。上げきると 公式の 形
    const pts = S.arm.map((p, i) => {
      const lag = i < ARM_N ? (opt.lag ?? SHOULDER_LAG) * (1 - smooth(0, .5, i / (ARM_N - 1))) : 0, ui = smooth(0, 1, Math.min(1, Math.max(0, (u - lag) / (1 - lag))));
      const [r0, f0] = pol(p, cp), [r1, f1] = pol(S.goal[i], cp); let df = f1 - f0; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI;
      const uu = lag > 0 ? ui : u, r = r0 + (r1 - r0) * uu, f = f0 + df * uu + extra; return [cp[0] + r * Math.cos(f), cp[1] + r * Math.sin(f)];
    });
    // 首もとの 接点は 顔の ふちの すぐ外なので、そこが 角に なると 線が とげの ように 出る。顔の 中へ 入った 点（jnIn）を 角に する
    const jnIn = S.jnIn; shoulder[sg] = jnIn; if (opt.probe) (opt.probe[sg] = pts);
    // 首もとの すき間うめ：胴の 上の ふち（接点の 手前）と 腕の 上の ふちの 始まりの 間に、顔の ふちの すぐ下で V字の すき間が できる。そこを 布で うめる（塗るだけ）
    if (a > 0) fills.push([jnIn, ...S.neck, ...pts.slice(0, 14)]);
    armPts[sg] = pts;
  });
  // 描き方（2026-11-21 だいすけ「脇の ところに もや」「首の 所の 変な やつ だめ」）：
  // 胴を 塗って 外がわの 線を 描き、その 上に 腕を 塗って 腕の 外がわの 線を 描く。線は 元の 輪と 同じ 太さ（塗りの ふちが 線の まん中）。
  // 顔の 中に 入る つなぎの 辺（jnIn に つながる 辺）は 描かない。腕の 下の 線が しわの 線の 代わりに なるので、半透明で 消す 線は 無い
  const torso = torsoNow();
  const fillPath = (pts) => { const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(...q) : p.moveTo(...q))); p.closePath(); return p; };
  const strokeLines = (lines) => { const p = new Path2D(); for (const L of lines) if (L.length > 1) L.forEach((q, i) => (i ? p.lineTo(...q) : p.moveTo(...q))); g.stroke(p); };
  // 胴の 外がわの 線：jnIn の 所で 切る（jnIn に つながる 辺は 描かない）
  const torsoLines = []; { let cur = []; const isJ = (q) => R.sides.some((S) => S.jnIn === q);
    const n = torso.length, start = torso.findIndex((q) => !isJ(q));
    for (let k = 0; k <= n; k++) { const q = torso[(start + k) % n]; if (isJ(q)) { torsoLines.push(cur); cur = []; } else cur.push(q); }
    torsoLines.push(cur); }
  g.save(); g.lineWidth = R.ow * 2; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = lineCol; g.fillStyle = bodyCol;
  g.fill(fillPath(torso)); strokeLines(torsoLines);
  armPts.forEach((pts, sg) => { g.fill(fillPath([R.sides[sg].jnIn, ...pts])); });
  fills.forEach((f) => g.fill(fillPath(f)));
  strokeLines(armPts);
  g.restore();
}

// まつげ（2026-11-21 だいすけ「長い まつげと 短い まつげの 位置関係、閉じる 前と 後で 変わらない はず」「そんな 横に いかない」）。
// 閉じた 時は 並びは 開いた 目と 同じ まま、上下だけ 逆さに する（上まぶたが 下へ 閉じると まつげは 下を 向く。だいすけ「上下 逆に なるだけ」）。
// 付け根は 白目の だ円に いちばん 近い 点。いちばん 内がわの 付け根（anchor）を 目尻（すやすやの 弧の 外の はし）に 合わせ、
// 目尻の 線は もう1本の 付け根（tail）まで 伸ばす（だいすけ「まつげ 着いてる ところまで 目尻の 線 伸ばして」）
function lashInfo(P, Q, A) {
  const groups = [[], []];
  for (const i of Q.lashes) { const b = P.parts[i].el.getBBox(), k = Math.abs(b.x + b.width / 2 - A.white[0].cx) < Math.abs(b.x + b.width / 2 - A.white[1].cx) ? 0 : 1; groups[k].push(i); }
  return groups.map((ids, k) => {
    const w = A.white[k], ev = (p) => ((p[0] - w.cx) / w.rx) ** 2 + ((p[1] - w.cy) / w.ry) ** 2;
    const bases = ids.map((i) => samplePath(P.parts[i].el, 200).reduce((b, p) => (ev(p) < ev(b) ? p : b)));
    // anchor は 目頭に 近い 方（上の 付け根）、tail は 目尻 寄りの もう1本の 付け根
    const order = bases.map((b, j) => j).sort((a, c) => bases[a][1] - bases[c][1]);
    return { k, ids, anchor: bases[order[0]], tail: bases[order[order.length - 1]] };
  }).filter((q) => q.ids.length);
}
// 目尻の 線を どこまで 伸ばすか（弧の 外の はしの 先を、tail に いちばん 近づく 所まで）
function lashReach(e, o) {
  const s = e.k === 0 ? -1 : 1, end = o.pt(s, -1), T = [e.tail[0] - e.anchor[0] + end[0], -(e.tail[1] - e.anchor[1]) + end[1]];
  let best = 1, bd = 1e9; for (let u = 1; u <= 2.5; u += .005) { const q = o.pt(s * u, -1), d = Math.hypot(q[0] - T[0], q[1] - T[1]); if (d < bd) { bd = d; best = u; } }
  return { u: best, T, end };
}

// ---- 前向きの 絵（表情つき）----
// pose.lids：[S の目, C の目] を 0（開く）〜1（閉じる）で 片目ずつ。あれば pose.eye の 'closed' より 優先（2026-11-22 キャラ画像メーカー用）
// pose.eye：'left'（左を 見る）・'right'（右を 見る）・'closed'（すやすや）。なしで 元の 絵の まま。
//   2026-11-21 だいすけ「目は 左右と 閉じた 目だけ。上下・まん中は 使わない。なめらかに 動かなくて いい（気持ち 悪い）。
//   まばたきの 絵を 挟んで 左右に 動く パラパラ漫画調」→ 目は 3つの 絵の 切りかえ。左右を かえる 時は、呼ぶ がわで 間に 'closed' の コマを 入れる。
//   閉じた 目は「すやすや」：S・C の 丸い 輪郭を 残し、S の 横棒だけ 消して、白目の はばの 半分の 下に ふくらむ 弧。
//   左右は 黒目を 元の 絵と 同じ だけ 横に 寄せる（たての 位置は 元の まま）
const LINE = '#231815';
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function drawFront(g, P, W, H, pose = {}) {
  const Q = PARTS[P.name], A = P.eyes || (P.eyes = analyzeEyes(P, P.name)), PI = P.pupils || (P.pupils = pupilInfo(P, Q));
  const lid0 = pose.eye === 'closed' ? 1 : 0, lids = pose.lids ? pose.lids.map(Number) : [lid0, lid0], lid = Math.max(lids[0], lids[1]), skin = P.parts[Q.skin].fill, white = P.parts[Q.eyeWhite[0]].fill;
  const eyeParts = new Set([...Q.eyeWhite, ...Q.pupilS, ...Q.pupilC, ...Q.sparkS, ...Q.sparkC, Q.outS]);
  // 黒目の ずれ：両目とも 同じ 向きを 見る。動ける はばは 白目と 黒目の 大きさの 差
  const off = [PI.S, PI.C].map((p, k) => {
    if (pose.eye !== 'left' && pose.eye !== 'right') return [0, 0];
    // 寄せる はばは 元の 絵の 黒目と 白目の 中心の ずれと 同じ（元の 絵で 見て いる 向きは そのまま、反対の 向きは 左右に 写す）。
    // 2026-11-21 だいすけ「黒目の 形 元と 違う？よこはば 狭く なってる？」→ もっと 寄せると ふちの 線に かくれて 細く 見えた
    const w = A.white[k], mx = Math.abs(p.cx - w.cx);
    return [w.cx + (pose.eye === 'left' ? -mx : mx) - p.cx, 0];
  });
  // 開いて いる 所の 形（白目の 中心から、上の ふちと 下の ふち）。すやすやの 弧の 高さ・はば・ふくらみ
  const opening = (w, lid) => {
    const yc = w.cy + w.ry * .06, hw = w.rx / 2, sag = w.rx * .2;
    const rx = w.rx * 1.6 + (hw - w.rx * 1.6) * lid, ry = w.ry * 1.7 * (1 - lid);
    const pt = (u, sgn) => [w.cx + u * rx, yc + sgn * ry * Math.sqrt(Math.max(0, 1 - u * u)) + sag * (1 - u * u) * lid];
    return { pt, yc };
  };
  const openPath = (w, l) => { const o = opening(w, l), p = new Path2D(); for (let i = 0; i <= 40; i++) { const [x, y] = o.pt(-1 + 2 * i / 40, -1); i ? p.lineTo(x, y) : p.moveTo(x, y); } for (let i = 40; i >= 0; i--) { const [x, y] = o.pt(-1 + 2 * i / 40, 1); p.lineTo(x, y); } p.closePath(); return p; };
  // 腕の 角度：pose.arms ＝ [画面の 左, 画面の 右]（ラジアン。＋で 上げる）。体の 線ごと 曲げる
  const back = pose.view === 'back', pa = pose.arms || [0, 0], arms = back ? [pa[1], pa[0]] : pa, bend = !!(arms[0] || arms[1]);
  const warpSet = new Set([Q.body, Q.bodyLine, ...Q.arms.flat()]);
  // 後ろ姿（pose.view === 'back'）：公式の 絵に 無いので 案（2026-11-21）。前の 絵を 左右 反転して、顔（目・まつ毛・鼻・口・ほっぺ・前髪の くるん）と 胸の ロゴを 消し。つむじは 描かない（だいすけ 2026-11-21「つむじは なしで いい」）。
  // 腕の 左右も 入れかわる（pose.arms の [0] は 画面の 左の 腕）
  const skip = new Set(back ? [...Q.face, ...Q.logo] : []);
  g.save(); g.clearRect(0, 0, W, H); g.scale(W / P.vb.w, H / P.vb.h); g.translate(-P.vb.x, -P.vb.y);
  if (back) { const mx = P.vb.x + P.vb.w / 2; g.translate(mx, 0); g.scale(-1, 1); g.translate(-mx, 0); }
  P.parts.forEach((p, i) => {
    if (skip.has(i)) return;
    // 腕を 動かす 時は、体の 番で 胴と 腕を まとめて 描く（輪の 線・しわは そこで 描く）
    if (bend && warpSet.has(i)) { if (i === Q.body) drawArmsBody(g, P, Q, arms, pose); return; }
    // まつげ：目を 閉じた 時は すやすやの 弧の 外がわの はしへ 移す（2026-11-21 だいすけ「目 閉じた 時に まつげが ついて いって ない」）
    if (lid > 0 && Q.lashes.includes(i)) {
      const L = P.lash || (P.lash = lashInfo(P, Q, A)), e = L.find((q) => q.ids.includes(i));
      if (!lids[e.k]) { drawPart(g, p); return; }
      const end = opening(A.white[e.k], lids[e.k]).pt(e.k === 0 ? -1 : 1, -1);
      g.save(); g.translate(end[0], end[1]); g.scale(1, -1); g.translate(-e.anchor[0], -e.anchor[1]); drawPart(g, p); g.restore();
      return;
    }
    if (!eyeParts.has(i)) { drawPart(g, p); return; }
    // 目は 白目の 番で まとめて 描く（S の 輪郭は その後）
    const k = Q.eyeWhite.indexOf(i);
    if (k >= 0) {
      const wp = P.parts[i].path, w = A.white[k];
      g.save(); g.clip(wp);
      if (lids[k] > 0) { g.fillStyle = skin; g.fill(wp); g.clip(openPath(w, lids[k])); }
      g.fillStyle = white; g.fill(wp);
      g.restore(); g.save(); if (lids[k] > 0) g.clip(openPath(w, lids[k]));
      g.beginPath(); g.ellipse(w.cx, w.cy, w.rx + 1.5, w.ry + 1.5, 0, 0, 7); g.clip();
      // 左右を 向く 時、黒目は 白目の 形の 中だけ（ふちの 線の 切れ目から 外へ はみ出さない。2026-11-21 だいすけ「ミルンくんの 左向きの 黒目が はみ出してる」）。
      // 動かさない 時は 元の 絵の まま（元の 絵でも ミルンくんの C の 黒目は 切れ目から 少し 出て いる）
      if (off[k][0] || off[k][1]) g.clip(wp);
      g.save(); g.translate(off[k][0], off[k][1]);
      if (k === 0) {
        g.restore();
        // S の 目：元の 上下の 部品を そのまま 動かし、帯より 上・下で 切る（動かない 時は 元の 絵と 同じ）。
        // たてに 動いて 帯との 間に すき間が できた 所だけ、組み直した だ円で 埋める
        const [dx, dy] = off[k], big = 999, half = (j, y0, y1) => { g.save(); g.beginPath(); g.rect(-big, y0, 2 * big, y1 - y0); g.clip(); g.translate(dx, dy); drawPart(g, P.parts[j]); g.restore(); };
        half(Q.pupilS[0], -big, PI.band[0]); half(Q.pupilS[1], PI.band[1], big);
        const gap = dy > 0 ? [PI.band[1], PI.band[1] + dy] : dy < 0 ? [PI.band[0] + dy, PI.band[0]] : null;
        if (gap) { g.save(); g.beginPath(); g.rect(-big, gap[0], 2 * big, gap[1] - gap[0]); g.clip(); g.fillStyle = P.parts[Q.pupilS[0]].fill; g.beginPath(); g.ellipse(PI.S.cx + dx, PI.S.cy + dy, PI.S.rx, PI.S.ry, 0, 0, 7); g.fill(); g.restore(); }
        g.save();
      } else Q.pupilC.forEach((j) => drawPart(g, P.parts[j]));
      g.restore();
      // 横棒の 下の 白い すじ（動かない）
      if (k === 0) { g.save(); g.clip(wp); g.fillStyle = white; g.fillRect(w.cx - w.rx * 2, PI.band[0], w.rx * 4, PI.band[1] - PI.band[0]); g.restore(); }
      g.restore();
      return;
    }
    // キラキラ：元の 絵と 同じく 輪郭より 後に 描く（S の 横棒に 重なって いる）。黒目と いっしょに 動く。まぶたで かくれる
    const sk = Q.sparkS.includes(i) ? 0 : Q.sparkC.includes(i) ? 1 : -1;
    if (sk >= 0) {
      g.save(); if (lids[sk] > 0) g.clip(openPath(A.white[sk], lids[sk]));
      // 左右を 向く 時は 白目の だ円の 中だけ（切れ目から 出ない）
      if (off[sk][0] || off[sk][1]) { const w = A.white[sk]; g.beginPath(); g.ellipse(w.cx, w.cy, w.rx, w.ry, 0, 0, 7); g.clip(); }
      g.translate(off[sk][0], off[sk][1]); drawPart(g, p); g.restore();
      return;
    }
    if (i === Q.outS) {
      if (lids[0] <= 0) { drawPart(g, p); return; }
      // 丸い 所は 横棒の 無い S。横棒は 開いて いる 所の 中だけ 残す（まぶたが 横棒より 下へ 来たら 見えなく なる）
      drawBarlessS(g, A.S, LINE);
      g.save(); g.clip(openPath(A.white[0], lids[0])); g.beginPath(); g.rect(A.S.cx - A.S.rx * .8, A.S.barY - A.S.sw * 1.2, A.S.rx * 1.6, A.S.sw * 2.4); g.clip(); drawPart(g, p); g.restore();
    }
  });
  if (back) { g.restore(); return; }
  // まぶたの ふち（開いて いる 所の 上の ふち）。閉じきると すやすやの 弧
  if (lid > 0) {
    g.save(); g.strokeStyle = LINE; g.lineWidth = A.S.sw; g.lineCap = 'round';
    A.white.forEach((w, k) => {
      const lid = lids[k]; if (lid <= 0) return; g.globalAlpha = smooth(0, .25, lid);
      const o = opening(w, lid); g.save();
      if (lid < .999) g.clip(P.parts[Q.eyeWhite[k]].path);
      // 目を 閉じきった 時、まつげの ある 目は 目尻の 線を まつげの 付け根まで 伸ばす
      let u0 = -1, u1 = 1; if (lid >= .999 && Q.lashes.length) { const e = (P.lash || (P.lash = lashInfo(P, Q, A))).find((q) => q.k === k); if (e) { const r = lashReach(e, o); if (k === 0) u0 = -r.u; else u1 = r.u; } }
      g.beginPath(); for (let i = 0; i <= 60; i++) { const [x, y] = o.pt(u0 + (u1 - u0) * i / 60, -1); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.restore();
    });
    g.restore();
  }
  g.restore();
}

const SVG = { miruko: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg id=\"_レイヤー_1\" data-name=\"レイヤー 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 204.09 247.18\" width=\"408.18\" height=\"494.36\">\n  <defs>\n    <style>\n      .cls-1, .cls-2, .cls-3 {\n        fill: none;\n      }\n\n      .cls-2 {\n        stroke-width: 2.73px;\n      }\n\n      .cls-2, .cls-4, .cls-3 {\n        stroke: #af725a;\n        stroke-linejoin: round;\n      }\n\n      .cls-2, .cls-3 {\n        stroke-linecap: round;\n      }\n\n      .cls-5 {\n        fill: #75c5b2;\n      }\n\n      .cls-4 {\n        fill: #fff100;\n        stroke-width: 1.68px;\n      }\n\n      .cls-6 {\n        fill: #af725a;\n      }\n\n      .cls-7 {\n        fill: #fff7ee;\n      }\n\n      .cls-8 {\n        fill: #231815;\n      }\n\n      .cls-9 {\n        fill: #534d9e;\n      }\n\n      .cls-10 {\n        fill: #fff;\n      }\n\n      .cls-11 {\n        fill: #ea616c;\n      }\n\n      .cls-12 {\n        fill: #fffcd1;\n      }\n\n      .cls-13 {\n        fill: #123e20;\n      }\n\n      .cls-14 {\n        fill: #f9d1c3;\n      }\n\n      .cls-15 {\n        fill: #f19dae;\n      }\n\n      .cls-3 {\n        stroke-width: 2.09px;\n      }\n    </style>\n  </defs>\n  <path class=\"cls-15\" d=\"M171.79,206.84c-3.99-3.61-9.3-8.13-9.3-8.13l2.49,1.49c-.48-18.17-21.46-30.86-21.46-30.86-13.53,7.45-27.52,9.97-40.1,10.03-12.6.03-26.71-2.37-40.64-9.72,0,0-20.29,12.86-19.81,31.02l2.41-1.49s-5.07,4.56-8.86,8.19c0,0-7.68,7.57,11.89,5.1,0,0,.1-.34.3-.94-1.27,3.88-2.02,8.16-1.66,12.64,0,0,0,3.81-4.36,6.62,0,0-9.55,4.79-4.59,7.33,0,0,33.6,7.63,63.43,7.51,0,0,1.31.02,3.65,0,2.33,0,3.64-.02,3.64-.02,29.83-.11,63.01-8,63.01-8,4.83-2.58-4.98-7.29-4.98-7.29-4.51-2.78-4.71-6.58-4.71-6.58.12-4.48-.85-8.76-2.33-12.62.23.59.34.94.34.94,19.71,2.31,11.63-5.19,11.63-5.19ZM49.33,209.77c1.47-3.96,4.73-11.4,9.76-15.79,0,0-6.23,6.48-9.76,15.79ZM49,210.66c.04-.1.08-.21.12-.32-.05.11-.09.21-.12.32ZM159.11,209.36c-4.03-9.29-10.61-15.72-10.61-15.72,5.27,4.36,8.92,11.77,10.61,15.72ZM159.34,209.91c.06.11.1.23.14.32-.05-.1-.08-.21-.14-.32Z\"/>\n  <path class=\"cls-6\" d=\"M142.67,167.97c-11.7,6.46-24.93,9.75-39.3,9.83-14.36.04-27.76-3.16-39.81-9.51-.55-.29-1.21-.27-1.73.06-.86.54-21.02,13.53-20.52,32.33,0,0,0,.01,0,.02-2.62,2.44-5.99,5.56-5.99,5.56-.27.25-2.01,2.05-1.95,4.06.01.5.13,1.01.41,1.51,1.31,2.38,5.26,3.12,12.56,2.42-.66,2.86-1.1,5.68-1.03,8.42.02.48.04.97.07,1.45,0,.21-.16,3.08-3.62,5.32-1.73.88-6.79,3.72-6.75,6.86,0,.02,0,.03,0,.04.02.91.45,2.16,2.31,3.12.13.08.28.12.41.16.34.07,34.15,7.67,63.83,7.55-.04,0,3.65-.01,3.65-.01l3.67-.02c29.66-.11,63.05-7.97,63.38-8.04.14-.04.28-.09.41-.15,1.81-.97,2.17-2.24,2.15-3.14,0-.01,0-.03,0-.04-.12-3.14-5.34-5.93-7.12-6.8-3.58-2.22-3.88-5.1-3.9-5.3,0-.49.01-.97-.01-1.46-.07-2.73-.65-5.56-1.47-8.41,7.33.64,11.24-.14,12.43-2.52.25-.51.34-1.01.33-1.51-.05-2.01-1.9-3.79-2.16-4.04,0,0-3.54-3.1-6.3-5.52,0-.01,0-.02.01-.03-.5-18.8-21.35-31.63-22.24-32.16-.51-.33-1.19-.34-1.72-.06ZM143.46,171.16c3.46,2.31,17.45,12.43,19.59,26.14-.67-.24-1.43-.1-1.87.45-.23.29-.34.63-.32.95,0,.42.19.84.54,1.15,0,0,9.2,8.06,9.23,8.08.62.59,1.14,1.42,1.14,1.82,0,.06,0,.1-.03.14-.01.02-1.04,1.63-10.38.67-.31-.8-1.24-1.23-2.1-.97-.69.23-1.11.84-1.1,1.5,0,.15.04.32.1.48h0c1.39,3.64,2.14,7.2,2.24,10.63,0,.48.01.95,0,1.42,0,.31.3,4.78,5.48,7.96.06.03.11.06.16.09,2.91,1.41,5.37,3.41,5.38,4.12,0,0,0,.01,0,.03,0,.03-.13.16-.37.31-2.67.63-34.2,7.78-62.36,7.89-.03,0-3.63.02-3.63.02-.03,0-3.63.01-3.63.01-28.18.1-60.08-6.81-62.78-7.42-.25-.15-.38-.27-.4-.3v-.03c-.02-.71,2.31-2.73,5.17-4.16.05-.03.09-.06.14-.09,5.02-3.21,5.07-7.69,5.07-7.89-.04-.48-.07-.97-.08-1.46-.09-3.49.46-7.06,1.66-10.71h0c.05-.17.07-.33.06-.48-.01-.67-.46-1.28-1.17-1.49-.86-.27-1.77.16-2.05.97-9.29,1.03-10.41-.57-10.42-.59-.17-.3.34-1.29,1.02-1.97-.02.01,8.79-8.15,8.79-8.15.61-.56.65-1.48.1-2.1-.46-.55-1.22-.68-1.88-.43,1.41-13.72,14.86-23.96,18.2-26.29,12.31,6.3,25.92,9.49,40.5,9.45,14.58-.07,28.02-3.37,40-9.76ZM45.39,224.16s0,0,0,0c0,.03,0,.06,0,.09,0-.03,0-.05,0-.08ZM163.81,223.69v.09s0-.06,0-.09ZM105.23,247.16h0Z\"/>\n  <path class=\"cls-6\" d=\"M57.95,192.83s-.07.07-.1.1h0s-.02.02-.02.03c-5.21,4.61-8.54,12.15-10.07,16.26h0s0,.01,0,.01c-.07.18-.09.37-.09.55.02.64.45,1.22,1.11,1.46.86.3,1.8-.11,2.11-.91,3.37-8.9,9.38-15.23,9.44-15.29.59-.62.55-1.57-.09-2.16-.63-.6-1.64-.62-2.29-.06Z\"/>\n  <path class=\"cls-6\" d=\"M47.56,209.8h0l-.08.22h0s-.04.11-.04.11c-.07.17-.09.34-.09.52.01.62.46,1.2,1.14,1.42.85.29,1.79-.17,2.09-.96,0,.02,0,.04,0,.07l.11-.3c.29-.82-.17-1.73-1.04-2.01-.87-.3-1.8.11-2.1.93ZM49.55,209.14c.68.22,1.1.84,1.11,1.49,0,.11-.04.23-.06.35-.34.73-1.2,1.12-2.02.83-.67-.23-1.11-.83-1.12-1.46,0-.14.03-.26.06-.39.33-.75,1.19-1.11,2.03-.82Z\"/>\n  <path class=\"cls-6\" d=\"M147.29,192.54c-.61.61-.6,1.56.03,2.17.07.06,6.41,6.34,10.25,15.21.36.81,1.32,1.21,2.16.89.66-.24,1.06-.84,1.03-1.46,0-.19-.04-.37-.12-.55,0-.01,0-.01,0-.01h0c-1.75-4.11-5.48-11.62-10.92-16.18-.01,0-.03-.03-.03-.03h0s-.08-.07-.11-.1c-.67-.56-1.68-.52-2.29.07Z\"/>\n  <path class=\"cls-6\" d=\"M158.75,208.44c-.86.3-1.28,1.2-.94,2.01l.12.29s0-.03-.01-.06c.34.79,1.29,1.26,2.14.97.67-.23,1.1-.8,1.08-1.43,0-.17-.04-.33-.11-.51,0,0-.03-.06-.05-.12h0s-.09-.21-.09-.21h-.01c-.34-.82-1.29-1.24-2.13-.93ZM157.81,210.2c-.02-.64.38-1.26,1.04-1.5.82-.29,1.71.07,2.07.82.04.12.07.25.08.37.02.64-.38,1.25-1.05,1.49-.81.27-1.69-.1-2.06-.84-.04-.12-.07-.23-.07-.35Z\"/>\n  <path class=\"cls-7\" d=\"M183.86,102.63c1.12,42.26-35.22,76.66-81.19,76.85-45.96.17-84.13-33.95-85.25-76.21-1.12-42.26,35.23-76.67,81.18-76.84,45.95-.18,84.13,33.93,85.25,76.2Z\"/>\n  <path class=\"cls-10\" d=\"M98.63,113.74c.45,16.82-10.85,30.48-25.23,30.54-14.39.06-26.41-13.52-26.85-30.33-.45-16.81,10.85-30.48,25.23-30.54,14.39-.05,26.41,13.52,26.86,30.33Z\"/>\n  <path class=\"cls-10\" d=\"M156.35,113.52c.44,16.81-10.86,30.49-25.24,30.55-14.38.05-26.42-13.52-26.86-30.34-.44-16.81,10.86-30.47,25.24-30.54,14.39-.05,26.41,13.53,26.86,30.33Z\"/>\n  <path class=\"cls-6\" d=\"M20.91,121.7c-.87.22-1.38,1.07-1.12,1.91,10.64,34.5,45.05,58.5,83.7,58.34,38.64-.15,71.77-24.4,80.56-58.96.21-.84-.34-1.69-1.22-1.92-.89-.21-1.78.28-2,1.12-8.44,33.21-40.29,56.48-77.43,56.63-37.14.15-70.21-22.9-80.42-56.03-.25-.84-1.17-1.33-2.06-1.1Z\"/>\n  <path class=\"cls-6\" d=\"M16.52,103.81c.1,3.67.49,7.39,1.14,11.06.16.86,1.02,1.44,1.91,1.32.91-.13,1.51-.92,1.36-1.78-.63-3.51-1-7.08-1.1-10.62-1.1-41.55,34.59-75.5,79.57-75.67,44.97-.18,82.47,33.48,83.57,75.04.09,3.58-.09,6.83-.57,10.57-.12.85.53,1.65,1.43,1.77.91.12,1.74-.47,1.85-1.32.51-3.9.7-7.3.6-11.03-1.16-43.28-40.17-78.34-86.97-78.16-46.8.18-83.94,35.54-82.79,78.82Z\"/>\n  <path class=\"cls-13\" d=\"M74.78,114.81c0-.18,0-.35,0-.53-.22-7.96-6.48-14.39-14.04-14.36-7.52.03-13.45,6.51-13.24,14.47,0,.14,0,.3.02.45l27.26-.03Z\"/>\n  <path class=\"cls-13\" d=\"M132.31,116.34c.24,9.22-5.45,16.72-12.71,16.74-7.27.03-13.34-7.42-13.59-16.64-.25-9.23,5.45-16.73,12.71-16.76,7.27-.03,13.35,7.43,13.6,16.65Z\"/>\n  <g>\n    <path class=\"cls-6\" d=\"M19.31,113.39c-.92,0-1.65.71-1.62,1.58.03.86.78,1.56,1.7,1.55l22.09-.08c.92,0,1.63-.71,1.61-1.58-.02-.86-.78-1.56-1.69-1.55l-22.09.08Z\"/>\n    <path class=\"cls-6\" d=\"M1.61,113.46c-.92,0-1.64.71-1.61,1.57.02.86.78,1.57,1.7,1.56l9.31-.04c.91,0,1.63-.71,1.61-1.57-.04-.86-.79-1.56-1.7-1.55l-9.31.03Z\"/>\n  </g>\n  <g>\n    <path class=\"cls-6\" d=\"M162.3,112.84c-.92,0-1.65.7-1.62,1.56.02.86.77,1.56,1.69,1.56l21.7-.09c.92,0,1.63-.7,1.62-1.57-.03-.86-.78-1.56-1.69-1.55l-21.7.08Z\"/>\n    <path class=\"cls-6\" d=\"M192.38,112.72c-.91,0-1.63.7-1.61,1.57.02.86.78,1.56,1.7,1.55l10.01-.03c.91,0,1.63-.71,1.61-1.58-.02-.85-.78-1.55-1.7-1.55l-10.01.04Z\"/>\n  </g>\n  <path class=\"cls-13\" d=\"M74.82,120.84l-25.39.17c-.43.1-1.12.4-1.28,1.22.02.17.04.34.07.51.14,1.07.44,2.56,1.09,4.18l.33-.31c2.3,3.86,6.9,6.51,12.14,6.49,7.39-.03,13.22-5.33,13.05-11.83,0-.14,0-.29-.02-.43Z\"/>\n  <path class=\"cls-11\" d=\"M117.31,151.97h0c-4.65,5.7-9.46,8.58-14.29,8.55-6.1-.03-11.26-4.6-14.5-8.43-.61-.73-1.7-.86-2.46-.29-.38.28-.63.71-.68,1.17-.05.47.09.94.4,1.31,3.73,4.41,9.76,9.67,17.26,9.71,5.96.03,11.7-3.28,17.06-9.83.3-.36.43-.81.38-1.28-.06-.47-.31-.9-.7-1.19-.78-.57-1.86-.45-2.46.28Z\"/>\n  <path class=\"cls-14\" d=\"M71.92,150.21c0,3.05-5.65,5.52-12.61,5.52s-12.61-2.47-12.61-5.52,5.64-5.52,12.61-5.52,12.61,2.47,12.61,5.52Z\"/>\n  <path class=\"cls-14\" d=\"M156.51,150.21c0,3.05-5.65,5.52-12.61,5.52s-12.61-2.47-12.61-5.52,5.65-5.52,12.61-5.52,12.61,2.47,12.61,5.52Z\"/>\n  <path class=\"cls-10\" d=\"M123.49,112.65c-5.43.96-6.21,1.73-7.16,7.16-.96-5.43-1.74-6.21-7.16-7.16,5.43-.96,6.2-1.74,7.16-7.16.96,5.43,1.74,6.21,7.16,7.16Z\"/>\n  <path class=\"cls-10\" d=\"M125.07,120.53c-3.04.54-3.48.97-4.01,4.01-.54-3.04-.97-3.47-4.01-4.01,3.04-.54,3.48-.97,4.01-4.01.54,3.04.97,3.48,4.01,4.01Z\"/>\n  <g>\n    <polygon class=\"cls-8\" points=\"148.54 90.5 155.2 85.69 150.74 92.92 148.54 90.5\"/>\n    <polygon class=\"cls-8\" points=\"150.99 95.19 161.33 88.73 154 99 150.99 95.19\"/>\n  </g>\n  <g>\n    <polygon class=\"cls-8\" points=\"54.62 90.49 47.96 85.7 52.43 92.92 54.62 90.49\"/>\n    <polygon class=\"cls-8\" points=\"52.19 95.19 41.83 88.75 49.19 99.01 52.19 95.19\"/>\n  </g>\n  <path class=\"cls-4\" d=\"M22.47,123.65l4.32,1.78-4.11,2.32-.28,4.64-3.57-3.13-4.66.95,2.06-4.17-2.4-4.05,4.62.59,3.09-3.51.94,4.58Z\"/>\n  <path class=\"cls-4\" d=\"M188.55,122.6l4.32,1.78-4.11,2.32-.28,4.64-3.57-3.13-4.66.95,2.05-4.17-2.4-4.05,4.62.59,3.09-3.51.94,4.58Z\"/>\n  <path class=\"cls-8\" d=\"M103.89,112.61c.47,17.57,13.1,31.81,28.16,31.76,9.81-.04,18.74-6.25,23.33-16.2.36-.78-.02-1.72-.87-2.07-.84-.35-1.82,0-2.17.77-4.07,8.83-11.88,14.35-20.37,14.37-13.24.05-24.34-12.8-24.76-28.64-.42-15.86,10-28.79,23.23-28.85,8.63-.03,16.78,5.54,21.29,14.53.4.78,1.39,1.13,2.22.78.82-.35,1.17-1.28.78-2.06-5.09-10.14-14.42-16.41-24.36-16.37-15.06.05-26.93,14.41-26.47,31.98Z\"/>\n  <path class=\"cls-8\" d=\"M45.6,112.96l.1,1.9c.04.85.78,1.49,1.69,1.49,0,0,45.97-.16,49.33-.17-1.03,14.41-10.9,25.51-23.08,25.55-9.11.04-17.47-6.04-21.84-15.85-.35-.79-1.32-1.18-2.17-.87-.84.33-1.23,1.24-.87,2.04,4.9,11.03,14.48,17.86,24.97,17.82,14.41-.05,26.02-13.3,26.41-30.19,0-.02,0-.05,0-.07,0-.4-.18-.78-.48-1.07-.32-.3-.75-.49-1.21-.48,0,0-46.49.15-49.51.17,0-.07-.02-.27-.02-.27-.43-15.92,9.98-28.91,23.19-28.96,9.73-.04,18.61,6.95,22.63,17.79.3.82,1.24,1.26,2.12.99.85-.27,1.3-1.15,1-1.97-4.49-12.15-14.64-19.98-25.83-19.94-15.04.07-26.88,14.46-26.41,32.1Z\"/>\n  <path class=\"cls-10\" d=\"M65.7,112.65c-5.43.96-6.21,1.73-7.16,7.16-.96-5.43-1.74-6.21-7.16-7.16,5.43-.96,6.21-1.74,7.16-7.16.96,5.43,1.74,6.21,7.16,7.16Z\"/>\n  <g>\n    <path class=\"cls-6\" d=\"M97.65,137.96c-.28.25-.37.63-.22.97.37.82,3.91,1.76,9.07.56.49-.12.79-.59.65-1.06-.13-.47-.64-.76-1.14-.64-4.88,1.15-7.29.06-7.32.04-.35-.16-.77-.11-1.05.14Z\"/>\n    <path class=\"cls-6\" d=\"M101.21,139.19l.13,4.8c.02.49.44.87.95.87.51,0,.92-.4.91-.88l-.13-4.79c-.01-.48-.44-.87-.95-.87-.51,0-.91.4-.91.88Z\"/>\n  </g>\n  <g>\n    <path class=\"cls-1\" d=\"M95.11,44.27c-7.68,5.98-17.59,20.52-7.62,29.07,8.17,7.01,26.14,1.24,28.27-9.1,2.17-10.53-15.55-11.67-21.26-6.26-7.48,7.08,5.07,10.42,10.43,6.64\"/>\n    <path class=\"cls-6\" d=\"M96.66,42.19c-8.41,6.82-21.25,21.79-12.13,32.47,8.66,10.14,24.87,1.08,30.69-7.43,2.84-4.15,4.09-9.3-.58-12.65-4.46-3.21-11.7-2.54-16.39-.26-3.22,1.56-7.71,6.36-8,10.02-.45,5.66,10.12,4.21,12.87,2.54,1.48-.9,2.75-4.02,3.6-4.53-3.03,1.85-6.63,1.94-9.9.72-1.22-.46-2.1-1.33-2.6-2.5-.83-1.91,1.32-2.18,2.91-2.71,5.77-1.93,16.18-.81,16.88,6.76.85,9.29-15.12,10.53-21.12,8.47-12.83-4.41-6.89-20.6.67-26.73,1.04-.85,1.92-2,2.72-3.08.12-.16,1.28-1.82.38-1.09h0Z\"/>\n  </g>\n  <g>\n    <path class=\"cls-12\" d=\"M51.21,14.14c.5.64,1.27.5,1.92.4.09.24.29.44.54.35.69.02,1.51.41,2.4.23.49.23.99.87,1.8.45-.04.29.29.44.49.23l.48-.17.13.36c1.87.28,3.39.7,5.22.86-.04.28.17.48.41.4l.48-.17c-.08.16.13.36.37.27.48-.17,1.23.38,1.75.33,2.82.63,5.68,1.38,8.52,1.31.59.88,1.38,1.55,2.16,2.23,23.11,12.33,47.22,20.6,71.27,27.95.32-.25.61.19.82.39,2.65.55,5.88,1.58,8.45,1.89,3.68,1.13,7.55,1.66,11.66,2.1.61-.22,1.5,0,1.98-.57.8,1.08,2.7,1.08,3.38,2.2,5.61,1.95,11.18,4.18,16.92,6.49,1.93.81,3.3,2.37,3.48,4.76-1.86,3.94-7.24,3.41-10.85,3.61-1.18-.26-2.36-.11-3.41,0-.55-.76-1.17.55-1.63-.37-.85-.1-1.87.12-2.52-.19l-.36.13c-.73-.15-1.18-.26-2.04-.36-1.02-.18-2.32-.39-3.58-.08-.46-.52-1.15-.54-1.32-1.03-2.48-.07-5.63-1.25-8.33-1.93-.89.18-1.93-.81-2.9-.46-.78-.27-1.32-1.03-2.41-.64-.1-.65-.78-.27-1.23-.38l-25.27-7.32-.78-.67c-21.26-7.94-43.08-13.22-64.01-22.91l-2.07-.07c-2.26-2.87-5.9-3.89-9.07-5.89-4.61-2.58-8.68-6.71-9.66-12.5.13-1.55,1.83-1.75,2.96-2.02,1.06.3,2.83,1.03,3.84.81\"/>\n    <path class=\"cls-12\" d=\"M119.86,1.28c.38.68.98.06,1.5,0,1.1.02,2.08.48,3.21.21.91.63,2.69.26,3.84.81.97.06,1.92.4,2.89.46,1.71.21,2.58.72,4.54,1.24,5.68,1.38,12.01,4.97,16.55,8.12.52,1.45,2.39,1.33,2.95,2.9l.24-.09c.39,1.09,1.29,1.31,1.84,2.07,1.02.18.6,1.69,1.66,1.59,2.34,3.12,4.62,6.8,6.81,10.25l4.53,11.89.4,1.9c-4.82.64-9.59-.11-14.16-1.07-2.03.04-3.54-.37-5.38-.94-1.22.03-1.96-.52-3.02-.82-1.14-.14-2.33-.4-3.63-.61-20.69-5.96-41.59-14.03-61.6-24.18l-.96-1.16C92.95,5.74,107.54.78,119.86,1.28\"/>\n    <path class=\"cls-15\" d=\"M82.08,13.86l.96,1.16c20.01,10.16,40.91,18.22,61.6,24.18,1.3.22,2.49.47,3.63.61,1.06.3,1.81.85,3.02.82,1.84.57,3.35.98,5.38.94,4.57.95,9.34,1.7,14.16,1.07l.74,2.06c-.52.46.31,1.25.12,1.86-.13,1.55.2,3.21.47,4.75l-.08,1.67c-.47.58-1.37.35-1.98.57-4.11-.44-7.98-.96-11.66-2.1-2.57-.31-5.8-1.33-8.45-1.89-.21-.2-.5-.64-.82-.39-24.05-7.35-48.16-15.62-71.27-27.95-.79-.67-1.58-1.35-2.16-2.23.39-.82,1.44-.93,1.67-1.82,1.44-.93,2.68-2.05,4.68-3.31\"/>\n    <path class=\"cls-15\" d=\"M187.92,30.92c1.03,2.5-1.01,5.55,2.07,7.31l.89,1.73c-6.06,1.35-12.9,2.85-17.81,6.65l-1.38-.05c.19-.61-.64-1.41-.12-1.86l-.74-2.06-.4-1.9c5.98-3.1,10.19-9.25,17.49-9.81\"/>\n    <path class=\"cls-15\" d=\"M190.89,39.96c1.87-.12,3.72-.65,5.67-.94,2.05,1.17.49,3.65,1.13,5.46-1.19,3.15,2.5,4.7,3.3,7.68-9.3,1.83-18.82,1.56-27.4-.69l-1.43-.17c-.28-1.54-.6-3.2-.47-4.75l1.38.05c4.91-3.81,11.75-5.3,17.81-6.65\"/>\n    <path class=\"cls-2\" d=\"M171.11,53.02s9.93,4.69,16.08,6.76c6.15,2.07,8.72,3.7,8.2,7.02-.52,3.32-10.34,3.7-19.6,2.47-9.26-1.24-37.83-9.49-51.24-14.36-13.41-4.87-38.06-12.54-44.3-14.86-6.24-2.32-21.38-8.84-28.7-14.19-7.32-5.35-9.46-13.68-3.24-12.21,6.22,1.47,27.07,5.66,27.07,5.66,0,0,12.74-13.67,32.58-17.08,19.83-3.41,38.79,3.46,49.47,15,10.68,11.54,15.83,29.89,13.67,35.79Z\"/>\n    <path class=\"cls-3\" d=\"M75.39,19.32c7.1,5.71,27.62,14.15,48.69,21.75,21.07,7.6,41.14,13,47.74,12.34\"/>\n    <path class=\"cls-3\" d=\"M81.61,14.24c12.74,6.96,64.2,29.71,88.95,28.52\"/>\n    <path class=\"cls-3\" d=\"M171.55,47.32s5.81-4.64,12.58-6c6.77-1.35,12.46-2.75,12.92-2.06.46.69-.03,7.05-.03,7.05l4.07,6.01s-17.35,2.8-29.13-1.51\"/>\n    <path class=\"cls-3\" d=\"M170.9,40.72s9.92-8.04,12.57-8.99c2.65-.95,4.55-.99,4.55-.99l-.4,4.84,3.4,4.12\"/>\n  </g>\n  <g>\n    <g>\n      <path class=\"cls-10\" d=\"M94.93,195.39c-9.92,4.73-14.09,13.6-11.44,24.33.11.47.44.88.88,1.12.45.24.98.3,1.46.14,2.3-.71,5.81-2.01,7.04-2.5.68-.28,1.09-.91,1.07-1.58,0-.18-.04-.35-.1-.54-.26-.69-.41-1.52-.43-2.44-.1-3.42,1.51-8.06,5.68-11.06,6.31-3.79,12.64-3.63,18.82.52-.05-.04-.11-.08-.16-.12,1.45,1.21,2.93,1.06,3.75.38.87-.74.95-1.97.2-3.01-4.52-6.35-16.65-10.09-26.79-5.25ZM86.32,214.17c-.18-6.94,3.36-12.42,10.29-15.73,3.65-1.73,7.45-2.11,10.91-1.66-4.12.14-7.71,1.58-10.47,3.26-.04,0-.07.04-.11.06-4.97,3.53-7.26,9.23-7.13,13.86.02.66.08,1.3.21,1.91-.97.37-2.2.81-3.38,1.21-.18-1-.28-1.98-.31-2.93Z\"/>\n      <path class=\"cls-5\" d=\"M118.95,202c1.04.88,1.85.37,1.28-.4-3.84-5.4-14.97-9.2-24.46-4.68-8.87,4.22-13.11,12.02-10.52,22.45,2.3-.71,5.79-2.01,6.91-2.45-1.5-4.02.07-11.3,5.89-15.44,5.67-3.44,12.96-4.78,20.91.53Z\"/>\n    </g>\n    <g>\n      <path class=\"cls-10\" d=\"M133.87,197.53c-1.83.47-19.89,6.95-21.14,7.48-1.31.54-2.55.74-4.89.1-3.28-.95-6.64-.76-9.18.57-2.19,1.14-3.72,3.08-4.41,5.6-.19.65-.26,1.21-.25,1.69.03,1.12.5,1.82.96,2.26.5.47,1.16.69,1.91.79-2.95,1.03-6.28,2.19-9.97,3.5-7.12,2.5-13.82,4.87-14.51,5.09-1.4.43-2.26,1.61-2.22,2.88,0,.27.05.54.14.81.45,1.33,1.96,2.39,3.99,1.86,1.13-.29,7.71-2.62,11.64-4.02,4.62,6.6,16.22,12.2,28.51,6.68,6.95-3.14,12.51-10.37,12.28-19.2-.06-2.18-.59-4.48-1.43-6.82,1.98-.71,6.16-2.19,6.16-2.19l4.32-1.53c1.39-.43,2.26-1.61,2.23-2.89-.01-.26-.06-.53-.15-.81-.45-1.31-1.96-2.37-3.99-1.85ZM97.74,212.22c.45-1.66,1.36-2.84,2.71-3.54,1.7-.89,4.03-.99,6.42-.29.77.2,1.47.34,2.15.42-6.29,2.21-10.2,3.56-10.84,3.75-.27.08-.39.07-.54.08.01-.11.05-.25.1-.43ZM109.98,215.13c.28-.07.38-.07.54-.09-.01.12-.04.26-.09.43-.45,1.66-1.36,2.84-2.71,3.54-1.7.88-4.04.98-6.43.3-.75-.21-1.46-.34-2.13-.44,5.56-1.94,10.14-3.54,10.82-3.74ZM115.45,211.32c1.46,2.97-.33,10.7-5.11,13.9-6.05,3.9-13,1.94-14.98,1.25-2.26-.8-3.52-1.7-4.13-2.29,1.19-.42,2.65-.93,2.65-.93l1.55-.55c1.32-.55,2.54-.76,4.89-.12,3.28.95,6.64.75,9.18-.57,2.21-1.14,3.73-3.07,4.41-5.59.19-.64.27-1.21.26-1.69-.04-1.12-.49-1.83-.97-2.25-.5-.47-1.15-.69-1.89-.79,1.01-.35,2-.7,2.98-1.04.45-.09.81-.06,1.17.69ZM121.31,205.56c0,.07-.04.13-.04.2,0,.2.05.42.14.61,1.1,2.5,1.62,4.94,1.69,7.24.18,7.42-4.46,13.48-10.27,16.11-5.37,2.41-10.38,2.26-14.52.96,4.45.7,9.58.26,14.12-2.66,4.68-3.13,7.24-9.48,7.11-14.34-.05-1.41-.31-2.71-.82-3.75-.6-1.25-1.56-2.08-2.7-2.47,1.3-.48,3.18-1.16,5.28-1.92ZM133.87,197.53h0Z\"/>\n      <path class=\"cls-9\" d=\"M134.37,199.18c-1.72.44-19.87,6.97-20.88,7.4-1.64.68-3.31.95-6.12.19-4.58-1.35-9.94-.31-11.38,4.96-.6,2.06.17,3.17,2.76,2.46.91-.26,7.3-2.5,15.03-5.22,6.1-1.29,5.03,12.68-2.37,17.65-10.2,6.56-24.28-.72-22.19-3.57,3.14-1.13,5.09-1.78,5.45-1.92,1.65-.69,3.31-.95,6.11-.19,4.59,1.34,9.95.29,11.38-4.98.6-2.05-.17-3.16-2.75-2.45-2.02.6-34.76,12.21-36.42,12.72-1.65.52-1.22,2.81.8,2.29.99-.25,7.4-2.51,12.87-4.46,3.22,5.9,14.5,12.83,26.98,7.22,8.68-3.91,14.37-14.31,9.44-25.52,6.11-2.15,11.48-4.09,12.1-4.28,1.66-.51,1.24-2.81-.8-2.29Z\"/>\n    </g>\n  </g>\n</svg>\n", mirun: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg id=\"_レイヤー_1\" data-name=\"レイヤー 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 226.5 246.59\" width=\"453\" height=\"493.18\">\n  <defs>\n    <style>\n      .cls-1 {\n        fill: #75c5b2;\n      }\n\n      .cls-2 {\n        fill: #af725a;\n      }\n\n      .cls-3 {\n        fill: #231815;\n      }\n\n      .cls-4 {\n        fill: #534d9e;\n      }\n\n      .cls-5 {\n        fill: #fff;\n      }\n\n      .cls-6 {\n        fill: #feefdd;\n      }\n\n      .cls-7 {\n        fill: #ffec00;\n      }\n    </style>\n  </defs>\n  <path class=\"cls-7\" d=\"M190.65,201.82c-4.42-4.01-10.32-9.03-10.32-9.03l2.76,1.65c-.54-20.17-23.81-34.25-23.81-34.25-15.01,8.27-30.54,11.06-44.5,11.13-13.98.04-29.65-2.63-45.1-10.78,0,0-22.51,14.27-21.98,34.43l2.67-1.66s-5.62,5.06-9.83,9.09c0,0-8.52,8.4,13.2,5.66,0,0,.11-.38.33-1.05-1.41,4.3-2.24,9.05-1.85,14.03,0,0,0,4.23-4.84,7.35,0,0-10.59,5.31-5.09,8.13,0,0,37.29,8.46,70.4,8.33,0,0,1.46.02,4.05,0,2.59,0,4.04-.03,4.04-.03,33.11-.12,69.93-8.88,69.93-8.88,5.36-2.86-5.52-8.09-5.52-8.09-5-3.09-5.23-7.31-5.23-7.31.13-4.97-.95-9.73-2.58-14.01.25.65.38,1.04.38,1.04,21.87,2.56,12.9-5.76,12.9-5.76ZM54.74,205.08c1.63-4.4,5.25-12.65,10.83-17.52,0,0-6.91,7.19-10.83,17.52ZM54.38,206.06c.04-.11.08-.24.14-.36-.05.12-.1.24-.14.36ZM176.58,204.62c-4.47-10.3-11.77-17.45-11.77-17.45,5.85,4.84,9.9,13.06,11.77,17.45ZM176.83,205.23c.07.12.11.25.16.36-.05-.11-.09-.23-.16-.36Z\"/>\n  <path class=\"cls-2\" d=\"M158.33,158.68c-12.98,7.16-27.66,10.82-43.61,10.9-15.94.04-30.8-3.51-44.18-10.56-.61-.32-1.35-.3-1.92.06-.95.6-23.32,15.02-22.77,35.89,0,0,0,.01,0,.02-2.91,2.71-6.64,6.17-6.64,6.17-.3.28-2.23,2.28-2.17,4.51.01.56.14,1.12.45,1.68,1.46,2.64,5.84,3.46,13.93,2.69-.74,3.18-1.22,6.3-1.14,9.35.02.54.04,1.07.08,1.61,0,.23-.18,3.41-4.02,5.91-1.92.98-7.53,4.13-7.49,7.61,0,.02,0,.03,0,.05.02,1.01.5,2.4,2.56,3.46.15.08.31.13.46.18.38.08,37.9,8.51,70.84,8.38-.04,0,4.05-.02,4.05-.02l4.07-.02c32.91-.12,69.97-8.84,70.33-8.92.16-.04.31-.1.45-.17,2.01-1.08,2.41-2.49,2.38-3.49,0-.02,0-.04,0-.05-.14-3.49-5.92-6.59-7.9-7.55-3.97-2.46-4.31-5.66-4.33-5.88,0-.54.01-1.08-.01-1.62-.08-3.03-.72-6.17-1.63-9.33,8.13.71,12.47-.16,13.79-2.8.28-.56.38-1.12.36-1.68-.06-2.24-2.11-4.21-2.39-4.48,0,0-3.92-3.44-6.99-6.13,0-.01,0-.02.01-.03-.55-20.87-23.7-35.11-24.68-35.7-.57-.36-1.33-.38-1.91-.06ZM159.21,162.23c3.84,2.56,19.36,13.79,21.74,29.01-.74-.26-1.58-.12-2.08.5-.25.32-.38.7-.36,1.06,0,.47.22.93.6,1.28,0,0,10.21,8.94,10.24,8.96.7.66,1.26,1.58,1.26,2.02,0,.07,0,.11-.03.16-.01.02-1.16,1.81-11.52.74-.34-.89-1.38-1.36-2.33-1.07-.77.25-1.24.94-1.22,1.67,0,.17.04.36.11.54h0c1.54,4.04,2.37,8,2.48,11.79,0,.53.01,1.06,0,1.57,0,.34.33,5.3,6.08,8.84.06.03.12.06.17.09,3.23,1.56,5.96,3.78,5.97,4.57,0,.01,0,.02,0,.03,0,.03-.15.18-.41.34-2.97.69-37.95,8.64-69.21,8.76-.04,0-4.02.03-4.02.03-.03,0-4.03.01-4.03.01-31.27.11-66.68-7.56-69.68-8.23-.28-.16-.43-.3-.45-.34v-.03c-.02-.78,2.57-3.03,5.74-4.61.05-.04.1-.07.16-.11,5.57-3.57,5.63-8.54,5.63-8.75-.04-.53-.08-1.07-.09-1.62-.1-3.87.51-7.84,1.85-11.88h0c.05-.19.07-.37.07-.54-.01-.74-.51-1.42-1.3-1.65-.96-.3-1.97.18-2.27,1.08-10.31,1.15-11.55-.64-11.57-.66-.19-.34.38-1.44,1.14-2.19-.02.02,9.76-9.05,9.76-9.05.67-.62.72-1.64.11-2.33-.52-.61-1.36-.75-2.08-.48,1.56-15.23,16.49-26.59,20.2-29.18,13.66,6.99,28.77,10.54,44.95,10.49,16.18-.07,31.1-3.74,44.4-10.83ZM50.37,221.04s0,0,0,0c0,.03,0,.06,0,.1,0-.03,0-.06,0-.09ZM181.79,220.53v.1s0-.07,0-.1ZM116.78,246.57h0Z\"/>\n  <path class=\"cls-2\" d=\"M64.31,186.27s-.08.08-.11.11h0s-.02.02-.02.03c-5.78,5.12-9.48,13.48-11.18,18.05h0s0,.02,0,.02c-.08.2-.1.41-.1.61.02.71.49,1.35,1.23,1.62.95.33,2-.12,2.34-1.01,3.75-9.88,10.41-16.9,10.48-16.97.66-.69.61-1.74-.1-2.4-.7-.67-1.82-.69-2.54-.07Z\"/>\n  <path class=\"cls-2\" d=\"M52.78,205.11h0l-.09.25h0c-.03.05-.04.12-.04.12-.08.19-.1.38-.1.58.02.68.51,1.33,1.27,1.57.95.33,1.98-.19,2.32-1.06,0,.02,0,.05,0,.08l.12-.33c.32-.91-.19-1.92-1.15-2.23-.96-.33-2,.13-2.33,1.04ZM54.99,204.38c.75.24,1.22.93,1.23,1.65,0,.12-.04.26-.06.38-.37.81-1.33,1.24-2.25.93-.75-.26-1.23-.92-1.24-1.62,0-.15.03-.29.06-.43.37-.84,1.32-1.23,2.25-.91Z\"/>\n  <path class=\"cls-2\" d=\"M163.47,185.96c-.67.67-.66,1.73.03,2.4.08.07,7.12,7.04,11.38,16.88.4.9,1.46,1.34,2.4.99.73-.27,1.17-.93,1.14-1.62,0-.21-.04-.41-.13-.61,0-.02,0-.02,0-.02h0c-1.94-4.56-6.08-12.89-12.12-17.96-.01,0-.03-.03-.04-.03h0s-.08-.07-.12-.1c-.75-.62-1.86-.58-2.54.08Z\"/>\n  <path class=\"cls-2\" d=\"M176.18,203.6c-.95.33-1.42,1.33-1.05,2.24l.13.32s-.01-.04-.02-.07c.38.87,1.44,1.4,2.38,1.08.75-.26,1.22-.89,1.2-1.59,0-.19-.04-.37-.12-.57,0,0-.04-.07-.05-.14h0s-.1-.23-.1-.23h-.01c-.38-.91-1.43-1.37-2.36-1.04ZM175.14,205.55c-.02-.71.42-1.4,1.15-1.66.91-.32,1.9.08,2.3.92.05.14.08.27.09.41.02.71-.42,1.39-1.17,1.65-.9.3-1.87-.11-2.29-.94-.04-.13-.08-.25-.08-.39Z\"/>\n  <g>\n    <g>\n      <path class=\"cls-5\" d=\"M105.35,189.12c-11.01,5.25-15.64,15.09-12.69,27,.12.52.49.97.98,1.25.5.26,1.09.33,1.63.15,2.56-.79,6.44-2.23,7.82-2.77.75-.31,1.21-1,1.19-1.75,0-.2-.04-.39-.11-.59-.29-.76-.45-1.69-.48-2.71-.11-3.79,1.68-8.95,6.31-12.27,7-4.21,14.02-4.03,20.88.58-.06-.05-.12-.09-.17-.13,1.61,1.34,3.25,1.17,4.16.42.97-.82,1.05-2.19.22-3.34-5.02-7.04-18.47-11.2-29.73-5.83ZM95.79,209.95c-.2-7.7,3.73-13.78,11.42-17.45,4.05-1.92,8.27-2.34,12.11-1.84-4.57.15-8.56,1.76-11.62,3.62-.04,0-.08.04-.12.07-5.52,3.92-8.05,10.25-7.92,15.38.02.74.09,1.44.23,2.12-1.08.41-2.44.9-3.76,1.35-.19-1.11-.31-2.2-.35-3.25Z\"/>\n      <path class=\"cls-1\" d=\"M132.01,196.45c1.15.97,2.06.41,1.42-.45-4.26-5.99-16.61-10.21-27.15-5.2-9.84,4.69-14.55,13.34-11.68,24.91,2.55-.79,6.43-2.23,7.66-2.72-1.67-4.46.08-12.54,6.54-17.13,6.3-3.81,14.38-5.31,23.2.58Z\"/>\n    </g>\n    <g>\n      <path class=\"cls-5\" d=\"M148.57,191.49c-2.03.52-22.08,7.71-23.46,8.31-1.46.6-2.83.82-5.43.12-3.64-1.05-7.37-.84-10.19.63-2.44,1.27-4.13,3.42-4.9,6.21-.22.72-.28,1.34-.28,1.88.03,1.24.55,2.02,1.07,2.51.55.52,1.28.77,2.12.88-3.27,1.14-6.97,2.44-11.07,3.88-7.9,2.78-15.34,5.4-16.11,5.65-1.55.47-2.5,1.79-2.46,3.19,0,.3.06.6.16.9.5,1.47,2.17,2.65,4.43,2.06,1.25-.33,8.56-2.91,12.91-4.47,5.13,7.33,18,13.54,31.64,7.41,7.72-3.48,13.88-11.51,13.63-21.3-.07-2.42-.66-4.97-1.59-7.57,2.2-.79,6.83-2.43,6.83-2.43l4.79-1.69c1.54-.48,2.5-1.79,2.47-3.21-.01-.29-.06-.59-.17-.9-.5-1.46-2.17-2.63-4.42-2.05ZM108.48,207.8c.5-1.84,1.51-3.15,3.01-3.93,1.88-.99,4.48-1.1,7.12-.32.85.22,1.64.38,2.38.47-6.98,2.46-11.32,3.95-12.03,4.16-.3.08-.43.08-.59.09.01-.12.06-.27.11-.47ZM122.06,211.02c.31-.08.43-.07.59-.1-.01.13-.05.28-.1.48-.49,1.84-1.51,3.15-3,3.93-1.88.98-4.48,1.09-7.13.33-.83-.24-1.61-.38-2.36-.49,6.17-2.15,11.26-3.93,12.01-4.15ZM128.13,206.8c1.62,3.3-.37,11.88-5.67,15.42-6.72,4.33-14.42,2.15-16.62,1.39-2.5-.89-3.91-1.88-4.58-2.55,1.32-.46,2.94-1.04,2.94-1.04l1.72-.61c1.47-.61,2.82-.84,5.43-.13,3.64,1.05,7.38.83,10.19-.63,2.46-1.27,4.13-3.41,4.89-6.2.22-.71.29-1.35.28-1.88-.04-1.24-.55-2.03-1.08-2.5-.55-.53-1.28-.77-2.1-.88,1.12-.38,2.22-.78,3.31-1.16.5-.1.9-.07,1.29.76ZM134.63,200.4c0,.08-.05.14-.04.23,0,.23.06.47.16.68,1.22,2.78,1.79,5.48,1.88,8.04.2,8.23-4.95,14.96-11.4,17.88-5.96,2.68-11.52,2.51-16.11,1.07,4.93.78,10.64.3,15.67-2.95,5.2-3.47,8.03-10.52,7.89-15.91-.05-1.57-.34-3-.91-4.16-.67-1.38-1.74-2.31-2.99-2.74,1.44-.53,3.53-1.29,5.86-2.13ZM148.57,191.49h0Z\"/>\n      <path class=\"cls-4\" d=\"M149.13,193.32c-1.91.49-22.05,7.73-23.17,8.21-1.82.76-3.68,1.05-6.79.21-5.09-1.5-11.03-.34-12.63,5.51-.66,2.29.19,3.51,3.06,2.73,1.02-.29,8.1-2.77,16.68-5.79,6.77-1.44,5.58,14.07-2.63,19.58-11.32,7.27-26.95-.79-24.62-3.96,3.49-1.26,5.65-1.98,6.05-2.14,1.83-.77,3.67-1.06,6.78-.21,5.1,1.48,11.04.32,12.63-5.53.66-2.28-.19-3.51-3.05-2.72-2.25.67-38.58,13.54-40.42,14.12-1.83.57-1.35,3.12.89,2.54,1.1-.28,8.21-2.79,14.28-4.95,3.57,6.55,16.09,14.24,29.94,8.01,9.63-4.34,15.95-15.88,10.47-28.32,6.78-2.39,12.74-4.54,13.43-4.75,1.84-.57,1.37-3.12-.89-2.54Z\"/>\n    </g>\n  </g>\n  <path class=\"cls-6\" d=\"M204.05,86.17c1.24,46.9-39.09,85.08-90.1,85.29-51,.19-93.36-37.68-94.61-84.58C18.09,39.98,58.44,1.79,109.44,1.6c50.99-.2,93.37,37.66,94.62,84.57Z\"/>\n  <path class=\"cls-5\" d=\"M109.46,98.5c.5,18.67-12.04,33.83-28,33.89-15.97.07-29.3-15.01-29.8-33.66-.5-18.66,12.04-33.83,28-33.89,15.97-.06,29.31,15.01,29.8,33.66Z\"/>\n  <path class=\"cls-5\" d=\"M173.51,98.25c.49,18.66-12.05,33.84-28.01,33.9-15.96.06-29.32-15-29.81-33.67-.49-18.65,12.05-33.82,28.01-33.89,15.97-.06,29.31,15.01,29.81,33.66Z\"/>\n  <path class=\"cls-2\" d=\"M23.21,107.33c-.97.24-1.53,1.19-1.25,2.12,11.81,38.29,50,64.92,92.89,64.75,42.88-.17,79.65-27.08,89.41-65.44.24-.93-.38-1.88-1.36-2.12-.99-.24-1.98.31-2.22,1.24-9.37,36.85-44.71,62.69-85.93,62.85-41.22.16-77.92-25.41-89.26-62.18-.28-.93-1.3-1.48-2.28-1.22Z\"/>\n  <path class=\"cls-2\" d=\"M18.33,87.48c.11,4.08.54,8.2,1.27,12.27.18.96,1.13,1.6,2.12,1.47,1.01-.15,1.68-1.02,1.5-1.98-.7-3.9-1.11-7.86-1.22-11.78C20.78,41.34,60.39,3.67,110.31,3.47c49.91-.2,91.52,37.16,92.74,83.28.1,3.97-.1,7.58-.63,11.74-.13.94.58,1.83,1.58,1.96,1.01.14,1.93-.52,2.06-1.46.57-4.33.78-8.1.67-12.25C205.44,38.71,162.15-.2,110.21,0,58.27.2,17.06,39.44,18.33,87.48Z\"/>\n  <path class=\"cls-2\" d=\"M101.84,1.29c-.07.21-.09.4-.09.6.02.72.51,1.37,1.26,1.62.21.07,20.9,7.07,25.01,17.75.43,1.12.65,2.23.68,3.35.07,2.15-.63,4.31-2.08,6.54-.12.15-.97,1.16-2.42,2.45-2.9-4.17-6.89-6.34-7.15-6.48-10.49-5.9-21.27-3.34-21.73-3.23-.05.01-.1.04-.15.05-2.63.9-4.29,2.31-4.93,4.17-.9,2.54.53,4.8.69,5.05,7.47,11.07,20.94,9.09,21.51,9-.1.01-.2.02-.29.02,4.27-.01,7.88-1.47,10.75-3.2.34,1.06.59,2.16.63,3.39,0,0-.11,5.31-3.89,8.04-2.57,1.83-6.33,2.16-11.2.96-.98-.25-1.96.32-2.2,1.24-.24.92.37,1.87,1.36,2.12,6.03,1.48,10.85.95,14.34-1.56,5.2-3.75,5.27-10.46,5.27-10.75h0c-.05-2.09-.57-3.91-1.27-5.57,2.27-1.85,3.6-3.51,3.73-3.66.03-.03.06-.07.08-.11,1.84-2.81,2.71-5.64,2.64-8.46-.04-1.49-.34-2.99-.91-4.46C126.74,7.87,105.08.55,104.16.25c-.96-.33-2,.14-2.32,1.04ZM115.27,30.12c.09.05,3.61,2.02,6.03,5.63-2.45,1.57-5.59,2.94-9.24,2.95-.1,0-.2.01-.29.03-.47.06-11.62,1.66-17.73-7.38,0,0-.39-.64-.41-1.39,0-.24.03-.49.11-.73.36-.99,1.65-1.63,2.68-2,.58-.13,9.94-2.13,18.86,2.88Z\"/>\n  <path class=\"cls-3\" d=\"M109.24,99.69c0-.2,0-.39,0-.59-.24-8.84-7.19-15.97-15.58-15.94-8.35.04-14.93,7.23-14.69,16.06,0,.16,0,.34.02.5l30.26-.03Z\"/>\n  <path class=\"cls-3\" d=\"M115.3,97.25c.52,19.5,14.54,35.31,31.25,35.25,10.89-.05,20.8-6.94,25.89-17.98.4-.87-.03-1.91-.96-2.3-.93-.39-2.02,0-2.41.86-4.52,9.79-13.18,15.92-22.61,15.95-14.69.06-27.01-14.21-27.48-31.79-.47-17.6,11.1-31.95,25.79-32.01,9.57-.03,18.62,6.15,23.62,16.12.45.87,1.54,1.26,2.46.86.91-.39,1.29-1.42.87-2.29-5.65-11.25-16-18.21-27.04-18.16-16.72.06-29.89,15.99-29.37,35.49Z\"/>\n  <path class=\"cls-3\" d=\"M173.72,101.38c.27,10.23-6.04,18.55-14.11,18.58-8.06.04-14.81-8.24-15.08-18.46-.28-10.24,6.04-18.57,14.1-18.6,8.06-.04,14.81,8.24,15.09,18.48Z\"/>\n  <path class=\"cls-5\" d=\"M157.62,101.44c.06,2.19-1.47,3.96-3.42,3.96-1.94,0-3.56-1.75-3.62-3.94-.06-2.17,1.47-3.95,3.42-3.96,1.93,0,3.56,1.76,3.61,3.94Z\"/>\n  <g>\n    <path class=\"cls-3\" d=\"M104.91,132.78c-.56.49-.74,1.25-.43,1.92.74,1.63,7.75,3.5,18,1.11.97-.23,1.56-1.17,1.3-2.1-.26-.93-1.28-1.5-2.26-1.28-9.68,2.28-14.48.11-14.53.08-.69-.32-1.53-.22-2.08.27Z\"/>\n    <path class=\"cls-3\" d=\"M111.96,135.22l.26,9.52c.04.96.88,1.73,1.89,1.73,1.02,0,1.82-.79,1.8-1.75l-.26-9.52c-.03-.96-.87-1.73-1.88-1.73-1.02.01-1.81.79-1.8,1.74Z\"/>\n  </g>\n  <g>\n    <path class=\"cls-2\" d=\"M21.44,98.11c-1.02,0-1.83.79-1.8,1.75.03.96.87,1.73,1.88,1.72l24.51-.09c1.02,0,1.81-.79,1.79-1.75-.02-.96-.87-1.74-1.88-1.72l-24.51.09Z\"/>\n    <path class=\"cls-2\" d=\"M1.79,98.19c-1.02,0-1.82.78-1.79,1.74.02.96.87,1.74,1.88,1.73l10.33-.04c1.01,0,1.81-.78,1.79-1.74-.04-.95-.88-1.73-1.89-1.72l-10.33.04Z\"/>\n  </g>\n  <g>\n    <path class=\"cls-2\" d=\"M180.12,97.5c-1.02,0-1.83.78-1.8,1.74.02.96.86,1.73,1.88,1.74l24.08-.1c1.02,0,1.81-.78,1.79-1.74-.03-.96-.87-1.73-1.88-1.73l-24.08.09Z\"/>\n    <path class=\"cls-2\" d=\"M213.5,97.37c-1.01,0-1.81.78-1.79,1.74.02.95.87,1.73,1.89,1.72l11.11-.04c1.01,0,1.81-.79,1.79-1.75-.02-.94-.87-1.73-1.88-1.72l-11.11.05Z\"/>\n  </g>\n  <path class=\"cls-3\" d=\"M50.61,97.63l.11,2.11c.05.95.87,1.65,1.87,1.65,0,0,51.02-.18,54.74-.19-1.14,15.99-12.1,28.31-25.62,28.35-10.11.05-19.39-6.7-24.24-17.59-.39-.88-1.47-1.31-2.41-.96-.93.36-1.37,1.37-.97,2.26,5.44,12.24,16.07,19.83,27.71,19.77,16-.06,28.87-14.76,29.32-33.5,0-.02,0-.05,0-.08,0-.44-.2-.87-.54-1.19-.35-.34-.84-.54-1.34-.53,0,0-51.6.17-54.95.19,0-.08-.02-.3-.02-.3-.47-17.66,11.08-32.08,25.73-32.14,10.8-.05,20.65,7.71,25.11,19.75.34.91,1.38,1.4,2.35,1.1.95-.3,1.45-1.28,1.11-2.19-4.98-13.48-16.25-22.17-28.67-22.13-16.69.07-29.83,16.05-29.31,35.62Z\"/>\n  <path class=\"cls-3\" d=\"M109.29,106.38l-28.17.18c-.48.11-1.24.44-1.42,1.35.02.19.04.38.07.57.16,1.19.49,2.84,1.21,4.64l.36-.34c2.55,4.28,7.65,7.22,13.48,7.2,8.2-.04,14.67-5.91,14.48-13.13,0-.16,0-.32-.02-.48Z\"/>\n  <path class=\"cls-3\" d=\"M78.01,143.37c-.79.58-.91,1.68-.27,2.43,8,9.44,20.85,20.7,36.66,20.77,12.54.05,24.7-7.02,36.17-21.02.62-.75.46-1.84-.34-2.44-.82-.6-1.97-.46-2.59.28-10.74,13.13-21.94,19.76-33.31,19.71-14.32-.06-26.26-10.6-33.75-19.43-.64-.75-1.8-.88-2.58-.3Z\"/>\n</svg>\n" };
function load(name) { if (!SVG[name]) throw new Error('名前は miruko か mirun: ' + name); const P = parsePuppet(SVG[name]); P.name = name; return P; }
function size(P, height) { return [Math.round(height * P.vb.w / P.vb.h), height]; }
function draw(canvas, P, pose) { drawFront(canvas.getContext('2d'), P, canvas.width, canvas.height, pose || {}); }
window.MiruMiru = { load, size, draw, PARTS };
})();
