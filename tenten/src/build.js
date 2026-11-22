/*
 * 公式絵をなぞった数値 (shapes.json) から、てんてんの形を組み立てる。three.js には依存しない。
 * いったん「公式絵を見ている向き」の座標（x 右・y 上・z 手前、体の幅が 1）で作り、
 * 最後に顔が +Z を向くように回して、足の下を高さ 0 にする。
 */

export const PART_CFG = {
  earR: { frame: 'view', off: -0.17, k: 0.4, seg: 20 },
  earL: { frame: 'view', off: 0.04, k: 0.4, seg: 20 },
  nub: { frame: 'view', off: 0.03, k: 1.0, seg: 16 },
  armR: { frame: 'view', off: -0.22, k: 0.8, seg: 20 },
  armL: { frame: 'view', off: 0.262, tilt: [0, -0.42], k: 0.5, seg: 20, dive: 5.0 },
  footR: { frame: 'view', off: -0.22, k: 1.0, seg: 20 },
  footL: { frame: 'view', off: 0.03, k: 1.0, seg: 20 },
  plug: { frame: 'tail', off: 0, k: 1.0, seg: 20, closedStart: true },
  plugTip: { frame: 'tail', off: 0, k: 0.7, seg: 16 },
};
export const WIFI_CFG = { frame: 'model', off: 0, k: 1.0, seg: 14 };
export const TAIL_CFG = { gammaDeg: 15, elbowR: 0.13, seg: 12, step: 0.012, collar: false };
export const BODY_SEG = 64;

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

