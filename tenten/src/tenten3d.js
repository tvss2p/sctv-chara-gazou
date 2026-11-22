import { build } from './build.js';
import { COLORS } from './spec.js';

/*
 * createTenten(THREE, { shapes, meta, texture, outline })
 *   shapes: src/shapes.json、meta: src/atlas.json、texture: assets/atlas_*.png を読んだ THREE.Texture
 * 戻り値 { root, body, hull, info, data }。前は +Z、足の下が高さ 0、体の幅（線こみ）が 1。
 */
export function createTenten(THREE, { shapes, meta, texture, outline = true, parts, lod = 'full', faces = null, faceTexture = null } = {}) {
  const data = build(shapes, meta, { parts, lod, faces });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const root = new THREE.Group();
  root.name = 'tenten_root';
  const bones = {};
  const list = data.bones.map((b) => { const o = new THREE.Bone(); o.name = b.name; bones[b.name] = o; return o; });
  data.bones.forEach((b, i) => {
    const p = b.parent ? data.bones.find((q) => q.name === b.parent).pos : [0, 0, 0];
    list[i].position.set(b.pos[0] - p[0], b.pos[1] - p[1], b.pos[2] - p[2]);
    if (b.parent) bones[b.parent].add(list[i]); else root.add(list[i]);
  });
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(list);
  const mk = (posArr, idxArr, material, name, withUv) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    if (withUv) {
      g.setAttribute('normal', new THREE.BufferAttribute(data.nor, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(data.uv, 2));
    }
    g.setAttribute('skinIndex', new THREE.BufferAttribute(data.skinIndex, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(data.skinWeight, 4));
    g.setIndex(new THREE.BufferAttribute(idxArr, 1));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    g.boundingSphere.radius *= 1.6;
    const m = new THREE.SkinnedMesh(g, material);
    m.name = name;
    root.add(m);
    m.bind(skeleton, new THREE.Matrix4());
    m.boundingSphere = g.boundingSphere.clone();
    return m;
  };
  const body = mk(data.pos, data.idx, new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), 'tenten', true);
  /* 顔だけの面（表情の切りかえ用）。体と同じ頂点を使い、少し手前に描く。絵のずらし（offset）で表情を選ぶ */
  let face = null;
  if (faces && faceTexture && data.fidx.length) {
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    faceTexture.anisotropy = 4;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', body.geometry.getAttribute('position'));
    g.setAttribute('uv', new THREE.BufferAttribute(data.fuv, 2));
    g.setAttribute('skinIndex', body.geometry.getAttribute('skinIndex'));
    g.setAttribute('skinWeight', body.geometry.getAttribute('skinWeight'));
    g.setIndex(new THREE.BufferAttribute(data.fidx, 1));
    g.boundingSphere = body.geometry.boundingSphere.clone();
    g.boundingBox = body.geometry.boundingBox.clone();
    face = new THREE.SkinnedMesh(g, new THREE.MeshBasicMaterial({ map: faceTexture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    face.name = 'tenten_face';
    root.add(face);
    face.bind(skeleton, new THREE.Matrix4());
    face.boundingSphere = g.boundingSphere.clone();
  }
  const setFace = (name) => { if (face) setFaceOffset(faceTexture, faces, name); };
  let hull = null;
  if (outline) {
    /* プラグ・プラグの先・電波の殻は、奥へずらして描く。プラグの先の殻がプラグの上の面を突き抜けてちぎれたように見え、
       電波の端にも殻の小さな線が出ていた（2026-11-22 だいすけ）。体・耳・手足・しっぽは、体に重なる所の線が細るのでずらさない */
    const sel = new Set(['plug', 'plugTip', 'wifi0', 'wifi1'].map((n) => data.partNames.indexOf(n)).filter((i) => i >= 0));
    const keep = [], push = [];
    for (let i = 0; i < data.hidx.length; i += 3) (sel.has(data.part[data.hidx[i]]) ? push : keep).push(data.hidx[i], data.hidx[i + 1], data.hidx[i + 2]);
    hull = mk(data.hpos, new Uint32Array(keep), new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.line), toneMapped: false }), 'tenten_outline', false);
    if (push.length) {
      const hp = mk(data.hpos, new Uint32Array(push), new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.line), toneMapped: false, polygonOffset: true, polygonOffsetFactor: 80, polygonOffsetUnits: 16000 }), 'tenten_outline_back', false);
      hull.add(hp);   // 線を消す時（outline.visible = false）にいっしょに消える
    }
  }
  /* （ふだんは使わない）電波をカメラのほうへ向ける。電波は頭の上に固定された立体の部品で、既定では回さない */
  /* 服（身ごろ・そで）：体と同じ頂点を使う別のメッシュ。服の絵（assets/atlas_<服>_*.png）を貼る。着ていないときは見せない */
  let wear = null;
  let wearHull = null;
  if (data.gidx.length) {
    wear = mk(data.pos, data.gidx, new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), 'tenten_wear', true);
    wear.visible = false;
    if (outline) {
      wearHull = mk(data.hpos, data.ghidx, new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.line), toneMapped: false }), 'tenten_wear_outline', false);
      wearHull.visible = false;
    }
  }
  /* 服を着せる（tex＝服の絵の Texture）。null でぬぐ */
  /* opts.collar＝false で、えりを描かない（Tシャツ）。えりの三角形は並びの最後にあるので、描く数を減らすだけ */
  const setOutfit = (tex, opts = {}) => {
    if (!wear) return;
    if (tex) { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; wear.material.map = tex; wear.material.needsUpdate = true; }
    wear.visible = !!tex;
    const col = opts.collar !== false;
    wear.geometry.setDrawRange(0, data.gidx.length - (col ? 0 : data.gCollar || 0));
    if (wearHull) { wearHull.visible = !!tex; wearHull.geometry.setDrawRange(0, data.ghidx.length - (col ? 0 : data.ghCollar || 0)); }
  };
  const faceWifi = (camera) => {
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    root.getWorldQuaternion(q);
    e.setFromQuaternion(q, 'YXZ');
    const dx = camera.position.x - root.position.x;
    const dz = camera.position.z - root.position.z;
    const camYaw = camera.isOrthographicCamera ? 0 : Math.atan2(dx, dz);
    bones.wifi.rotation.y = camYaw - e.y;
  };
  /* ポーズを付ける。'rest'＝まっすぐ立った姿、'official'＝公式絵のポーズ */
  const applyPose = (name) => {
    for (const k of Object.keys(bones)) if (k !== 'wifi') bones[k].quaternion.identity();
    const p = data.poses[name];
    if (p) for (const k of Object.keys(p)) bones[k].quaternion.set(p[k][0], p[k][1], p[k][2], p[k][3]);
  };
  const clips = makeClips(THREE, data);
  return { root, body, hull, face, setFace, wear, wearHull, setOutfit, bones, skeleton, faceWifi, applyPose, clips, info: data.info, data };
}

