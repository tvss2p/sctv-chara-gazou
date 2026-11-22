export const UNIT_PX = 837.4;
export const LINE_PX = 16;
export const LINE = LINE_PX / UNIT_PX;
export const OFFICIAL = { src: 'ref/tenten-official.jpg', w: 1260, h: 1275 };
export const COLORS = {
  body: '#2AC8C9', shadow: '#01ABAB', hi: '#95FFFF', line: '#114B5E',
  blue: '#0075AB', blueShadow: '#00496A', cheek: '#FE6714',
  plug: '#FF6600', plugShadow: '#C44F00', tongue: '#CA3D2B',
  black: '#000000', white: '#FFFFFF',
};
export const PARTS = {
  wifi: 2, nub: 1, ears: 2, eyes: 2, eyeHi: 2, brows: 2, cheeks: 2, mouth: 1,
  tongue: 1, tenG: 3, arms: 2, feet: 2, tail: 1, plug: 1, headHi: 1,
};
export function px2model(p, center) {
  return [(p[0] - center[0]) / UNIT_PX, (center[1] - p[1]) / UNIT_PX];
}