export function build(shapes, meta, opts = {}) {
  const partCfg = { ...PART_CFG, ...(opts.parts || {}) };
  /* 面の細かさ。'full'＝チラシ用（なめらか）、'game'＝ゲーム用（面を約5分の1に減らす） */
  const lod = opts.lod === 'game'
    ? { rows: 3, body: 40, limb: 12, part: 0.6, tail: 8, disc: 12 }
    : { rows: 1, body: BODY_SEG, limb: 20, part: 1, tail: TAIL_CFG.seg, disc: 24 };
  const U = shapes.unitPx;
  const [ax, ay] = shapes.anchor;
  const LINE = shapes.linePx / U;
  const yaw = (shapes.yawDeg * Math.PI) / 180;
  const fView = [Math.sin(yaw), 0, Math.cos(yaw)];
  const toView = (p) => [(p[0] - ax) / U, (ay - p[1]) / U];

  const out = { pos: [], nor: [], uv: [], idx: [], hull: [], part: [], tp: [], partNames: [], pivots: {} };
  const partId = (name) => {
    let i = out.partNames.indexOf(name);
    if (i < 0) { out.partNames.push(name); i = out.partNames.length - 1; }
    return i;
  };

  function uvFor(layer, p) {
    const L = meta.layers[layer];
    const [sx0, sy0, sx1, sy1] = L.src;
    const [dx0, dy0, dx1] = L.dst;
    const s = (dx1 - dx0) / (sx1 - sx0);
    const x = Math.min(Math.max(ax + p[0] * U, sx0 + 2), sx1 - 2);
    const y = Math.min(Math.max(ay - p[1] * U, sy0 + 2), sy1 - 2);
    return [(dx0 + (x - sx0) * s) / meta.size, 1 - (dy0 + (y - sy0) * s) / meta.size];
  }

  /* rings[i][j] の格子を足す。sets = [{ cols:[...], layer }]。格子は j 方向に閉じている */
  function emitGrid(rings, sets, name, noHull, ringParam, hullOnly, sectionRef) {
    if (lod.rows > 1 && rings.length > 6 && !name.startsWith('wear')) {
      const keep = [];
      for (let i = 0; i < rings.length - 1; i += lod.rows) keep.push(i);
      keep.push(rings.length - 1);
      rings = keep.map((i) => rings[i]);
      if (noHull) noHull = keep.map((i) => noHull[i]);
      if (ringParam) ringParam = keep.map((i) => ringParam[i]);
    }
    const R = rings.length;
    const M = rings[0].length;
    const ctr = rings.map((r) => mul(r.reduce(add, [0, 0, 0]), 1 / M));
    /* sectionRef：体に巻いた帯（えり・ふち）用。輪が斜め（前が低く肩が高い）だと「輪の中心から外」では表裏を決められないので、
     * 帯の断面のまん中（同じ列の点の平均）から外を表とする */
    const sec = sectionRef ? rings[0].map((_, j) => mul(rings.reduce((a, r) => add(a, r[j]), [0, 0, 0]), 1 / R)) : null;
    const N = rings.map((r, i) => r.map((p, j) => {
      const up = rings[Math.min(i + 1, R - 1)][j];
      /* 沈む付け根のとなりの輪は、沈む側を見ずに向きを決める（線の端が曲がらないように） */
      const cut = noHull && i > 0 && noHull[i - 1] && !noHull[i];
      const dn = cut ? p : rings[Math.max(i - 1, 0)][j];
      const rt = r[(j + 1) % M];
      const lf = r[(j + M - 1) % M];
      let n = cross(sub(rt, lf), sub(up, dn));
      const radial = sec ? sub(p, sec[j]) : sub(p, ctr[i]);
      if (len(n) < 1e-9 || len(radial) < 1e-7) {
        const other = i === 0 ? ctr[Math.min(1, R - 1)] : ctr[i - 1];
        const axis = sub(ctr[i], other);
        const edge = i === 0 || i === R - 1;
        n = edge && len(axis) > 1e-9 ? axis : (len(radial) > 1e-9 ? radial : [0, 1, 0]);
        return unit(n);
      }
      if (dot(n, radial) < 0) n = mul(n, -1);
      return unit(n);
    }));
    const pid = partId(name);
    for (const set of sets) {
      const base = out.pos.length / 3;
      const C = set.cols.length;
      for (let i = 0; i < R; i++) {
        for (const j of set.cols) {
          const p = rings[i][j % M];
          const n = N[i][j % M];
          out.pos.push(p[0], p[1], p[2]);
          out.nor.push(n[0], n[1], n[2]);
          const t = set.uv || uvFor(set.layer, set.uvMap ? set.uvMap(p) : p);
          out.uv.push(t[0], t[1]);
          out.part.push(pid);
          out.tp.push(ringParam ? ringParam[i] : -1);
        }
      }
      let flip = null;
      for (let i = 0; i < R - 1; i++) {
        for (let c = 0; c < C - 1; c++) {
          const a = base + i * C + c;
          const b = base + (i + 1) * C + c;
          const d = base + i * C + c + 1;
          const e = base + (i + 1) * C + c + 1;
          if (flip === null) {
            const pa = rings[i][set.cols[c] % M];
            const pb = rings[i + 1][set.cols[c] % M];
            const pe = rings[i + 1][set.cols[c + 1] % M];
            const gn = cross(sub(pb, pa), sub(pe, pa));
            if (len(gn) > 1e-12) flip = dot(gn, N[i + 1][set.cols[c] % M]) < 0;
          }
          if (flip) out.idx.push(a, e, b, a, d, e);
          else out.idx.push(a, b, e, a, e, d);
          const h = hullOnly ? 2 : (noHull && noHull[i] && noHull[i + 1] ? 0 : 1);
          out.hull.push(h, h);
        }
      }
    }
  }

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

  /* ---- 体：公式絵の輪郭を、高さごとの丸い輪切りとして積む ---- */
  const M = lod.body;
  let bodyMaxR = 0;
  const bodyRings = shapes.rings.map((r) => {
    const cx = ((r.xl + r.xr) / 2 - ax) / U;
    const rad = (r.xr - r.xl) / 2 / U;
    bodyMaxR = Math.max(bodyMaxR, rad);
    const y = (ay - r.y) / U;
    return { cx, rad, y };
  });
  emitGrid(
    bodyRings.map(({ cx, rad, y }) => range(0, M - 1).map((j) => {
      const ph = (2 * Math.PI * j) / M;
      return [cx + rad * Math.cos(ph), y, rad * Math.sin(ph)];
    })),
    [{ cols: range(0, M / 2), layer: 'bodyFront' }, { cols: range(M / 2, M), layer: 'bodyBack' }],
    'body',
  );
  const bodyAt = (y) => {
    let best = bodyRings[0];
    for (const r of bodyRings) if (Math.abs(r.y - y) < Math.abs(best.y - y)) best = r;
    return best;
  };
  const yTop = bodyRings[0].y;
  const yBot = bodyRings[bodyRings.length - 1].y;

  /* ---- しっぽの面（付け根は下の背中の中央。そこから横・後ろへのびる縦の面） ---- */
  /* ---- 服の身ごろ：えりの線からすそまで、体よりひと回り大きい殻。すそは体から離れて、まっすぐ下がる ----
   * 部品の名前が wear で始まるものは、体とは別のメッシュ（服）になる。服を着ていないときは見せない。 */
  const WEAR = { neckY: -0.042, hemUp: 0.045, gap: 0.02, shoulder: 0.14, vneck: 0.03, yawSign: 1 };
  const bodyI = (y) => {
    let k = 0;
    while (k < bodyRings.length - 2 && bodyRings[k + 1].y > y) k++;
    const t = Math.min(1, Math.max(0, (bodyRings[k].y - y) / (bodyRings[k].y - bodyRings[k + 1].y)));
    return { cx: bodyRings[k].cx + (bodyRings[k + 1].cx - bodyRings[k].cx) * t, rad: bodyRings[k].rad + (bodyRings[k + 1].rad - bodyRings[k].rad) * t };
  };
  {
    const hemY = yBot + WEAR.hemUp;
    const NR = lod.rows > 1 ? 9 : 18;
    /* 形：えりでは体にぴったり → 胸のあたりで少しふくらむ → 体が細くなってもそのまま下がり、すそで少しすぼまる（ブルゾンの形） */
    const prof = (t) => {
      const fit = bodyI(WEAR.neckY + (hemY - WEAR.neckY) * t).rad;
      const open = LINE + 0.01 + 0.012 * Math.min(1, t * 4);
      const hang = bodyMaxR * (1.04 - 0.02 * t - 0.12 * Math.pow(Math.max(0, (t - 0.66) / 0.34), 2));
      const k = Math.min(1, Math.max(0, t / 0.3));
      const s = k * k * (3 - 2 * k);
      return fit + open + (Math.max(fit + open, hang) - fit - open) * s;
    };
    const rows = [{ y: WEAR.neckY + 0.014, r: bodyI(WEAR.neckY + 0.014).rad - 0.012, lift: 1 }];
    for (let i = 0; i <= NR; i++) { const t = i / NR; rows.push({ y: WEAR.neckY + (hemY - WEAR.neckY) * t, r: prof(t), lift: Math.pow(1 - Math.min(1, t / 0.45), 2) }); }
    const hemR = rows[rows.length - 1].r;
    /* すその折り返し：角を丸めて、内側へ */
    rows.push({ y: hemY - 0.016, r: hemR - 0.01 }, { y: hemY - 0.026, r: hemR - 0.03 }, { y: hemY - 0.024, r: hemR - 0.055 }, { y: hemY + 0.02, r: hemR - 0.095 });
    /* 服の上のふち：前のまん中（えり）で低く、肩と背中では高い。肩までつながった、ふつうの上着の形にする。
     * 上のふちが高い所では、体にぴったり沿わせる（顔の横を通って肩へ上がる） */
    const sm = (a0, a1, x) => { const k = Math.min(1, Math.max(0, (x - a0) / (a1 - a0))); return k * k * (3 - 2 * k); };
    const angF = (ph) => Math.acos(Math.max(-1, Math.min(1, Math.sin(ph + WEAR.yawSign * yaw)))) * 180 / Math.PI;
    const liftAt = (ph) => {
      const ang = angF(ph);                              /* 体の正面のまん中からの角度（0＝前、90＝真横、180＝背中） */
      return WEAR.shoulder * sm(24, 92, ang) - WEAR.vneck * (1 - sm(0, 30, ang));
    };
    const rings = rows.map(({ y, r, lift }, ri) => range(0, M - 1).map((j) => {
      const ph = (2 * Math.PI * j) / M;
      const top = WEAR.neckY + liftAt(ph);
      /* 行 ri の高さ：上のふち（top）からすそ（hemY）までを、もとの割合で割りふる */
      const t = Math.min(1, Math.max(0, (WEAR.neckY - y) / (WEAR.neckY - hemY)));
      const yy = ri === 0 ? top + 0.014 : (lift !== undefined ? top + (hemY - top) * t : y);
      const rb = bodyI(Math.max(yy, yBot + 0.02));
      const base = bodyI(Math.max(y, yBot + 0.02)).rad;
      const rr = lift !== undefined ? Math.max(r, rb.rad + (ri === 0 ? -0.012 : Math.min(r - base, 0.045))) : r;
      return [rb.cx + rr * Math.cos(ph), yy, rr * Math.sin(ph)];
    }));
    emitGrid(rings, [{ cols: range(0, M / 2), layer: 'bodyFront' }, { cols: range(M / 2, M), layer: 'bodyBack' }], 'wearBody', rows.map((_, i) => i <= 1));   /* 上のふち（体の中へ折りこむ所）には線を付けない。線はふちの帯が受けもつ */
    /* 首まわりのふち：上のふちに沿った細い帯（どの服にも付く。ふちに線が出る） */
    const ribSpec = [[0.012, LINE - 0.004], [0.024, LINE + 0.018], [0.01, LINE + 0.042], [-0.014, LINE + 0.036]];
    const rib = ribSpec.map(([dy, dr]) => range(0, M - 1).map((j) => {
      const ph = (2 * Math.PI * j) / M;
      const yy = WEAR.neckY + liftAt(ph) + dy;
      const rb = bodyI(yy);
      return [rb.cx + (rb.rad + dr) * Math.cos(ph), yy, (rb.rad + dr) * Math.sin(ph)];
    }));
    emitGrid(rib, [{ cols: range(0, M), uv: meta.swatch.armLit || meta.swatch.lit }], 'wearRib', null, null, false, true);
    /* えり：前だけの、折り返した2枚の羽。前のまん中は切れこみ、その両わき（えり先）がいちばん広く、肩へ向かって細くなって消える */
    const cfade = (ang) => 1 - sm(40, 64, ang);
    const cwAt = (ang) => (ang < 4 ? 0.014 : (0.045 + 0.04 * (1 - sm(12, 50, ang))) * cfade(ang));
    const crow = [[0.012, 0, LINE], [0.028, 0, LINE + 0.03], [0, -0.5, LINE + 0.056], [0, -1, LINE + 0.052], [0.006, -1, LINE + 0.03]];
    const collar = crow.map(([dy, k, dr]) => range(0, M - 1).map((j) => {
      const ph = (2 * Math.PI * j) / M;
      const ang = angF(ph);
      const f = cfade(ang);
      const yy = WEAR.neckY + liftAt(ph) + 0.012 + (dy - 0.012) * f + k * cwAt(ang);
      const rb = bodyI(yy);
      const rr = rb.rad + LINE + (dr - LINE) * f;
      return [rb.cx + rr * Math.cos(ph), yy, rr * Math.sin(ph)];
    }));
    const cN = Math.ceil((M * 64) / 360);
    const cJ = Math.round(M / 4 - (WEAR.yawSign * yaw * M) / (2 * Math.PI));
    emitGrid(collar, [{ cols: range(cJ - cN, cJ + cN).map((j) => (j + M) % M), uv: meta.swatch.armLit || meta.swatch.lit }], 'wearCollar');
  }

  /* ---- しっぽの通り道 ----
   * 背中の下の真ん中から、まっすぐ後ろへ出る → ゆるいひじ1つで左へ曲がる → あとは1枚の縦の面の上だけを通る。
   * 公式絵に見えている部分は、公式絵の向きから見た位置（横・高さ）をそのまま使う。 */
  const tailBack = mul(fView, -1);
  const tailLeft = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const gam = (TAIL_CFG.gammaDeg * Math.PI) / 180;
  const tailTurn = Math.PI / 2 - gam;
  const tailH = add(mul(tailLeft, Math.cos(gam)), mul(tailBack, Math.sin(gam)));
  const tailN = [-tailH[2], 0, tailH[0]];
  const tv0 = toView(shapes.tail.stations[0].c);
  const tv3 = toView(shapes.tail.stations[3].c);
  const tailSlope = (tv3[1] - tv0[1]) / (tv3[0] - tv0[0]);
  const tailG = tailSlope * tailH[0];
  const tailArc = TAIL_CFG.elbowR * tailTurn;
  let tailRootY = tv0[1];
  let tailR0 = null;
  let tailE = null;
  for (let it = 0; it < 6; it++) {
    const rb = bodyAt(tailRootY);
    tailR0 = add([rb.cx, tailRootY, 0], mul(tailBack, rb.rad));
    tailE = add(add(tailR0, mul(tailLeft, TAIL_CFG.elbowR * (1 - Math.cos(tailTurn)))), mul(tailBack, TAIL_CFG.elbowR * Math.sin(tailTurn)));
    const yE = tv0[1] + (tailE[0] - tv0[0]) * tailSlope;
    tailE[1] = yE;
    tailRootY = yE - (tailG * tailArc) / 2;
  }
  tailR0[1] = tailRootY;
  const tailOff = dot(tailE, tailN);
  const onTailPlane = (xy) => { const t = (xy[0] - tailE[0]) / tailH[0]; return [xy[0], xy[1], tailE[2] + t * tailH[2]]; };
  let tailRoot = tailR0;
  const tailEnd0 = onTailPlane(toView(shapes.tail.stations[shapes.tail.stations.length - 1].c));
  const tailEnd0b = onTailPlane(toView(shapes.tail.stations[shapes.tail.stations.length - 3].c));

  const planeOf = (cfg) => {
    if (cfg.frame === 'model') return { n: fView, off: cfg.off };
    if (cfg.frame === 'tail') return { n: tailN, off: tailOff + cfg.off };
    return { n: [cfg.tilt ? cfg.tilt[0] : 0, cfg.tilt ? cfg.tilt[1] : 0, 1], off: cfg.off };
  };
  const unproject = (xy, pl) => [xy[0], xy[1], (pl.off - xy[0] * pl.n[0] - xy[1] * pl.n[1]) / pl.n[2]];

  function pillow(name, stations, widthDir, cfg, layer, depthOf) {
    const pl0 = planeOf(cfg);
    const pseg = Math.max(8, Math.round(cfg.seg * lod.part));
    const rings = [];
    for (const s of stations) {
      const pl = s.e && cfg.dive ? { n: pl0.n, off: pl0.off - (cfg.dive * s.e) / U } : pl0;
      const c = toView(s.c);
      const wd = widthDir(s);
      const w = s.w / U;
      const e1 = unproject([c[0] + wd[0] * w, c[1] + wd[1] * w], pl);
      const e0 = unproject([c[0] - wd[0] * w, c[1] - wd[1] * w], pl);
      const cc = mul(add(e1, e0), 0.5);
      const hv = mul(sub(e1, e0), 0.5);
      const dv = mul(cfg.frame === 'tail' ? tailN : (cfg.frame === 'model' ? fView : [0, 0, 1]), depthOf ? depthOf(s) : cfg.k * w);
      rings.push(range(0, pseg - 1).map((j) => {
        const ps = (2 * Math.PI * j) / pseg;
        return add(cc, add(mul(hv, Math.cos(ps)), mul(dv, Math.sin(ps))));
      }));
    }
    /* プラグは公式絵の位置で形を作ってから、新しいしっぽの先へ、向きごと移す。色は移す前の位置で公式絵から取る */
    const fin = cfg.frame === 'tail' ? rings.map((r) => r.map(plugT)) : rings;
    emitGrid(fin, [{ cols: range(0, pseg), layer, uvMap: cfg.frame === 'tail' ? plugTinv : null }], name, cfg.dive ? stations.map((s) => s.e > 0) : null);
    return fin;
  }

  /* ---- 腕・足・耳：まっすぐ立った姿（左右対称）で作る ----
   * 左側を作り、右側はその鏡写し。太さの変わり方は公式絵のよく見えている側から取る。
   * 公式絵のポーズ（片腕を前に、など）は形を変えず、骨の回転（poses.official）で付ける。 */
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const m2v = (p) => [p[0] * cy + p[2] * sy, p[1], -p[0] * sy + p[2] * cy];
  const v2m = (p) => [p[0] * cy - p[2] * sy, p[1], p[0] * sy + p[2] * cy];
  const mirror = (p) => { const m = v2m(p); return m2v([-m[0], m[1], m[2]]); };
  const firstFree = (nm) => shapes.parts[nm].stations.find((s) => !(s.e > 0));
  const profileOf = (src) => {
    const P = shapes.parts[src];
    const st = P.stations.filter((s) => !(s.e > 0));
    const c0 = st[0].c;
    const rows = st.map((s) => {
      const dx = s.c[0] - c0[0];
      const dy = s.c[1] - c0[1];
      return { u: (dx * P.d[0] + dy * P.d[1]) / U, v: [(dx * P.n[0] + dy * P.n[1]) * P.n[0] / U, -(dx * P.n[0] + dy * P.n[1]) * P.n[1] / U], w: s.w / U };
    });
    const total = rows[rows.length - 1].u;
    return rows.map((r) => ({ s: r.u / total, v: r.v, w: r.w }));
  };
  const tipOf = (nm) => { const st = shapes.parts[nm].stations; return toView(st[st.length - 1].c); };
  const UV_LIT = meta.swatch.lit;
  const UV_SHADOW = meta.swatch.shadow;
  const UV_BLUE = meta.swatch.blue;
  const UV_BLUE_SHADOW = meta.swatch.blueShadow;
  const UV_ARM_LIT = meta.swatch.armLit || meta.swatch.lit;
  const UV_ARM_SHADOW = meta.swatch.armShadow || meta.swatch.shadow;
  const quat = (a0, a1) => {
    const c = cross(a0, a1);
    const q = [c[0], c[1], c[2], 1 + dot(a0, a1)];
    const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return q.map((v) => v / l);
  };
  out.poses = { official: {} };
  const limbNames = new Set(['armL', 'armR', 'footL', 'footR', 'earL', 'earR']);
  const midLow = bodyRings[Math.floor(bodyRings.length / 2)].y;
  const SEG = lod.limb;
  const ringOf = (c, e1, e2, w1, w2) => range(0, SEG - 1).map((j) => {
    const ps = (2 * Math.PI * j) / SEG;
    return add(c, add(mul(e1, w1 * Math.cos(ps)), mul(e2, w2 * Math.sin(ps))));
  });
  const perp = (ref, A) => unit(sub(ref, mul(A, dot(ref, A))));
  const BOTTOM = range(Math.round(SEG * 0.3), Math.round(SEG * 0.7));
  const TOP = range(Math.round(SEG * 0.7), SEG + Math.round(SEG * 0.3));
  const ALL = range(0, SEG);

  function limbPair(nameL, nameR, O, A, len, makeRings, setsL, setsR, tauSign) {
    const ringsL = makeRings(O, A, len);
    emitGrid(ringsL, setsL, nameL);
    emitGrid(ringsL.map((r) => r.map(mirror)), setsR, nameR);
    out.pivots[nameL] = O;
    out.pivots[nameR] = mirror(O);
    if (!tauSign) return;
    for (const [nm, o, a0, sg] of [[nameL, O, A, tauSign], [nameR, mirror(O), mirror(add(A, [0, 0, 0])), -tauSign]]) {
      const a0m = v2m(nm === nameL ? A : sub(mirror(add(O, A)), mirror(O)));
      const tip = tipOf(nm);
      const d2 = [tip[0] - o[0], tip[1] - o[1]];
      const proj = Math.hypot(d2[0], d2[1]);
      const tau = Math.acos(Math.min(1, proj / len)) * sg;
      const a1 = v2m([(d2[0] / proj) * Math.cos(tau), (d2[1] / proj) * Math.cos(tau), Math.sin(tau)]);
      out.poses.official[nm] = quat(unit(a0m), unit(a1));
    }
  }

  /* 腕：真横に、少し下向き。上は明るい色、下は影の色 */
  {
    const y = (toView(firstFree('armL').c)[1] + toView(firstFree('armR').c)[1]) / 2;
    const rb = bodyAt(y);
    const O = add([rb.cx, y, 0], mul(m2v([1, 0, 0]), rb.rad - 0.05));
    const A = m2v(unit([0.94, -0.34, 0]));
    const prof = profileOf('armL');
    const projL = Math.hypot(tipOf('armL')[0] - O[0], tipOf('armL')[1] - O[1]);
    const oR = mirror(O);
    const projR = Math.hypot(tipOf('armR')[0] - oR[0], tipOf('armR')[1] - oR[1]);
    const len = Math.max(projL, projR) * 1.08;
    const e1 = perp([0, 1, 0], A);
    const e2 = cross(A, e1);
    const mk = (o, a, L) => [{ s: -0.3, w: prof[0].w }, ...prof].map((r) => ringOf(add(o, mul(a, r.s * L)), e1, e2, r.w, 0.85 * r.w));
    const sets = [{ cols: TOP, uv: UV_LIT }, { cols: BOTTOM, uv: UV_SHADOW }];
    limbPair('armL', 'armR', O, A, len, mk, sets, sets, 1);
    /* そで：肩からうでの6割まで。そで口は腕より太く、先から手が出る */
    const slSpec = [[-0.34, 0.09], [-0.32, 0.106], [0, 0.112], [0.2, 0.118], [0.42, 0.114], [0.64, 0.108], [0.68, 0.1], [0.57, 0.076]];
    const sl = slSpec.map(([s, w]) => ringOf(add(O, mul(A, s * len)), e1, e2, w, 0.8 * w));
    const slNo = slSpec.map((_, i) => i <= 3 || i >= slSpec.length - 2);   /* 体の中の付け根と、そで口の内側には線を付けない */
    const ssets = [{ cols: TOP, uv: UV_ARM_LIT }, { cols: BOTTOM, uv: UV_ARM_SHADOW }];
    /* そでは布のように伸びる：付け根の輪は体に、そで口の輪は腕について動く（0＝体、1＝腕）。腕を上げても、付け根が肩からはみ出さない */
    const slW = [0, 0, 0.35, 0.7, 0.92, 1, 1, 1];
    emitGrid(sl, ssets, 'wearSleeveL', slNo, slW);
    emitGrid(sl.map((r) => r.map(mirror)), ssets, 'wearSleeveR', slNo, slW);
  }
  /* 足：体の下の左右。前後に長い楕円 */
  {
    const x0 = 0.2;
    const z0 = 0.06;
    let rb = null;
    for (const r of bodyRings) if (r.y < midLow && (!rb || Math.abs(r.rad - Math.hypot(x0, z0)) < Math.abs(rb.rad - Math.hypot(x0, z0)))) rb = r;
    const O = add([rb.cx, rb.y + 0.06, 0], m2v([x0, 0, z0]));
    const A = m2v(unit([0.1, -1, 0.12]));
    const prof = profileOf('footR');
    const projL = Math.hypot(tipOf('footL')[0] - O[0], tipOf('footL')[1] - O[1]);
    const oR = mirror(O);
    const projR = Math.hypot(tipOf('footR')[0] - oR[0], tipOf('footR')[1] - oR[1]);
    const len = Math.max(projL, projR) * 1.04;
    const e1 = perp(m2v([0, 0, 1]), A);
    const e2 = cross(A, e1);
    const mk = (o, a, L) => [{ s: -0.3, w: prof[0].w }, ...prof].map((r) => ringOf(add(o, mul(a, r.s * L)), e1, e2, 1.35 * r.w, r.w));
    const sets = [{ cols: ALL, uv: UV_SHADOW }];
    limbPair('footL', 'footR', O, A, len, mk, sets, sets, 1);
  }
  /* 耳：丸みのある角。向きと反りは公式絵の左耳（全部見えている側）から取る。右耳だけ青 */
  {
    const y = toView(firstFree('earL').c)[1] - 0.02;
    const rb = bodyAt(y);
    const O = add([rb.cx, y, 0], mul(m2v(unit([1, 0, -0.05])), rb.rad - 0.03));
    const tip = tipOf('earL');
    const d2 = [tip[0] - O[0], tip[1] - O[1]];
    const len = Math.hypot(d2[0], d2[1]);
    const A = [d2[0] / len, d2[1] / len, 0];
    const prof = profileOf('earL');
    const e1 = unit(cross([0, 0, 1], A));
    const e2 = cross(A, e1);
    const mk = (o, a, L) => [{ s: -0.3, v: [0, 0], w: prof[0].w }, ...prof].map((r) => ringOf(add(add(o, mul(a, r.s * L)), [r.v[0], r.v[1], 0]), e1, e2, r.w, 0.75 * r.w));
    limbPair('earL', 'earR', O, A, len, mk, [{ cols: ALL, uv: UV_LIT }], [{ cols: ALL, uv: UV_BLUE }], 0);
  }

  /* ---- しっぽの通り道：公式絵の線をなぞらず、立体の曲線として設計する ----
   * 背中の下の真ん中からまっすぐ後ろへ出て、体のまわりを左へゆるく回りこみながら少し下がり、
   * 体の左でプラグを上に向けて立ち上がる。数値は [左右, 高さ（体の下0〜上1）, 前後]（体の幅が1、前が+）。 */
  const bodyH = yTop - yBot;
  const tRootF = 0.3;
  const tRb = bodyAt(yBot + tRootF * bodyH);
  const tpt = (x, fy, z) => add(m2v([x, 0, z]), [tRb.cx, yBot + fy * bodyH, 0]);
  const tz = (d) => -(tRb.rad + d);
  const tailCtrl = [tpt(0, 0.3, tz(-0.15)), tpt(0, 0.3, tz(0)), tpt(0.02, 0.29, tz(0.08)), tpt(0.12, 0.23, tz(0.16)),
    tpt(0.3, 0.18, tz(0.27)), tpt(0.5, 0.2, tz(0.34)), tpt(0.64, 0.33, tz(0.31)), tpt(0.7, 0.5, tz(0.25))];
  const tailCurve = [];
  for (let i = 0; i < tailCtrl.length - 1; i++) {
    const p0 = tailCtrl[Math.max(0, i - 1)];
    const p1 = tailCtrl[i];
    const p2 = tailCtrl[i + 1];
    const p3 = tailCtrl[Math.min(tailCtrl.length - 1, i + 2)];
    for (let k = 0; k < 12; k++) {
      const t = k / 12;
      tailCurve.push([0, 1, 2].map((d) => 0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t * t + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t * t * t)));
    }
  }
  tailCurve.push(tailCtrl[tailCtrl.length - 1]);
  tailR0 = tailCtrl[1];
  tailRoot = tailCtrl[1];
  const tailT1 = unit(sub(tailCurve[tailCurve.length - 1], tailCurve[tailCurve.length - 4]));
  const plugO1 = tailCurve[tailCurve.length - 1];
  const plugN1 = perp(m2v(unit([0.3, 0, 1])), tailT1);
  const plugB1 = cross(tailT1, plugN1);
  const plugT0 = unit(sub(tailEnd0, tailEnd0b));
  const plugB0 = cross(plugT0, tailN);
  const plugT = (p) => { const d = sub(p, tailEnd0); return add(plugO1, add(mul(tailT1, dot(d, plugT0)), add(mul(plugN1, dot(d, tailN)), mul(plugB1, dot(d, plugB0))))); };
  const plugTinv = (p) => { const d = sub(p, plugO1); return add(tailEnd0, add(mul(plugT0, dot(d, tailT1)), add(mul(tailN, dot(d, plugN1)), mul(plugB0, dot(d, plugB1))))); };
  const tailLight = m2v(unit([0.6, 0.6, 0.5]));

  for (const name of Object.keys(shapes.parts)) {
    if (limbNames.has(name)) continue;
    const cfg = partCfg[name];
    const P = shapes.parts[name];
    let st = P.stations;
    if (cfg.closedStart) st = [{ c: [st[0].c[0] - P.d[0] * 2, st[0].c[1] - P.d[1] * 2], w: 0 }, ...st];
    const wd = [P.n[0], -P.n[1]];
    const rings = pillow(name, st, () => wd, cfg, name);
    const first = rings[Math.min(4, rings.length - 1)];
    out.pivots[name] = mul(first.reduce(add, [0, 0, 0]), 1 / first.length);
  }

  /* ---- 電波 ---- */
  out.pivots.wifi = unproject(toView([shapes.wifi[0].c[0], shapes.wifi[0].c[1] - shapes.wifi[0].rOut]), planeOf(WIFI_CFG));
  shapes.wifi.forEach((wf, i) => {
    const name = 'wifi' + i;
    const src = wf.stations;
    const mk = (s) => {
      const a = (s.a * Math.PI) / 180;
      const rm = (s.rIn + s.rOut) / 2;
      return { a, c: [wf.c[0] + rm * Math.cos(a), wf.c[1] + rm * Math.sin(a)], w: (s.rOut - s.rIn) / 2 };
    };
    const body = src.map(mk);
    const cap = (s, da) => ({ ...mk({ ...s, a: s.a + da }), w: 0 });
    const st = [cap(src[0], -0.6), ...body, cap(src[src.length - 1], 0.6)];
    const wMean = body.reduce((t, s) => t + s.w, 0) / body.length / U;
    pillow(name, st, (s) => [Math.cos(s.a), -Math.sin(s.a)], WIFI_CFG, 'wifi', (s) => (s.w > 0 ? WIFI_CFG.k * wMean : 0));
  });

  /* ---- しっぽ（管）：背中の下の真ん中から出て、左へ回り、プラグを上に向ける ----
   * 公式絵に見えている部分は、公式絵の向きから見た位置をそのまま使い、奥行きだけなめらかに付ける。 */
  {
    const r0 = shapes.tail.stations[0].w / U;
    const pts = tailCurve.map((p) => ({ p, r: r0 }));
    const last = pts[pts.length - 1];
    const tEnd = tailT1;
    pts.push({ p: add(last.p, mul(tEnd, 14 / U)), r: last.r });
    const res = [pts[0]];
    let acc = 0;
    for (let k = 1; k < pts.length; k++) {
      const seg = len(sub(pts[k].p, pts[k - 1].p));
      let d = TAIL_CFG.step - acc;
      while (d <= seg) {
        const t = d / seg;
        res.push({ p: add(mul(pts[k - 1].p, 1 - t), mul(pts[k].p, t)), r: pts[k - 1].r * (1 - t) + pts[k].r * t });
        d += TAIL_CFG.step;
      }
      acc = (acc + seg) % TAIL_CFG.step;
    }
    const sm = (k) => {
      let s = [0, 0, 0];
      let n = 0;
      for (let q = Math.max(0, k - 3); q <= Math.min(res.length - 1, k + 3); q++) { s = add(s, res[q].p); n++; }
      return mul(s, 1 / n);
    };
    let n1 = null;
    const rings = res.map((c, k) => {
      const tan = unit(sub(sm(Math.min(k + 1, res.length - 1)), sm(Math.max(k - 1, 0))));
      n1 = tailLight;
      n1 = unit(sub(n1, mul(tan, dot(n1, tan))));
      const n2 = cross(tan, n1);
      return range(0, lod.tail - 1).map((j) => {
        const ps = (2 * Math.PI * j) / lod.tail;
        return add(c.p, add(mul(n1, c.r * Math.cos(ps)), mul(n2, c.r * Math.sin(ps))));
      });
    });
    const inBody = res.map((q) => {
      const rb = bodyAt(q.p[1]);
      return q.p[1] < yTop && q.p[1] > yBot && Math.hypot(q.p[0] - rb.cx, q.p[2]) < rb.rad - 0.02;
    });
    /* 光の当たる半分は明るい青、反対の半分は影の青 */
    emitGrid(rings, [{ cols: range((3 * lod.tail) / 4, (5 * lod.tail) / 4), uv: UV_BLUE }, { cols: range(lod.tail / 4, (3 * lod.tail) / 4), uv: UV_BLUE_SHADOW }], 'tail', inBody, res.map((_, k) => k / (res.length - 1)));
    /* 付け根：ケーブルが背中に入る所を、体の表面にそった線の色の丸でふちどる（差し込み口） */
    {
      const ys = bodyRings.map((q) => q.y);
      const surf = (q) => {
        let k = 0;
        while (k < ys.length - 2 && ys[k + 1] > q[1]) k++;
        const t = Math.min(1, Math.max(0, (ys[k] - q[1]) / (ys[k] - ys[k + 1])));
        const cx = bodyRings[k].cx + (bodyRings[k + 1].cx - bodyRings[k].cx) * t;
        const rad = bodyRings[k].rad + (bodyRings[k + 1].rad - bodyRings[k].rad) * t;
        const slope = (bodyRings[k].rad - bodyRings[k + 1].rad) / (ys[k] - ys[k + 1]);
        const dh = unit([q[0] - cx, 0, q[2]]);
        return { p: [cx + dh[0] * rad, q[1], dh[2] * rad], n: unit([dh[0], -slope, dh[2]]) };
      };
      const NR = lod.disc;
      const rad = r0 + LINE * 0.9;
      const pid = partId('body');
      const base = out.pos.length / 3;
      const pushV = (q) => {
        const s = surf(q);
        const p = sub(s.p, mul(s.n, LINE - 0.004));
        out.pos.push(p[0], p[1], p[2]);
        out.nor.push(s.n[0], s.n[1], s.n[2]);
        out.uv.push(UV_LIT[0], UV_LIT[1]);
        out.part.push(pid);
        out.tp.push(-1);
        return s;
      };
      const c0 = pushV(tailR0);
      const ring = range(0, NR - 1).map((j) => {
        const th = (2 * Math.PI * j) / NR;
        return add(tailR0, add(mul(tailLeft, rad * Math.cos(th)), [0, rad * Math.sin(th), 0]));
      });
      const sv = ring.map(pushV);
      for (let j = 0; j < NR; j++) {
        const i1 = base + 1 + j;
        const i2 = base + 1 + ((j + 1) % NR);
        const g = cross(sub(sv[j].p, c0.p), sub(sv[(j + 1) % NR].p, c0.p));
        if (dot(g, c0.n) > 0) out.idx.push(base, i1, i2); else out.idx.push(base, i2, i1);
        out.hull.push(2);
      }
    }
    out.pivots.tail = tailRoot;
    out.tailPath = res.map((q) => q.p);
  }

  /* ---- 顔だけの面：体の前の面のうち、顔の範囲に入る三角形を選び、顔の一覧の絵を見る UV を付ける ---- */
  const nAll = out.pos.length / 3;
  const fuv = new Float32Array(nAll * 2);
  const fidx = [];
  if (opts.faces) {
    const [fx0, fy0, fx1, fy1] = opts.faces.rect;
    const bodyPid = out.partNames.indexOf('body');
    const inFace = new Uint8Array(nAll);
    for (let i = 0; i < nAll; i++) {
      const px = ax + out.pos[3 * i] * U;
      const py = ay - out.pos[3 * i + 1] * U;
      fuv[2 * i] = (px - fx0) / (fx1 - fx0) / opts.faces.cols;
      fuv[2 * i + 1] = 1 - (py - fy0) / (fy1 - fy0) / opts.faces.rows;
      inFace[i] = out.part[i] === bodyPid && out.pos[3 * i + 2] > 0.02 && px > fx0 && px < fx1 && py > fy0 && py < fy1 ? 1 : 0;
    }
    for (let i = 0; i < out.idx.length; i += 3) {
      if (out.hull[i / 3] === 1 && inFace[out.idx[i]] && inFace[out.idx[i + 1]] && inFace[out.idx[i + 2]]) fidx.push(out.idx[i], out.idx[i + 1], out.idx[i + 2]);
    }
  }

  /* ---- 顔が +Z を向くように回し、足の下を高さ 0 にする ---- */
  const cb = Math.cos(-yaw);
  const sb = Math.sin(-yaw);
  const rot = (p) => [p[0] * cb + p[2] * sb, p[1], -p[0] * sb + p[2] * cb];
  const n = out.pos.length / 3;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const hpos = new Float32Array(n * 3);
  let minY = Infinity;
  for (let i = 0; i < n; i++) {
    const p = rot([out.pos[3 * i], out.pos[3 * i + 1], out.pos[3 * i + 2]]);
    const q = rot([out.nor[3 * i], out.nor[3 * i + 1], out.nor[3 * i + 2]]);
    pos.set(p, 3 * i);
    nor.set(q, 3 * i);
    hpos.set(add(p, mul(q, LINE)), 3 * i);
    minY = Math.min(minY, p[1] + q[1] * LINE);
  }
  for (let i = 0; i < n; i++) { pos[3 * i + 1] -= minY; hpos[3 * i + 1] -= minY; }
  /* 輪郭線の殻：面の向きを返す。体に沈む付け根の「壁」には線を出さない */
  const hl = [];
  for (let i = 0; i < out.idx.length; i += 3) {
    const h = out.hull[i / 3];
    if (h === 1) hl.push(out.idx[i], out.idx[i + 2], out.idx[i + 1]);
    if (h === 2) hl.push(out.idx[i], out.idx[i + 1], out.idx[i + 2]);
  }
  /* 線だけの部品（しっぽの付け根の輪）は塗りに入れない */
  const isWear = out.partNames.map((nm) => nm.startsWith('wear'));
  const fillIdx = [];
  const isCollar = out.partNames.map((nm) => nm === 'wearCollar');
  const gidx = [];
  const gcol = [];
  for (let i = 0; i < out.idx.length; i += 3) {
    if (out.hull[i / 3] === 2) continue;
    const pt = out.part[out.idx[i]];
    (isCollar[pt] ? gcol : isWear[pt] ? gidx : fillIdx).push(out.idx[i], out.idx[i + 1], out.idx[i + 2]);
  }
  const gCollar = gcol.length;
  gidx.push(...gcol);
  /* 輪郭線も、体の分と服の分に分ける */
  const hlBody = [];
  const ghidx = [];
  const ghcol = [];
  for (let i = 0; i < hl.length; i += 3) (isCollar[out.part[hl[i]]] ? ghcol : isWear[out.part[hl[i]]] ? ghidx : hlBody).push(hl[i], hl[i + 1], hl[i + 2]);
  const ghCollar = ghcol.length;
  ghidx.push(...ghcol);
  hl.length = 0;
  for (const v of hlBody) hl.push(v);
  const hidx = new Uint32Array(hl);
  const fix = (p) => { const q = rot(p); return [q[0], q[1] - minY, q[2]]; };
  const pivots = {};
  for (const k of Object.keys(out.pivots)) pivots[k] = fix(out.pivots[k]);
  const tailPath = out.tailPath.map(fix);

  /* ---- 骨 ---- */
  const bodyC = fix([bodyRings[Math.floor(bodyRings.length / 2)].cx, (yTop + yBot) / 2, 0]);
  const at = (f) => tailPath[Math.min(tailPath.length - 1, Math.round(f * (tailPath.length - 1)))];
  const bones = [
    { name: 'root', parent: null, pos: [0, 0, 0] },
    { name: 'body', parent: 'root', pos: bodyC },
    { name: 'earR', parent: 'body', pos: pivots.earR }, { name: 'earL', parent: 'body', pos: pivots.earL },
    { name: 'armR', parent: 'body', pos: pivots.armR }, { name: 'armL', parent: 'body', pos: pivots.armL },
    { name: 'footR', parent: 'root', pos: pivots.footR }, { name: 'footL', parent: 'root', pos: pivots.footL },
    { name: 'wifi', parent: 'body', pos: pivots.wifi },
    { name: 'tail1', parent: 'body', pos: at(0) }, { name: 'tail2', parent: 'tail1', pos: at(0.25) },
    { name: 'tail3', parent: 'tail2', pos: at(0.5) }, { name: 'tail4', parent: 'tail3', pos: at(0.75) },
  ];
  const bi = (nm) => bones.findIndex((q) => q.name === nm);
  const partBone = { body: 'body', nub: 'body', wifi0: 'wifi', wifi1: 'wifi', plug: 'tail4', plugTip: 'tail4', wearBody: 'body', wearCollar: 'body', wearRib: 'body', wearSleeveL: 'armL', wearSleeveR: 'armR' };
  const skinIndex = new Uint16Array(n * 4);
  const skinWeight = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const nm = out.partNames[out.part[i]];
    if (nm === 'tail') {
      const x = out.tp[i] * 4;
      const j = Math.floor(x + 0.25);
      if (j >= 1 && j <= 3) {
        const t = Math.min(1, Math.max(0, (x - (j - 0.25)) / 0.5));
        skinIndex[4 * i] = bi('tail' + j); skinWeight[4 * i] = 1 - t;
        skinIndex[4 * i + 1] = bi('tail' + (j + 1)); skinWeight[4 * i + 1] = t;
      } else {
        skinIndex[4 * i] = bi('tail' + Math.min(4, Math.floor(x) + 1)); skinWeight[4 * i] = 1;
      }
    } else if (nm.startsWith('wearSleeve') && out.tp[i] >= 0 && out.tp[i] < 1) {
      skinIndex[4 * i] = bi(partBone[nm]); skinWeight[4 * i] = out.tp[i];
      skinIndex[4 * i + 1] = bi('body'); skinWeight[4 * i + 1] = 1 - out.tp[i];
    } else {
      skinIndex[4 * i] = bi(partBone[nm] || nm); skinWeight[4 * i] = 1;
    }
  }
  return {
    pos, nor, hpos, uv: new Float32Array(out.uv), idx: new Uint32Array(fillIdx), hidx,
    part: new Uint8Array(out.part), partNames: out.partNames, pivots, tailPath, bones, skinIndex, skinWeight, poses: out.poses,
    fuv, fidx: new Uint32Array(fidx), gidx: new Uint32Array(gidx), ghidx: new Uint32Array(ghidx), gCollar, ghCollar,
    info: { yawRad: yaw, anchorY: -minY, unitPx: U, anchorPx: [ax, ay], size: shapes.size, line: LINE, bodyMaxR,
      triangles: fillIdx.length / 3 + hl.length / 3 },
  };
}