/* 動き3つ：idle（待機・くり返し）、wave（左手をふる）、jump（ジャンプ）。骨の名前で動かすので GLB にもそのまま入る */
export function makeClips(THREE, data) {
  const rest = {};
  for (const b of data.bones) {
    const p = b.parent ? data.bones.find((q) => q.name === b.parent).pos : [0, 0, 0];
    rest[b.name] = [b.pos[0] - p[0], b.pos[1] - p[1], b.pos[2] - p[2]];
  }
  const half = data.bones.find((b) => b.name === 'body').pos[1] - 0.12;
  const quat = (axis, deg) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis).normalize(), (deg * Math.PI) / 180); return [q.x, q.y, q.z, q.w]; };
  const Z = [0, 0, 1];
  const Y = [0, 1, 0];
  /* キーとキーのあいだをなめらかな曲線（Catmull-Rom）でつなぎ、30コマ/秒に細かくする。くり返す動きは端もなめらかにつなぐ */
  const FPS = 30;
  const dense = (times, vals, loop) => {
    const dur = times[times.length - 1];
    const n = Math.round(dur * FPS);
    const k = vals.length;
    const at = (i) => (loop ? vals[((i % (k - 1)) + (k - 1)) % (k - 1)] : vals[Math.min(k - 1, Math.max(0, i))]);
    const tt = [];
    const out = [];
    for (let f = 0; f <= n; f++) {
      const x = (f / n) * dur;
      let i = 0;
      while (i < k - 2 && times[i + 1] <= x) i++;
      const u = (x - times[i]) / (times[i + 1] - times[i]);
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const w = Array.isArray(p1) ? p1.length : 1;
      const get = (p, d) => (w === 1 && !Array.isArray(p) ? p : p[d]);
      const r = [];
      for (let d = 0; d < w; d++) {
        const a0 = get(p0, d), a1 = get(p1, d), a2 = get(p2, d), a3 = get(p3, d);
        r.push(0.5 * (2 * a1 + (-a0 + a2) * u + (2 * a0 - 5 * a1 + 4 * a2 - a3) * u * u + (-a0 + 3 * a1 - 3 * a2 + a3) * u * u * u));
      }
      tt.push(x);
      out.push(w === 1 && !Array.isArray(p1) ? r[0] : r);
    }
    return [tt, out];
  };
  let LOOP = false;
  const rot = (bone, times, axis, degs) => { const [tt, v] = dense(times, degs, LOOP); return new THREE.QuaternionKeyframeTrack(bone + '.quaternion', tt, v.flatMap((d) => quat(axis, d))); };
  const pos = (bone, times, offs) => { const [tt, v] = dense(times, offs, LOOP); if (bone === 'root') for (const o of v) o[1] = Math.max(0, o[1]); return new THREE.VectorKeyframeTrack(bone + '.position', tt, v.flatMap((o) => [rest[bone][0] + o[0], rest[bone][1] + o[1], rest[bone][2] + o[2]])); };
  const scl = (bone, times, vals) => { const [tt, v] = dense(times, vals, LOOP); return new THREE.VectorKeyframeTrack(bone + '.scale', tt, v.flat()); };
  /* 体をつぶす・のばす。足は動かないので、体の下が足から浮かないように位置も合わせる */
  const squash = (times, sy) => {
    const [tt, v] = dense(times, sy, LOOP);
    return [
      new THREE.VectorKeyframeTrack('body.scale', tt, v.flatMap((s) => { const w = 1 / Math.sqrt(s); return [w, s, w]; })),
      new THREE.VectorKeyframeTrack('body.position', tt, v.flatMap((s) => [rest.body[0], rest.body[1] - (1 - s) * half, rest.body[2]])),
    ];
  };
  const N = 8;
  const loopT = Array.from({ length: N + 1 }, (_, i) => (2 * i) / N);
  const wave8 = (amp, phase) => loopT.map((tt) => amp * Math.sin(Math.PI * tt - phase));
  LOOP = true;
  const idle = new THREE.AnimationClip('idle', 2, [
    ...squash(loopT, loopT.map((tt) => 1 - 0.018 * (0.5 - 0.5 * Math.cos(Math.PI * tt)))),
    rot('armL', loopT, Z, wave8(5, 0.4)), rot('armR', loopT, Z, wave8(-5, 0.4)),
    rot('tail1', loopT, Y, wave8(4, 0)), rot('tail2', loopT, Y, wave8(4, 0.6)), rot('tail3', loopT, Z, wave8(4, 1.2)), rot('tail4', loopT, Z, wave8(5, 1.8)),
    pos('wifi', loopT, wave8(0.012, 0.8).map((v) => [0, v, 0])),
  ]);
  LOOP = false;
  const wt = [0, 0.25, 0.45, 0.65, 0.85, 1.05, 1.25, 1.6];
  const wave = new THREE.AnimationClip('wave', 1.6, [
    rot('armL', wt, Z, [0, 82, 54, 86, 54, 86, 68, 0]),
    rot('armR', wt, Z, [0, -8, -8, -8, -8, -8, -8, 0]),
    rot('body', wt, Z, [0, -4, -2, -5, -2, -5, -3, 0]),
    rot('tail3', wt, Z, [0, 6, -4, 6, -4, 6, 0, 0]),
  ]);
  const jt = [0, 0.18, 0.32, 0.5, 0.68, 0.8, 0.9, 1];
  const jump = new THREE.AnimationClip('jump', 1, [
    ...squash(jt, [1, 0.84, 1.1, 1.02, 1.06, 0.88, 0.96, 1]),
    pos('root', jt, [0, 0, 0.2, 0.32, 0.18, 0, 0, 0].map((y) => [0, y, 0])),
    rot('armL', jt, Z, [0, -14, 40, 55, 40, -6, 0, 0]), rot('armR', jt, Z, [0, 14, -40, -55, -40, 6, 0, 0]),
    rot('footL', jt, [1, 0, 0], [0, 0, 22, 12, 0, 0, 0, 0]), rot('footR', jt, [1, 0, 0], [0, 0, 22, 12, 0, 0, 0, 0]),
    rot('tail2', jt, [1, 0, 0], [0, 6, -14, -6, 10, 6, 0, 0]),
    pos('wifi', jt, [0, -0.02, 0.03, 0.05, 0.02, -0.03, 0.01, 0].map((y) => [0, y, 0])),
  ]);
  /* 勝ったとき：両手を上下させながら、2回はねる（くり返し） */
  LOOP = true;
  const ct = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.8, 0.95, 1.1, 1.25, 1.4];
  const armUp = [18, -8, 72, 38, 76, 30, -8, 72, 38, 76, 18];
  const cheer = new THREE.AnimationClip('cheer', 1.4, [
    ...squash(ct, [1, 0.88, 1.08, 1.02, 1.05, 0.9, 0.88, 1.08, 1.02, 1.05, 1]),
    pos('root', ct, [0, 0, 0.2, 0.27, 0.14, 0, 0, 0.2, 0.27, 0.14, 0].map((y) => [0, y, 0])),
    rot('armL', ct, Z, armUp), rot('armR', ct, Z, armUp.map((d) => -d)),
    rot('body', ct, Z, [0, 0, 4, 0, -3, 0, 0, -4, 0, 3, 0]),
    rot('footL', ct, [1, 0, 0], [0, 0, 20, 10, 0, 0, 0, 20, 10, 0, 0]), rot('footR', ct, [1, 0, 0], [0, 0, 20, 10, 0, 0, 0, 20, 10, 0, 0]),
    rot('tail2', ct, [1, 0, 0], [0, 6, -12, -4, 8, 4, 6, -12, -4, 8, 0]), rot('tail4', ct, Z, [0, 5, -8, 4, -6, 0, 5, -8, 4, -6, 0]),
    pos('wifi', ct, [0, -0.02, 0.03, 0.05, 0.02, -0.02, -0.02, 0.03, 0.05, 0.02, 0].map((y) => [0, y, 0])),
  ]);
  /* 飛んでいるとき（シューティングなど）：腕を小さくぱたぱた、足は後ろへ流す、しっぽがなびく。0.8秒くり返し */
  const ft = [0, 0.2, 0.4, 0.6, 0.8];
  const fly = new THREE.AnimationClip('fly', 0.8, [
    ...squash(ft, [1, 0.985, 1, 1.015, 1]),
    rot('armL', ft, Z, [10, 26, 12, 24, 10]), rot('armR', ft, Z, [-10, -26, -12, -24, -10]),
    rot('footL', ft, [1, 0, 0], [26, 34, 28, 22, 26]), rot('footR', ft, [1, 0, 0], [22, 16, 24, 30, 22]),
    rot('tail2', ft, Y, [0, 7, 0, -7, 0]), rot('tail3', ft, Z, [0, -6, 0, 6, 0]), rot('tail4', ft, Z, [0, 8, 0, -8, 0]),
    pos('wifi', ft, [0, 0.012, 0, -0.012, 0].map((y) => [0, y, 0])),
  ]);
  LOOP = false;
  return { idle, wave, jump, cheer, fly };
}

/* 顔の一覧の絵のなかで、表情 name のマスを選ぶ */
export function setFaceOffset(texture, faces, name) {
  const i = Math.max(0, faces.names.indexOf(name));
  texture.offset.set((i % faces.cols) / faces.cols, -Math.floor(i / faces.cols) / faces.rows);
}

/* face: チラシ用に全身の絵ごと表情を変えるときの名前（src/faces.json の full）。'normal' は公式絵の顔 */
export function atlasUrl(base, size, face = 'normal') { return base + '/assets/atlas_' + (face === 'normal' ? '' : face + '_') + size + '.png'; }

export async function loadTenten(THREE, base = '.', { size = 2048, outline = true, parts, lod = 'full', face = 'normal', faceSheet = false } = {}) {
  const [shapes, meta, texture] = await Promise.all([
    fetch(base + '/src/shapes.json').then((r) => r.json()),
    fetch(base + '/src/atlas.json').then((r) => r.json()),
    new THREE.TextureLoader().loadAsync(atlasUrl(base, size, face)),
  ]);
  let faces = null;
  let faceTexture = null;
  if (faceSheet) {
    faces = await fetch(base + '/src/faces.json').then((r) => r.json());
    faceTexture = await new THREE.TextureLoader().loadAsync(base + '/assets/faces_' + size + '.png');
  }
  return createTenten(THREE, { shapes, meta, texture, outline, parts, lod, faces, faceTexture });
}

/* 公式絵と同じ画素に重なる正投影カメラ（公式絵の向きに回した root を写す） */
export function officialCamera(THREE, info) {
  const U = info.unitPx;
  const [ax, ay] = info.anchorPx;
  const [W, H] = info.size;
  const cam = new THREE.OrthographicCamera(-ax / U, (W - ax) / U, info.anchorY + ay / U, info.anchorY - (H - ay) / U, 0.1, 40);
  cam.position.set(0, 0, 20);
  return cam;
}
