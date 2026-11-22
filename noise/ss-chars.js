// てんてん STAR SHOT! 0.4.13 のキャラの絵と動き（本編 game/index.html から tools/build-chars.js で切り出したもの。手で直さない）
window.SSChars=(function(){

/* ===== 本編の代わり（ゲームの状態・音・入力はここで空にする） ===== */
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
const store={get(k,d){return d},set(){}};
const H=390;let W=844,SCALE=1;const DPR=Math.max(1,Math.min(3,window.devicePixelRatio||1));
let SA={l:0,r:0,t:0,b:0},WSA={l:0,r:0};
const VIEW={mode:'yoko',pmode:'retro',pc:null,force:null,pt:false,ps:1,sw:390,sh:844,scr:{x:0,y:0,w:600,h:390},k:1,gb:null};
let UPR=false;function upright(x,y,fn){fn()}
let ctx=null;
const $=()=>null;
const IMG={};
const IMG_NAMES={side:'tenten_side.png',up:'tenten_up.png',down:'tenten_down.png',front:'tenten_front.png',ko:'tenten_ko.png',ouch:'tenten_ouch.png',spin:'tenten_spin.png',kw1:'kazu_wave1.png',kw2:'kazu_wave2.png',kg:'kazu_guts.png',miruko:'miruko.png',mirun:'mirun.png'};
function loadImages(base){base=base||'';const v=window.SSCHARS_V?'?v='+window.SSCHARS_V:'';return Promise.all(Object.entries(IMG_NAMES).map(([k,u])=>new Promise(res=>{const im=new Image();im.onload=()=>{IMG[k]=im;res()};im.onerror=()=>res();im.src=base+u+v})))}
const G={state:'title',paused:false,diff:'normal',time:0,scroll:0,enemies:[],shots:[],parts:[],drops:[],imos:[],st:{},stage:1,D:null,phase:'',rk:0,boost:0,lv:1,spread:0,rt:0,helpers:[],haze:0};
const stK=()=>Math.max(0,(G.stage||1)-1),bossOn=()=>false;
const rkFire=()=>1,rkArmor=()=>1;
function hpx(n){return Math.max(1,Math.round(n))}
const roomy=()=>1;
function music(){}function sfx(){}function sfxG(){}function buzz(){}function tone(){}function burst(){}function killed(){}function toast(){}function shake(){}
function E(o){const e=Object.assign({t:0,hp:1,flash:0,fr:0,r:14,score:10,exp:1,boost:2,dead:false},o);e.maxhp=e.hp;G.enemies.push(e);return e}
const ZK={v:1,e:{},f:{angry:1,charge:1,fire:1,hurt:1,worry:1},it:{}};
const ITEM_BY={};const itemUrl=()=>'';


/* ---- 本編 898-906: 色・むずかしさ ---- */
const C={plum:'#2A1440',night:'#1B1240',deep:'#2A1C58',cream:'#FFF3D6',butter:'#FFE066',pink:'#FF6FB1',mint:'#33D6CF',coral:'#FF7A6B',peach:'#FFB48A',lilac:'#B9A4FF',green:'#8EE68E',violet:'#5B3FD1',red:'#FF3E7F',blue:'#5AA9FF'};
const DIFF={
  // rk＝てんてんが強くなったとき、敵がどれだけ本気になるか（下の updateRank）
  // b〜＝ボス戦（小ボス・ボス）のとき。やさしいでもボスは手ごたえがあるように、ふつうに近づけてある
  easy:  {bullet:.72,fire:1.6,hp:.8, hit:6,magnet:130,rk:.55,label:'やさしい',bhp:1,bfire:1.18,bbullet:.86},
  normal:{bullet:1,  fire:1,  hp:1,  hit:8,magnet:0,  rk:1,  label:'ふつう',bhp:1,bfire:1,bbullet:1},
  hard:  {bullet:1.3,fire:.68,hp:1.25,hit:8,magnet:0, rk:1.25,label:'むずかしい',bhp:1.25,bfire:.68,bbullet:1.3}
};


/* ---- 本編 912-966: ドット絵・スプライト ---- */
/* ============ ドット絵 ============ */
const PAL={'#':C.plum,w:C.cream,p:C.pink,y:C.butter,c:C.cream,v:C.lilac,m:'#EAFBF8',g:'#3FBF6B',o:'#E8A33D',b:'#8A3B1E',s:C.cream,u:'#8B5CD6',l:C.blue,r:'#FFD2E2',
  k:'#F9C9A2',h:'#4A3428',e:'#BDB6CC',t:'#B0703A',a:C.coral,d:'#3B4A8C'};   // k〜d はオープニングの町の人
const Z_A=["..#.#.#.#..",".#########.","###########","##ww###ww##","###w####w##","#p#######p#",".#########.","#.#.#.#.#.#"];
const Z_B=[".#.#.#.#.#.",".#########.","###########","##ww###ww##","###w####w##","#p#######p#",".#########.",".#.#.#.#.#."];
const B_A=["..#.....#..","...#...#...","###########","#vccvccc###","#c#ccc#c#y#","#ccccccv###","#cc###cc#p#","###########",".##.....##."];
const B_B=[".#.......#.","..#.....#..","###########","#ccvccvc###","#c#ccc#c#y#","#vcccccc###","#cc###cc#p#","###########","..##...##.."];
const I_A=[".y....y.","..#..#..","...##...","..####..",".######.","##w##w##","########","..#..#..",".#.##.#.","#.#..#.#"];
const I_B=[".y....y.","..#..#..","...##...","..####..",".######.","##w##w##","########",".#.##.#.","#......#",".#....#."];
const U_A=[".....pppppp.....","...pppppppppp...","..pppppppppppp..",".ppyppcppyppcpp.","pppppppppppppppp","..###..##..###..","...#........#..."];
const L_A=["...####...",".########.","##########","##w###w###","##########","##########","##########","##.####.##","#...##...#"];
const L_B=["...####...",".########.","##########","##w###w###",".#########",".#########","##########","##.####.##","#...##...#"];
const M_A=["###########","#pcccccccp#","#cpcccccpc#","#ccpcccpcc#","#cccpppccc#","#c##ccc##c#","#ccccccccc#","###########"];
const R_A=["..y......y..","..#......#..","..#......#..",".##########.","#mmmmmmmmmm#","#mm#mmmm#mm#","#mpmm##mmpm#","#mmgmgmgmmm#",".##########.","..##....##.."];
const RM_A=[".#####.","#uuuup#","#uuuuu#","#u#u#u#","#u#u#u#","#uupuu#","#uuuuu#","#lpgyu#","#uuuuu#","#cucuc#","#uuuuu#","#cucuc#","#uuuuu#",".#####."];
const CL_A=["....wwww........","..wwwwwwwww.....",".wwwwwwwwwwwww..","wwwwwwwwwwwwwwww","wwwwwwwwwwwwwwww",".rrrrrrrrrrrrrr.","...rrrrrrrrrr..."];
const IMO=["..s..",".ooo.","obooo","ooooo","ooobo",".ooo.","..s..","..oo.","...oo",".oobo","obooo",".ooo.","..s..",".ooo.","ooboo","ooobo","obooo",".ooo.","..s.."];

function mkSprite(rows,sc,glitch,pal){pal=pal||PAL;
  const h=rows.length,w=rows[0].length,pad=glitch?1:0;
  const c=document.createElement('canvas');c.width=(w+pad*2)*sc;c.height=h*sc;
  const x=c.getContext('2d');
  if(glitch){
    const off=Math.max(1,Math.round(sc*.7));
    for(const [col,ox] of [[C.pink,-off],[C.mint,off]]){
      x.fillStyle=col;
      for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(rows[j][i]!=='.')x.fillRect((i+pad)*sc+ox,j*sc,sc,sc);
    }
  }
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const ch=rows[j][i];if(ch==='.')continue;x.fillStyle=pal[ch];x.fillRect((i+pad)*sc,j*sc,sc,sc)}
  const wc=document.createElement('canvas');wc.width=c.width;wc.height=c.height;
  const wx=wc.getContext('2d');wx.drawImage(c,0,0);wx.globalCompositeOperation='source-in';wx.fillStyle='#fff';wx.fillRect(0,0,wc.width,wc.height);
  return {img:c,white:wc,w:c.width,h:c.height};
}
const SPR={};
function buildSprites(){
  SPR.zaza=[mkSprite(Z_A,3,1),mkSprite(Z_B,3,1)];
  SPR.zazaBig=[mkSprite(Z_A,9,1),mkSprite(Z_B,9,1)];
  SPR.braun=[mkSprite(B_A,3,1),mkSprite(B_B,3,1)];
  SPR.ika=[mkSprite(I_A,3,1),mkSprite(I_B,3,1)];
  SPR.ufo=[mkSprite(U_A,3,0)];
  SPR.lag=[mkSprite(L_A,3,1),mkSprite(L_B,3,1)];
  SPR.mail=[mkSprite(M_A,3,0)];
  SPR.ruta=[mkSprite(R_A,3,0)];
  SPR.rimo=[mkSprite(RM_A,2,0)];
  SPR.cloud=[mkSprite(CL_A,4,0)];
  // 砂嵐（ボスの画面）
  SPR.noise=[];
  for(let k=0;k<4;k++){const c=document.createElement('canvas');c.width=46;c.height=36;const x=c.getContext('2d');
    for(let j=0;j<36;j++)for(let i=0;i<46;i++){const v=Math.random();x.fillStyle=v<.33?'#8C84A8':v<.66?'#C9C2DC':'#F2EEF8';x.fillRect(i,j,1,1)}
    SPR.noise.push(c)}
  buildStageSprites();
}
function spr(s,x,y,flash){if(UPR){upright(x,y,()=>spr(s,x,y,flash));return}const im=flash?s.white:s.img;ctx.drawImage(im,Math.round(x-s.w/2),Math.round(y-s.h/2))}


/* ---- 本編 1732-1749: 文字・ふきだし ---- */
/* ============ 描画 ============ */
function T(text,x,y,size,col,font,align,stroke){if(UPR){upright(x,y,()=>T(text,x,y,size,col,font,align,stroke));return}ctx.font=size+'px '+(font==='pop'?"'Dela Gothic One'":font==='body'?"'M PLUS Rounded 1c'":"DotGothic16")+',sans-serif';ctx.textAlign=align||'left';ctx.textBaseline='middle';
  if(stroke!==false){ctx.lineJoin='round';ctx.lineWidth=Math.max(3,size/4);ctx.strokeStyle=C.plum;ctx.strokeText(text,x,y)}ctx.fillStyle=col;ctx.fillText(text,x,y)}
// ドットの角（3pxの階段）の四角：外が縁の色、中が塗りの色
function pxRect(x,y,w,h,bd,bg){const s=3;ctx.fillStyle=bd;ctx.fillRect(x+2*s,y,w-4*s,h);ctx.fillRect(x+s,y+s,w-2*s,h-2*s);ctx.fillRect(x,y+2*s,w,h-4*s);ctx.fillStyle=bg;ctx.fillRect(x+3*s,y+s,w-6*s,h-2*s);ctx.fillRect(x+2*s,y+2*s,w-4*s,h-4*s);ctx.fillRect(x+s,y+3*s,w-2*s,h-6*s)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function sticker(text,x,y,size,bg,rot,fg){
  if(UPR){upright(x,y,()=>sticker(text,x,y,size,bg,rot,fg));return}
  ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.font=size+"px 'Dela Gothic One',sans-serif";const w=ctx.measureText(text).width+size*1.1,h=size*1.55;
  rr(-w/2+4,-h/2+4,w,h,size*.45);ctx.fillStyle=C.plum;ctx.fill();rr(-w/2,-h/2,w,h,size*.45);ctx.fillStyle=bg;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=C.cream;ctx.stroke();
  ctx.fillStyle=fg||C.plum;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,0,1);ctx.restore()}
// しっぽ tail：なし＝下から左下へ（かずさん・ステッカー）、'r'＝右のふちから右へ、'l'＝左のふちから左へ（話している人をさす）。しっぽにもふちどりをつける
const bubbleW=(text,size)=>{ctx.font=size+"px 'M PLUS Rounded 1c',sans-serif";return ctx.measureText(text).width+20};
function bubble(text,x,y,size,tail){if(UPR){upright(x,y,()=>bubble(text,x,y,size,tail));return}const w=bubbleW(text,size),h=size+14;rr(x-w/2,y-h/2,w,h,10);ctx.fillStyle=C.cream;ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=C.plum;ctx.stroke();
  const e=tail==='r'?x+w/2:x-w/2,s=tail==='r'?1:-1,tp=tail?[[e-s*2,y-6],[e+s*12,y+4],[e-s*2,y+6]]:[[x-6,y+h/2-2],[x-14,y+h/2+9],[x+4,y+h/2-2]];
  ctx.beginPath();ctx.moveTo(...tp[0]);ctx.lineTo(...tp[1]);ctx.lineTo(...tp[2]);ctx.closePath();ctx.fillStyle=C.cream;ctx.fill();
  ctx.beginPath();ctx.moveTo(...tp[0]);ctx.lineTo(...tp[1]);ctx.lineTo(...tp[2]);ctx.stroke();ctx.fillStyle=C.plum;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 '+size+"px 'M PLUS Rounded 1c',sans-serif";ctx.fillText(text,x,y+1)}


/* ---- 本編 1779-1849: 敵の描き方・ボス（ステージ1） ---- */
function drawImo(m){for(let j=0;j<19;j++)for(let i=0;i<5;i++){const ch=m.cells[j][i];if(ch==='.')continue;ctx.fillStyle=PAL[ch];ctx.fillRect(m.x+i*3,m.y+j*3,3,3)}}
function drawEnemy(e){
  if(ST_DRAW_RAW[e.type]){ST_DRAW_RAW[e.type](e,e.flash>0);return}   // 体がのびるボス（カラマリ・コードなど）は、たてでもゲームの世界の向きのまま描く
  if(UPR){upright(e.x,e.y,()=>drawEnemy(e));return}
  const fl=e.flash>0;const fr=Math.floor(e.t*2.5)%2;
  switch(e.type){
    case 'fzaza':spr(SPR.zaza[G.form?G.form.frame:fr],e.x,e.y,fl);break;
    case 'fbraun':case 'braun1':spr(SPR.braun[G.form&&e.form?G.form.frame:fr],e.x,e.y,fl);break;
    case 'fika':spr(SPR.ika[G.form?G.form.frame:fr],e.x,e.y,fl);break;
    case 'mini':spr(SPR.zaza[fr],e.x,e.y,fl);break;
    case 'ufo':spr(SPR.ufo[0],e.x,e.y,fl);break;
    case 'cloud':spr(SPR.cloud[0],e.x,e.y,fl);break;
    case 'lag':if(e.blink>0&&Math.floor(e.blink*40)%2)break;spr(SPR.lag[Math.floor(e.t*5)%3===0?1:0],e.x,e.y,fl);break;
    case 'mail':{spr(SPR.mail[0],e.x,e.y,fl);const on=e.dash>0||Math.floor(e.t*5)%2;if(on){ctx.beginPath();ctx.arc(e.x+16,e.y-12,7,0,TAU);ctx.fillStyle=C.red;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=C.plum;ctx.stroke();T('!',e.x+16,e.y-11,10,C.cream,'pop','center',false)}break}
    case 'guru':{ctx.save();ctx.translate(e.x,e.y);const step=Math.floor(e.t*10)%8;for(let i=0;i<8;i++){const a=(i+step)*TAU/8;ctx.globalAlpha=.25+i/10;ctx.fillStyle=[C.cream,C.cream,C.mint,C.mint,C.lilac,C.lilac,C.pink,C.pink][i];ctx.fillRect(Math.round(Math.cos(a)*12)-3,Math.round(Math.sin(a)*12)-3,6,6)}ctx.globalAlpha=1;ctx.fillStyle=fl?'#fff':C.plum;ctx.fillRect(-7,-7,14,14);ctx.fillStyle=C.cream;ctx.fillRect(-4,-3,3,3);ctx.fillRect(2,-3,3,3);ctx.restore();break}
    case 'deka':spr(SPR.zazaBig[fr],e.x,e.y,fl);break;
    case 'boss':drawBoss(e,fl);break;
    default:if(ST_DRAW[e.type])ST_DRAW[e.type](e,fl);
  }
}
// ボスの顔（22×14 の点で描く）。ふだん＝怒り顔（ほっぺの赤み）、ため＝＞＜、放出＝まんまる目と「お」の口、いたた＝×目、ピンチ＝困り眉
const FACES={"angry": ["......................", "......................", "......................", "...##............##...", "....##..........##....", ".....#..........#.....", ".....#w#......#w#.....", ".....###......###.....", "...pp............pp...", "......................", ".......########.......", "......##rrrrrr##......", "......................", "......................"], "blink": ["......................", "......................", "......................", "...##............##...", "....##..........##....", ".....#..........#.....", "......................", ".....###......###.....", "...pp............pp...", "......................", ".......########.......", "......##rrrrrr##......", "......................", "......................"], "charge": ["......................", "......................", "......................", "...................b..", "....#............#.b..", ".....##........##.....", ".......#......#.......", ".....##........##.....", "....#..pp....pp..#....", "......................", "........######........", ".......#w#w#w#........", "........######........", "......................"], "fire": ["......................", "......................", "......................", "......................", ".....###......###.....", "....#www#....#www#....", "....#w#w#....#w#w#....", "....#www#....#www#....", ".....###......###.....", "...pp............pp...", ".........####.........", "........#rrrr#........", "........#rrrr#........", ".........####........."], "hurt": ["......................", "......................", "......................", "......................", "....#...#....#...#....", ".....#.#......#.#.....", "......#........#......", ".....#.#......#.#.....", "....#...#....#...#....", "...pp............pp...", "........#.#.#.#.......", ".........#.#.#........", "......................", "......................"], "worry": ["......................", "......................", "......................", "......##......##......", "....##..........##....", "......................", ".....###......###.....", ".....#w#......#w#.....", "...pp............pp.b.", "....................b.", ".........####.........", "........#....#........", "......................", "......................"]};
const FCOL={'#':C.plum,w:C.cream,r:C.red,p:'#FF8FB8',b:C.blue};
function drawFace(name,sx,sy,u,v){const f=FACES[name];for(let j=0;j<14;j++)for(let i=0;i<22;i++){const ch=f[j][i];if(ch==='.')continue;ctx.fillStyle=FCOL[ch];ctx.fillRect(sx+i*u,sy+j*v,u+.5,v+.5)}}
const bossCharging=b=>b.ready&&((b.ch===1&&b.atk<.3)||(b.ch===8&&b.atk<.7)||(b.ch===3&&G.beam&&G.beam.t<G.beam.warn));
function bossFace(b){if(b.fx>0||(b.ch===3&&G.beam&&G.beam.t>=G.beam.warn))return 'fire';if(b.hurtT>0)return 'hurt';if(bossCharging(b))return 'charge';if(b.hp<b.maxhp*.35)return 'worry';return (b.t%2.8)<.13?'blink':'angry'}
function bossSay(b,text,d){b.say={text,t:0,d:d||1.3}}
// ため＝ぷるぷる震えて、まわりから星が集まる。放出＝ぽよんとふくらむ。吹き出しは大きな攻撃の最初の1回だけ
function drawBoss(b,fl){
  const chg=bossCharging(b);ctx.save();
  if(chg)ctx.translate(rand(-1.6,1.6),rand(-1.2,1.2));
  if(b.fx>0){const s=1+b.fx*.2;ctx.translate(b.x,b.y);ctx.scale(s,1-(s-1)*.45);ctx.translate(-b.x,-b.y)}
  drawBossBody(b,fl,chg);ctx.restore();
  if(chg){for(let i=0;i<6;i++){const pr=(b.t*1.6+i/6)%1,a=i*TAU/6+b.t*1.2,r=lerp(110,26,pr),px=b.x-22+Math.cos(a)*r,py=b.y+Math.sin(a)*r*.8;
    ctx.globalAlpha=pr;ctx.fillStyle=i%2?C.butter:C.pink;ctx.fillRect(px-1,py-4,3,9);ctx.fillRect(px-4,py-1,9,3)}ctx.globalAlpha=1}
  if(b.say){ctx.globalAlpha=clamp(Math.min(b.say.t*6,(b.say.d-b.say.t)*4),0,1);bossBubble(b);ctx.globalAlpha=1}
}
// ボスの吹き出し：体のすぐ横にくっつけて、しっぽでボスをさす。よこ・レトロは左（てんてんの側）、たては空いているほう（画面からはみ出さない）
function bossBubble(b){
  const w=bubbleW(b.say.text,13),off=102+w/2;let dx=-off,tail='r';
  if(VIEW.mode==='tate'){const sx=b.y,roomL=sx-102-SA.l,roomR=VIEW.sw-SA.r-sx-102;if(roomL<w+6&&roomR>roomL){dx=off;tail='l'}
    dx=clamp(sx+dx,SA.l+6+w/2,VIEW.sw-SA.r-6-w/2)-sx}   // 描く場所は upright の中なので、ずらしはそのまま画面のずらし
  bubble(b.say.text,b.x+dx,b.y-38,13,tail);
}
function drawBossBody(b,fl,chg){
  const x=b.x,y=b.y,bw=170,bh=136,L=x-bw/2,Tp=y-bh/2;
  ctx.lineCap='round';ctx.lineWidth=6;ctx.strokeStyle=C.plum;
  ctx.beginPath();ctx.moveTo(x-28,Tp+2);ctx.lineTo(x-52,Tp-28);ctx.moveTo(x+28,Tp+2);ctx.lineTo(x+52,Tp-28);ctx.stroke();
  [[x-52,C.pink],[x+52,C.mint]].forEach(([ax,c])=>{ctx.beginPath();ctx.arc(ax,Tp-30,chg?9+2*Math.sin(b.t*24):8,0,TAU);ctx.fillStyle=chg&&Math.floor(b.t*12)%2?C.butter:c;ctx.fill();ctx.lineWidth=3;ctx.stroke()});   // ため：アンテナの玉が光ってふくらむ
  rr(L-5,Tp,bw,bh,26);ctx.fillStyle=C.pink;ctx.fill();rr(L+5,Tp,bw,bh,26);ctx.fillStyle=C.mint;ctx.fill();
  rr(L,Tp,bw,bh,26);ctx.fillStyle=fl?'#fff':C.plum;ctx.fill();
  const sx=L+14,sy=Tp+14,sw=bw-62,sh=bh-28;
  ctx.save();rr(sx,sy,sw,sh,18);ctx.clip();
  if(b.ch===11){ctx.fillStyle='#FFE8C2';ctx.fillRect(sx,sy,sw,sh);ctx.imageSmoothingEnabled=false;if(IMG.kg)ctx.drawImage(IMG.kg,sx+sw/2-36,sy+12,72,92);ctx.imageSmoothingEnabled=true}
  else{ctx.imageSmoothingEnabled=false;ctx.drawImage(SPR.noise[Math.floor(b.t*14)%4],sx,sy,sw,sh);ctx.imageSmoothingEnabled=true;
    const u=sw/22,v=sh/14,face=bossFace(b);
    if(face==='charge'){ctx.globalAlpha=.18+.12*Math.sin(b.t*30);ctx.fillStyle=C.butter;ctx.fillRect(sx,sy,sw,sh);ctx.globalAlpha=1}
    drawFace(face,sx,sy,u,v)}
  ctx.restore();
  const px=L+bw-38;ctx.beginPath();ctx.arc(px+12,Tp+30,10,0,TAU);ctx.fillStyle=C.butter;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=C.cream;ctx.stroke();
  ctx.beginPath();ctx.arc(px+12,Tp+58,10,0,TAU);ctx.fillStyle=C.coral;ctx.fill();ctx.stroke();
  T('CH',px+12,Tp+84,11,C.cream,'dot','center',false);T(String(b.ch).padStart(2,'0'),px+12,Tp+102,15,b.ch===11?C.butter:C.mint,'dot','center',false);
  ctx.fillStyle=C.plum;ctx.fillRect(x-56,Tp+bh,30,14);ctx.fillRect(x+26,Tp+bh,30,14);
}
function drawTrail(){
  for(const s of G.trail){const a=1-s.t/s.life;const x=Math.round(s.x),y=Math.round(s.y);
    if(s.r>4.5){const L=Math.max(2,Math.round(s.r*1.5*(.4+.6*a)));ctx.globalAlpha=a*.9;ctx.fillStyle=s.c;ctx.fillRect(x-1,y-L,3,L*2+1);ctx.fillRect(x-L,y-1,L*2+1,3);
      ctx.globalAlpha=a*.45;ctx.fillRect(x-3,y-3,7,7);ctx.globalAlpha=a;ctx.fillStyle='#fff';ctx.fillRect(x-1,y-1,3,3)}
    else{const z=Math.max(2,Math.round(s.r*a));ctx.globalAlpha=a*.75;ctx.fillStyle=s.c;ctx.fillRect(x-(z>>1),y-(z>>1),z,z)}}
  ctx.globalAlpha=1;
}

/* ---- 本編 1979-1979: タイトルの星 ---- */
const RSTARS=Array.from({length:30},(_,i)=>({x:(i*97)%1200,y:(i*53)%190+12,p:i*1.7,s:i%4?2:3}));

/* ---- 本編 2283-2480: ステージ2〜のドット絵 ---- */
const PAL2={ '#': '#2A1440', w: '#FFF3D6', p: '#FF6FB1', y: '#FFE066', v: '#B9A4FF', m: '#EAFBF8', g: '#3FBF6B', o: '#E8A33D', b: '#8A3B1E', u: '#8B5CD6', l: '#5AA9FF', r: '#FFD2E2',
  n: '#33D6CF', k: '#FF7A6B', e: '#FF3E7F', x: '#8C84A8', s: '#C9C2DC', z: '#B9E8FF', h: '#4A4560', f: '#FF9E3D', d: '#2A1C58', t: '#1E8C86', a: '#7FE0FF' };
const ST_SPR={
  moya: { glitch: 1, rows: [
    '....######....',
    '..##ssssss##..',
    '.#ssssssssss#.',
    '#ssssssssssss#',
    '#ss##ssss##ss#',
    '#psssssssssps#',
    '#sssss##sssss#',
    '.#xxxxxxxxxx#.',
    '..#x#xx#xx#x#.',
    '...#.##.##.#..'] },
  pake: { glitch: 1, rows: [
    '......####....',
    '....##llll#...',
    '...#llwwwl#...',
    '..#llww#wl#...',
    '.##llwwwll#...',
    '#yy#llllllll#.',
    '.##llllll#l.l#',
    '...#ll.l.l.#..',
    '....#l.l.l#...',
    '.....##.##....'] },
  biri: { glitch: 1, rows: [
    '....#.#.#....',
    '...#y#y#y#...',
    '.##yyyyyyy##.',
    '#yyyyyyyyyyy#',
    '.#yw#yyyw#y#.',
    '#yyyyyyyyyyy#',
    '.#yyy###yyy#.',
    '#yyyyyyyyyyy#',
    '.##yyyyyyy##.',
    '...#y#y#y#...',
    '....#.#.#....'] },
  teiden: { glitch: 1, rows: [
    '#.............#',
    '##...#...#...##',
    '#u#..#u#u#..#u#',
    '#uu##uuuuu##uu#',
    '.#uuuuwuwuuuu#.',
    '..#uuuuuuuuu#..',
    '...##u#e#u##...',
    '.....#...#.....',
    '......#y#......',
    '.....#y#y#.....'] },
  jamy: { glitch: 1, rows: [
    '..####..........',
    '.#wwnn#..##..##.',
    '#w#nnnn##nn##nn#',
    '#nnnnn#nn#nn#nn#',
    '.#ennn#.##..##..',
    '..####..........'] },
  buffa: { glitch: 1, rows: [
    '...#####...',
    '..#vvvvv#..',
    '.#vvvvvvv#.',
    '#vvw#vw#vv#',
    '#vvvvvvvvv#',
    '#vv#v#v#vv#',
    '#vvvvvvvvv#',
    '.#vvvvvvv#.',
    '..#vvvvv#..',
    '...#####...'] },
  spamsat: { glitch: 1, rows: [
    '#lll#.#####.#lll#',
    '#lll##wwwww##lll#',
    '#lll#w#ppp#w#lll#',
    '#lll#wp#w#pw#lll#',
    '#lll#wwwwwww#lll#',
    '#lll#.#####.#lll#',
    '.......#.#.......',
    '........#........'] },
  debri: { glitch: 0, rows: [
    '..####......',
    '.#xxxx#.##..',
    '#xxsxxx#xx#.',
    '#xsxxxxxxx##',
    '#xxx#xxxsxx#',
    '.#xxxxxxxx#.',
    '..#xx##xx#..',
    '...##..##...'] },
  pyon: { glitch: 1, rows: [
    '..#.....#..',
    '.#w#...#w#.',
    '.#r#...#r#.',
    '.#w#...#w#.',
    '..#wwwww#..',
    '.#wwwwwww#.',
    '#ww#www#ww#',
    '#rwwwwwwwr#',
    '#wwww#wwww#',
    '.#wwwwwww#.',
    '..#w#.#w#..',
    '...#...#...'] },
  mogura: { glitch: 0, rows: [
    '....#####....',
    '...#yyyyy#...',
    '..#yyywyyy#..',
    '..#bbbbbbb#..',
    '.#bbw#bw#bb#.',
    '.#bbbbrbbbb#.',
    '#xx#bbbbb#xx#',
    '#xxx#####xxx#',
    '.#xxxxxxxxx#.'] },
  zarazara: { glitch: 1, rows: [
    '..k.k.k.k..',
    '.kkkkkkkkk.',
    'kkkkkkkkkkk',
    'kkwwkkkwwkk',
    'kkkwkkkkwkk',
    'kfkkkkkkkfk',
    '.kkkkkkkkk.',
    'k.k.k.k.k.k'] },
  rover: { glitch: 1, rows: [
    '.......##......',
    '......#ee#.....',
    '.......##......',
    '.......#.......',
    '....#######....',
    '...#xxxxxxx#...',
    '..#xxew#ewxx#..',
    '..#xxxxxxxxx#..',
    '.#############.',
    '#h#h#h#h#h#h#h#',
    '.#.#.#.#.#.#.#.'] },
  popup: { glitch: 1, rows: [
    '#############',
    '#llllllll#ew#',
    '#############',
    '#wwwwwwwwwww#',
    '#ww#wwwww#ww#',
    '#wwwww#wwwww#',
    '#ww#######ww#',
    '#wwwwwwwwwww#',
    '#############'] },
  virus: { glitch: 1, rows: [
    '.....#.#.....',
    '..#.#g#g#.#..',
    '...#ggggg#...',
    '.##ggwgwgg##.',
    '#ggggggggggg#',
    '.#gg#ggg#gg#.',
    '#gggg###gggg#',
    '.##ggggggg##.',
    '...#ggggg#...',
    '..#.#g#g#.#..',
    '.....#.#.....'] },
  freeze: { glitch: 1, rows: [
    '....###....',
    '...#zzz#...',
    '..#zzazz#..',
    '.#zz#z#zz#.',
    '#zzzzzzzzz#',
    '#zzz###zzz#',
    '.#zzzzzzz#.',
    '..#zzzzz#..',
    '...#zzz#...',
    '....###....'] },
  loop: { glitch: 1, rows: [
    '...#####...',
    '..#ppppp#..',
    '.#pp###pp#.',
    '#pp#...#pp#',
    '#p#.w.w.#p#',
    '#p#.....#p#',
    '#pp#.#.#pp#',
    '.#pp###pp#.',
    '..#ppp#y#..',
    '...###yyy#.',
    '......###..'] },
  copyw: { glitch: 1, rows: [
    '.#####.............',
    '#nnnnn####.....###.',
    '#wnnwn#ggg#####ggg#',
    '##nn#n#ggg#ggg#ggg#',
    '#nnnnn#ggg#ggg#ggg#',
    '#n###n#####ggg####.',
    '.#####.....###.....'] },
  bugg: { glitch: 1, rows: [
    '..#.......#..',
    '...#.....#...',
    '...#######...',
    '..#xwxxxwx#..',
    '.###########.',
    '#eeyee#eeyee#',
    '#eeeee#eeeee#',
    '#eyeee#eeeye#',
    '.#eeee#eeee#.',
    '..#########..',
    '.#..#...#..#.'] },
};
function buildStageSprites(){for(const [k,sp] of Object.entries(ST_SPR))SPR[k]=[mkSprite(sp.rows,3,sp.glitch,PAL2)];SPR.ayatsuri=[mkSprite(AYA_ROWS,3,1,PAL2)]}
// アヤツリン：ミル子・ミルンに とりついて、糸であやつっていた ノイズのおばけ（こちらで作ったキャラ）
const AYA_ROWS=['....#####....','..##uuuuu##..','.#uuuuuuuuu#.','#uuwwuuuwwuu#','#uu#wuuu#wuu#','#uuuuuuuuuuu#','#uuu#ppp#uuu#','#uuuu###uuuu#','#uuuuuuuuuuu#','.#uuuuuuuuu#.','#uu#uu#uu#uu#','.#..#..#..#..'];


/* ---- 本編 2525-2525: partSum ---- */
function partSum(e){e.hp=e.parts.reduce((a,p)=>a+(p.alive?p.hp:0),0);if(e.hp<=0&&!e.dead)killed(e)}

/* ---- 本編 2544-2544: ST_UPD/ST_DRAW ---- */
const ST_UPD={},ST_DRAW={},ST_DRAW_RAW={};

/* ---- 本編 2677-3487: ステージ2〜10（絵・動き・大きいキャラ） ---- */
// ---- ステージの中身
const STG={};
// ===== ステージ2 くもの上（マジックアワー）：雲にかくれた敵・モヤモヤ・パケロス、小ボス あやつられミル子（たすける）、ボス カラマリ・コード（結び目をほどく）
function moyaE(y,x){return E({type:'moya',x:x??W+30,y,by:y,hp:hpx(3),score:30,exp:2,r:18,shotT:rand(1.2,2.2)})}
function pakeE(y,x,ph){return E({type:'pake',x:x??W+30,y,by:y,hp:hpx(2),score:40,exp:2,r:15,ph:ph||0})}
function pakeRow(y){for(let i=0;i<3;i++)pakeE(y+(i%2?16:-16),W+30+i*46,i*.45)}
function kumoE(y,hide){return E({type:'kumo',x:W+80,y,hp:4,score:10,exp:0,boost:0,r:36,hide,noTouch:true,onKill:kumoOut})}
function kumoOut(e){if(e.out)return;e.out=true;const m=e.hide==='pake'?pakeE(e.y,e.x+10,.8):moyaE(e.y,e.x+10);m.t=.2;pop(e.x,e.y-30,'ポンッ',C.cream,13,.7,false);for(let i=0;i<3;i++)burst(e.x+rand(-20,20),e.y+rand(-10,10),6,C.cream)}
ST_UPD.moya=(e,dt)=>{e.x-=52*dt;e.y=e.by+Math.sin(e.t*1.4)*30;const d=Math.hypot(G.player.x-e.x,G.player.y-e.y);if(d<170)G.haze=Math.max(G.haze,(1-d/170)*.9);   // 近いと画面がかすむ
  e.shotT-=dt;if(e.shotT<=0&&e.x<W-40){e.shotT=2.6*rkFire();fire(e.x-12,e.y,aim(e.x,e.y),120,'orb')}if(e.x<-40)e.gone=true};
ST_UPD.pake=(e,dt)=>{e.x-=135*dt;e.y=e.by+Math.sin(e.t*3+e.ph)*14;e.ghost=((e.t+e.ph)%1.8)>1.15;if(e.x<-40)e.gone=true};   // 消えているあいだは弾がすりぬける
ST_UPD.kumo=(e,dt)=>{e.x-=48*dt;if(!e.out&&e.x<W*.56){kumoOut(e);e.gone=true}if(e.x<-90)e.gone=true};   // 近づくか撃つと、中の敵が飛び出す
ST_DRAW.moya=(e,fl)=>{ctx.save();ctx.translate(e.x,e.y);const k=Math.sin(e.t*3)*.05;ctx.scale(1+k,1-k);spr(SPR.moya[0],0,0,fl);ctx.restore()};
ST_DRAW.pake=(e,fl)=>{ctx.globalAlpha=e.ghost?.22:1;spr(SPR.pake[0],e.x,e.y,fl);ctx.globalAlpha=1};
ST_DRAW.kumo=(e,fl)=>{const s=SPR.cloud[0],k=1.9,w=s.w*k,h=s.h*k,y=e.y+Math.sin(e.t*2)*2;ctx.drawImage(fl?s.white:s.img,e.x-w/2,y-h/2,w,h);
  if(Math.floor(e.t*1.5)%3){ctx.fillStyle=C.plum;ctx.fillRect(e.x-11,y-1,5,5);ctx.fillRect(e.x+6,y-1,5,5)}};   // 中から目がのぞく
// 小ボス：あやつられミル子。紫のノイズ（HP）をはらうと正気にもどる → ボス戦で UFO に乗って応援に来る
const TINT={};
function possessedTint(im){const key=im.src;if(TINT[key])return TINT[key];const mk=col=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return c};return TINT[key]={p:mk('#8B5CD6'),k:mk(C.pink),m:mk(C.mint),w:mk('#ffffff')}}
function drawPossessed(im,x,y,w,h,t,fl,k){
  const a=clamp(k,0,1),g=ctx.createRadialGradient(x,y,10,x,y,w*.8);g.addColorStop(0,`rgba(139,92,214,${(.55*a).toFixed(3)})`);g.addColorStop(1,'rgba(139,92,214,0)');ctx.fillStyle=g;ctx.fillRect(x-w,y-h,w*2,h*2);
  for(let i=0;i<12;i++){const ang=i*TAU/12+t*1.5,r=w*.66;ctx.globalAlpha=a;ctx.fillStyle=i%2?'#8B5CD6':C.pink;ctx.fillRect(x+Math.cos(ang)*r-3,y+Math.sin(ang)*r*.9-2,7,4)}ctx.globalAlpha=1;
  // 映像の乱れ（初期案と同じ）：いつもピンクと水色に 色ずれ。1.8秒ごとに 横へ ガクッと ゆがむ。ふわふわ浮く。体力がへるほど 弱まる
  const tn=possessedTint(im),q=(t%1.8)/1.8,[jx,jy,sk]=q<.86?[0,0,0]:q<.9?[-5,0,8]:q<.94?[4,1,0]:[-2,0,0],yy=y-h/2+Math.sin(t*Math.PI)*4;
  ctx.save();ctx.translate(x+jx*a,yy+h/2+jy*a);if(sk)ctx.transform(1,0,Math.tan(sk*a*Math.PI/180),1,0,0);
  ctx.globalAlpha=.95*a;ctx.drawImage(tn.k,-w/2-3,-h/2,w,h);ctx.drawImage(tn.m,-w/2+3,-h/2,w,h);ctx.globalAlpha=1;
  ctx.drawImage(im,-w/2,-h/2,w,h);if(fl){ctx.globalAlpha=.5;ctx.drawImage(tn.w,-w/2,-h/2,w,h);ctx.globalAlpha=1}ctx.restore();   // 当たったときは うすく光る（まっ白にしない）
  const s=SPR.ayatsuri&&SPR.ayatsuri[0];if(s){const gx=x+Math.sin(t*1.7)*8,gy=yy-30+Math.sin(t*2.3)*4;ctx.globalAlpha=.35+.35*a;   // 上で 糸を ひっぱる アヤツリン（体力がへるほど うすく）
    ctx.strokeStyle='rgba(234,251,248,.7)';ctx.lineWidth=1.2;ctx.beginPath();for(const [hx,tx2,ty2] of [[-14,-w*.28,yy+h*.32],[0,0,yy+6],[14,w*.28,yy+h*.32]]){ctx.moveTo(gx+hx,gy+10);ctx.lineTo(x+tx2,ty2+Math.sin(t*3+hx)*3)}ctx.stroke();
    ctx.drawImage(s.img,gx-s.w/2,gy-s.h/2);ctx.globalAlpha=1}
}
// たすけたとき：アヤツリンが スーッと ぬけて、にげていく
function ayaOut(e,line){G.st.ghost={x:e.x,y:e.y-20,t:0,line};zkSeenId('ayatsuri');zkKill({type:'ayatsuri'});sfx('back')}
function ayaUpdate(dt){const g=G.st.ghost;if(g){g.t+=dt;if(g.t>3.4)G.st.ghost=null}}
function ayaDraw(){const g=G.st.ghost,s=SPR.ayatsuri&&SPR.ayatsuri[0];if(!g||!s)return;const t=g.t,k=clamp(t/.8,0,1),x=g.x+Math.sin(t*5)*10*k+Math.max(0,t-.8)*90,y=Math.max(56,g.y-k*46-Math.max(0,t-.8)*12),a=t<.8?k:clamp((3.4-t)/1.2,0,1);   // 体から上へ スーッと ぬけて、うしろへ にげていく
  for(let i=0;i<4;i++){ctx.globalAlpha=a*.25*(1-i/4);spr(s,x-i*6,y+i*14,false)}   // スーッと ぬける（うしろに 残像）
  ctx.globalAlpha=a;ctx.save();ctx.translate(x,y);ctx.scale(.6+.4*k,.6+.4*k);spr(s,0,0,false);ctx.restore();ctx.globalAlpha=1;
  if(t<.8&&Math.random()<.6)burst(g.x+rand(-20,20),g.y+rand(-30,10),2,'#8B5CD6');
  if(t>.35&&t<1.9){const w=bubbleW(g.line,12);bubble(g.line,VIEW.mode==='tate'?x:x-w/2-24,VIEW.mode==='tate'?y:y+36,12)}}
function mirukoSaved(e){G.helpers=G.helpers||[];if(!G.helpers.some(h=>h.kind==='miruko'))G.helpers.push({kind:'miruko',wait:6,y:58});G.st.saved={x:e.x,y:e.y,t:0};ayaOut(e,'くっ… バレたか〜！')}
ST_UPD.miruko=(e,dt)=>{if(e.say&&(e.say.t+=dt)>e.say.d)e.say=null;if(e.fx>0)e.fx-=dt;
  const stop=W-(VIEW.mode==='tate'?SA.t+170:roomy()<.7?120:150);if(e.x>stop){e.x-=dt*90;return}
  if(!e.ready){e.ready=true;bossSay(e,'ピ…ガガ…',1.8)}
  e.y=190+Math.sin(e.t*1.1)*82;e.shotT-=dt;
  if(e.shotT<=0){e.shotT=1.8*rkFire();const n=G.rk>.5?5:3,a=aim(e.x-30,e.y),st=fan(e.x-30,e.y,.24);for(let i=-(n>>1);i<=(n>>1);i++)fire(e.x-30,e.y,a+i*st,135,'orb');e.fx=.25;sfx('bShot')}
  if(e.hp<e.maxhp*.4&&!e.saidW){e.saidW=true;bossSay(e,'あれ…？ わたし…',1.8)}};
ST_DRAW.miruko=(e,fl)=>{const im=IMG.miruko;if(!im)return;const h=104,w=h*im.naturalWidth/im.naturalHeight;drawPossessed(im,e.x,e.y,w,h,e.t,fl,e.hp/e.maxhp);if(e.say)bossBubble(e)};
// ボス：カラマリ・コード。からまったケーブルの竜。黄色い結び目（3つ）だけ弾が効く。ぜんぶほどくと頭が弱点に（体は短くなる）
function karaPart(e,p){burst(p.x,p.y,18,C.butter);sfx('boom');
  if(p.k==='knot'){addScore(500,p.x,p.y-20);const left=e.parts.filter(q=>q.k==='knot'&&q.alive).length;e.len=Math.max(11,e.len-2);bossSay(e,left===2?'ほどけた〜！':left===1?'ゆ、ゆるむ…！':'ぜんぶ ほどけた〜！',1.4);if(!left){e.parts[3].lock=false;e.atk=1}}}
ST_UPD.karamari=(e,dt)=>{if(e.say&&(e.say.t+=dt)>e.say.d)e.say=null;if(e.fx>0)e.fx-=dt;for(const p of e.parts)if(p.flash>0)p.flash-=dt;
  const sp=roomy()<.7?11:15,stop=W-sp*e.len-(VIEW.mode==='tate'?SA.t+50:40);
  if(e.x>stop)e.x-=dt*110;else if(!e.ready){e.ready=true;buzz([200,60,200,60,360],true);bossSay(e,'からまっちゃった〜！',2)}
  if(e.lunge>0){e.lunge-=dt;e.y=lerp(e.y,e.ly,dt*6);e.dx=lerp(e.dx||0,-70,dt*5)}else{e.y=lerp(e.y,190+Math.sin(e.t*.8)*78,dt*2);e.dx=lerp(e.dx||0,0,dt*3)}
  const segs=[];for(let i=0;i<=e.len;i++){const q=i/16;segs.push({x:e.x+(e.dx||0)*(1-q)+i*sp,y:e.y*(1-q*.6)+190*q*.6+Math.sin(e.t*2.2-i*.55)*24*Math.min(1,i/3)})}e.segs=segs;   // 頭から後ろへ、波がつたわる
  for(const p of e.parts){const s=segs[Math.min(p.seg,segs.length-1)];p.x=s.x+(p.k==='head'?-6:0);p.y=s.y}
  e.armor=segs.filter((s,i)=>i>0&&i%2===1).map(s=>({x:s.x,y:s.y,r:8}));
  if(!e.ready)return;
  e.atk-=dt;const alive=e.parts.filter(p=>p.k==='knot'&&p.alive),hard=alive.length===0,hd=e.parts[3];
  if(e.atk<=0){e.pat=(e.pat+1)%3;e.atk=(hard?1.6:2.3)*rkFire();
    if(e.pat===0){for(const k of alive.length?alive:[hd])fire(k.x-8,k.y,aim(k.x,k.y),150,'bolt');e.fx=.2;sfx('bZap')}   // 結び目から電気
    else if(e.pat===1){e.charge=.7;bossSay(e,'ビリビリ…',.9);sfx('bChg')}   // ためて、プラグから扇の弾
    else{e.lunge=1.1;e.ly=clamp(G.player.y,70,310);bossSay(e,'からめとってやる〜！',1.2);sfx('bLunge')}}   // てんてんの高さへ つっこむ
  if(e.charge>0){e.charge-=dt;if(e.charge<=0){const n=hard?7:5,a=aim(hd.x,hd.y);for(let i=-(n>>1);i<=(n>>1);i++)fire(hd.x-20,hd.y,a+i*.18,165,'orb');e.fx=.3;buzz(80,true);sfx('bRing')}}
  if(e.hp<e.maxhp*.3&&!e.saidW&&!e.say){e.saidW=true;bossSay(e,'ピンチ…！')}
};
ST_DRAW_RAW.karamari=(e,fl)=>{const S=e.segs||[];if(S.length<2)return;ctx.save();if(e.charge>0)ctx.translate(rand(-1.5,1.5),rand(-1.5,1.5));
  ctx.lineCap='round';ctx.lineJoin='round';const line=(w,c,o)=>{ctx.beginPath();S.forEach((s,i)=>{const y=s.y+(o?Math.sin(e.t*6+i)*o:0);i?ctx.lineTo(s.x,y):ctx.moveTo(s.x,y)});ctx.lineWidth=w;ctx.strokeStyle=c;ctx.stroke()};
  line(26,C.plum);line(12,fl?'#fff':C.mint);line(5,C.pink,3);
  for(const i of [6,12])if(S[i]){ctx.beginPath();ctx.arc(S[i].x,S[i].y-14,14,0,TAU);ctx.lineWidth=12;ctx.strokeStyle=C.plum;ctx.stroke();ctx.lineWidth=5;ctx.strokeStyle=C.mint;ctx.stroke()}   // からまった輪
  for(const p of e.parts){if(p.k!=='knot')continue;
    if(p.alive){const r=p.r*(p.flash>0?1.15:1);ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fillStyle=p.flash>0?'#fff':C.butter;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=C.plum;ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-6,p.y-5);ctx.lineTo(p.x+6,p.y+5);ctx.moveTo(p.x-6,p.y+5);ctx.lineTo(p.x+6,p.y-5);ctx.stroke()}
    else{ctx.beginPath();ctx.arc(p.x,p.y,7,0,TAU);ctx.lineWidth=3;ctx.strokeStyle=C.cream;ctx.stroke()}}
  const hd=e.parts[3],hx=hd.x,hy=hd.y,hf=hd.flash>0||fl;   // 頭（プラグの口）。結び目がのこっているあいだは かたい
  rr(hx-32,hy-28,62,56,18);ctx.fillStyle=C.plum;ctx.fill();rr(hx-28,hy-24,54,48,14);ctx.fillStyle=hf?'#fff':(hd.lock?C.mint:C.coral);ctx.fill();
  ctx.fillStyle=C.plum;ctx.fillRect(hx-46,hy-12,16,6);ctx.fillRect(hx-46,hy+6,16,6);ctx.fillStyle=C.silver||'#C9C2DC';ctx.fillRect(hx-44,hy-11,12,4);ctx.fillRect(hx-44,hy+7,12,4);
  ctx.beginPath();ctx.arc(hx-4,hy-8,9,0,TAU);ctx.fillStyle=C.cream;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=C.plum;ctx.stroke();ctx.beginPath();ctx.arc(hx-6-(e.charge>0?2:0),hy-8,4,0,TAU);ctx.fillStyle=C.plum;ctx.fill();
  rr(hx-22,hy+8,34,9,4);ctx.fillStyle=e.charge>0&&Math.floor(e.t*20)%2?C.butter:C.red;ctx.fill();
  if(!hd.lock){ctx.globalAlpha=.6+.4*Math.sin(e.t*8);ctx.lineWidth=3;ctx.strokeStyle=C.butter;rr(hx-36,hy-32,70,64,20);ctx.stroke();ctx.globalAlpha=1}   // ほどけたら頭が光る＝弱点
  ctx.restore();
  if(e.say){const tt=VIEW.mode==='tate';upright(hx,hy,()=>{const w=bubbleW(e.say.text,13);ctx.globalAlpha=clamp(Math.min(e.say.t*6,(e.say.d-e.say.t)*4),0,1);bubble(e.say.text,hx+(tt?0:-34-w/2),hy-(tt?58:46),13,tt?null:'r');ctx.globalAlpha=1})}
};
STG[2]={
  intro:{peek:['moya','pake'],c1:'スナアラシ大王を やっつけた！',c2:'でも 空の上から、まだ ノイズの気配が…',sub:'マジックアワーの 雲の上',sky:['#8B5CD6','#E0609E','#FFB08A']},
  bg:{
    sky(x,W,H){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#8B5CD6');g.addColorStop(.48,'#E0609E');g.addColorStop(.78,'#FF9E8A');g.addColorStop(1,'#FFC9A0');x.fillStyle=g;x.fillRect(0,0,W,H);
      x.globalAlpha=.85;x.fillStyle=C.butter;x.beginPath();x.arc(W*.78,H-92,58,0,TAU);x.fill();x.globalAlpha=.35;x.beginPath();x.arc(W*.78,H-92,84,0,TAU);x.fill();x.globalAlpha=1;
      x.fillStyle=C.cream;for(let i=0;i<18;i++){x.globalAlpha=.4+((i*7)%5)/10;x.fillRect((i*157)%W,(i*53)%120+12,2,2)}x.globalAlpha=1},
    far(x,w,h){x.fillStyle='rgba(255,210,226,.85)';for(let i=0;i<9;i++){const cx=i*52+((i*37)%20),r=34+((i*29)%18);x.beginPath();x.arc(cx,h-8,r,0,TAU);x.fill()}x.fillRect(0,h-20,w,20)},
    near(x,w,h){const cols=['#FFF3D6','#FFE3EC'];for(let i=0;i<8;i++){x.fillStyle=cols[i%2];const cx=i*60+((i*23)%24),r=40+((i*41)%22);x.beginPath();x.arc(cx,h-4+((i*13)%10),r,0,TAU);x.fill()}x.fillStyle=cols[0];x.fillRect(0,h-26,w,26)},
    mid(W,H){const s=SPR.cloud&&SPR.cloud[0];if(!s)return;ctx.globalAlpha=.75;for(let i=0;i<4;i++){const sp=.45+i*.12,x=W+120-((G.scroll*sp+i*260)%(W+260)),y=[70,150,110,200][i],k=1.2+i*.25;ctx.drawImage(s.img,x-s.w*k/2,y-s.h*k/2,s.w*k,s.h*k)}ctx.globalAlpha=1},
    skyP(x,w,h){const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#FFC9A0');g.addColorStop(.5,'#FFB8C8');g.addColorStop(1,'#E0609E');x.fillStyle=g;x.fillRect(0,0,w,h)},
    midP(w,h){const s=SPR.cloud&&SPR.cloud[0];if(!s)return;   // たて：上から見た雲の海。大きい雲はゆっくり、小さい雲は速く下へ流れる
      for(let L=0;L<2;L++){ctx.globalAlpha=L?.95:.7;const sp=L?1.6:.7,n=L?5:6,k=L?2.4:3.2;for(let i=0;i<n;i++){const y=((G.scroll*sp+i*(h+200)/n)%(h+200))-100,x=[50,300,180,90,340,240][i];ctx.drawImage(s.img,x-s.w*k/2,y-s.h*k/2,s.w*k,s.h*k)}}ctx.globalAlpha=1}
  },
  waves:[[.6,()=>{moyaE(120);moyaE(270)}],[3,()=>pakeRow(100)],[5.5,()=>kumoE(160,'moya')],[7.5,()=>cloud(290)],[9.5,()=>pakeRow(260)],
    [12,()=>{kumoE(110,'pake');kumoE(275,'moya')}],[14.5,()=>snake(190,'s2a')],[17,()=>{moyaE(90);moyaE(190);moyaE(290)}],[19.5,()=>cloud(140)],
    [21.5,()=>pakeRow(150)],[23.5,()=>kumoE(235,'pake')],[25.5,()=>{cloud(100);kumoE(290,'moya')}],[28,()=>pakeRow(300)],[30.5,()=>{kumoE(130,'moya');kumoE(250,'pake')}],
    [33,()=>{moyaE(150);pakeRow(250)}],[36,()=>cloud(200)],[38,()=>{pakeRow(110);moyaE(280)}]],
  waveEnd:46,
  rest(){moyaE(150);moyaE(240)},
  extra(){if(Math.random()<.5)pakeE(rand(90,300));else moyaE(rand(90,300))},
  mid(){return E({type:'miruko',x:W+90,y:190,hp:hpx(60),score:1000,exp:10,boost:10,r:46,boss:true,name:'あやつられミル子',shotT:2.2,rescue:true,onKill:mirukoSaved})},
  boss(){const e=E({type:'karamari',x:W+60,y:190,hp:1,score:6000,exp:0,boost:6,r:40,boss:true,mainBoss:true,name:'カラマリ・コード',atk:2.5,pat:0,ready:false,fx:0,len:16,onPart:karaPart});
    const hh=hpx(80);e.parts=[{k:'knot',seg:4,r:15,hp:hpx(30)},{k:'knot',seg:7,r:16,hp:hpx(28)},{k:'knot',seg:10,r:17,hp:hpx(22)},{k:'head',seg:0,r:28,hp:hh,lock:true}];   // 奥の結び目ほど ねらいにくいので やわらかめ
    e.parts.forEach(p=>{p.alive=true;p.maxhp=p.hp;p.x=p.y=-999});e.armor=[];partSum(e);e.maxhp=e.hp;return e},
  update(dt){const s=G.st.saved;if(s){s.t+=dt;if(s.t>4.2)G.st.saved=null}ayaUpdate(dt)},
  fx(){const s=G.st.saved,im=IMG.miruko;if(!s||!im)return;const h=96,w=h*im.naturalWidth/im.naturalHeight,y=s.y-s.t*40;   // たすけたミル子が、お礼を言って空へ
    upright(s.x,y,()=>{ctx.globalAlpha=clamp(4.2-s.t,0,1);ctx.drawImage(im,s.x-w/2,y-h/2,w,h);ctx.globalAlpha=1});if(s.t>1.6&&s.t<3.8)bubble('ありがとう！ あとで おうえんに行くね！',s.x-60,y-60,12);ayaDraw()}
};


// ===== ステージ3〜 の共通：大きいキャラの絵・予告つきの攻撃・暗さ・吸いこみ
// 小ボス・ボスの絵は tools/stage_chars.js のデザイン案と同じ描き方（中心が (0,0)）。一度だけキャンバスに描いておいて使う
const ST_BIG=(function(){const IMGS=IMG;
const C={plum:'#2A1440',cream:'#FFF3D6',pink:'#FF6FB1',mint:'#33D6CF',butter:'#FFE066',lilac:'#B9A4FF',coral:'#FF7A6B',red:'#FF3E7F',blue:'#5AA9FF',deep:'#2A1C58',gray:'#8C84A8',silver:'#C9C2DC',orange:'#FF9E3D',ice:'#B9E8FF',green:'#3FBF6B',night:'#1B1240',purple:'#8B5CD6'};
const TAU=Math.PI*2;
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function circ(x,X,Y,r,fill,stroke,lw){x.beginPath();x.arc(X,Y,r,0,TAU);if(fill){x.fillStyle=fill;x.fill()}if(stroke){x.lineWidth=lw||3;x.strokeStyle=stroke;x.stroke()}}
function face(x,name,ox,oy,w,h){const f=FACES[name],u=w/22,v=h/14,col={'#':C.plum,w:C.cream,r:C.red,p:'#FF8FB8',b:C.blue};for(let j=0;j<14;j++)for(let i=0;i<22;i++){const ch=f[j][i];if(ch==='.')continue;x.fillStyle=col[ch];x.fillRect(ox+i*u,oy+j*v,u+.4,v+.4)}}
function noise(x,X,Y,w,h,u){let sd=9;for(let j=0;j<h;j+=u)for(let i=0;i<w;i+=u){sd=(sd*16807)%2147483647;const q=sd/2147483647;x.fillStyle=q<.33?'#8C84A8':q<.66?'#C9C2DC':'#F2EEF8';x.fillRect(X+i,Y+j,u,u)}}
function glitchShadow(x,fn){x.save();x.translate(-4,0);x.globalAlpha=.9;fn('pink');x.restore();x.save();x.translate(4,0);fn('mint');x.restore()}
function bolt(x,X,Y,s,col){x.save();x.translate(X,Y);x.scale(s,s);x.beginPath();x.moveTo(0,-20);x.lineTo(-9,2);x.lineTo(-1,2);x.lineTo(-6,20);x.lineTo(9,-4);x.lineTo(1,-4);x.lineTo(6,-20);x.closePath();x.fillStyle=col||C.butter;x.fill();x.lineWidth=2.5;x.strokeStyle=C.plum;x.stroke();x.restore()}
function aura(x,img,W,H){ // あやつられ：紫のノイズのふち
  const g=x.createRadialGradient(0,0,10,0,0,W*.62);g.addColorStop(0,'rgba(139,92,214,.55)');g.addColorStop(1,'rgba(139,92,214,0)');x.fillStyle=g;x.fillRect(-W,-H,W*2,H*2);
  for(let i=0;i<14;i++){const a=i*TAU/14,r=W*.55;x.fillStyle=i%2?C.purple:C.pink;x.fillRect(Math.cos(a)*r-3,Math.sin(a)*r*.9-3,7,4)}
  x.save();x.globalAlpha=.55;for(const [dx,dy,c] of [[-5,0,C.purple],[5,0,C.pink],[0,-4,C.purple]]){x.save();x.translate(dx,dy);x.drawImage(img,-W/2,-H/2,W,H);x.globalCompositeOperation='source-atop';x.fillStyle=c;x.fillRect(-W,-H,W*2,H*2);x.restore()}x.restore();
  x.drawImage(img,-W/2,-H/2,W,H);x.save();x.globalCompositeOperation='source-atop';for(let i=0;i<40;i++){x.fillStyle=i%2?'rgba(139,92,214,.5)':'rgba(255,111,177,.4)';x.fillRect(-W/2+((i*37)%W),-H/2+((i*53)%H),6,3)}x.restore()}
const BIG={
  // ---------- CH.2 くもの上
  miruko(x){aura(x,IMGS.miruko,130,130);circ(x,58,-50,9,C.purple,C.plum,2);x.fillStyle=C.cream;x.font='bold 14px sans-serif';x.textAlign='center';x.fillText('?',58,-45)},
  karamari(x){ // からまったケーブルの竜。結び目（黄色）を撃ってほどく
    x.lineCap='round';
    const path=t=>[-60+t*170,Math.sin(t*9)*26+Math.cos(t*4)*12];
    for(const [col,ofs,lw] of [[C.plum,0,26],[C.mint,-5,12],[C.pink,5,12]]){x.strokeStyle=col;x.lineWidth=lw;x.beginPath();for(let i=0;i<=40;i++){const t=i/40,[px,py]=path(t);i?x.lineTo(px,py+ofs*Math.sin(t*20)):x.moveTo(px,py+ofs)}x.stroke()}
    for(const t of [.3,.55,.8]){const [px,py]=path(t);circ(x,px,py,11,C.butter,C.plum,3);x.strokeStyle=C.plum;x.lineWidth=2;x.beginPath();x.moveTo(px-6,py-4);x.lineTo(px+6,py+4);x.moveTo(px-6,py+4);x.lineTo(px+6,py-4);x.stroke()}
    for(const [cx2,cy2,r2] of [[10,-40,18],[70,30,16]]){x.strokeStyle=C.plum;x.lineWidth=14;x.beginPath();x.arc(cx2,cy2,r2,0,TAU);x.stroke();x.strokeStyle=C.mint;x.lineWidth=6;x.beginPath();x.arc(cx2,cy2,r2,0,TAU);x.stroke()}   // からまった輪
    // 頭（プラグの口）
    rr(x,-110,-34,62,58,18);x.fillStyle=C.plum;x.fill();rr(x,-106,-30,54,50,14);x.fillStyle=C.mint;x.fill();
    x.fillStyle=C.plum;x.fillRect(-122,-14,16,6);x.fillRect(-122,4,16,6);x.fillStyle=C.silver;x.fillRect(-120,-13,12,4);x.fillRect(-120,5,12,4);
    circ(x,-80,-12,9,C.cream,C.plum,3);circ(x,-82,-12,4,C.plum);rr(x,-100,6,36,10,5);x.fillStyle=C.red;x.fill();
    x.strokeStyle=C.plum;x.lineWidth=4;x.beginPath();x.moveTo(-70,-34);x.lineTo(-58,-52);x.moveTo(-86,-34);x.lineTo(-88,-54);x.stroke();circ(x,-58,-54,5,C.pink,C.plum,2);circ(x,-88,-56,5,C.butter,C.plum,2)},
  // ---------- CH.3 かみなり雲
  breaker(x){ // ブレーカー番長
    rr(x,-55,-62,110,124,12);x.fillStyle=C.plum;x.fill();rr(x,-49,-56,98,112,8);x.fillStyle=C.silver;x.fill();
    rr(x,-36,-44,72,40,6);x.fillStyle=C.deep;x.fill();face(x,'angry',-34,-42,68,36);
    for(let i=0;i<3;i++){rr(x,-34+i*24,10,20,34,4);x.fillStyle=C.plum;x.fill();x.fillStyle=i===1?C.red:C.cream;x.fillRect(-30+i*24,14,12,12)}   // まん中の赤いスイッチも ふだんは上（停電すると 下に落ちる＝ST_DRAW.breaker）
    bolt(x,-70,-40,.9);bolt(x,72,-10,.8)},
  surge(x){ // ゴロゴロ・サージ（雷雲＋コンセント）
    const puffs=[[-70,0,42],[-30,-26,48],[22,-30,50],[66,-6,44],[30,20,46],[-24,22,46]];
    for(const [px,py,r] of puffs)circ(x,px,py+6,r+6,C.plum);for(const [px,py,r] of puffs)circ(x,px,py,r,'#6B5A9E');for(const [px,py,r] of puffs)circ(x,px-6,py-8,r*.6,'#8F80C4');
    face(x,'angry',-50,-24,100,64);
    bolt(x,-96,40,1.4);bolt(x,98,36,1.3);bolt(x,-8,72,1.1);
    x.strokeStyle=C.plum;x.lineWidth=6;x.beginPath();x.moveTo(40,52);x.bezierCurveTo(50,80,80,70,80,96);x.stroke();rr(x,64,92,32,24,6);x.fillStyle=C.cream;x.fill();x.lineWidth=3;x.stroke();x.fillStyle=C.plum;x.fillRect(72,100,4,10);x.fillRect(84,100,4,10)},
  // ---------- CH.4 オーロラ成層圏
  parabo(x){ // パラボラン
    x.save();x.rotate(-.35);x.beginPath();x.ellipse(0,0,74,58,0,-Math.PI/2,Math.PI/2);x.closePath();x.fillStyle=C.plum;x.fill();x.beginPath();x.ellipse(-4,0,66,50,0,-Math.PI/2,Math.PI/2);x.closePath();x.fillStyle=C.silver;x.fill();
    x.strokeStyle=C.plum;x.lineWidth=5;x.beginPath();x.moveTo(-4,0);x.lineTo(70,0);x.stroke();circ(x,74,0,9,C.red,C.plum,3);x.restore();
    circ(x,16,-6,16,C.cream,C.plum,4);circ(x,20,-6,7,C.plum);x.fillStyle=C.plum;x.fillRect(-10,60,26,12);x.fillRect(-30,72,66,10)},
  yomikomi(x){ // ヨミコミ大魔王（巨大な読み込み中）。％が100になる前にたおす
    const cols=[C.cream,C.cream,C.mint,C.mint,C.lilac,C.lilac,C.pink,C.pink,C.butter,C.butter,C.coral,C.coral];
    for(let i=0;i<12;i++){const a=i*TAU/12;x.save();x.translate(Math.cos(a)*84,Math.sin(a)*84);x.rotate(a);x.globalAlpha=.3+i/16;rr(x,-14,-10,28,20,8);x.fillStyle=cols[i];x.fill();x.globalAlpha=1;x.lineWidth=3;x.strokeStyle=C.plum;x.stroke();x.restore()}
    circ(x,0,0,60,C.plum);x.save();x.beginPath();x.arc(0,0,54,0,TAU);x.clip();noise(x,-54,-54,108,108,3);x.restore();face(x,'charge',-40,-34,80,50);
    rr(x,-30,24,60,26,6);x.fillStyle=C.plum;x.fill();},
  // ---------- CH.5 人工衛星の海
  arm(x){ // ハックアーム（のっとられた宇宙ステーションのうで）
    rr(x,52,62,80,34,8);x.fillStyle=C.plum;x.fill();rr(x,58,66,68,26,6);x.fillStyle=C.gray;x.fill();for(let i=0;i<3;i++){x.fillStyle=i===1?C.red:C.butter;x.fillRect(66+i*20,74,10,8)}
    x.lineCap='round';x.strokeStyle=C.plum;x.lineWidth=32;x.beginPath();x.moveTo(90,62);x.lineTo(30,-6);x.lineTo(-36,-24);x.stroke();
    x.strokeStyle=C.silver;x.lineWidth=22;x.beginPath();x.moveTo(90,62);x.lineTo(30,-6);x.lineTo(-36,-24);x.stroke();
    x.strokeStyle='rgba(42,20,64,.35)';x.lineWidth=3;for(const [a,b2] of [[60,28],[0,-15]]){x.beginPath();x.moveTo(a-8,b2-8);x.lineTo(a+8,b2+8);x.stroke()}
    circ(x,30,-6,18,C.butter,C.plum,4);circ(x,90,62,22,C.gray,C.plum,4);
    x.save();x.translate(-52,-28);x.fillStyle=C.plum;for(const s of [-1,1]){x.beginPath();x.moveTo(6,s*4);x.lineTo(-44,s*30);x.lineTo(-34,s*40);x.lineTo(14,s*14);x.closePath();x.fill();x.fillStyle=C.silver;x.beginPath();x.moveTo(4,s*6);x.lineTo(-38,s*30);x.lineTo(-33,s*35);x.lineTo(10,s*13);x.closePath();x.fill();x.fillStyle=C.plum}
    circ(x,0,0,22,C.plum);circ(x,0,0,17,C.cream);circ(x,0,0,9,C.red);circ(x,-3,-3,3,C.cream);x.restore()},
  jamsat(x){ // ジャミング・サテライト（パネルが弾をふせぐ。パネルを先にこわす）
    for(const s of [-1,1]){x.save();x.translate(s*112,0);rr(x,-44,-36,88,72,6);x.fillStyle=C.plum;x.fill();for(let i=0;i<4;i++)for(let j=0;j<3;j++){x.fillStyle=(i+j)%2?C.blue:'#7FC0FF';x.fillRect(-40+i*21,-32+j*22,19,20)}x.restore();x.fillStyle=C.plum;x.fillRect(s*48-(s<0?20:0),-6,20,12)}
    circ(x,0,0,52,C.plum);circ(x,0,0,46,C.silver);circ(x,0,0,36,C.plum);x.save();x.beginPath();x.arc(0,0,33,0,TAU);x.clip();noise(x,-33,-33,66,66,3);x.restore();face(x,'angry',-30,-20,60,40);
    x.strokeStyle=C.plum;x.lineWidth=5;x.beginPath();x.moveTo(0,-52);x.lineTo(0,-84);x.stroke();circ(x,0,-88,8,C.red,C.plum,3)},
  // ---------- CH.6 月面ステーション
  mirun(x){aura(x,IMGS.mirun,130,130)},
  kengai(x){ // ケンガイ・ゴースト（アンテナが「圏外」になると消える。3本立ったときがチャンス）
    x.beginPath();x.moveTo(-70,70);x.lineTo(-70,-10);x.bezierCurveTo(-70,-90,70,-90,70,-10);x.lineTo(70,70);for(let i=0;i<5;i++){const xx=70-i*28;x.quadraticCurveTo(xx-7,86,xx-14,70);x.quadraticCurveTo(xx-21,54,xx-28,70)}x.closePath();
    x.fillStyle='rgba(233,228,245,.92)';x.fill();x.lineWidth=5;x.strokeStyle=C.plum;x.stroke();
    circ(x,-26,-14,12,C.plum);circ(x,26,-14,12,C.plum);circ(x,-22,-18,4,C.cream);circ(x,30,-18,4,C.cream);x.fillStyle=C.plum;x.beginPath();x.ellipse(0,18,12,9,0,0,TAU);x.fill();
    circ(x,-46,8,6,'#FF8FB8');circ(x,46,8,6,'#FF8FB8');
},
  // ---------- CH.7 火星の砂あらし
  devil(x){ // ダストデビル
    for(let i=0;i<7;i++){const y=-70+i*22,w=100-i*12;x.beginPath();x.ellipse(Math.sin(i)*8,y,w/2,10,0,0,TAU);x.fillStyle=i%2?C.orange:C.coral;x.fill();x.lineWidth=3;x.strokeStyle=C.plum;x.stroke()}
    circ(x,-18,-62,11,C.cream,C.plum,3);circ(x,18,-62,11,C.cream,C.plum,3);circ(x,-16,-62,5,C.plum);circ(x,20,-62,5,C.plum);x.strokeStyle=C.plum;x.lineWidth=4;x.beginPath();x.moveTo(-24,-44);x.lineTo(-8,-40);x.lineTo(8,-44);x.lineTo(24,-40);x.stroke();
    for(let i=0;i<10;i++){x.fillStyle=i%2?C.orange:'#B5673A';x.fillRect(-70+((i*41)%140),-80+((i*29)%150),5,5)}},
  akasuna(x){ // アカスナ大帝（スナアラシ大王の兄）。画面が2つ
    const bw=200,bh=130,L=-bw/2,T=-bh/2;
    x.lineCap='round';x.lineWidth=6;x.strokeStyle=C.plum;x.beginPath();x.moveTo(-30,T+2);x.lineTo(-60,T-34);x.moveTo(30,T+2);x.lineTo(60,T-34);x.stroke();circ(x,-60,T-36,9,C.orange,C.plum,3);circ(x,60,T-36,9,C.butter,C.plum,3);
    x.fillStyle=C.butter;x.beginPath();x.moveTo(-28,T-6);x.lineTo(-20,T-28);x.lineTo(-8,T-12);x.lineTo(0,T-32);x.lineTo(8,T-12);x.lineTo(20,T-28);x.lineTo(28,T-6);x.closePath();x.fill();x.lineWidth=3;x.stroke();
    rr(x,L-6,T,bw,bh,26);x.fillStyle=C.orange;x.fill();rr(x,L+6,T,bw,bh,26);x.fillStyle=C.coral;x.fill();rr(x,L,T,bw,bh,26);x.fillStyle='#5A1E2E';x.fill();
    for(const s of [-1,1]){x.save();rr(x,s<0?L+12:6,T+14,82,bh-28,14);x.clip();noise(x,s<0?L+12:6,T+14,82,bh-28,3);face(x,s<0?'angry':'charge',s<0?L+14:8,T+30,78,52);x.restore()}
    x.fillStyle=C.plum;x.fillRect(-70,T+bh,34,14);x.fillRect(36,T+bh,34,14)},
  // ---------- CH.8 小惑星ベルト
  p404(x){ // ポップアップ404（初期案のデザイン。平成レトロなエラー画面が、小さなウィンドウを次々出す。弱点は右上の×）→ ボス
    const win=(X,Y,w,h,bar,sh,label,fs)=>{x.fillStyle=sh;x.fillRect(X+5,Y+5,w,h);x.fillStyle='#E9E4F5';x.fillRect(X,Y,w,h);x.fillStyle=bar;x.fillRect(X,Y,w,16);x.lineWidth=3;x.strokeStyle=C.cream;x.strokeRect(X,Y,w,h);
      x.fillStyle=C.plum;x.font=(fs||14)+'px "DotGothic16",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(label,X+w/2,Y+16+(h-16)/2)};
    // 小さなウィンドウ（エラー・ﾂﾅｶﾞﾘﾏｾﾝ・ﾖﾐｺﾐﾁｭｳ）は、ゲームでは 1つずつ開いて、ぜんぶ閉じて…をくり返す（P404_WIN）
    const X=-96,Y=-36,w=190,h=128,cx=X+w/2;
    x.fillStyle=C.plum;x.fillRect(X+7,Y+7,w,h);x.fillStyle='#E9E4F5';x.fillRect(X,Y,w,h);
    const g=x.createLinearGradient(X,0,X+w,0);g.addColorStop(0,'#5B3FD1');g.addColorStop(1,C.pink);x.fillStyle=g;x.fillRect(X,Y,w,26);
    x.lineWidth=4;x.strokeStyle=C.cream;x.strokeRect(X,Y,w,h);
    x.fillStyle=C.red;x.fillRect(X+w-26,Y+4,21,19);x.lineWidth=2.5;x.strokeStyle=C.cream;x.strokeRect(X+w-26,Y+4,21,19);x.beginPath();x.moveTo(X+w-21,Y+9);x.lineTo(X+w-10,Y+18);x.moveTo(X+w-10,Y+9);x.lineTo(X+w-21,Y+18);x.stroke();
    x.fillStyle=C.plum;x.font='46px "Dela Gothic One",sans-serif';x.textAlign='center';x.textBaseline='alphabetic';x.fillText('404',cx,Y+84);
    x.fillRect(cx-29,Y+98,10,10);x.fillRect(cx-12,Y+101,24,4);x.fillRect(cx+19,Y+98,10,10)},
  troy(x){ // トロイのもくば（プレゼントのふりをした木馬。おなかのとびらが開くと、ウイルスが飛び出す）
    const Wd='#E8A33D',Dk='#C27E2A',Br='#8A3B1E',line=()=>{x.lineWidth=4;x.strokeStyle=C.plum;x.stroke()};
    x.lineCap='round';x.strokeStyle=C.plum;x.lineWidth=9;x.beginPath();x.moveTo(62,-18);x.quadraticCurveTo(94,-20,98,14);x.stroke();x.strokeStyle=Br;x.lineWidth=4;x.stroke();x.lineCap='butt';
    rr(x,-96,58,188,20,6);x.fillStyle=Br;x.fill();line();
    for(const wx of [-70,-28,22,64]){circ(x,wx,86,12,C.gray,C.plum,4);circ(x,wx,86,4,C.plum)}
    for(const lx of [-74,-48,30,54]){x.beginPath();x.rect(lx,16,16,44);x.fillStyle=Wd;x.fill();line()}
    x.beginPath();x.moveTo(-58,-26);x.lineTo(-92,-80);x.lineTo(-66,-92);x.lineTo(-30,-26);x.closePath();x.fillStyle=Wd;x.fill();line();
    x.fillStyle=Br;for(let i=0;i<5;i++)x.fillRect(-68+i*8,-92+i*13,10,10);
    rr(x,-86,-32,158,56,12);x.fillStyle=Wd;x.fill();line();
    x.strokeStyle=Dk;x.lineWidth=2;for(const gy of [-18,-4,10]){x.beginPath();x.moveTo(-78,gy);x.lineTo(64,gy);x.stroke()}
    x.beginPath();x.rect(36,-32,14,56);x.fillStyle=C.pink;x.fill();x.lineWidth=3;x.strokeStyle=C.plum;x.stroke();
    for(const s of [-1,1]){x.beginPath();x.ellipse(43+s*13,-38,13,8,s*.5,0,TAU);x.fillStyle=C.pink;x.fill();x.lineWidth=3;x.strokeStyle=C.plum;x.stroke()}circ(x,43,-37,5,C.red,C.plum,3);
    rr(x,-44,-20,52,36,4);x.fillStyle='#120A22';x.fill();x.lineWidth=3;x.strokeStyle=C.plum;x.stroke();
    const g=x.createRadialGradient(-18,-2,2,-18,-2,30);g.addColorStop(0,'rgba(63,191,107,.85)');g.addColorStop(1,'rgba(63,191,107,0)');x.fillStyle=g;x.fillRect(-44,-20,52,36);
    for(const [ex,ey] of [[-36,-8],[-14,0],[-22,-14]]){x.fillStyle=C.cream;x.fillRect(ex,ey,4,4);x.fillRect(ex+8,ey,4,4)}
    x.beginPath();x.moveTo(-44,16);x.lineTo(8,16);x.lineTo(2,32);x.lineTo(-50,32);x.closePath();x.fillStyle=Br;x.fill();x.lineWidth=3;x.strokeStyle=C.plum;x.stroke();
    for(const [px,py,c] of [[-24,38,C.green],[-10,46,C.pink],[4,38,C.mint],[-30,50,C.green]]){x.fillStyle=C.plum;x.fillRect(px-1,py-1,8,8);x.fillStyle=c;x.fillRect(px,py,6,6)}
    rr(x,-128,-108,70,40,12);x.fillStyle=Wd;x.fill();line();
    x.beginPath();x.moveTo(-76,-106);x.lineTo(-70,-124);x.lineTo(-62,-102);x.closePath();x.fillStyle=Wd;x.fill();line();
    circ(x,-102,-92,8,C.cream,C.plum,3);circ(x,-104,-92,4,C.red);
    x.fillStyle=C.plum;x.fillRect(-122,-84,5,5);x.strokeStyle=C.plum;x.lineWidth=3;x.beginPath();x.moveTo(-124,-75);x.lineTo(-104,-77);x.stroke()},
  meiwaku(x){ // メイワク大艦隊（巨大メールの母艦。メールを次々出す）
    rr(x,-110,-60,220,120,10);x.fillStyle=C.plum;x.fill();rr(x,-102,-52,204,104,6);x.fillStyle=C.cream;x.fill();
    x.strokeStyle=C.pink;x.lineWidth=7;x.beginPath();x.moveTo(-100,-48);x.lineTo(0,14);x.lineTo(100,-48);x.stroke();x.strokeStyle=C.plum;x.lineWidth=4;x.beginPath();x.moveTo(-100,50);x.lineTo(-30,-4);x.moveTo(100,50);x.lineTo(30,-4);x.stroke();
    face(x,'angry',-44,-6,88,52);for(let i=0;i<4;i++){rr(x,-96+i*52,58,28,14,4);x.fillStyle=C.gray;x.fill();x.lineWidth=3;x.strokeStyle=C.plum;x.stroke()}
    circ(x,100,-60,20,C.red,C.plum,4);x.fillStyle=C.cream;x.font='bold 24px sans-serif';x.textAlign='center';x.fillText('!',100,-51)},
  // ---------- CH.9 土星のリング
  repeat(x){ // リピートくん（同じ攻撃をくり返すテープのロボ）
    rr(x,-80,-50,160,100,14);x.fillStyle=C.plum;x.fill();rr(x,-72,-42,144,84,10);x.fillStyle=C.lilac;x.fill();rr(x,-54,-26,108,40,8);x.fillStyle=C.deep;x.fill();
    for(const s of [-1,1]){circ(x,s*28,-6,14,C.cream,C.plum,3);x.strokeStyle=C.plum;x.lineWidth=3;x.beginPath();x.arc(s*28,-6,7,0,4.5);x.stroke();x.fillStyle=C.plum;x.beginPath();x.moveTo(s*28+7,-6);x.lineTo(s*28+12,-10);x.lineTo(s*28+12,-2);x.fill()}
    rr(x,-30,24,60,10,4);x.fillStyle=C.pink;x.fill()},
  mugen(x){ // ムゲン・ループ（自分のしっぽをかむ輪のヘビ）
    for(let i=0;i<28;i++){const a=i/28*TAU*.92+.5,px=Math.cos(a)*78,py=Math.sin(a)*58;circ(x,px,py,17-i*.25,C.plum);circ(x,px,py,13-i*.25,i%2?C.ice:C.lilac)}
    x.save();x.translate(Math.cos(.35)*78,Math.sin(.35)*58);circ(x,0,0,30,C.plum);circ(x,0,0,25,C.ice);circ(x,-8,-6,7,C.cream,C.plum,3);circ(x,10,-6,7,C.cream,C.plum,3);x.fillStyle=C.plum;x.fillRect(-10,-8,4,4);x.fillRect(8,-8,4,4);x.fillStyle=C.red;x.fillRect(-6,8,14,5);x.restore();
},
  // ---------- CH.10 宇宙のはて
  gate(x){ // ゲートキーパー
    rr(x,-90,-80,180,160,20);x.fillStyle=C.plum;x.fill();rr(x,-78,-68,156,148,14);x.fillStyle='#3A2A70';x.fill();
    x.beginPath();x.moveTo(-50,80);x.lineTo(-50,-10);x.arc(0,-10,50,Math.PI,0);x.lineTo(50,80);x.closePath();x.fillStyle=C.night;x.fill();
    for(let i=0;i<30;i++){x.fillStyle=['#FF6FB1','#33D6CF','#FFE066','#B9A4FF'][i%4];x.fillRect(-46+((i*29)%92),-50+((i*47)%126),3,3)}
    x.save();x.translate(0,-56);x.beginPath();x.ellipse(0,0,26,16,0,0,TAU);x.fillStyle=C.cream;x.fill();x.lineWidth=4;x.strokeStyle=C.mint;x.stroke();circ(x,0,0,9,C.pink);circ(x,0,0,4,C.plum);x.restore()},
  black(x){ // ブラックノイズ（砂嵐のブラックホール。吸いこみに逆らって撃つ）
    for(let k=0;k<4;k++){x.save();x.rotate(k*TAU/4);for(let i=0;i<46;i++){const t=i/46,a=t*4.2,r=20+t*92;x.fillStyle=['#C9C2DC','#8C84A8','#F2EEF8','#B9A4FF'][i%4];x.globalAlpha=1-t*.8;x.fillRect(Math.cos(a)*r-3,Math.sin(a)*r-3,6,6)}x.restore()}x.globalAlpha=1;
    circ(x,0,0,46,'#0B0618');circ(x,0,0,46,null,C.purple,4);
    circ(x,-16,-6,8,C.red);circ(x,16,-6,8,C.red);circ(x,-16,-6,3,C.cream);circ(x,16,-6,3,C.cream);x.strokeStyle=C.red;x.lineWidth=3;x.beginPath();x.moveTo(-14,16);x.quadraticCurveTo(0,8,14,16);x.stroke()},
};
return BIG})();
const BIGC={};
function bigCv(id){if(BIGC[id])return BIGC[id];const S=2,w=340,h=280,c=document.createElement('canvas');c.width=w*S;c.height=h*S;const x=c.getContext('2d');x.scale(S,S);x.translate(w/2,h/2);try{ST_BIG[id](x)}catch(e){}
  const wc=document.createElement('canvas');wc.width=c.width;wc.height=c.height;const wx=wc.getContext('2d');wx.drawImage(c,0,0);wx.globalCompositeOperation='source-atop';wx.fillStyle='#fff';wx.fillRect(0,0,wc.width,wc.height);
  // 絵のあるところ（図鑑で大きく見せるため）
  let bb=[c.width,c.height,0,0];try{const d=x.getImageData(0,0,c.width,c.height).data;for(let j=0;j<c.height;j+=2)for(let i=0;i<c.width;i+=2)if(d[(j*c.width+i)*4+3]>16){if(i<bb[0])bb[0]=i;if(j<bb[1])bb[1]=j;if(i>bb[2])bb[2]=i;if(j>bb[3])bb[3]=j}}catch(e){bb=[0,0,c.width,c.height]}
  if(bb[2]<=bb[0])bb=[0,0,c.width,c.height];
  return BIGC[id]={img:c,white:wc,w,h,box:{x:bb[0],y:bb[1],w:bb[2]-bb[0]+2,h:bb[3]-bb[1]+2}}}
function drawBig(id,x,y,k,fl,rot,alpha){const b=bigCv(id);ctx.save();ctx.translate(x,y);if(rot)ctx.rotate(rot);ctx.scale(k,k);if(alpha!=null)ctx.globalAlpha=alpha;ctx.drawImage(b.img,-b.w/2,-b.h/2,b.w,b.h);if(fl){ctx.globalAlpha=(alpha??1)*.55;ctx.drawImage(b.white,-b.w/2,-b.h/2,b.w,b.h)}ctx.restore()}
// 絵の上の位置（dx,dy）→ ゲームの世界でのずれ。たては絵を立てて描くので、90°まわす
const upo=(dx,dy)=>VIEW.mode==='tate'?[-dy,dx]:[dx,dy];
const hpS=n=>hpx(n*(1+.1*Math.max(0,G.stage-2)));   // ステージが進むほど、すこしかたい
const off=e=>{if(e.x<-70||e.y<-90||e.y>H+90)e.gone=true};
function shootT(e,dt,int,fn){if(e.shotT==null)e.shotT=rand(.5,int);e.shotT-=dt;if(e.shotT<=0&&e.x<W-30&&e.x>50){e.shotT=int*rkFire();fn(e)}}
function sprK(s,x,y,k,fl){const im=fl?s.white:s.img;ctx.drawImage(im,x-s.w*k/2,y-s.h*k/2,s.w*k,s.h*k)}
// 大きいキャラ：右から入ってきて止まる（ready）。弱点（parts）とかたい所（arm）は、絵の上の位置で書いておく
function bigE(o){const e=E(Object.assign({x:W+150,y:190,boss:true,ready:false,fx:0,atk:2.2,pat:-1,k:.85,bw:110,bh:100,exp:0,boost:8,r:60},o));
  if(e.parts){e.parts.forEach(p=>{p.alive=true;p.maxhp=p.hp;p.x=p.y=-999});partSum(e);e.maxhp=e.hp}else e.maxhp=e.hp;return e}
const bigStop=e=>W-(VIEW.mode==='tate'?SA.t+(e.bh*e.k+72):   /* たて：上の HUD（ボスの体力）に かからないように。bh＝絵の上はしまで */roomy()<.7?e.bw*e.k*.8+24:e.bw*e.k+44);
function bigEnter(e,dt,say){if(e.x>bigStop(e)){e.x-=dt*110;return false}if(!e.ready){e.ready=true;if(e.mainBoss)buzz([200,60,200,60,360],true);if(say)bossSay(e,say,2)}return true}
function bigTick(e,dt){if(e.say&&(e.say.t+=dt)>e.say.d)e.say=null;if(e.fx>0)e.fx-=dt;if(e.stun>0)e.stun-=dt;
  if(e.parts)for(const p of e.parts){if(p.flash>0)p.flash-=dt;const [dx,dy]=upo(p.ox*e.k,p.oy*e.k);p.x=e.x+dx;p.y=e.y+dy}
  if(e.arm)e.armor=e.arm.map(q=>{const [dx,dy]=upo(q[0]*e.k,q[1]*e.k);return {x:e.x+dx,y:e.y+dy,r:q[2]*e.k}})}
const bigY=(e,dt,amp,sp)=>{e.y=lerp(e.y,190+Math.sin(e.t*(sp||.8))*(amp??70),dt*2)};
const ptOf=(e,i)=>e.parts[i];
// 弱点の光る輪（絵の上。drawEnemy の中＝たては立てた向きで描く）
function drawWeak(e,p,col){if(!p.alive||p.lock)return;const x=e.x+p.ox*e.k,y=e.y+p.oy*e.k,r=p.r+4+Math.sin(e.t*8)*2;ctx.globalAlpha=.55+.35*Math.sin(e.t*8);ctx.lineWidth=3;ctx.strokeStyle=p.flash>0?'#fff':(col||C.butter);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.globalAlpha=1}
function drawBroken(e,p){if(p.alive)return;const x=e.x+p.ox*e.k,y=e.y+p.oy*e.k;ctx.fillStyle='rgba(42,20,64,.75)';ctx.beginPath();ctx.arc(x,y,p.r*.9,0,TAU);ctx.fill();if(Math.floor(e.t*8)%2){ctx.fillStyle=C.butter;ctx.fillRect(x+rand(-p.r,p.r)*.6,y+rand(-p.r,p.r)*.6,3,3)}}
// 吹き出し：よこは左（てんてんの側）、たてはボスの下
function bigSay(e){if(!e.say)return;ctx.globalAlpha=clamp(Math.min(e.say.t*6,(e.say.d-e.say.t)*4),0,1);const w=bubbleW(e.say.text,13);
  if(VIEW.mode==='tate'){const dx=clamp(e.y,SA.l+6+w/2,VIEW.sw-SA.r-6-w/2)-e.y;bubble(e.say.text,e.x+dx,e.y+e.bh*e.k*.62+16,13)}
  else bubble(e.say.text,e.x-(e.bw*e.k*.82+w/2),e.y-e.bh*e.k*.35,13,'r');ctx.globalAlpha=1}
function bigBody(e,fl,o){o=o||{};ctx.save();if(e.charge>0||o.shake)ctx.translate(rand(-1.6,1.6),rand(-1.2,1.2));if(e.fx>0){const s=1+e.fx*.18;ctx.translate(e.x,e.y);ctx.scale(s,1-(s-1)*.45);ctx.translate(-e.x,-e.y)}
  drawBig(o.art||e.art,e.x,e.y+(o.dy||0),e.k,fl,o.rot,o.alpha);ctx.restore()}
// 小ボスの共通：たおすとステージの点（スコアは E の score）
// ---- 予告つきの攻撃：点線（warn 秒）→ 雷・ビーム（on 秒）。kind 'v'＝たての柱（x の位置）、'h'＝横の帯（y の位置、x0 より左）
function hzAdd(o){const h=Object.assign({t:0,warn:1,on:.45,w:30,kind:'v'},o);(G.st.hz=G.st.hz||[]).push(h);sfxG(h.kind==='v'?'bWarnV':'bLock',.25);return h}
function hzUpdate(dt){const L=G.st.hz;if(!L||!L.length)return;const P=G.player,px=P.x+2,py=P.y+8;
  for(const h of L){const was=h.t;h.t+=dt;if(was<h.warn&&h.t>=h.warn){sfxG(h.kind==='v'?'bThunder':'bBeam',.15);buzz(h.kind==='v'?60:[200],true);if(h.kind==='v')G.st.flashT=.16;if(h.onFire)h.onFire(h)}
    if(h.t>=h.warn&&h.t<h.warn+h.on){const hit=h.kind==='v'?Math.abs(px-h.x)<h.w/2+G.D.hit*.5:Math.abs(py-h.y)<h.w/2+G.D.hit*.5&&px<(h.x0??W);if(hit)hurt()}}
  G.st.hz=L.filter(h=>h.t<h.warn+h.on)}
function hzDraw(){for(const h of G.st.hz||[]){const on=h.t>=h.warn,bl=Math.floor(h.t*10)%2;
  if(h.kind==='v'){if(!on){if(bl){ctx.fillStyle=C.butter;for(let y=0;y<H;y+=18)ctx.fillRect(h.x-2,y,4,10)}}
    else{const k=clamp(1-(h.t-h.warn)/h.on,0,1);ctx.globalAlpha=.35*k;ctx.fillStyle=C.butter;ctx.fillRect(h.x-h.w,0,h.w*2,H);ctx.globalAlpha=1;
      ctx.beginPath();let y=0;ctx.moveTo(h.x,0);while(y<H){y+=24;ctx.lineTo(h.x+((Math.floor(y/24)+Math.floor(G.time*24))%2?9:-9),y)}ctx.lineWidth=9;ctx.strokeStyle=C.plum;ctx.stroke();ctx.lineWidth=5;ctx.strokeStyle=C.cream;ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle=C.butter;ctx.stroke()}}
  else{const x1=h.x0??W;if(!on){if(bl){ctx.fillStyle=h.col||C.red;for(let x=0;x<x1;x+=18)ctx.fillRect(x,h.y-2,10,4)}}
    else{ctx.globalAlpha=.9;ctx.fillStyle=C.plum;ctx.fillRect(0,h.y-h.w/2-3,x1,h.w+6);ctx.fillStyle=h.col||C.blue;ctx.fillRect(0,h.y-h.w/2,x1,h.w);ctx.fillStyle='#fff';ctx.fillRect(0,h.y-h.w/6,x1,h.w/3);ctx.globalAlpha=1}}}}
// ---- 暗さ（てんてんのまわりだけ少し明るい）・吸いこみ
function darkDraw(a){if(!(a>.02))return;const P=G.player,g=ctx.createRadialGradient(P.x,P.y,36,P.x,P.y,230);g.addColorStop(0,`rgba(10,6,24,${(a*.2).toFixed(3)})`);g.addColorStop(1,`rgba(10,6,24,${a.toFixed(3)})`);ctx.fillStyle=g;ctx.fillRect(-20,-20,W+40,H+40)}
function pullTo(x,y,str,dt,range){const P=G.player,dx=x-P.x,dy=y-P.y,d=Math.hypot(dx,dy);if(d<6||(range&&d>range))return 0;const f=str*(range?1-d/range:1)*dt,bd=bounds();P.x=clamp(P.x+dx/d*f,bd.x0,bd.x1);P.y=clamp(P.y+dy/d*f,bd.y0,bd.y1);return f}
// ---- ステージの共通の毎フレーム（STG の update の前）と、描く順（暗さ → 予告・雷 → ピカッ）
function rageTick(dt){const b=G.boss;if(!b||b.dead||!b.ready||!b.mainBoss||G.stage<3||G.phase!=='boss')return;
  if(!b.rage&&b.hp<b.maxhp*.4){b.rage=1;b.rgT=1.2;bossSay(b,'ほんきモード！',1.4);sfx('bRage');G.shake=.5;buzz([120,60,120],true)}
  if(b.rage){b.rgT-=dt;if(b.rgT<=0){b.rgT=Math.max(1.5,3.4-.2*(G.stage-3))*rkFire();const n=8+G.stage,o=rand(0,TAU);for(let i=0;i<n;i++)fire(b.x,b.y,o+i*TAU/n,90+G.stage*4,'orb');sfx('bRing')}}}
function stCommon(dt){hzUpdate(dt);rageTick(dt);if(G.st.flashT>0)G.st.flashT-=dt;if(G.noFire>0)G.noFire-=dt}
function stCommonDraw(){{const b=G.boss;if(b&&b.rage&&!b.dead){const r=b.r*1.9+Math.sin(G.time*8)*6;const g=ctx.createRadialGradient(b.x,b.y,r*.4,b.x,b.y,r);g.addColorStop(0,'rgba(255,62,127,0)');g.addColorStop(.75,'rgba(255,62,127,.16)');g.addColorStop(1,'rgba(255,62,127,0)');ctx.fillStyle=g;ctx.fillRect(b.x-r,b.y-r,r*2,r*2)}}   // ほんきモード：赤く光る
  hzDraw();if(G.st.flashT>0){ctx.fillStyle=`rgba(255,250,230,${(G.st.flashT*2.6).toFixed(3)})`;ctx.fillRect(-20,-20,W+40,H+40)}}
// 図鑑：大きいキャラの絵
const zkBigPic=id=>{const b=bigCv(id),q=b.box,c=document.createElement('canvas');c.width=q.w;c.height=q.h;c.getContext('2d').drawImage(b.img,q.x,q.y,q.w,q.h,0,0,q.w,q.h);return {src:c.toDataURL(),w:120,h:Math.round(120*q.h/q.w)}};
// 図鑑：かたい石（ドット絵がない敵）の絵
function zkRock(x,W,H,t,green){x.save();x.translate(W/2,H/2);x.rotate(t*.6);const r=Math.min(W,H)*.32;if(green){x.globalAlpha=.35;x.fillStyle=C.green;x.beginPath();x.arc(0,0,r*1.3,0,TAU);x.fill();x.globalAlpha=1}
  x.fillStyle=C.plum;x.beginPath();for(let i=0;i<10;i++){const a=i*TAU/10,q=r*(i%2?.85:1.08);x.lineTo(Math.cos(a)*q,Math.sin(a)*q)}x.closePath();x.fill();x.fillStyle=green?'#5E8A6A':'#8C84A8';x.beginPath();for(let i=0;i<10;i++){const a=i*TAU/10,q=r*(i%2?.72:.92);x.lineTo(Math.cos(a)*q,Math.sin(a)*q)}x.closePath();x.fill();
  x.fillStyle='rgba(42,20,64,.3)';x.beginPath();x.arc(-r*.25,-r*.2,r*.22,0,TAU);x.arc(r*.3,r*.28,r*.15,0,TAU);x.fill();x.restore()}

// ===== ステージ3 かみなり雲（夜のはじまり）：ビリビリ（たおすと2つに分かれる）・テイデン（近いと暗くなる）・落雷の予告、小ボス ブレーカー番長、ボス ゴロゴロ・サージ
function biriE(y,x,small){return E({type:'biri',x:x??W+30,y,by:y,hp:small?1:hpS(3),score:small?20:40,exp:small?1:2,r:small?10:16,small,vx:small?-rand(190,240):-72,vy:0,life:small?2.2:99,onKill:small?null:biriSplit})}
function biriSplit(e){for(const s of [-1,1]){const m=biriE(e.y,e.x,true);m.vy=s*rand(70,110);m.t=.1}}
ST_UPD.biri=(e,dt)=>{e.x+=e.vx*dt;if(e.small){e.y+=e.vy*dt;e.vy*=Math.pow(.4,dt);e.life-=dt;if(e.life<=0){e.gone=true;burst(e.x,e.y,4,C.butter)}}
  else{e.y=e.by+Math.sin(e.t*2.2)*26;shootT(e,dt,2.8,e=>fire(e.x-10,e.y,aim(e.x,e.y),130,'bolt'))}off(e)};
ST_DRAW.biri=(e,fl)=>{const k=e.small?.6:1,j=Math.random()<.35?rand(-1.5,1.5):0;sprK(SPR.biri[0],e.x+j,e.y,k,fl);if(Math.floor(e.t*12)%3===0){ctx.fillStyle=C.butter;ctx.fillRect(e.x+rand(-16,16)*k,e.y+rand(-16,16)*k,3,3)}};
function teidenE(y){return E({type:'teiden',x:W+30,y,by:y,hp:hpS(4),score:60,exp:3,r:16})}
ST_UPD.teiden=(e,dt)=>{e.x-=(e.x>W*.64?80:22)*dt;e.y=e.by+Math.sin(e.t*1.3)*40;shootT(e,dt,3.2,e=>fire(e.x-10,e.y,aim(e.x,e.y),110,'orb'));off(e)};
ST_DRAW.teiden=(e,fl)=>{ctx.globalAlpha=.8+.2*Math.sin(e.t*5);spr(SPR.teiden[0],e.x,e.y,fl);ctx.globalAlpha=1};
// 小ボス：ブレーカー番長。まん中の赤いスイッチだけ弾が効く。体力が 1/3 減るたびにスイッチが落ちて、しばらく動けない
ST_UPD.breaker=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'電気は わたさん！'))return;
  const q=e.hp/e.maxhp,stg=q<1/3?2:q<2/3?1:0;if(stg>(e.stg||0)){e.stg=stg;e.stun=2.6;bossSay(e,'ガチャン！ て、停電…',1.6);sfx('boom');buzz([60,40,60],true);G.st.flashT=.1}
  if(e.stun>0){e.y=lerp(e.y,e.y+1,dt);return}bigY(e,dt,74,.9);
  e.atk-=dt;if(e.atk<=0){e.pat=(e.pat+1)%3;e.atk=2.1*rkFire();const sw=ptOf(e,0);
    if(e.pat===0){const a=aim(sw.x,sw.y);for(const d of [-.22,0,.22])fire(sw.x-10,sw.y,a+d,150,'bolt');e.fx=.2;sfx('bZap')}
    else if(e.pat===1){bossSay(e,'ビリビリ〜！',.9);for(let i=0;i<10;i++)fire(e.x,e.y,i*TAU/10+e.t,120,'bolt');e.fx=.3;sfx('bRing');sfx('bZap')}
    else{biriE(e.y-50,e.x-40);biriE(e.y+50,e.x-40);sfx('bOpen')}}};
ST_DRAW.breaker=(e,fl)=>{const st=e.stun>0;bigBody(e,fl,{shake:st&&Math.random()<.5});const sw=ptOf(e,0),x=e.x+sw.ox*e.k,y=e.y+sw.oy*e.k;
  if(st){const k=e.k;ctx.fillStyle=C.plum;ctx.fillRect(x-8*k,e.y+12*k,16*k,30*k);ctx.fillStyle=C.red;ctx.fillRect(x-6*k,e.y+31*k,12*k,11*k);   // スイッチが いちばん下まで落ちる（絵のまん中のスイッチの溝にぴったり）
   for(let i=0;i<2;i++)T('z',e.x+30+i*14,e.y-70-((e.t*30+i*12)%24),14,C.cream,'dot','center',false)}
  else drawWeak(e,sw,C.red);bigSay(e)};
// ボス：ゴロゴロ・サージ（雷雲＋コンセント）。点線の予告のあとに雷。下のプラグを撃つと電気がもれて弱る（それまで雲はかたい）
function surgePart(e,p){if(p.k==='plug'){burst(p.x,p.y,20,C.butter);sfx('boom');ptOf(e,1).def=1;bossSay(e,'ビリビリ… 電気が もれる〜！',1.8);addScore(800,p.x,p.y-20)}}
ST_UPD.surge=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'ゴロゴロ…ドーン！'))return;e.y=lerp(e.y,165+Math.sin(e.t*.7)*45,dt*2);/* 下のプラグが BOOST のボタンにかからない高さ */const weak=!ptOf(e,0).alive;
  if(weak&&Math.random()<dt*6)burst(ptOf(e,0).x,ptOf(e,0).y,2,C.butter);
  e.atk-=dt;if(e.atk<=0){e.pat=(e.pat+1)%3;e.atk=(weak?2.6:2.1)*rkFire();
    if(e.pat===0){bossSay(e,'ゴロゴロ…',1);sfx('bChg');const n=G.rk>.5?3:2;for(let i=0;i<n;i++)hzAdd({kind:'v',x:clamp(G.player.x+(i-(n-1)/2)*110+rand(-14,14),50,W-120),warn:1.15+i*.12,on:.4,w:34})}
    else if(e.pat===1){e.rain=7;e.rainT=0;e.fx=.2;sfx('bZap')}
    else{e.charge=.9;bossSay(e,'ためて…',.8);sfx('bChg')}}
  if(e.rain>0){e.rainT-=dt;if(e.rainT<=0){e.rainT=.11;e.rain--;sfxG('bSpray',.08);fire(e.x-40+rand(-30,30),e.y+40,aim(e.x,e.y)+rand(-.5,.5),140,'bolt')}}   // 雲から雷のつぶ
  if(e.charge>0){e.charge-=dt;if(e.charge<=0){hzAdd({kind:'h',y:G.player.y,x0:e.x-60,warn:.75,on:.6,w:30,col:C.butter});e.fx=.3}}};
ST_DRAW.surge=(e,fl)=>{bigBody(e,fl);const pl=ptOf(e,0);if(pl.alive)drawWeak(e,pl,C.butter);else drawBroken(e,pl);if(!pl.alive)drawWeak(e,ptOf(e,1),C.pink);bigSay(e)};
STG[3]={
  intro:{peek:['biri','teiden'],c1:'カラマリ・コードを ほどいた！',c2:'あたりが暗くなってきた… ゴロゴロ鳴ってる！',sub:'夜のはじまりの 雷雲',sky:['#1B1240','#3A2A70','#6B4FA0']},
  bg:{
    sky(x,W,H){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#140C30');g.addColorStop(.5,'#2E2160');g.addColorStop(1,'#5B3F8E');x.fillStyle=g;x.fillRect(0,0,W,H);
      x.fillStyle=C.cream;for(let i=0;i<14;i++){x.globalAlpha=.25+((i*7)%5)/12;x.fillRect((i*157)%W,(i*53)%110+10,2,2)}x.globalAlpha=1},
    far(x,w,h){x.fillStyle='#3A2A70';for(let i=0;i<8;i++){const cx=i*58+((i*31)%18),r=38+((i*29)%20);x.beginPath();x.arc(cx,h-6,r,0,TAU);x.fill()}x.fillRect(0,h-22,w,22);
      x.fillStyle='#4A3A80';for(let i=0;i<6;i++){x.beginPath();x.arc(i*74+20,h-18,26,0,TAU);x.fill()}},
    near(x,w,h){const cols=['#2A1C58','#352670'];for(let i=0;i<8;i++){x.fillStyle=cols[i%2];const cx=i*60+((i*23)%24),r=42+((i*41)%22);x.beginPath();x.arc(cx,h-2+((i*13)%10),r,0,TAU);x.fill()}x.fillStyle=cols[0];x.fillRect(0,h-28,w,28)},
    mid(W,H){ctx.strokeStyle='rgba(185,164,255,.32)';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<46;i++){const x=((i*97-G.time*260)%(W+80)+W+80)%(W+80)-40,y=((i*61+G.time*520)%(H+40))-20;ctx.moveTo(x,y);ctx.lineTo(x-7,y+16)}ctx.stroke();   // ななめの細い雨
      if((G.time%7)<.12){ctx.fillStyle='rgba(255,243,214,.18)';ctx.fillRect(0,0,W,H)}},   // 遠くの稲光
    skyP(x,w,h){const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2E2160');g.addColorStop(1,'#140C30');x.fillStyle=g;x.fillRect(0,0,w,h)},
    midP(w,h){const s=SPR.cloud&&SPR.cloud[0];if(s){ctx.globalAlpha=.32;for(let i=0;i<5;i++){const y=((G.scroll*.9+i*(h+200)/5)%(h+200))-100,x=[60,300,170,90,330][i],k=3;ctx.drawImage(s.img,x-s.w*k/2,y-s.h*k/2,s.w*k,s.h*k)}ctx.globalAlpha=1}
      ctx.strokeStyle='rgba(185,164,255,.3)';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<40;i++){const x=(i*53)%w,y=((i*71+G.time*600)%(h+40))-20;ctx.moveTo(x,y);ctx.lineTo(x+4,y+14)}ctx.stroke()}
  },
  waves:[[.6,()=>{biriE(120);biriE(260)}],[3,()=>teidenE(190)],[5,()=>{biriE(90);biriE(190);biriE(290)}],[7.5,()=>cloud(300)],[9,()=>{teidenE(110);teidenE(270)}],
    [11.5,()=>{biriE(150);biriE(230)}],[13.5,()=>snake(190,'s3a')],[16,()=>{teidenE(150);biriE(290)}],[18.5,()=>cloud(110)],[20,()=>{biriE(100);biriE(200);biriE(300)}],
    [22.5,()=>teidenE(240)],[24.5,()=>{biriE(130);teidenE(280)}],[27,()=>cloud(200)],[28.5,()=>{biriE(90);biriE(290)}],[31,()=>{teidenE(110);teidenE(200);teidenE(290)}],
    [34,()=>snake(140,'s3b')],[36.5,()=>{biriE(160);biriE(240)}],[38.5,()=>cloud(280)]],
  waveEnd:46,
  rest(){biriE(150);teidenE(250)},
  extra(){if(Math.random()<.6)biriE(rand(90,300));else teidenE(rand(90,300))},
  mid(){return bigE({type:'breaker',art:'breaker',hp:1,score:1500,exp:10,boost:10,k:.95,bw:62,bh:72,name:'ブレーカー番長',parts:[{k:'sw',ox:0,oy:20,r:20,hp:hpS(42)}],arm:[[0,-28,46]]})},
  boss(){return bigE({type:'surge',art:'surge',hp:1,score:8000,mainBoss:true,k:.85,bw:140,bh:110,y:165,name:'ゴロゴロ・サージ',onPart:surgePart,
    parts:[{k:'plug',ox:80,oy:104,r:17,hp:hpS(44)},{k:'core',ox:-4,oy:-4,r:50,hp:hpS(150),def:.3}]})},
  // テイデンが出ているあいだは、だんだん暗くなる（たおすと明るさがもどる）。道中はときどき落雷
  update(dt){const on=G.enemies.some(e=>e.type==='teiden'&&!e.dead&&e.x<W*.92);G.st.dark=clamp((G.st.dark||0)+(on?.12:-.4)*dt,0,.6);
    if(G.phase==='waves'||G.phase==='rest'){G.st.boltT=(G.st.boltT??6)-dt;if(G.st.boltT<=0){G.st.boltT=rand(3.6,5.6)*(1-.3*G.rk);hzAdd({kind:'v',x:clamp(G.player.x+rand(-30,70),60,W-60),warn:1.2,on:.35,w:32})}}},
  fx(){darkDraw(G.st.dark)}
};

// ===== ステージ4 オーロラ成層圏（夜）：ジャミーラ（頭に当てると一気に）・バッファ（止まって回って急に速く）・グルグルの列。オーロラの帯の中はショットが強くなる
//        小ボス パラボラン（点線でねらってビーム）、ボス ヨミコミ大魔王（％が100になると大技）
function jamyE(y,x){return E({type:'jamy',x:x??W+30,y,by:y,hp:hpS(6),score:60,exp:3,r:17,ph:rand(0,TAU),dmgK:(e,s)=>s.x<e.x-2?3:1})}   // 左はしの頭に当てると3倍
ST_UPD.jamy=(e,dt)=>{e.x-=96*dt;e.y=e.by+Math.sin(e.t*3+e.ph)*38;shootT(e,dt,3,e=>fire(e.x-12,e.y,aim(e.x,e.y),125,'orb'));off(e)};
ST_DRAW.jamy=(e,fl)=>{const s=SPR.jamy[0],k=Math.cos(e.t*3+e.ph)*.08;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(k);spr(s,0,0,fl);ctx.restore()};
function buffaE(y){return E({type:'buffa',x:W+30,y,by:y,hp:hpS(4),score:70,exp:3,r:16,st:0,stT:1.6})}
ST_UPD.buffa=(e,dt)=>{e.stT-=dt;if(e.stT<=0){e.st=(e.st+1)%3;e.stT=[1.6,.9,.7][e.st];if(e.st===2){e.ty=G.player.y;sfx('hit')}}
  if(e.st===0)e.x-=80*dt;else if(e.st===2){e.x-=330*dt;e.y=lerp(e.y,e.ty,dt*3)}   // 止まってぐるぐる → 急に速く
  off(e)};
ST_DRAW.buffa=(e,fl)=>{const s=SPR.buffa[0];ctx.save();ctx.translate(e.x,e.y);if(e.st===1)ctx.rotate(e.t*14);spr(s,0,0,fl);ctx.restore();if(e.st===2){ctx.globalAlpha=.4;spr(s,e.x+16,e.y,false);ctx.globalAlpha=1}};
// オーロラの帯：ゆっくり上下にゆれる。中を通った弾は 1.6 倍
const aurY=()=>190+Math.sin(G.time*.35)*95,AUR_H=74;
// 小ボス：パラボラン。てんてんの高さに点線でねらいをつけて、ビーム。点線が出たら上下へにげる
ST_UPD.parabo=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'ねらいを さだめて…'))return;
  if(!e.aimT)e.y=lerp(e.y,clamp(G.player.y,80,300),dt*1.2);
  e.atk-=dt;if(e.atk<=0){e.pat=(e.pat+1)%3;e.atk=2.4*rkFire();
    if(e.pat<2){e.aimT=1.6;hzAdd({kind:'h',y:e.y-6,x0:e.x-50,warn:1.0,on:.55,w:26,col:C.mint,onFire:()=>{e.fx=.3}});bossSay(e,e.pat?'ビーーム！':'ロックオン！',1)}
    else{for(let i=-2;i<=2;i++)fire(e.x-50,e.y-6,aim(e.x,e.y)+i*.2,140,'orb');sfx('bShot')}}
  if(e.aimT>0)e.aimT-=dt};
ST_DRAW.parabo=(e,fl)=>{bigBody(e,fl);const x=e.x-60*e.k,y=e.y-24*e.k;if(Math.floor(e.t*6)%2){ctx.fillStyle=C.red;ctx.beginPath();ctx.arc(x,y,4,0,TAU);ctx.fill()}bigSay(e)};
// ボス：ヨミコミ大魔王（巨大な読み込み中）。まわりの玉をばらまく。まん中の％が100になると大技
ST_UPD.yomikomi=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'読み込み中… しばらく おまちください'))return;bigY(e,dt,56,.6);
  e.pct=Math.min(100,(e.pct||0)+dt*(3.1+2*G.rk)*G.D.fire**-.3);e.seg=(e.seg||0)+dt*8;
  {const p10=Math.floor((e.pct||0)/10);if(p10!==e.p10){e.p10=p10;if(p10>=7&&p10<10)sfx('bPct')}}   // 70% から、10% ごとに ピッ
  if(e.pct>=100&&!e.big){e.big=1.4;bossSay(e,'100%！ ダウンロード完了〜！',1.6);sfx('bChg');buzz([200,80,300],true)}
  if(e.big>0){e.big-=dt;if(e.big<=0){for(let r=0;r<3;r++)for(let i=0;i<16;i++)fire(e.x,e.y,i*TAU/16+r*.2,110+r*35,'orb');snake(clamp(G.player.y,90,300),'yk'+Math.floor(e.t));e.pct=0;e.big=0;e.fx=.4;G.shake=.4;sfx('big');sfx('bRing')}return}
  if(e.spray>0){e.spray-=dt;e.sprT=(e.sprT||0)-dt;if(e.sprT<=0){e.sprT=.12;e.sang=(e.sang||0)+.42;fire(e.x-20,e.y,Math.PI+Math.sin(e.sang)*1.1,150,'orb');sfxG('bSpray',.1)}}
  e.atk-=dt;if(e.atk<=0){e.pat=(e.pat+1)%2;e.atk=2.6*rkFire();if(e.pat===0){e.spray=2;bossSay(e,'ぐるぐる〜',1)}else{const a=aim(e.x,e.y);for(let i=-2;i<=2;i++)fire(e.x-40,e.y,a+i*.17,165,'orb');e.fx=.25;sfx('bShot')}}};
ST_DRAW.yomikomi=(e,fl)=>{bigBody(e,fl,{shake:e.big>0});const k=e.k,i=Math.floor(e.seg||0)%12,a=i*TAU/12;
  ctx.save();ctx.translate(e.x+Math.cos(a)*84*k,e.y+Math.sin(a)*84*k);ctx.rotate(a);rr(-14*k,-10*k,28*k,20*k,8*k);ctx.fillStyle=C.butter;ctx.globalAlpha=.9;ctx.fill();ctx.restore();ctx.globalAlpha=1;   // ぐるぐる回る「読み込み中」
  const p=Math.floor(e.pct||0);T(p+'%',e.x,e.y+38*k,p>=90?20:17,p>=90&&Math.floor(e.t*8)%2?C.red:C.butter,'dot','center',false);bigSay(e)};
STG[4]={
  intro:{peek:['jamy','buffa'],c1:'かみなり雲を ぬけた！',c2:'その先は、オーロラが ゆれる空…',sub:'緑にかがやく 夜の空',sky:['#0B1A3A','#123E5A','#2E8C7A']},
  bg:{
    sky(x,W,H){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#070B24');g.addColorStop(.6,'#0F2A4A');g.addColorStop(1,'#1D4D66');x.fillStyle=g;x.fillRect(0,0,W,H);
      for(let i=0;i<60;i++){x.fillStyle=C.cream;x.globalAlpha=.3+((i*7)%6)/9;const z=i%9?2:3;x.fillRect((i*131)%W,(i*67)%(H-120),z,z)}x.globalAlpha=1;
      const g2=x.createRadialGradient(W/2,H+900,900,W/2,H+900,980);g2.addColorStop(0,'#123A5A');g2.addColorStop(.92,'#3D86B8');g2.addColorStop(1,'rgba(127,224,255,0)');x.fillStyle=g2;x.beginPath();x.arc(W/2,H+900,980,0,TAU);x.fill()},   // 丸い地平線
    far(x,w,h){x.globalAlpha=.35;x.fillStyle='#7FE0FF';for(let i=0;i<6;i++){x.beginPath();x.ellipse(i*80+30,h-10,46,10,0,0,TAU);x.fill()}x.globalAlpha=1},
    near(x,w,h){x.globalAlpha=.5;x.fillStyle='#BFEFFF';for(let i=0;i<8;i++){x.beginPath();x.ellipse(i*58+((i*23)%20),h-6,40,9,0,0,TAU);x.fill()}x.globalAlpha=1},
    mid(W,H){const y0=aurY();for(let L=0;L<3;L++){ctx.beginPath();for(let x=0;x<=W;x+=24){const y=y0+Math.sin(x*.012+G.time*(.8+L*.3)+L)*14-(L-1)*16;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}
        ctx.lineWidth=AUR_H*(.7-L*.18);ctx.strokeStyle=['rgba(63,191,107,.22)','rgba(51,214,207,.24)','rgba(234,251,248,.18)'][L];ctx.stroke()}},
    skyP(x,w,h){const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#123E5A');g.addColorStop(1,'#070B24');x.fillStyle=g;x.fillRect(0,0,w,h)},
    midP(w,h){for(let i=0;i<40;i++){ctx.fillStyle=C.cream;ctx.globalAlpha=.3+((i*7)%6)/9;ctx.fillRect((i*97)%w,((i*131+G.scroll*1.4)%(h+20))-10,2,2)}ctx.globalAlpha=1}
  },
  waves:[[.6,()=>{jamyE(120);jamyE(260,W+90)}],[3,()=>buffaE(190)],[5,()=>snake(110,'s4a')],[7,()=>{buffaE(100);buffaE(280)}],[9,()=>cloud(200)],
    [10.5,()=>{jamyE(90);jamyE(190,W+70);jamyE(290,W+140)}],[13,()=>snake(270,'s4b')],[15,()=>{buffaE(150);jamyE(250)}],[17.5,()=>snake(190,'s4c')],[19.5,()=>cloud(120)],
    [21,()=>{buffaE(110);buffaE(200);buffaE(290)}],[24,()=>{jamyE(150);jamyE(230,W+80)}],[26.5,()=>{snake(100,'s4d');snake(280,'s4e')}],[29.5,()=>cloud(290)],
    [31,()=>{jamyE(120);buffaE(260)}],[33.5,()=>snake(190,'s4f')],[36,()=>{buffaE(140);buffaE(240)}],[38,()=>{jamyE(100);jamyE(300)}]],
  waveEnd:46,
  rest(){snake(190,'s4r')},
  extra(){const k=Math.random();if(k<.4)jamyE(rand(90,300));else if(k<.75)buffaE(rand(90,300));else snake(rand(100,280),'x'+Math.floor(G.time))},
  mid(){return bigE({type:'parabo',art:'parabo',hp:hpS(80),score:1800,exp:10,boost:10,k:.85,bw:84,bh:84,r:56,name:'パラボラン'})},
  boss(){return bigE({type:'yomikomi',art:'yomikomi',hp:hpS(230),score:9000,mainBoss:true,k:.9,bw:104,bh:104,r:58,name:'ヨミコミ大魔王',pct:0})},
  update(dt){const y=aurY(),P=G.player,inB=Math.abs(P.y-y)<AUR_H/2;
    for(const s of G.shots)if(!s.aur&&Math.abs(s.y-y)<AUR_H/2){s.aur=1;s.dmg*=1.6}
    if(inB&&!G.st.inB&&G.phase!=='clear')pop(P.x,P.y-52,'ショット強化中！',C.mint,12,.9,false);G.st.inB=inB},
  fx(){ctx.fillStyle='rgba(234,251,248,.8)';for(const s of G.shots)if(s.aur&&Math.random()<.5)ctx.fillRect(s.x-8+rand(-6,6),s.y+rand(-8,8),3,3)}
};

// ===== ステージ5 人工衛星の海：スパム衛星（パネルを広げて弾をばらまく）・デブリ（こわせない。スレスレでかわすと +100）、小ボス ハックアーム、ボス ジャミング・サテライト（パネルが弾をふせぐ）
function spamE(y){return E({type:'spamsat',x:W+30,y,by:y,hp:hpS(5),score:80,exp:3,r:20,open:0,st:0,stopX:rand(W*.55,W*.75)})}
ST_UPD.spamsat=(e,dt)=>{if(e.st===0){e.x-=90*dt;if(e.x<e.stopX){e.st=1;e.opT=0}}
  else if(e.st===1){e.open=Math.min(1,e.open+dt*2.4);e.opT+=dt;if(e.opT>.7&&!e.fired){e.fired=1;const a=aim(e.x,e.y),n=G.rk>.5?7:5;for(let i=0;i<n;i++)fire(e.x-14,e.y,a+(i-(n-1)/2)*.2,135,'orb');sfx('hit')}if(e.opT>1.6){e.st=2}}
  else{e.open=Math.max(0,e.open-dt*2);e.x-=120*dt}
  e.y=e.by+Math.sin(e.t*1.4)*12;off(e)};
ST_DRAW.spamsat=(e,fl)=>{const s=SPR.spamsat[0];if(e.open>0){ctx.fillStyle=C.plum;for(const d of [-1,1]){const w=18*e.open;ctx.fillRect(e.x+d*(s.w/2)+(d<0?-w:0),e.y-10,w,20);ctx.fillStyle=C.blue;ctx.fillRect(e.x+d*(s.w/2)+(d<0?-w+2:2),e.y-8,Math.max(0,w-4),16);ctx.fillStyle=C.plum}
    if(Math.floor(e.t*8)%2){ctx.fillStyle=C.pink;rr(e.x-26,e.y-30,52,12,4);ctx.fill();T('SALE!!',e.x,e.y-24,9,C.cream,'dot','center',false)}}spr(s,e.x,e.y,fl)};
function debriE(y,sp){return E({type:'debri',x:W+40,y,hp:999,score:0,exp:0,boost:0,r:16,solid:true,side:true,vx:-(sp||rand(120,170)),vy:rand(-20,20),rot:rand(-2,2)})}
ST_UPD.debri=(e,dt)=>{e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.y<40||e.y>H-40)e.vy*=-1;off(e)};
ST_DRAW.debri=(e,fl)=>{ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.t*e.rot);sprK(SPR.debri[0],0,0,1.3,false);ctx.restore()};
// 小ボス：ハックアーム。てんてんをつかみに、うでをのばしてくる。先の赤い目が弱点
ST_UPD.arm=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'つかまえて やる〜！'))return;
  if(e.lunge>0){e.lunge-=dt;const P=G.player;e.x=lerp(e.x,e.lx,dt*(e.lunge>.7?3.2:1.6));e.y=lerp(e.y,e.ly,dt*3);if(e.lunge<=0)e.back=1}
  else if(e.back){e.x=lerp(e.x,bigStop(e),dt*2.2);if(Math.abs(e.x-bigStop(e))<4)e.back=0}else bigY(e,dt,70,.9);
  e.atk-=dt;if(e.atk<=0&&!(e.lunge>0)&&!e.back){e.pat=(e.pat+1)%2;e.atk=2.4*rkFire();const eye=ptOf(e,0);
    if(e.pat===0){e.lunge=1.4;const [dx,dy]=upo(-52*e.k,-28*e.k);e.lx=G.player.x-dx+26;e.ly=clamp(G.player.y-dy,60,330);bossSay(e,'ガシッ！',.9);sfx('bLunge')}   // つかみに来る
    else{for(const d of [-.25,0,.25])fire(eye.x-8,eye.y,aim(eye.x,eye.y)+d,150,'orb');e.fx=.2;sfx('bShot')}}};
ST_DRAW.arm=(e,fl)=>{bigBody(e,fl);drawWeak(e,ptOf(e,0),C.red);bigSay(e)};
// ボス：ジャミング・サテライト。左右のパネルを先にこわすと、まん中が弱点に（それまでは弾をはじく）
function jamPart(e,p){burst(p.x,p.y,24,C.blue);sfx('boom');addScore(600,p.x,p.y-20);const left=e.parts.filter(q=>q.k==='panel'&&q.alive).length;
  bossSay(e,left?'パネルが〜！':'ぜんぶ こわれた〜！ ジャミングできない…',1.6);if(!left){ptOf(e,2).lock=false;e.atkK=.75}}
ST_UPD.jamsat=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'ジジジ… 電波を みだしてやる！'))return;bigY(e,dt,58,.6);
  e.atk-=dt;if(e.atk<=0){e.pat=(e.pat+1)%3;e.atk=2.3*rkFire()*(e.atkK||1);const alive=e.parts.filter(q=>q.k==='panel'&&q.alive),core=ptOf(e,2);
    if(e.pat===0){for(const p of alive.length?alive:[core]){const a=aim(p.x,p.y);for(const d of [-.3,-.1,.1,.3])fire(p.x,p.y,a+d,140,'orb')}sfx('bShot')}
    else if(e.pat===1){for(let i=0;i<14;i++)fire(core.x,core.y,i*TAU/14+e.t*.3,115,'orb');e.fx=.25;sfx('bRing')}
    else{hzAdd({kind:'h',y:G.player.y,x0:core.x-40,warn:.9,on:.5,w:24,col:C.lilac});bossSay(e,'ジャミング・ビーム！',1)}}};
ST_DRAW.jamsat=(e,fl)=>{bigBody(e,fl);for(const p of e.parts){if(p.k==='panel'){if(p.alive)drawWeak(e,p,C.blue);else drawBroken(e,p)}}const c=ptOf(e,2);if(!c.lock)drawWeak(e,c,C.pink);bigSay(e)};
STG[5]={
  intro:{peek:['spamsat','debri'],c1:'オーロラを こえて 宇宙へ！',c2:'人工衛星が あやしい電波を 出している…',sub:'地球を見おろす 宇宙',sky:['#03030C','#0A1030','#1F4A8A']},
  bg:{
    sky(x,W,H){x.fillStyle='#04040E';x.fillRect(0,0,W,H);for(let i=0;i<90;i++){x.fillStyle=C.cream;x.globalAlpha=.25+((i*7)%6)/8;const z=i%11?2:3;x.fillRect((i*137)%W,(i*71)%H,z,z)}x.globalAlpha=1;
      const R=900,cy=H+R-120,g=x.createRadialGradient(W*.5,cy,R-60,W*.5,cy,R+30);g.addColorStop(0,'#0B1A3C');g.addColorStop(.93,'#1E5AA8');g.addColorStop(.97,'#7FE0FF');g.addColorStop(1,'rgba(127,224,255,0)');x.fillStyle=g;x.beginPath();x.arc(W*.5,cy,R+30,0,TAU);x.fill();   // 夜の地球（青いふち）
      x.fillStyle='rgba(255,224,102,.8)';for(let i=0;i<70;i++){const px=(i*97)%W,py=H-((i*37)%90)-6;if(Math.hypot(px-W*.5,py-cy)<R-8)x.fillRect(px,py,2,2)}},   // 街のあかり
    far(x,w,h){x.fillStyle='rgba(255,224,102,.5)';for(let i=0;i<20;i++)x.fillRect((i*53)%w,h-((i*29)%40)-4,2,2)},
    near(x,w,h){},
    mid(W,H){},
    skyP(x,w,h){x.fillStyle='#0B1A3C';x.fillRect(0,0,w,h)},
    midP(w,h){for(let i=0;i<60;i++){const y=((i*91+G.scroll*.6)%(h+20))-10;ctx.fillStyle=i%5?'rgba(255,224,102,.75)':'rgba(127,224,255,.6)';ctx.fillRect((i*67)%w,y,2,2)}   // 下に見える夜の地球の街あかり
      for(let i=0;i<4;i++){const y=((i*260+G.scroll*.3)%(h+300))-150;ctx.globalAlpha=.18;ctx.fillStyle='#EAFBF8';ctx.beginPath();ctx.ellipse((i*131)%w+40,y,90,30,.3,0,TAU);ctx.fill()}ctx.globalAlpha=1}
  },
  waves:[[.6,()=>{spamE(130);spamE(260)}],[3,()=>debriE(190)],[4.5,()=>{debriE(100,140);debriE(290,150)}],[6.5,()=>spamE(200)],[8.5,()=>cloud(110)],
    [10,()=>{debriE(150);debriE(240,190)}],[12,()=>{spamE(100);spamE(290)}],[14.5,()=>{for(let i=0;i<3;i++)debriE(90+i*100,130+i*20)}],[17,()=>spamE(190)],[19,()=>cloud(280)],
    [20.5,()=>{debriE(120);spamE(250)}],[23,()=>{spamE(110);spamE(200);spamE(290)}],[26,()=>{debriE(170,200);debriE(230,170)}],[28,()=>cloud(190)],
    [30,()=>{spamE(140);debriE(270)}],[32.5,()=>{for(let i=0;i<4;i++)debriE(80+i*80,140+(i%2)*40)}],[35,()=>{spamE(120);spamE(260)}],[37.5,()=>debriE(190,210)]],
  waveEnd:46,
  rest(){debriE(140);debriE(250,150)},
  extra(){if(Math.random()<.6)spamE(rand(90,300));else debriE(rand(90,300))},
  mid(){return bigE({type:'arm',art:'arm',hp:1,score:2000,exp:10,boost:10,k:.85,bw:120,bh:90,name:'ハックアーム',parts:[{k:'eye',ox:-52,oy:-28,r:20,hp:hpS(46)}],arm:[[90,62,26],[30,-6,18]]})},
  boss(){return bigE({type:'jamsat',art:'jamsat',hp:1,score:10000,mainBoss:true,k:.78,bw:156,bh:96,name:'ジャミング・サテライト',onPart:jamPart,
    parts:[{k:'panel',ox:-112,oy:0,r:38,hp:hpS(60)},{k:'panel',ox:112,oy:0,r:38,hp:hpS(60)},{k:'core',ox:0,oy:0,r:40,hp:hpS(110),lock:true}]})},
  // デブリをスレスレでかわすと +100
  update(dt){const P=G.player,px=P.x+2,py=P.y+8;for(const e of G.enemies){if(e.type!=='debri'||e.near||e.dead)continue;const d=Math.hypot(e.x-px,e.y-py);
    if(d<G.D.hit+e.r*.75+30&&d>G.D.hit+e.r*.75+2&&P.inv<=0){e.near=1;addScore(100,P.x,P.y-30,false);pop(P.x,P.y-46,'スレスレ +100',C.mint,13,1,true);sfx('item')}}}
};

// ===== ステージ6 月面ステーション（低重力）：ピョンラグ（大きくはねる）・クレーターもぐら（出てきたときだけ当たる）・ラグラグ・はねるいん石
//        小ボス あやつられミルン（たすけると応援に来る）、ボス ケンガイ・ゴースト（アンテナが3本立ったときだけ当たる）
const GROUND=()=>H-58;
// h0＝はじめの高さ。よこは地面からの高さ、たて（上から見る）は大きさで高さを見せる
function pyonE(h0){const t=VIEW.mode==='tate';return E({type:'pyon',x:W+30,by:t?rand(90,300):GROUND()-12,hgt:h0??rand(10,60),vh:rand(40,120),hp:hpS(4),score:70,exp:3,r:16,land:0,y:190})}
ST_UPD.pyon=(e,dt)=>{e.x-=70*dt;e.vh-=150*dt;e.hgt+=e.vh*dt;if(e.land>0)e.land-=dt;   // 月の重力：ふわっと大きくはねる。着地の瞬間に弾
  if(e.hgt<=0){e.hgt=0;e.vh=rand(170,230);e.land=.3;if(e.x<W-30)for(const d of G.rk>.5?[-.3,0,.3]:[0])fire(e.x-8,e.y-8,aim(e.x,e.y)+d,120,'orb')}
  e.y=VIEW.mode==='tate'?e.by+Math.sin(e.t*.8)*24:e.by-e.hgt;off(e)};
ST_DRAW.pyon=(e,fl)=>{const s=SPR.pyon[0],q=e.land>0?.25*(e.land/.3):0,t=VIEW.mode==='tate',z=t?1+e.hgt/240:1;
  if(t){ctx.fillStyle='rgba(42,20,64,.3)';ctx.beginPath();ctx.ellipse(e.x+8,e.y+e.hgt*.25,16,6,0,0,TAU);ctx.fill()}
  ctx.save();ctx.translate(e.x,e.y+s.h/2);ctx.scale((1+q)*z,(1-q)*z);spr(s,0,-s.h/2,fl);ctx.restore()};
function moguraE(x,y){return E({type:'mogura',x:x??W+20,y:y??(VIEW.mode==='tate'?rand(90,300):GROUND()-4),hp:hpS(3),score:90,exp:3,r:16,ph:0,phT:.8,ghost:true})}
ST_UPD.mogura=(e,dt)=>{e.x-=(VIEW.mode==='tate'?40:60)*dt;e.phT-=dt;   // 地面といっしょに流れる。引っこんでいるあいだは当たらない
  if(e.phT<=0){e.ph=(e.ph+1)%3;e.phT=[1.2,1.4,.5][e.ph];if(e.ph===1&&e.x<W-20&&e.x>60){const a=aim(e.x,e.y-10);fire(e.x,e.y-14,a,135,'orb');fire(e.x,e.y-14,a+.25,120,'orb')}}
  e.up=e.ph===0?0:e.ph===1?Math.min(1,(e.up||0)+dt*6):Math.max(0,(e.up||0)-dt*5);e.ghost=e.up<.5;off(e)};
ST_DRAW.mogura=(e,fl)=>{ctx.fillStyle='#4A4560';ctx.beginPath();ctx.ellipse(e.x,e.y+10,26,8,0,0,TAU);ctx.fill();ctx.fillStyle='#2A2440';ctx.beginPath();ctx.ellipse(e.x,e.y+10,18,5,0,0,TAU);ctx.fill();
  if(e.up>0){const s=SPR.mogura[0];ctx.save();ctx.beginPath();ctx.rect(e.x-40,e.y-60,80,70);ctx.clip();spr(s,e.x,e.y+10-s.h*.5-e.up*s.h*.55,fl&&!e.ghost);ctx.restore()}};
function rockE(y){return E({type:'rock',x:W+40,y:y??rand(80,200),vy:rand(-40,40),vx:-rand(80,120),hp:999,score:0,exp:0,boost:0,r:18,solid:true,side:true,rot:rand(-1.5,1.5)})}
ST_UPD.rock=(e,dt)=>{e.x+=e.vx*dt;if(VIEW.mode!=='tate')e.vy+=90*dt;else e.vy*=Math.pow(.6,dt);e.y+=e.vy*dt;if(e.y<30||e.y>H-30)e.vy=-e.vy;if(VIEW.mode!=='tate'&&e.y>GROUND()-16){e.y=GROUND()-16;e.vy=-Math.abs(e.vy)*.92-20;burst(e.x,e.y+14,4,'#C9C2DC')}off(e)};
ST_DRAW.rock=(e,fl)=>{ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.t*e.rot);ctx.fillStyle=C.plum;ctx.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8,r=e.r*(i%2?.86:1.06);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();
  ctx.fillStyle='#8C84A8';ctx.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8,r=e.r*(i%2?.72:.9);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.fillStyle='#6E6890';ctx.beginPath();ctx.arc(-4,-3,5,0,TAU);ctx.arc(6,5,3,0,TAU);ctx.fill();ctx.restore()};
// 小ボス：あやつられミルン。ミル子と同じく、紫のノイズをはらうと正気にもどる
function mirunSaved(e){G.helpers=G.helpers||[];if(!G.helpers.some(h=>h.kind==='mirun'))G.helpers.push({kind:'mirun',wait:3,y:58});G.st.saved={x:e.x,y:e.y,t:0};ayaOut(e,'また おまえか〜！ おぼえてろ〜！')}
ST_UPD.mirun=(e,dt)=>{if(e.say&&(e.say.t+=dt)>e.say.d)e.say=null;if(e.fx>0)e.fx-=dt;
  const stop=W-(VIEW.mode==='tate'?SA.t+170:roomy()<.7?120:150);if(e.x>stop){e.x-=dt*90;return}
  if(!e.ready){e.ready=true;bossSay(e,'ピ…ピピ…ルン…',1.8)}
  e.y=190+Math.sin(e.t*.9)*90;e.shotT-=dt;e.sp=(e.sp||0)+dt*2.6;
  if(e.shotT<=0){e.shotT=.16*rkFire();fire(e.x-30,e.y,Math.PI+Math.sin(e.sp)*.9,125,'orb');sfxG('bSpray',.12);e.n=(e.n||0)+1;if(e.n%14===0){e.shotT=1.4;const a=aim(e.x,e.y);for(const d of [-.2,0,.2])fire(e.x-30,e.y,a+d,160,'orb');sfx('bShot')}}
  if(e.hp<e.maxhp*.4&&!e.saidW){e.saidW=true;bossSay(e,'あれ…？ ぼく、なにを…',1.8)}};
ST_DRAW.mirun=(e,fl)=>{const im=IMG.mirun;if(!im)return;const h=104,w=h*im.naturalWidth/im.naturalHeight;drawPossessed(im,e.x,e.y,w,h,e.t,fl,e.hp/e.maxhp);if(e.say)bossBubble(e)};
// ボス：ケンガイ・ゴースト。アンテナが「圏外」のあいだは消えて当たらない。3本立った瞬間がチャンス
ST_UPD.kengai=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'ここは 圏外だよ〜 ふふふ'))return;
  e.barT=(e.barT??2)-dt;if(e.barT<=0){e.bars=((e.bars||0)+1)%4;e.barT=[2.0,.6,.6,3.0][e.bars]*(e.hp<e.maxhp*.4?.85:1);if(e.bars===3){sfx('bAppear');bossSay(e,'あっ、電波が…！',1)}if(e.bars===0){e.ty=rand(90,300);sfx('bWarp')}}
  e.ghost=e.bars!==3;e.vis=lerp(e.vis??1,[.12,.35,.6,1][e.bars||0],dt*6);e.y=lerp(e.y,e.ty??190,dt*1.4)+Math.sin(e.t*2)*.6;
  e.atk-=dt;if(e.atk<=0){e.atk=(e.bars===3?1.3:2)*rkFire();
    if(e.bars===3){const a=aim(e.x,e.y);for(const d of [-.24,0,.24])fire(e.x-50,e.y,a+d,160,'orb');sfx('bShot')}
    else{const n=G.rk>.5?10:8;for(let i=0;i<n;i++)fire(e.x,e.y,i*TAU/n+e.t,95,'orb');sfx('bRing')}}};
ST_DRAW.kengai=(e,fl)=>{bigBody(e,fl&&!e.ghost,{alpha:e.vis??1});const k=e.k;
  for(let i=0;i<3;i++){ctx.fillStyle=i<(e.bars||0)?C.butter:'rgba(42,20,64,.35)';ctx.fillRect(e.x+(-18+i*14)*k,e.y+(-96-i*8)*k,10*k,(10+i*8)*k)}
  if(!e.bars){ctx.globalAlpha=.6+.4*Math.sin(e.t*6);T('圏外',e.x+38*k,e.y-88*k,13,C.red,'body','center',false);ctx.globalAlpha=1}
  if(e.bars===3){ctx.globalAlpha=.5+.4*Math.sin(e.t*10);ctx.lineWidth=3;ctx.strokeStyle=C.butter;ctx.beginPath();ctx.arc(e.x,e.y,74*k,0,TAU);ctx.stroke();ctx.globalAlpha=1}bigSay(e)};
STG[6]={
  intro:{peek:['pyon','mogura'],c1:'衛星の電波が もとにもどった！',c2:'つぎは 月だ！ だれかの声がする…',sub:'月面の ドーム基地',sky:['#05050F','#141430','#3A3A5A']},
  bg:{
    sky(x,W,H){x.fillStyle='#06061A';x.fillRect(0,0,W,H);for(let i=0;i<80;i++){x.fillStyle=C.cream;x.globalAlpha=.25+((i*7)%6)/8;x.fillRect((i*137)%W,(i*71)%(H-80),2,2)}x.globalAlpha=1;
      const ex=W*.8,ey=80,g=x.createRadialGradient(ex-10,ey-10,6,ex,ey,46);g.addColorStop(0,'#7FC0FF');g.addColorStop(1,'#1E5AA8');x.fillStyle=g;x.beginPath();x.arc(ex,ey,42,0,TAU);x.fill();   // 青い地球
      x.fillStyle='rgba(63,191,107,.85)';x.beginPath();x.ellipse(ex-12,ey-6,14,9,.5,0,TAU);x.ellipse(ex+14,ey+12,10,7,-.4,0,TAU);x.fill();x.strokeStyle='rgba(127,224,255,.5)';x.lineWidth=4;x.beginPath();x.arc(ex,ey,46,0,TAU);x.stroke()},
    far(x,w,h){x.fillStyle='#4A4560';x.beginPath();x.moveTo(0,h);for(let i=0;i<=8;i++)x.lineTo(i*55,h-30-((i*37)%26));x.lineTo(w,h);x.fill();
      for(const [dx,r] of [[120,34],[300,24]]){x.fillStyle='#C9C2DC';x.beginPath();x.arc(dx,h-24,r,Math.PI,0);x.fill();x.fillStyle='rgba(127,224,255,.55)';x.beginPath();x.arc(dx,h-24,r-6,Math.PI,0);x.fill();x.fillStyle='#FFE066';x.fillRect(dx-3,h-24-r-10,2,10)}},   // ドームの基地
    near(x,w,h){x.fillStyle='#8C84A8';x.fillRect(0,h-56,w,56);x.fillStyle='#A9A2C4';x.fillRect(0,h-56,w,6);
      for(let i=0;i<6;i++){const cx=i*72+((i*31)%30)+20,cy=h-30+((i*13)%14);x.fillStyle='#6E6890';x.beginPath();x.ellipse(cx,cy,24-(i%3)*5,7,0,0,TAU);x.fill();x.fillStyle='#5A5478';x.beginPath();x.ellipse(cx,cy+1,16-(i%3)*4,4,0,0,TAU);x.fill()}},   // 灰色の月面とクレーター
    mid(W,H){},
    skyP(x,w,h){x.fillStyle='#8C84A8';x.fillRect(0,0,w,h)},
    midP(w,h){for(let i=0;i<9;i++){const y=((i*167+G.scroll*1.0)%(h+120))-60,cx=(i*113)%w+20,r=18+(i%4)*9;ctx.fillStyle='#6E6890';ctx.beginPath();ctx.arc(cx,y,r,0,TAU);ctx.fill();ctx.fillStyle='#5A5478';ctx.beginPath();ctx.arc(cx+3,y+3,r*.7,0,TAU);ctx.fill()}}   // 上から見たクレーター
  },
  waves:[[.6,()=>{pyonE();pyonE(80)}],[3,()=>moguraE()],[4.5,()=>rockE(120)],[6,()=>{lagE();pyonE()}],[8.5,()=>{moguraE();moguraE(W+120)}],[10,()=>cloud(120)],
    [11.5,()=>{pyonE();pyonE(50);pyonE(110)}],[14,()=>{rockE(100);rockE(200)}],[16,()=>{lagE();lagE()}],[18,()=>moguraE()],[19.5,()=>cloud(200)],
    [21,()=>{pyonE();moguraE(W+80)}],[23.5,()=>{rockE(150);lagE()}],[26,()=>{pyonE();pyonE(90)}],[28.5,()=>{moguraE();moguraE(W+100);moguraE(W+200)}],
    [31,()=>cloud(150)],[32.5,()=>{lagE();rockE(120)}],[35,()=>{pyonE();pyonE(70)}],[37.5,()=>moguraE()]],
  waveEnd:46,
  rest(){pyonE();rockE(150)},
  extra(){const k=Math.random();if(k<.4)pyonE();else if(k<.7)moguraE();else lagE()},
  mid(){return E({type:'mirun',x:W+90,y:190,hp:hpS(52),score:2000,exp:10,boost:10,r:46,boss:true,name:'あやつられミルン',shotT:2.2,rescue:true,onKill:mirunSaved})},
  boss(){return bigE({type:'kengai',art:'kengai',hp:hpS(150),score:11000,mainBoss:true,k:.85,bw:80,bh:96,r:62,name:'ケンガイ・ゴースト',bars:1,barT:2})},
  update(dt){const s=G.st.saved;if(s){s.t+=dt;if(s.t>4.2)G.st.saved=null}ayaUpdate(dt)},
  fx(){const s=G.st.saved,im=IMG.mirun;if(!s||!im)return;const h=96,w=h*im.naturalWidth/im.naturalHeight,y=s.y-s.t*40;   // たすけたミルンが、お礼を言って空へ
    upright(s.x,y,()=>{ctx.globalAlpha=clamp(4.2-s.t,0,1);ctx.drawImage(im,s.x-w/2,y-h/2,w,h);ctx.globalAlpha=1});if(s.t>1.6&&s.t<3.8)bubble('ありがとう！ ぼくも おうえんするよ！',s.x-60,y-60,12);ayaDraw()}
};

// ===== ステージ7 火星の砂あらし（昼）：ザラザラ（集まると画面がザラザラ）・ジャックローバー（地面を走って上へ撃つ）。ときどき砂あらし
//        小ボス ダストデビル（近いと吸いよせられる）、ボス アカスナ大帝（画面が2つ。2つのチャンネルの攻撃を同時に）
function zaraE(y,x){return E({type:'zarazara',x:x??W+30,y,by:y,hp:hpS(2),score:30,exp:1,r:14,ph:rand(0,TAU)})}
function zaraFlock(y){for(let i=0;i<5;i++)zaraE(y+rand(-30,30),W+30+i*28)}
ST_UPD.zarazara=(e,dt)=>{e.x-=110*dt;e.y=e.by+Math.sin(e.t*4+e.ph)*16+rand(-1,1);off(e)};
ST_DRAW.zarazara=(e,fl)=>{spr(SPR.zarazara[0],e.x+rand(-1,1),e.y,fl)};
function roverE(y){return E({type:'rover',x:W+30,y:y??(VIEW.mode==='tate'?rand(90,300):H-58),hp:hpS(5),score:90,exp:3,r:18})}
ST_UPD.rover=(e,dt)=>{e.x-=(e.x>W*.7?90:45)*dt;shootT(e,dt,1.9,e=>{const a=VIEW.mode==='tate'?aim(e.x,e.y):Math.min(-.35,aim(e.x,e.y-14));fire(e.x-4,e.y-16,a,150,'orb')});off(e)};   // 上に向かって撃つ
ST_DRAW.rover=(e,fl)=>{const b=Math.abs(Math.sin(e.t*12))*1.5;spr(SPR.rover[0],e.x,e.y-b,fl);if(Math.random()<.3){ctx.fillStyle='rgba(194,96,58,.6)';ctx.fillRect(e.x+18+rand(0,10),e.y+10+rand(-3,3),4,4)}};
// 小ボス：ダストデビル（砂のつむじ風）。近くにいると、てんてんが吸いよせられる
ST_UPD.devil=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'ぐるぐる〜 すいこんでやる！'))return;e.y=lerp(e.y,190+Math.sin(e.t*.7)*95,dt*1.5);
  if(pullTo(e.x,e.y,95+60*G.rk,dt,360)>0)sfxG('bSuck',1.1);
  if(Math.hypot(G.player.x-e.x,G.player.y-e.y)<360&&!G.st.pullSaid){G.st.pullSaid=1;pop(G.player.x,G.player.y-50,'すいよせられる〜！',C.coral,12,1,false)}
  e.sp=(e.sp||0)+dt*3;e.shotT=(e.shotT??1)-dt;if(e.shotT<=0){e.shotT=.22*rkFire();for(const s of [0,Math.PI])fire(e.x,e.y,e.sp+s,115,'orb');sfxG('bSpray',.15)}};
ST_DRAW.devil=(e,fl)=>{bigBody(e,fl,{dy:Math.sin(e.t*9)*2});for(let i=0;i<8;i++){const a=e.t*5+i*TAU/8,r=60+((e.t*60+i*20)%60);ctx.fillStyle=i%2?C.coral:'#B5673A';ctx.globalAlpha=.6;ctx.fillRect(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.5,4,4)}ctx.globalAlpha=1;bigSay(e)};
// ボス：アカスナ大帝（スナアラシ大王の兄）。左の画面（おこり顔）は ねらい撃ち、右の画面（ため顔）は まるく。ときどき2つそろってビーム
function akaPart(e,p){burst(p.x,p.y,26,C.coral);sfx('boom');addScore(1000,p.x,p.y-20);if(e.parts.some(q=>q.alive))bossSay(e,'ぐぬぬ… 画面が ひとつに…！',1.6);e.atkK=.7}
ST_UPD.akasuna=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'弟の かたきだ〜！'))return;bigY(e,dt,64,.55);const [L,R]=e.parts,k=e.atkK||1;
  if(L.alive){e.la=(e.la??1.4)-dt;if(e.la<=0){e.la=1.5*rkFire()*k;const a=aim(L.x,L.y);for(const d of [-.2,0,.2])fire(L.x-30,L.y,a+d,165,'orb');sfx('bShot')}}
  if(R.alive){e.ra=(e.ra??2)-dt;if(e.ra<=0){e.ra=2.4*rkFire()*k;const n=G.rk>.5?12:10;for(let i=0;i<n;i++)fire(R.x,R.y,i*TAU/n+e.t,110,'orb');sfx('bRing')}}
  e.bt=(e.bt??6)-dt;if(e.bt<=0){e.bt=7*k;bossSay(e,'ダブル・ビーーム！',1.1);sfx('bChg');for(const q of [L,R])if(q.alive)hzAdd({kind:'h',y:clamp(G.player.y+(q===L?-30:30),50,H-50),x0:e.x-90,warn:1,on:.5,w:24,col:C.coral})}};
ST_DRAW.akasuna=(e,fl)=>{bigBody(e,fl);for(const p of e.parts){if(p.alive)drawWeak(e,p,C.butter);else drawBroken(e,p)}bigSay(e)};
STG[7]={
  intro:{peek:['zarazara','rover'],c1:'ミルンくんも なかまに なった！',c2:'赤い星から、ザラザラの電波が…',sub:'赤い砂の 火星',sky:['#7A3A2A','#C2603A','#E8A070']},
  bg:{
    sky(x,W,H){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#8A4632');g.addColorStop(.6,'#C9714A');g.addColorStop(1,'#E8A070');x.fillStyle=g;x.fillRect(0,0,W,H);
      x.globalAlpha=.55;x.fillStyle='#FFE7C4';x.beginPath();x.arc(W*.7,90,30,0,TAU);x.fill();x.globalAlpha=.2;x.beginPath();x.arc(W*.7,90,52,0,TAU);x.fill();x.globalAlpha=1},   // うすい太陽
    far(x,w,h){x.fillStyle='#A0523A';x.beginPath();x.moveTo(0,h);x.lineTo(0,h-40);x.lineTo(40,h-40);x.lineTo(60,h-70);x.lineTo(130,h-70);x.lineTo(150,h-40);x.lineTo(230,h-36);x.lineTo(250,h-90);x.lineTo(330,h-92);x.lineTo(352,h-44);x.lineTo(w,h-40);x.lineTo(w,h);x.fill();   // けずれた岩山
      x.fillStyle='#8A4632';x.fillRect(60,h-70,70,6);x.fillRect(250,h-92,80,6)},
    near(x,w,h){x.fillStyle='#B5673A';x.beginPath();x.moveTo(0,h);for(let i=0;i<=14;i++)x.lineTo(i*30,h-44+Math.sin(i*1.3)*8);x.lineTo(w,h);x.fill();x.fillStyle='#8A3B1E';for(let i=0;i<12;i++)x.fillRect((i*37)%w,h-20+((i*13)%14),6,4)},
    mid(W,H){},
    skyP(x,w,h){x.fillStyle='#B5673A';x.fillRect(0,0,w,h)},
    midP(w,h){for(let i=0;i<12;i++){const y=((i*137+G.scroll*1.0)%(h+80))-40,cx=(i*89)%w+10;ctx.fillStyle='#8A3B1E';ctx.beginPath();ctx.ellipse(cx,y,10+(i%3)*6,7+(i%2)*3,0,0,TAU);ctx.fill();ctx.fillStyle='#C9714A';ctx.fillRect(cx-4,y-4,4,3)}
      ctx.globalAlpha=.25;ctx.fillStyle='#FFE7C4';for(let i=0;i<30;i++)ctx.fillRect((i*53)%w,((i*71+G.scroll*1.6)%(h+20))-10,3,2);ctx.globalAlpha=1}
  },
  waves:[[.6,()=>zaraFlock(150)],[3,()=>roverE()],[5,()=>zaraFlock(260)],[7,()=>{roverE();roverE(VIEW.mode==='tate'?rand(90,300):undefined)}],[9,()=>cloud(110)],
    [10.5,()=>{zaraFlock(110);zaraFlock(280)}],[13.5,()=>roverE()],[15,()=>zaraFlock(190)],[17.5,()=>{roverE();zaraFlock(120)}],[20,()=>cloud(200)],
    [21.5,()=>{zaraFlock(100);zaraFlock(200);zaraFlock(300)}],[25,()=>{roverE();roverE()}],[27.5,()=>zaraFlock(160)],[29.5,()=>cloud(280)],
    [31,()=>{zaraFlock(240);roverE()}],[34,()=>{zaraFlock(130);zaraFlock(270)}],[37,()=>roverE()]],
  waveEnd:46,
  rest(){zaraFlock(190)},
  extra(){if(Math.random()<.6)zaraFlock(rand(90,300));else roverE()},
  mid(){return bigE({type:'devil',art:'devil',hp:hpS(80),score:2200,exp:10,boost:10,k:.95,bw:56,bh:86,r:52,name:'ダストデビル'})},
  boss(){return bigE({type:'akasuna',art:'akasuna',hp:1,score:12000,mainBoss:true,k:.85,bw:106,bh:110,name:'アカスナ大帝',onPart:akaPart,
    parts:[{k:'L',ox:-47,oy:0,r:34,hp:hpS(110)},{k:'R',ox:47,oy:0,r:34,hp:hpS(110)}]})},
  // ザラザラが集まるほど画面がザラザラ。ときどき砂あらし（しばらくすると晴れる）
  update(dt){G.st.zara=G.enemies.filter(e=>e.type==='zarazara'&&!e.dead&&e.x<W).length;
    G.st.stT=(G.st.stT??12)-dt;if(G.st.stT<=0){if(G.st.storm>0){G.st.storm=0;G.st.stT=rand(12,16)}else{G.st.storm=5;G.st.stT=5;pop(G.player.x,G.player.y-56,'砂あらしで 見えにくい…',C.cream,13,1.4,true)}}
    if(G.st.storm>0)G.st.storm-=dt;G.st.sa=lerp(G.st.sa||0,G.st.storm>0?.5:0,Math.min(1,dt*1.5))},
  fx(){const a=Math.min(.35,(G.st.zara||0)*.035)+(G.st.sa||0);if(a<.02)return;
    ctx.fillStyle=`rgba(181,103,58,${(G.st.sa*.6).toFixed(3)})`;ctx.fillRect(-20,-20,W+40,H+40);
    for(let i=0;i<Math.floor(a*260);i++){ctx.fillStyle=i%3?'rgba(255,231,196,.55)':'rgba(138,59,30,.6)';ctx.fillRect(rand(0,W),rand(0,H),rand(2,5),2)}}
};

// ===== ステージ8 小惑星ベルト：ウイルスター（分かれる）・コピーワーム（どんどん長く。頭をたおすとまとめて消える）・バグッチ（バグを残す）・ポップアップ（弾をふさぐ。×で閉じる）、こわせる小惑星
//        小ボス トロイのもくば（とびらが開くとウイルス）、ボス ポップアップ404（ウィンドウを次々出す。弱点は右上の×）
function virusE(y,x,grp){const sm=!!grp;return E({type:'virus',x:x??W+30,y,by:y,hp:sm?1:hpS(3),score:sm?20:60,exp:sm?1:3,r:sm?10:17,small:sm,grp,vx:sm?-rand(120,170):-80,vy:sm?rand(-70,70):0,onKill:sm?virusBit:virusSplit})}
function virusSplit(e){const g={n:3,k:0};for(let i=0;i<3;i++){const m=virusE(e.y,e.x,g);m.vy=(i-1)*80;m.t=.1}}
function virusBit(e){const g=e.grp;g.k++;if(g.k===g.n){addScore(300,e.x,e.y-20,false);pop(e.x,e.y-30,'ぜんぶ たおした！ +300',C.butter,12,1.1,true)}}   // 分かれたぶんも全部たおすとボーナス
ST_UPD.virus=(e,dt)=>{e.x+=e.vx*dt;if(e.small){e.y+=e.vy*dt;e.vy*=Math.pow(.5,dt)}else{e.y=e.by+Math.sin(e.t*2)*22;shootT(e,dt,3,e=>fire(e.x-10,e.y,aim(e.x,e.y),125,'orb'))}off(e)};
ST_DRAW.virus=(e,fl)=>{ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.sin(e.t*3)*.2);sprK(SPR.virus[0],0,0,e.small?.6:1,fl);ctx.restore()};
// コピーワーム：頭（弱点）のうしろにコピーがふえていく。コピーはかたい（弾をふさぐ）
function copywE(y){const e=E({type:'copyw',x:W+30,y,by:y,hp:1,score:150,exp:4,r:14,segs:2,hist:[],copyT:1.2});e.parts=[{k:'head',r:18,hp:hpS(6),alive:true,x:-999,y:-999}];e.parts[0].maxhp=e.parts[0].hp;partSum(e);e.maxhp=e.hp;e.armor=[];return e}
ST_UPD.copyw=(e,dt)=>{e.x-=85*dt;e.y=e.by+Math.sin(e.t*2.4)*40;e.hist.unshift([e.x,e.y]);if(e.hist.length>90)e.hist.pop();
  e.copyT-=dt;if(e.copyT<=0&&e.segs<8){e.segs++;e.copyT=1.1;if(e.x<W)pop(e.x+20*e.segs,e.y-20,'コピー！',C.mint,10,.6,false)}
  const p=e.parts[0];p.x=e.x;p.y=e.y;if(p.flash>0)p.flash-=dt;e.armor=[];for(let i=1;i<=e.segs;i++){const h=e.hist[Math.min(e.hist.length-1,i*7)];if(h)e.armor.push({x:h[0],y:h[1],r:12})}
  if(e.x<-60-e.segs*30)e.gone=true};
ST_DRAW_RAW.copyw=(e,fl)=>{const s=SPR.copyw[0];for(let i=e.armor.length-1;i>=0;i--){const a=e.armor[i];ctx.globalAlpha=.75;spr(s,a.x,a.y,false);ctx.globalAlpha=1}spr(s,e.x,e.y,e.parts[0].flash>0);
  ctx.globalAlpha=.6+.3*Math.sin(e.t*8);ctx.strokeStyle=C.butter;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,17,0,TAU);ctx.stroke();ctx.globalAlpha=1};
// バグッチ：通ったあとに四角いバグを残す（さわると痛い・しばらくすると消える）
function buggE(y){return E({type:'bugg',x:W+30,y,by:y,hp:hpS(3),score:70,exp:3,r:15,dropT:.3})}
ST_UPD.bugg=(e,dt)=>{e.x-=105*dt;e.y=e.by+Math.sin(e.t*3.2)*44;e.dropT-=dt;if(e.dropT<=0&&e.x<W){e.dropT=.32;(G.st.bits=G.st.bits||[]).push({x:e.x+10,y:e.y,t:0})}off(e)};
ST_DRAW.bugg=(e,fl)=>{spr(SPR.bugg[0],e.x,e.y,fl)};
// ポップアップ：勝手に開いて、てんてんの弾をふさぐ。右上の×を撃つと閉じる
function popupE(x,y,o){const e=E(Object.assign({type:'popup',x:x??W+30,y,hp:1,score:50,exp:1,r:20,k:1.6,bw:30,bh:20,vx:-60,side:true},o||{}));
  e.parts=[{k:'x',ox:12,oy:-8,r:11,hp:1,alive:true,x:-999,y:-999,maxhp:1}];e.arm=[[-7,7,8],[7,7,8]];/* かたいのは下の段だけ（×の高さは あける） */partSum(e);e.maxhp=1;return e}
ST_UPD.popup=(e,dt)=>{if(e.tx!=null){e.x=lerp(e.x,e.tx,dt*2.4);e.y=lerp(e.y,e.ty,dt*2.4);e.tx-=18*dt;if(e.t>8){e.gone=true;burst(e.x,e.y,6,C.lilac)}}else e.x+=e.vx*dt;bigTick(e,dt);if(e.x<-60)e.gone=true};   // ボスが出したウィンドウは、少しずつ近づいてきて、8秒で勝手に閉じる
ST_DRAW.popup=(e,fl)=>{const s=SPR.popup[0];sprK(s,e.x,e.y,e.k,false);const p=e.parts[0];if(p.alive&&Math.floor(e.t*4)%2){ctx.lineWidth=2;ctx.strokeStyle=C.butter;ctx.strokeRect(e.x+(p.ox-6)*e.k,e.y+(p.oy-5)*e.k,12*e.k,10*e.k)}};
// こわせる小惑星（中からメディアか ウイルス）
function rock8E(y,v){return E({type:'rock8',x:W+40,y,hp:hpS(6),score:40,exp:2,r:26,vir:!!v,drop:v?0:1,rot:rand(-1,1),onKill:v?(e=>{virusE(e.y,e.x-10)}):null})}
ST_UPD.rock8=(e,dt)=>{e.x-=70*dt;off(e)};
ST_DRAW.rock8=(e,fl)=>{ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.t*e.rot);if(e.vir){ctx.globalAlpha=.35+.2*Math.sin(e.t*4);ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(0,0,34,0,TAU);ctx.fill();ctx.globalAlpha=1}
  ctx.fillStyle=C.plum;ctx.beginPath();for(let i=0;i<10;i++){const a=i*TAU/10,r=e.r*(i%2?.85:1.08);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();
  ctx.fillStyle=fl?'#fff':(e.vir?'#5E8A6A':'#8C84A8');ctx.beginPath();for(let i=0;i<10;i++){const a=i*TAU/10,r=e.r*(i%2?.72:.92);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(42,20,64,.3)';ctx.beginPath();ctx.arc(-6,-5,6,0,TAU);ctx.arc(8,7,4,0,TAU);ctx.fill();ctx.restore()};
// 小ボス：トロイのもくば。おなかのとびらが開くと、ウイルスが飛び出す（開いているあいだだけ、とびらが弱点）
ST_UPD.troy=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'プレゼントだよ〜 ふふふ'))return;bigY(e,dt,60,.6);const d=ptOf(e,0);
  e.dT=(e.dT??2)-dt;if(e.dT<=0){e.open=!e.open;e.dT=e.open?3.2:1.9;d.lock=!e.open;sfx('bOpen');if(e.open){bossSay(e,'ギィ〜 パカッ！',1);const n=G.rk>.5?2:1;for(let i=0;i<n;i++){const v=virusE(d.y+(i?24:-24),d.x-10,{n:99,k:0});v.t=.1}}}   // 小さいウイルスが飛び出す
  e.atk-=dt;if(e.atk<=0){e.atk=1.7*rkFire();const [dx,dy]=upo(-102*e.k,-92*e.k),ex=e.x+dx,ey=e.y+dy;for(const a of [-.15,.15])fire(ex,ey,aim(ex,ey)+a,150,'orb');sfx('bShot')}};
ST_DRAW.troy=(e,fl)=>{bigBody(e,fl);const k=e.k,d=ptOf(e,0);if(!e.open){ctx.fillStyle='#E8A33D';ctx.fillRect(e.x-44*k,e.y-20*k,52*k,36*k);ctx.strokeStyle=C.plum;ctx.lineWidth=3;ctx.strokeRect(e.x-44*k,e.y-20*k,52*k,36*k);ctx.strokeStyle='#C27E2A';ctx.lineWidth=2;for(const gy of [-8,4]){ctx.beginPath();ctx.moveTo(e.x-42*k,e.y+gy*k);ctx.lineTo(e.x+6*k,e.y+gy*k);ctx.stroke()}}
  else drawWeak(e,d,C.green);bigSay(e)};
// ボス：ポップアップ404。小さなウィンドウを次々出して弾をふさぐ。弱点は右上の×
const ERR_TX=['ﾂﾅｶﾞﾘﾏｾﾝ','ﾖﾐｺﾐﾁｭｳ','エラー','404'];
function errBeep(){tone({f:880,dur:.07,type:'square',vol:.03});setTimeout(()=>tone({f:440,dur:.12,type:'square',vol:.03}),80)}
// 小さなウィンドウ：初期案と同じく、ひとつ、またひとつと開いて、ぜんぶ閉じて、またくり返す（体力が半分になると、ふえて速くなる）。開いているあいだは弾をふさぐ
const P404_WIN=[{x:-138,y:-82,w:124,h:54,bar:C.pink,sh:C.mint,t:'ﾂﾅｶﾞﾘﾏｾﾝ',at:.18},{x:-62,y:-112,w:124,h:54,bar:'#5B3FD1',sh:C.pink,t:'エラー',at:.38},{x:52,y:-72,w:68,h:40,bar:C.mint,sh:C.lilac,t:'ﾖﾐｺﾐﾁｭｳ',fs:11,at:.56},
  {x:-160,y:10,w:118,h:50,bar:C.coral,sh:C.butter,t:'ｻｰﾊﾞｰ ｴﾗｰ',fs:12,at:.30,hard:1},{x:66,y:-128,w:116,h:46,bar:'#33D6CF',sh:C.pink,t:'ﾍﾟｰｼﾞｶﾞ ﾅｲ',fs:12,at:.66,hard:1}];   // 初期案と同じく、404 の後ろに重なるように
// 開きぐあい（0〜1）。wc＝経過時間、half＝体力半分（ふえて速くなる）。図鑑（zkP404）も同じものを使う
function p404Wo(wc,half){const T=half?2.6:3.2,ph=(wc%T)/T;return P404_WIN.map(w=>w.hard&&!half?0:ph<w.at?0:ph<w.at+.06?(ph-w.at)/.06:ph<.9?1:Math.max(0,1-(ph-.9)/.06))}
function p404Win(e,dt){e.wc=(e.wc||0)+dt;const prev=e.wo||[];e.wo=p404Wo(e.wc,e.half);
  e.wo.forEach((o,i)=>{if(o>0&&!(prev[i]>0))tone({f:620+i*120,dur:.05,type:'square',vol:.028})});   // ピコッ
  if(prev.some(o=>o>0)&&!e.wo.some(o=>o>0))tone({f:200,dur:.14,type:'square',vol:.03});   // ぜんぶ閉じる：ブブー
  e.arm=[[0,46,48]];P404_WIN.forEach((w,i)=>{if(e.wo[i]>.5){const n=Math.ceil(w.w/30);for(let j=0;j<n;j++)e.arm.push([w.x+(j+.5)*w.w/n,w.y+w.h/2,w.h/2-2])}})}
// x＝描く先、(ox,oy)＝404 の原点、k＝大きさ、wo＝開きぐあい
function p404WinPaint(x,ox,oy,k,wo){P404_WIN.forEach((w,i)=>{const o=wo[i]||0;if(o<=0)return;const cx=ox+(w.x+w.w/2)*k,cy=oy+(w.y+w.h/2)*k,s=(.6+.4*o)*k;x.save();x.translate(cx,cy);x.scale(s,s);x.globalAlpha=Math.min(1,o*1.4);
  const X=-w.w/2,Y=-w.h/2;x.fillStyle=w.sh;x.fillRect(X+5,Y+5,w.w,w.h);x.fillStyle='#E9E4F5';x.fillRect(X,Y,w.w,w.h);x.fillStyle=w.bar;x.fillRect(X,Y,w.w,16);x.lineWidth=3;x.strokeStyle=C.cream;x.strokeRect(X,Y,w.w,w.h);
  x.fillStyle=C.red;x.fillRect(X+w.w-15,Y+2,12,12);x.fillStyle=C.plum;x.font=(w.fs||14)+'px "DotGothic16",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(w.t,0,Y+16+(w.h-16)/2);x.restore()});x.globalAlpha=1}
function p404WinDraw(e){p404WinPaint(ctx,e.x,e.y,e.k,e.wo||[])}
ST_UPD.p404=(e,dt)=>{p404Win(e,dt);bigTick(e,dt);if(!bigEnter(e,dt,'ページが 見つかりません〜！'))return;bigY(e,dt,50,.5);const X=ptOf(e,0);
  if(!e.half&&e.hp<e.maxhp*.5){e.half=1;bossSay(e,'エラーが ふえる〜！',1.4)}
  e.atk-=dt;if(e.atk<=0){e.pat=(e.pat+1)%3;e.atk=2.2*rkFire();
    if(e.pat===0){errBeep();const n=G.enemies.filter(q=>q.type==='popup'&&!q.dead).length;for(let i=0;i<(n<2?2:n<4?1:0);i++){const p=popupE(X.x,X.y,{tx:clamp(X.x-rand(110,260),G.player.x+90,W-40),ty:clamp(X.y+rand(-60,60),50,H-50)});p.t=.2}bossSay(e,ERR_TX[Math.floor(Math.random()*3)],1)}
    else if(e.pat===1){for(let i=0;i<9;i++)fire(e.x-40,e.y+20,Math.PI+(i-4)*.17,130+(i%2)*30,'orb');errBeep();sfx('bRing')}
    else{hzAdd({kind:'h',y:G.player.y,x0:e.x-80,warn:.9,on:.5,w:24,col:C.pink});bossSay(e,'ブブーッ！',1)}}};
ST_DRAW.p404=(e,fl)=>{p404WinDraw(e);bigBody(e,fl);drawWeak(e,ptOf(e,0),C.red);bigSay(e)};
STG[8]={
  intro:{peek:['virus','copyw','bugg'],c1:'アカスナ大帝を やっつけた！',c2:'岩の中に ウイルスが かくれている…！',sub:'ウイルスだらけの 岩の帯',sky:['#0A0818','#1C1638','#2E3A4A']},
  bg:{
    sky(x,W,H){x.fillStyle='#0A0818';x.fillRect(0,0,W,H);for(let i=0;i<70;i++){x.fillStyle=C.cream;x.globalAlpha=.2+((i*7)%6)/9;x.fillRect((i*137)%W,(i*71)%H,2,2)}x.globalAlpha=1;
      const g=x.createRadialGradient(W*.3,H*.4,10,W*.3,H*.4,260);g.addColorStop(0,'rgba(63,191,107,.12)');g.addColorStop(1,'rgba(63,191,107,0)');x.fillStyle=g;x.fillRect(0,0,W,H)},
    far(x,w,h){for(const [cx,cy,r,v] of [[60,60,30,0],[200,90,22,1],[330,40,36,0]]){x.fillStyle='#2A2440';x.beginPath();x.arc(cx,cy,r,0,TAU);x.fill();x.fillStyle=v?'rgba(63,191,107,.35)':'#3A3458';x.beginPath();x.arc(cx-r*.25,cy-r*.25,r*.6,0,TAU);x.fill()}},
    near(x,w,h){for(const [cx,cy,r] of [[40,90,14],[170,70,10],[290,100,18],[380,60,8]]){x.fillStyle='#4A4560';x.beginPath();x.arc(cx,cy,r,0,TAU);x.fill();x.fillStyle='#6E6890';x.beginPath();x.arc(cx-3,cy-3,r*.5,0,TAU);x.fill()}},
    mid(W,H){for(let i=0;i<6;i++){const sp=.3+i*.08,x=W+80-((G.scroll*sp+i*190)%(W+160)),y=[40,330,120,250,70,300][i],r=[26,18,34,14,22,30][i];ctx.save();ctx.translate(x,y);ctx.rotate(G.time*.3*(i%2?1:-1));ctx.fillStyle='#3A3458';ctx.beginPath();for(let k=0;k<9;k++){const a=k*TAU/9,rr2=r*(k%2?.82:1);ctx.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2)}ctx.closePath();ctx.fill();ctx.restore()}},
    skyP(x,w,h){x.fillStyle='#0A0818';x.fillRect(0,0,w,h);for(let i=0;i<70;i++){x.fillStyle=C.cream;x.globalAlpha=.2+((i*7)%6)/9;x.fillRect((i*97)%w,(i*71)%h,2,2)}x.globalAlpha=1},
    midP(w,h){for(let i=0;i<8;i++){const y=((i*151+G.scroll*(.5+i*.06))%(h+120))-60,x=(i*83)%w+20,r=[26,18,34,14,22,30,12,20][i];ctx.save();ctx.translate(x,y);ctx.rotate(G.time*.3*(i%2?1:-1));ctx.fillStyle=i%3?'#3A3458':'#2E4A3A';ctx.beginPath();for(let k=0;k<9;k++){const a=k*TAU/9,rr2=r*(k%2?.82:1);ctx.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2)}ctx.closePath();ctx.fill();ctx.restore()}}
  },
  waves:[[.6,()=>{virusE(130);virusE(260)}],[3,()=>rock8E(190,0)],[4.5,()=>copywE(120)],[7,()=>buggE(260)],[9,()=>{rock8E(110,1);rock8E(280,0)}],[11,()=>{popupE(undefined,150);popupE(undefined,240)}],
    [12.5,()=>{virusE(100);virusE(200);virusE(300)}],[15,()=>copywE(250)],[17.5,()=>{buggE(130);buggE(270)}],[20,()=>{rock8E(190,1)}],[21.5,()=>cloud(110)],
    [23,()=>{popupE(undefined,120);popupE(undefined,200);popupE(undefined,280)}],[25,()=>{virusE(150);copywE(260)}],[28,()=>{rock8E(130,0);rock8E(250,1)}],[30,()=>buggE(190)],
    [32,()=>{virusE(110);virusE(290)}],[34.5,()=>copywE(190)],[37,()=>{rock8E(150,0);buggE(260)}]],
  waveEnd:46,
  rest(){virusE(150);rock8E(250,0)},
  extra(){const k=Math.random();if(k<.35)virusE(rand(90,300));else if(k<.6)buggE(rand(90,300));else if(k<.8)copywE(rand(100,280));else rock8E(rand(90,300),Math.random()<.5)},
  mid(){return bigE({type:'troy',art:'troy',hp:1,score:2400,exp:10,boost:10,k:.8,bw:120,bh:124,name:'トロイのもくば',parts:[{k:'door',ox:-18,oy:-2,r:22,hp:hpS(36),lock:true}],arm:[[-18,-2,18]]})},
  boss(){return bigE({type:'p404',art:'p404',hp:1,score:13000,mainBoss:true,k:.82,bw:116,bh:110,name:'ポップアップ404',parts:[{k:'x',ox:78,oy:-22,r:24,hp:hpS(56)}],arm:[[0,46,48]]})},
  // バグッチの残したバグ：さわると痛い。3秒で消える
  update(dt){const B=G.st.bits;if(!B)return;const P=G.player,px=P.x+2,py=P.y+8;for(const b of B){b.t+=dt;b.x-=30*dt;if(b.t>.2&&Math.abs(b.x-px)<G.D.hit+6&&Math.abs(b.y-py)<G.D.hit+6){b.t=9;hurt()}}G.st.bits=B.filter(b=>b.t<3)},
  fx(){for(const b of G.st.bits||[]){const a=clamp(3-b.t,0,1);ctx.globalAlpha=a;ctx.fillStyle=C.plum;ctx.fillRect(b.x-6,b.y-6,12,12);ctx.fillStyle=Math.floor((b.t+b.x)*6)%2?C.green:C.pink;ctx.fillRect(b.x-4,b.y-4,8,8);ctx.globalAlpha=1}}
};

// ===== ステージ9 土星のリング：フリーズ（体当たりされると少しのあいだ撃てない）・ループ（ぐるぐる回る輪）。氷のつぶの帯に入ると、動きがゆっくりに
//        小ボス リピートくん（同じ攻撃を3回くり返す）、ボス ムゲン・ループ（体は弾をはね返す。輪の切れ目の頭をねらう）
function freezeE(y){return E({type:'freeze',x:W+30,y,by:y,hp:hpS(4),score:80,exp:3,r:16,stopT:rand(1.5,2.5),onTouch:freezeHit})}
function freezeHit(e){if(G.noFire>0)return;G.noFire=1.6;pop(G.player.x,G.player.y-50,'フリーズ！ 撃てない…',C.lilac,13,1.2,true);sfx('back');buzz([40,40,40],true)}
ST_UPD.freeze=(e,dt)=>{e.stopT-=dt;if(e.stopT<=0){e.ice=e.ice>0?0:.9;e.stopT=e.ice?.9:rand(1.4,2.2)}if(e.ice>0)e.ice-=dt;else{e.x-=85*dt;e.y=lerp(e.y,G.player.y,dt*.5)}off(e)};   // ときどき固まる。てんてんの高さへ寄ってくる
ST_DRAW.freeze=(e,fl)=>{spr(SPR.freeze[0],e.x,e.y,fl);if(e.ice>0){ctx.globalAlpha=.5;ctx.strokeStyle='#B9E8FF';ctx.lineWidth=2;ctx.strokeRect(e.x-20,e.y-18,40,36);ctx.globalAlpha=1}};
function loopE(y){return E({type:'loop',x:W+60,y,cx:W+60,cy:y,hp:hpS(3),score:70,exp:3,r:15,ph:rand(0,TAU)})}
ST_UPD.loop=(e,dt)=>{e.cx-=75*dt;const a=e.t*3+e.ph;e.x=e.cx+Math.cos(a)*44;e.y=e.cy+Math.sin(a)*44;shootT(e,dt,3.2,e=>fire(e.x-8,e.y,aim(e.x,e.y),120,'orb'));if(e.cx<-80)e.gone=true};
ST_DRAW.loop=(e,fl)=>{ctx.globalAlpha=.3;ctx.strokeStyle=C.lilac;ctx.setLineDash([4,6]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.cx,e.cy,44,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;spr(SPR.loop[0],e.x,e.y,fl)};   // まん中をねらうと当てやすい
// 氷のつぶの帯：リングにそって、ななめに流れる
const iceY=x=>190+(x-W/2)*.26+Math.sin(G.time*.28)*80,ICE_H=64;
// 小ボス：リピートくん。同じ攻撃を3回くり返してから、次の攻撃へ
ST_UPD.repeat=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'くりかえし さいせい〜♪'))return;bigY(e,dt,70,.8);
  e.atk-=dt;if(e.atk<=0){e.rep=((e.rep||0)%3)+1;if(e.rep===1)e.pat=(e.pat+1)%3;e.atk=(e.rep===3?2.2:1.1)*rkFire();bossSay(e,['','1かいめ','2かいめ','3かいめ！'][e.rep],.7);if(e.rep===1)sfx('bRewind');
    if(e.pat===0){const a=aim(e.x,e.y);for(const d of [-.22,0,.22])fire(e.x-50,e.y,a+d,165,'orb');sfx('bShot')}
    else if(e.pat===1){for(let i=0;i<12;i++)fire(e.x,e.y,i*TAU/12+e.rep*.1,120,'orb');sfx('bRing')}
    else{for(let i=0;i<6;i++)fire(e.x-50,e.y-75+i*30,Math.PI,150,'orb');sfx('bZap')}
    e.fx=.2}};
ST_DRAW.repeat=(e,fl)=>{bigBody(e,fl);const k=e.k;for(const s of [-1,1]){ctx.save();ctx.translate(e.x+s*28*k,e.y-6*k);ctx.rotate(e.t*4);ctx.fillStyle=C.plum;ctx.fillRect(-1.5,-11*k,3,22*k);ctx.restore()}bigSay(e)};   // テープのリールが回る
// ボス：ムゲン・ループ。輪が回る。体は弾をはね返す。輪の切れ目にある頭が弱点
const MUG_H=[Math.cos(.35)*78,Math.sin(.35)*58];
function mugenSet(e){const c=Math.cos(e.rot),s=Math.sin(e.rot),R=(x,y)=>[x*c-y*s,x*s+y*c],h=R(MUG_H[0],MUG_H[1]),p=e.parts[0];p.ox=h[0];p.oy=h[1];
  e.arm=[];for(let i=3;i<26;i+=4){const a=i/28*TAU*.92+.5,q=R(Math.cos(a)*78,Math.sin(a)*58);e.arm.push([q[0],q[1],12])}}
// 名前のとおり：たおしても2回 よみがえる（3回目で おわり）。よみがえるたびに 回るのが速くなる
function mugenRevive(e,p){if(!(e.loops>0))return;e.loops--;p.alive=true;p.hp=p.maxhp*(e.loops?.8:.65);p.lock=true;e.rev=1.6;e.spd=(e.spd||0)+.35;
  bossSay(e,e.loops?'ムゲン！ もういっかい〜！':'まだまだ… ラストループ！',1.6);sfx('bRevive');sfx('bRewind');G.shake=.4;burst(p.x,p.y,24,C.lilac);G.eshots=G.eshots.filter(b=>Math.hypot(b.x-e.x,b.y-e.y)>140)}
ST_UPD.mugen=(e,dt)=>{const q=e.hp/e.maxhp;if(e.rev>0){e.rev-=dt;if(e.rev<=0)ptOf(e,0).lock=false}e.rot=(e.rot||0)+dt*(.45+(1-q)*.5+(e.spd||0)+(e.rev>0?5:0));mugenSet(e);bigTick(e,dt);if(!bigEnter(e,dt,'ぐるぐる… いつまでも おわらないよ〜'))return;bigY(e,dt,52,.5);
  e.atk-=dt;if(e.atk<=0){e.atk=Math.max(.9,2.2-(1-q)*1.2)*rkFire();e.n=(e.n||0)+1;const n=G.rk>.5?14:12;for(let i=0;i<n;i++)fire(e.x,e.y,i*TAU/n+e.n*.13,105+(1-q)*50,'orb');e.fx=.2;sfx('bRing');   // くり返しが だんだん速くなる
    if(e.n%4===0){loopE(clamp(G.player.y,90,300));bossSay(e,'もういっかい！',.8)}}};
ST_DRAW.mugen=(e,fl)=>{bigBody(e,fl||(e.rev>0&&Math.floor(e.rev*12)%2),{rot:e.rot});drawWeak(e,ptOf(e,0),C.pink);
  const z=e.rev>0?1+.4*Math.abs(Math.sin(e.rev*8)):1;T('∞',e.x,e.y+10,30*z,C.butter,'body','center',false);T('×'+((e.loops||0)+1),e.x,e.y+34,13,C.cream,'dot','center',false);bigSay(e)};   // のこりの ループの数
STG[9]={
  intro:{peek:['freeze','loop'],c1:'ポップアップ404を 閉じた！',c2:'キラキラの輪っかが 見えてきた…',sub:'氷のリングが 光る星',sky:['#2A1C58','#5B4A90','#B9A4FF']},
  bg:{
    sky(x,W,H){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1E1448');g.addColorStop(.6,'#3E2F7A');g.addColorStop(1,'#6A57A8');x.fillStyle=g;x.fillRect(0,0,W,H);
      for(let i=0;i<50;i++){x.fillStyle=C.cream;x.globalAlpha=.25+((i*7)%6)/9;x.fillRect((i*137)%W,(i*71)%H,2,2)}x.globalAlpha=1;
      const sx=W*.74,sy=H*.42;x.save();x.translate(sx,sy);x.rotate(-.28);x.strokeStyle='rgba(234,251,248,.45)';x.lineWidth=14;x.beginPath();x.ellipse(0,0,210,46,0,Math.PI,TAU);x.stroke();   // 大きな土星（うしろの輪）
      const pg=x.createLinearGradient(0,-120,0,120);pg.addColorStop(0,'#FFE7C4');pg.addColorStop(.5,'#E8C08A');pg.addColorStop(1,'#B98A5A');x.fillStyle=pg;x.beginPath();x.arc(0,0,118,0,TAU);x.fill();
      x.fillStyle='rgba(185,138,90,.4)';for(const yy of [-60,-20,30,70])x.fillRect(-118,yy,236,10);
      x.strokeStyle='rgba(234,251,248,.8)';x.lineWidth=14;x.beginPath();x.ellipse(0,0,210,46,0,0,Math.PI);x.stroke();x.strokeStyle='rgba(185,232,255,.6)';x.lineWidth=5;x.beginPath();x.ellipse(0,0,236,54,0,0,Math.PI);x.stroke();x.restore()},
    far(x,w,h){},
    near(x,w,h){},
    mid(W,H){const y0=iceY(0),y1=iceY(W);ctx.globalAlpha=.16;ctx.fillStyle='#B9E8FF';ctx.beginPath();ctx.moveTo(0,y0-ICE_H/2);ctx.lineTo(W,y1-ICE_H/2);ctx.lineTo(W,y1+ICE_H/2);ctx.lineTo(0,y0+ICE_H/2);ctx.fill();ctx.globalAlpha=1;
      for(let i=0;i<50;i++){const x=W-((G.time*(90+(i%5)*20)+i*53)%W),y=iceY(x)+((i*37)%ICE_H)-ICE_H/2;ctx.fillStyle=i%3?'rgba(234,251,248,.85)':'rgba(185,232,255,.9)';ctx.fillRect(x,y,i%4?2:3,i%4?2:3)}},   // 氷のつぶの帯
    skyP(x,w,h){const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3E2F7A');g.addColorStop(1,'#1E1448');x.fillStyle=g;x.fillRect(0,0,w,h);x.save();x.translate(w*.5,h*.62);x.rotate(.2);x.globalAlpha=.5;x.strokeStyle='#EAFBF8';x.lineWidth=18;x.beginPath();x.ellipse(0,0,260,70,0,0,TAU);x.stroke();x.restore();x.globalAlpha=1},
    midP(w,h){}
  },
  waves:[[.6,()=>{freezeE(130);freezeE(260)}],[3,()=>loopE(190)],[5,()=>{loopE(110);loopE(280)}],[7,()=>freezeE(200)],[9,()=>cloud(120)],
    [10.5,()=>{freezeE(100);freezeE(200);freezeE(300)}],[13,()=>{loopE(150);loopE(240)}],[15.5,()=>freezeE(190)],[17.5,()=>loopE(120)],[19.5,()=>cloud(270)],
    [21,()=>{freezeE(130);loopE(260)}],[23.5,()=>{loopE(100);loopE(200);loopE(300)}],[26.5,()=>{freezeE(150);freezeE(240)}],[29,()=>cloud(190)],
    [30.5,()=>{loopE(140);freezeE(270)}],[33,()=>{freezeE(110);freezeE(290)}],[35.5,()=>{loopE(190)}],[37.5,()=>{freezeE(150);loopE(250)}]],
  waveEnd:46,
  rest(){loopE(150);freezeE(250)},
  extra(){if(Math.random()<.5)freezeE(rand(90,300));else loopE(rand(100,280))},
  mid(){return bigE({type:'repeat',art:'repeat',hp:hpS(90),score:2600,exp:10,boost:10,k:.9,bw:80,bh:56,r:56,name:'リピートくん'})},
  boss(){const e=bigE({type:'mugen',art:'mugen',hp:1,score:14000,mainBoss:true,k:.95,bw:96,bh:76,name:'ムゲン・ループ',rot:0,loops:2,onPart:mugenRevive,parts:[{k:'head',ox:MUG_H[0],oy:MUG_H[1],r:28,hp:hpS(44)}]});mugenSet(e);return e},
  // 氷の帯の中では、動きがゆっくり（このフレームに動いた分を半分にもどす）
  update(dt){const P=G.player,pp=G.st.pp,inB=Math.abs(P.y-iceY(P.x))<ICE_H/2;
    if(pp&&inB&&G.phase!=='clear'){P.x=pp[0]+(P.x-pp[0])*.45;P.y=pp[1]+(P.y-pp[1])*.45;if(!G.st.inIce)pop(P.x,P.y-52,'ゆっくり…',C.lilac,12,.9,false)}
    G.st.inIce=inB;G.st.pp=[P.x,P.y]},
  fx(){if(G.noFire>0){const P=G.player;ctx.globalAlpha=.5+.3*Math.sin(G.time*20);ctx.strokeStyle='#B9E8FF';ctx.lineWidth=3;ctx.strokeRect(P.x-26,P.y-26,52,52);ctx.globalAlpha=1}}
};

// ===== ステージ10 宇宙のはて：これまでの敵が総出演。小ボス ゲートキーパー（目が開いているあいだだけ当たる・門から敵を呼ぶ）、
//        ラストボス ブラックノイズ（砂嵐のブラックホール。吸いこみに逆らって撃つ）。たおすとエンディング
const ALLSTARS=[y=>moyaE(y),y=>pakeRow(y),y=>biriE(y),y=>teidenE(y),y=>jamyE(y),y=>buffaE(y),y=>spamE(y),y=>pyonE(),y=>zaraFlock(y),y=>virusE(y),y=>copywE(y),y=>buggE(y),y=>freezeE(y),y=>loopE(y),y=>braunE(y,0),y=>mailE(y),()=>lagE(),y=>snake(y,'a'+Math.floor(G.time*10))];
const allstar=(i,y)=>ALLSTARS[i%ALLSTARS.length](y??rand(90,300));
const allRand=y=>allstar(Math.floor(Math.random()*ALLSTARS.length),y);
const GATE_SUM=[moyaE,biriE,teidenE,jamyE,buffaE,virusE,freezeE,loopE,y=>braunE(y,0)];   // 門から出てくる（1ぴきずつの敵）
// 小ボス：ゲートキーパー（宇宙のはての門番）。目が開いているあいだだけ弾が当たる。門の中から敵を呼び出す
ST_UPD.gate=(e,dt)=>{bigTick(e,dt);if(!bigEnter(e,dt,'ここから先へは とおさない！'))return;bigY(e,dt,60,.5);const eye=ptOf(e,0);
  e.eT=(e.eT??2)-dt;if(e.eT<=0){e.open=!e.open;e.eT=e.open?3.2:1.8;eye.lock=!e.open;if(!e.open){const [dx,dy]=upo(0,30*e.k);for(let i=0;i<2;i++){const m=GATE_SUM[Math.floor(Math.random()*GATE_SUM.length)](clamp(e.y+dy+(i?40:-40),80,310))||G.enemies[G.enemies.length-1];if(m&&!m.boss){m.x=e.x+dx-20;if(m.cx!=null)m.cx=m.x;burst(m.x,m.y,8,C.lilac)}}bossSay(e,'でてこい、ノイズたち！',1.2);sfx('bSummon')}else sfx('bOpen')}
  e.atk-=dt;if(e.atk<=0&&e.open){e.atk=.9*rkFire();const a=aim(eye.x,eye.y);for(const d of [-.2,0,.2])fire(eye.x-10,eye.y,a+d,170,'orb');sfx('bShot')}};
ST_DRAW.gate=(e,fl)=>{bigBody(e,fl);const k=e.k,ex=e.x,ey=e.y-56*k;if(!e.open){ctx.beginPath();ctx.ellipse(ex,ey,27*k,17*k,0,0,TAU);ctx.fillStyle='#3A2A70';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=C.plum;ctx.stroke();ctx.beginPath();ctx.moveTo(ex-22*k,ey);ctx.quadraticCurveTo(ex,ey+8*k,ex+22*k,ey);ctx.stroke()}   // 目を閉じている
  else drawWeak(e,ptOf(e,0),C.pink);bigSay(e)};
// ラストボス：ブラックノイズ。うでが回って、まん中へ吸いこむ。ミル子・ミルンも応援に来る
ST_UPD.black=(e,dt)=>{const q=e.hp/e.maxhp;e.rot=(e.rot||0)+dt*(.7+(1-q)*.9);bigTick(e,dt);if(!bigEnter(e,dt,'すべての電波を… のみこんでやる！'))return;
  e.y=lerp(e.y,190+Math.sin(e.t*.4)*40,dt*1.5);
  if(q<.5&&!e.half){e.half=1;bossSay(e,'まだまだ〜！ もっと すいこんでやる！',1.8);G.shake=.5;sfx('bRage')}
  pullTo(e.x,e.y,(e.half?120:80)*(1+.4*G.rk),dt);sfxG('bSuck',1.1);   // 吸いこみ（いつも）
  e.sp=(e.sp||0)+dt*(e.half?2.6:2);e.shotT=(e.shotT??1)-dt;if(e.shotT<=0){e.shotT=(e.half?.12:.16)*rkFire();const arms=e.half?3:2;for(let i=0;i<arms;i++)fire(e.x,e.y,e.sp+i*TAU/arms,100+(e.half?25:0),'orb');sfxG('bSpray',.14)}
  e.atk-=dt;if(e.atk<=0){e.atk=3*rkFire();const a=aim(e.x,e.y);for(let i=-3;i<=3;i++)fire(e.x-40,e.y,a+i*.13,175,'orb');e.fx=.3;sfx('bShot')}};
ST_DRAW.black=(e,fl)=>{const k=e.k;const g=ctx.createRadialGradient(e.x,e.y,20,e.x,e.y,180*k);g.addColorStop(0,'rgba(139,92,214,.35)');g.addColorStop(1,'rgba(139,92,214,0)');ctx.fillStyle=g;ctx.fillRect(e.x-200,e.y-200,400,400);
  bigBody(e,fl,{rot:e.rot});drawWeak(e,ptOf(e,0),C.red);bigSay(e)};
STG[10]={
  intro:{peek:['zaza','moya','virus','loop'],c1:'ムゲン・ループを ぬけだした！',c2:'いよいよ、ノイズの親玉の ところへ！',sub:'ネオンの星雲の その先',sky:['#2A0E3A','#7A2A8A','#33D6CF']},
  bg:{
    sky(x,W,H){x.fillStyle='#12061E';x.fillRect(0,0,W,H);
      for(const [cx,cy,r,c] of [[W*.2,H*.3,260,'rgba(255,111,177,.28)'],[W*.7,H*.6,300,'rgba(139,92,214,.3)'],[W*.5,H*.15,220,'rgba(51,214,207,.2)']]){const g=x.createRadialGradient(cx,cy,10,cx,cy,r);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H)}   // ネオンの星雲
      for(let i=0;i<110;i++){x.fillStyle=['#FFF3D6','#FF6FB1','#33D6CF','#FFE066'][i%4];x.globalAlpha=.3+((i*7)%6)/8;const z=i%13?2:3;x.fillRect((i*137)%W,(i*71)%H,z,z)}x.globalAlpha=1},
    far(x,w,h){},
    near(x,w,h){},
    mid(W,H){for(let i=0;i<30;i++){const sp=.8+(i%4)*.5,x=W+20-((G.scroll*sp+i*97)%(W+40)),y=(i*61)%H;ctx.fillStyle=['rgba(255,243,214,.8)','rgba(255,111,177,.8)','rgba(51,214,207,.8)'][i%3];ctx.fillRect(x,y,4+sp*3,2)}},   // ゴールが近いほど まぶしい星
    skyP(x,w,h){x.fillStyle='#12061E';x.fillRect(0,0,w,h);for(const [cx,cy,r,c] of [[w*.3,h*.3,240,'rgba(255,111,177,.28)'],[w*.7,h*.7,260,'rgba(139,92,214,.3)']]){const g=x.createRadialGradient(cx,cy,10,cx,cy,r);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,h)}},
    midP(w,h){for(let i=0;i<40;i++){const sp=.8+(i%4)*.5,y=((G.scroll*sp+i*97)%(h+40))-20,x=(i*61)%w;ctx.fillStyle=['rgba(255,243,214,.8)','rgba(255,111,177,.8)','rgba(51,214,207,.8)'][i%3];ctx.fillRect(x,y,2,4+sp*3)}}
  },
  waves:Array.from({length:18},(_,i)=>[.6+i*2.2,()=>{allstar(i,[120,260,190,100,300,150][i%6]);if(i%3===2)allstar(i+7,[260,120,210][i%3]);if(i%6===5)cloud([110,280][i%2])}]),
  waveEnd:48,
  rest(){allRand(150);allRand(250)},
  extra(){allRand()},
  mid(){return bigE({type:'gate',art:'gate',hp:1,score:3000,exp:10,boost:10,k:.85,bw:90,bh:84,name:'ゲートキーパー',open:false,eT:2,parts:[{k:'eye',ox:0,oy:-56,r:24,hp:hpS(34),lock:true}]})},
  boss(){return bigE({type:'black',art:'black',hp:1,score:20000,mainBoss:true,k:1,bw:110,bh:110,name:'ブラックノイズ',parts:[{k:'core',ox:0,oy:0,r:44,hp:hpS(300)}]})},
  update(dt){},
  fx(){}
};


/* ---- 本編 4071-4107: 図鑑の絵 ---- */
// 絵：ゲームのドット絵（SPR）・てんてんの画像を、そのまま図鑑でも使う（ボスとグルグルは小さく描きなおす）
const ZK_PIC={};
function zkCv(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;fn(x);return c}
function zkFaceTo(x,name,ox,oy,u,v){v=v||u;const f=FACES[name];for(let j=0;j<14;j++)for(let i=0;i<22;i++){const ch=f[j][i];if(ch==='.')continue;x.fillStyle=FCOL[ch];x.fillRect(ox+i*u,oy+j*v,u+.5,v+.5)}}
function zkNoise(x,ox,oy,w,h,u){let sd=7;for(let j=0;j<h;j+=u)for(let i=0;i<w;i+=u){sd=(sd*16807)%2147483647;const v=sd/2147483647;x.fillStyle=v<.33?'#C9C2D9':v<.66?'#E9E4F5':'#F8F5FC';x.fillRect(ox+i,oy+j,u,u)}}
function zkRR(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function zkBossCv(face){return zkCv(120,102,x=>{
  x.lineCap='round';x.lineWidth=4;x.strokeStyle=C.plum;x.beginPath();x.moveTo(46,24);x.lineTo(30,8);x.moveTo(74,24);x.lineTo(90,8);x.stroke();
  for(const [ax,c] of [[30,C.pink],[90,C.mint]]){x.beginPath();x.arc(ax,8,6,0,TAU);x.fillStyle=c;x.fill();x.lineWidth=2;x.stroke()}
  zkRR(x,5,22,104,70,16);x.fillStyle=C.pink;x.fill();zkRR(x,11,22,104,70,16);x.fillStyle=C.mint;x.fill();zkRR(x,8,22,104,70,16);x.fillStyle=C.plum;x.fill();
  x.save();zkRR(x,16,30,64,54,10);x.clip();zkNoise(x,16,30,64,54,2);zkFaceTo(x,face,26,43,2);x.restore();
  x.beginPath();x.arc(96,42,6,0,TAU);x.fillStyle=C.butter;x.fill();x.beginPath();x.arc(96,60,6,0,TAU);x.fillStyle=C.coral;x.fill();
  x.fillStyle=C.plum;x.fillRect(30,92,14,8);x.fillRect(76,92,14,8)})}
function zkFaceCv(face){return zkCv(44,30,x=>{zkNoise(x,0,0,44,30,2);zkFaceTo(x,face,0,1,2)})}
const guruCv=()=>zkCv(30,30,x=>{const cols=[C.cream,C.cream,C.mint,C.mint,C.lilac,C.lilac,C.pink,C.pink];for(let i=0;i<8;i++){const a=i*TAU/8;x.globalAlpha=.25+i/10;x.fillStyle=cols[i];x.fillRect(15+Math.round(Math.cos(a)*10)-3,15+Math.round(Math.sin(a)*10)-3,6,6)}x.globalAlpha=1;x.fillStyle=C.plum;x.fillRect(9,9,12,12);x.fillStyle=C.cream;x.fillRect(11,13,3,3);x.fillRect(16,13,3,3)});   // グルグル（図鑑・かべがみ）
function zkPic(z){
  if(ZK_PIC[z.id])return ZK_PIC[z.id];let p=null;
  const S=k=>{const s=SPR[k]&&SPR[k][0];return s?{src:s.img.toDataURL(),w:s.w,h:s.h,px:1}:null};
  switch(z.id){
    case 'tenten':if(IMG.front)p={src:IMG.front.src,w:64,h:Math.round(64*IMG.front.naturalHeight/IMG.front.naturalWidth)};break;
    case 'kazu':if(IMG.kw1)p={src:IMG.kw1.src,w:IMG.kw1.naturalWidth*2,h:IMG.kw1.naturalHeight*2,px:1};break;
    case 'deka':p=S('zazaBig');break;
    case 'boss':p={src:zkBossCv('angry').toDataURL(),w:120,h:102,px:1};break;
    case 'guru':p={src:guruCv().toDataURL(),w:30,h:30,px:1};break;
    case 'miruko':p={src:'assets/miruko.png',w:64,h:64};break;
    case 'karamari':p={src:zkCv(120,90,x=>zkKara(x,120,90,0)).toDataURL(),w:120,h:90};break;
    case 'mirun':p={src:'assets/mirun.png',w:64,h:64};break;
    case 'mirun':p={src:'assets/mirun.png',w:64,h:64};break;
    case 'rock':case 'rock8':p={src:zkCv(48,48,x=>zkRock(x,48,48,0,z.id==='rock8')).toDataURL(),w:48,h:48};break;
    default:p=ST_BIG[z.id]?zkBigPic(z.id):S(z.id);
  }
  if(p)ZK_PIC[z.id]=p;return p}
const zkImg=(p,k,cls)=>p?`<img src="${p.src}" alt="" width="${Math.round(p.w*k)}"${p.px?' style="image-rendering:pixelated"':''}${cls?` class="${cls}"`:''}>`:'';

// 一覧
let zkTab='all',zkSel=null;
const zkInTab=z=>zkTab==='all'||(zkTab==='nakama'&&(z.cat==='nakama'||z.cat==='guest'))||(zkTab==='noise'&&z.cat==='noise')||(zkTab==='boss'&&(z.cat==='mid'||z.cat==='boss'));

/* ---- 本編 4213-4385: 図鑑のアニメ（本編と同じ動き） ---- */
function zkBlit(x,img,w,h,W,H,ox,oy,fill,px){let k=Math.min(W*fill/w,H*fill/h);if(px&&k>=1)k=Math.floor(k);const dw=w*k,dh=h*k;x.drawImage(img,Math.round(W/2-dw/2+ox),Math.round(H/2-dh/2+oy),Math.round(dw),Math.round(dh));return k}
function zkAnim(c,id,t){
  const big=c.dataset.big==='1';
  if(big){const r=c.getBoundingClientRect(),w=Math.max(1,Math.round(r.width*DPR)),h=Math.max(1,Math.round(r.height*DPR));if(c.width!==w||c.height!==h){c.width=w;c.height=h}}
  const x=c.getContext('2d'),W=c.width,H=c.height;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);x.imageSmoothingEnabled=false;
  if(id==='boss'){zkBossScene(x,W,H,t,big);return}
  if(id==='tenten'){zkTenten(x,W,H,t,big);return}
  if(id==='karamari'){x.imageSmoothingEnabled=true;zkKara(x,W,H,t);return}
  if(id==='p404'){zkP404(x,W,H,t,big);return}
  if(ZK_LIVE[id]){zkLive(x,W,H,t,big,id);return}   // ステージ2から先：本編と同じ動き
  if(ST_BIG[id]){const b=bigCv(id),q=b.box;x.imageSmoothingEnabled=true;const k=Math.min(W*(big?.8:.92)/q.w,H*(big?.8:.92)/q.h),oy=Math.sin(t*2.2)*H*.025;x.drawImage(b.img,q.x,q.y,q.w,q.h,W/2-q.w*k/2,H/2-q.h*k/2+oy,q.w*k,q.h*k);return}
  const fr=Math.floor(t*2.5)%2,fill=big?.6:.82;let s=null,ox=0,oy=Math.round(Math.sin(t*2.4+id.length)*(big?H*.025:2)),alpha=1;
  switch(id){
    case 'zaza':s=SPR.zaza[fr];break;case 'braun':s=SPR.braun[fr];break;case 'ika':s=SPR.ika[fr];break;case 'deka':s=SPR.zazaBig[fr];break;
    case 'ufo':s=SPR.ufo[0];ox=Math.sin(t*1.3)*W*.1;break;
    case 'cloud':s=SPR.cloud[0];ox=Math.sin(t*.8)*W*.05;break;
    case 'ruta':s=SPR.ruta[0];break;
    case 'moya':s=SPR.moya&&SPR.moya[0];ox=Math.sin(t*1.1)*W*.05;break;
    case 'pake':s=SPR.pake&&SPR.pake[0];alpha=(t%1.8)>1.15?.25:1;break;
    default:s=SPR[id]?SPR[id][fr%SPR[id].length]:null;break;   // ステージ3〜 の小さな敵も、ゲームと同じドット絵
    case 'rimo':s=SPR.rimo[0];ox=Math.cos(t*2.2)*W*.08;oy=Math.sin(t*2.2)*H*.06;break;
    case 'mail':s=SPR.mail[0];ox=Math.sin(t*3)*W*.04;break;
    case 'lag':{s=SPR.lag[Math.floor(t*5)%3===0?1:0];const j=Math.floor(t/1.6),ph=t-j*1.6;ox=((j*37)%5-2)*W*.06;oy=((j*53)%3-1)*H*.07;if(ph<.2&&Math.floor(ph*40)%2)alpha=0;break}
    case 'guru':{const u=Math.min(W,H)/(big?64:34),step=Math.floor(t*10)%8,cols=[C.cream,C.cream,C.mint,C.mint,C.lilac,C.lilac,C.pink,C.pink];x.save();x.translate(Math.round(W/2),Math.round(H/2+oy));x.scale(u,u);
      for(let i=0;i<8;i++){const a=(i+step)*TAU/8;x.globalAlpha=.25+i/10;x.fillStyle=cols[i];x.fillRect(Math.round(Math.cos(a)*12)-3,Math.round(Math.sin(a)*12)-3,6,6)}x.globalAlpha=1;x.fillStyle=C.plum;x.fillRect(-7,-7,14,14);x.fillStyle=C.cream;x.fillRect(-4,-3,3,3);x.fillRect(2,-3,3,3);x.restore();return}
    case 'kazu':{const im=Math.floor(t*3)%2?IMG.kw2:IMG.kw1;if(im)zkBlit(x,im,im.naturalWidth,im.naturalHeight,W,H,0,oy,big?.62:.86,true);return}
  }
  if(!s)return;x.globalAlpha=alpha;const k=zkBlit(x,s.img,s.w,s.h,W,H,ox,oy,fill,true);x.globalAlpha=1;
  if(id==='mail'&&Math.floor(t*5)%2){const cx=W/2+ox+16*k,cy=H/2+oy-12*k;x.beginPath();x.arc(cx,cy,7*k,0,TAU);x.fillStyle=C.red;x.fill();x.lineWidth=2*k;x.strokeStyle=C.plum;x.stroke();x.fillStyle=C.cream;x.font=`${Math.round(10*k)}px "DotGothic16",monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText('!',cx,cy+k*.5)}
}
// ポップアップ404：図鑑でも本編と同じく、小さなウィンドウが ひとつ、またひとつと開いて、ぜんぶ閉じて…をくり返す（初期案のアニメ）
// 本編と同じ p404Wo・p404WinPaint を使う。ふつう（3まい）を2回 → 体力が半分のとき（5まい・速い）を2回
function zkP404(x,W,H,t,big){
  const b=bigCv('p404'),q=b.box,S=2;x.imageSmoothingEnabled=true;
  const fill=big?.74:.86,k=Math.min(W*fill/(q.w+150*S),H*fill/(q.h+120*S)),oy=Math.sin(t*2.2)*H*.02;   // まわりのウィンドウの分、少し小さめに
  const ox0=W/2-q.w*k/2+(340-q.x)*k,oy0=H/2-q.h*k/2+(280-q.y)*k+oy+16*k;   // 絵の原点（本編の e.x,e.y にあたる所）
  const N=3.2*2,m=t%(N+2.6*2),half=m>=N;
  p404WinPaint(x,ox0,oy0,S*k,p404Wo(half?m-N:m,half));
  x.drawImage(b.img,q.x,q.y,q.w,q.h,W/2-q.w*k/2,H/2-q.h*k/2+oy+16*k,q.w*k,q.h*k);   // 404 本体は手前
}
// ===== 図鑑：ステージ2から先の敵も、本編と同じ動きで じっくり見られるように
// 本編の描き方（drawEnemy → ST_DRAW）をそのまま使う。ctx を図鑑のキャンバスに一時的に差しかえて描く（弾・音・ゲームの状態には さわらない）
// ZK_LIVE[id]：mk＝本編と同じ作り方、tick(e,t,s)＝本編の動き（攻撃・分かれる・開く・消える…）を時間でまねて くり返す。配列を返すと まとめて描く
//   box・c＝見せる範囲と まん中（ゲームの座標）。大きい敵は絵の大きさから決める（pad・padL・padT で ゆとり）。pre・post＝敵の前後に描くもの
const zkMk=fn=>{const L=G.enemies,D=G.D,S=G.stage;G.enemies=[];if(!G.D)G.D=DIFF.normal;if(!(G.stage>0))G.stage=1;   // タイトルから図鑑を開いたとき（まだ遊んでいない）も作れるように
  try{const e=fn();e.x=e.y=0;e.hp=e.maxhp;return e}finally{G.enemies=L;G.D=D;G.stage=S}};
const zkCyc=(t,a)=>{let u=t%a.reduce((p,q)=>p+q,0);for(let i=0;i<a.length;i++){if(u<a[i])return [i,u];u-=a[i]}return [0,0]};   // いま何番目の場面か・その場面に入ってからの時間
const zkFx=(e,t,P,d)=>{e.fx=Math.max(0,(d||.22)-(t%P))};   // 攻撃のたびに ぽよんと ふくらむ
const zkBob=(e,t,a,sp)=>{e.y=Math.sin(t*(sp||.8))*(a??8)};
function zkHz(h,left){const sv=G.st;G.st={hz:[h]};ctx.save();ctx.translate(left,0);try{hzDraw()}finally{ctx.restore();G.st=sv}}   // 予告の点線 → ビーム（本編の hzDraw。x は left から）
const zkGround=y=>()=>{ctx.fillStyle='rgba(185,164,255,.25)';ctx.fillRect(-200,y,400,3)};
const ZK_LIVE={
  // ステージ2
  moya:{mk:()=>moyaE(0),box:[64,72],tick:(e,t)=>{e.y=Math.sin(t*1.4)*12}},
  pake:{mk:()=>pakeE(0,0,0),box:[150,72],init:s=>{s.q=[0,1,2].map(i=>zkMk(()=>pakeE(0,0,i*.45)))},
    tick:(e,t,s)=>s.q.map((q,i)=>{q.t=t;q.x=(i-1)*46;q.y=(i%2?10:-10)+Math.sin(t*3+q.ph)*10;q.ghost=((t+q.ph)%1.8)>1.15;return q})},   // 3びきの列。ときどき消える
  miruko:{mk:()=>STG[2].mid(),box:[150,190],c:[0,-22],smooth:1,tick:(e,t)=>{e.y=Math.sin(t*1.1)*12}},
  // ステージ3
  biri:{mk:()=>biriE(0,0),box:[120,84],tick:(e,t,s)=>{const [i,u]=zkCyc(t,[3,1.1]);if(!i){e.y=Math.sin(t*2.2)*12;return}   // たおすと 2つに分かれる
    s.m=s.m||[0,1].map(()=>zkMk(()=>biriE(0,0,true)));return s.m.map((q,j)=>{q.t=t;q.x=-u*60;q.y=(j?1:-1)*(1-Math.pow(.4,u))*44;return q})}},
  teiden:{mk:()=>teidenE(0),box:[64,72],tick:(e,t)=>{e.y=Math.sin(t*1.3)*12},pre:(e,t)=>{ctx.fillStyle=`rgba(10,6,24,${(.25+.15*Math.sin(t*.8)).toFixed(3)})`;ctx.fillRect(-400,-400,800,800)}},   // まわりが暗くなる
  breaker:{mk:()=>STG[3].mid(),padT:40,tick:(e,t)=>{const [i,u]=zkCyc(t,[5.2,2.6]);e.stun=i?2.6-u:0;if(i)e.fx=0;else{zkBob(e,t,8,.9);zkFx(e,t,2.1)}}},   // スイッチが落ちると しばらく停電
  surge:{mk:()=>STG[3].boss(),tick:(e,t)=>{zkBob(e,t,10,.7);const [i,u]=zkCyc(t,[2.1,2.1,2.1]);e.charge=i===2&&u<.9?1:0;zkFx(e,t,2.1,.25)}},
  // ステージ4
  jamy:{mk:()=>jamyE(0),box:[70,80],init:(s,e)=>{e.ph=0},tick:(e,t)=>{e.y=Math.sin(t*3)*14}},
  buffa:{mk:()=>buffaE(0),box:[150,64],tick:(e,t)=>{const [i,u]=zkCyc(t,[1.6,.9,.7]);e.st=i;e.x=i===0?50-u*25:i===1?10:10-u*100}},   // 止まって ぐるぐる → 急に速く
  parabo:{mk:()=>STG[4].mid(),padL:150,tick:(e,t)=>{zkBob(e,t,6,.9);const u=t%2.4;e.fx=u>1&&u<1.3?.3:0},
    post:(e,t)=>{const u=t%2.4;if(u<1.55)zkHz({kind:'h',t:u,warn:1,on:.55,w:26,col:C.mint,y:e.y-6,x0:e.x-50+170},-170)}},   // 点線で ねらって ビーム
  yomikomi:{mk:()=>STG[4].boss(),pad:30,tick:(e,t)=>{const u=t%9;e.pct=Math.min(100,u*12.5);e.big=u>8?9-u:0;e.seg=t*8;zkBob(e,t,8,.6);if(!e.big)zkFx(e,t,2.6,.25)}},   // ％が 100 になると 大技
  // ステージ5
  spamsat:{mk:()=>spamE(0),box:[110,100],c:[0,-8],tick:(e,t)=>{const [i,u]=zkCyc(t,[1.2,1.6,1]);e.open=i===0?0:i===1?Math.min(1,u*2.4):Math.max(0,1-u*2);e.y=Math.sin(t*1.4)*5}},   // パネルを広げて SALE!!
  debri:{mk:()=>debriE(0),box:[70,70],init:(s,e)=>{e.rot=1.6}},
  arm:{mk:()=>STG[5].mid(),padL:90,tick:(e,t)=>{const [i,u]=zkCyc(t,[2.4,1.4,1]);e.x=i===1?-80*Math.min(1,u/.6):i===2?-80*(1-u):0;if(!i){zkBob(e,t,8,.9);zkFx(e,t,1.2)}else e.fx=0}},   // うでを のばして つかみに来る
  jamsat:{mk:()=>STG[5].boss(),padL:120,tick:(e,t)=>{zkBob(e,t,8,.6);zkFx(e,t,2.3,.25)},
    post:(e,t)=>{const u=t%6.9;if(u<1.4)zkHz({kind:'h',t:u,warn:.9,on:.5,w:24,col:C.lilac,y:e.y+10,x0:e.x-60+200},-200)}},   // ジャミング・ビーム
  // ステージ6
  pyon:{mk:()=>pyonE(0),box:[70,140],c:[0,0],pre:zkGround(58),tick:(e,t)=>{const u=t%2.6;e.hgt=Math.max(0,200*u-75*u*u)*.55;e.land=u<.3?.3-u:0;e.y=46-e.hgt}},   // 月の重力で ふわっと はねる
  mogura:{mk:()=>moguraE(0,0),box:[80,80],c:[0,-6],tick:(e,t)=>{const [i,u]=zkCyc(t,[1.2,1.4,.5]);e.up=i===0?0:i===1?Math.min(1,u*6):Math.max(0,1-u*5);e.ghost=e.up<.5;e.y=12}},   // 穴から 顔を出す
  rock:{mk:()=>rockE(0),box:[80,120],pre:zkGround(58),init:(s,e)=>{e.rot=1.2},tick:(e,t)=>{e.y=40-Math.sin((t%1.6)/1.6*Math.PI)*70}},   // はねる
  mirun:{mk:()=>STG[6].mid(),box:[150,190],c:[0,-22],smooth:1,tick:(e,t)=>{e.y=Math.sin(t*.9)*12}},
  kengai:{mk:()=>STG[6].boss(),padT:60,pad:24,tick:(e,t)=>{const [i,u]=zkCyc(t,[2,.6,.6,3]),tg=[.12,.35,.6,1];e.bars=i;e.ghost=i!==3;e.vis=tg[i]+(tg[(i+3)%4]-tg[i])*Math.exp(-u*6);e.y=Math.sin(t*2)*3}},   // アンテナが3本立つと 姿が見える
  // ステージ7
  zarazara:{mk:()=>zaraE(0),box:[190,90],init:s=>{s.q=[0,1,2,3,4].map(i=>zkMk(()=>zaraE(0,0)))},tick:(e,t,s)=>s.q.map((q,i)=>{q.t=t;q.x=-56+i*28;q.y=(i%2?8:-8)+Math.sin(t*4+q.ph)*12;return q})},   // むれで飛ぶ
  rover:{mk:()=>roverE(0),box:[80,64],pre:zkGround(20)},
  devil:{mk:()=>STG[7].mid(),pad:50,tick:(e,t)=>{zkBob(e,t,10,.7)}},
  akasuna:{mk:()=>STG[7].boss(),padL:120,tick:(e,t)=>{zkBob(e,t,8,.55);zkFx(e,t,1.5,.2)},
    post:(e,t)=>{const u=t%7;if(u<1.5)for(const dy of [-30,30])zkHz({kind:'h',t:u,warn:1,on:.5,w:24,col:C.coral,y:e.y+dy,x0:e.x-90+200},-200)}},   // ダブル・ビーム
  // ステージ8
  virus:{mk:()=>virusE(0),box:[130,96],tick:(e,t,s)=>{const [i,u]=zkCyc(t,[3,1.2]);if(!i){e.y=Math.sin(t*2)*10;return}   // たおすと 3つに分かれる
    s.m=s.m||[0,1,2].map(()=>zkMk(()=>virusE(0,0,{n:3,k:0})));return s.m.map((q,j)=>{q.t=t;q.x=-u*50;q.y=(j-1)*56*(1-Math.pow(.5,u*1.5));return q})}},
  copyw:{mk:()=>copywE(0),box:[230,110],tick:(e,t)=>{const n=Math.min(8,2+Math.floor((t%10)/1.1)),Y=q=>Math.sin(q*2.4)*34;e.x=-80;e.y=Y(t);e.parts[0].flash=0;   // うしろに コピーが ふえていく
    e.armor=[];for(let i=1;i<=n;i++){const tau=i*7/60;e.armor.push({x:-80+85*tau,y:Y(t-tau),r:12})}}},
  bugg:{mk:()=>buggE(0),box:[200,110],tick:(e,t)=>{e.x=-60;e.y=Math.sin(t*3.2)*30},   // 通ったあとに バグを のこす
    pre:(e,t)=>{for(let a=t%.32;a<1.9;a+=.32){const b={x:-50+75*a,y:Math.sin((t-a)*3.2)*30,t:a},al=clamp(3-b.t,0,1);ctx.globalAlpha=al;ctx.fillStyle=C.plum;ctx.fillRect(b.x-6,b.y-6,12,12);ctx.fillStyle=Math.floor((b.t+b.x)*6)%2?C.green:C.pink;ctx.fillRect(b.x-4,b.y-4,8,8);ctx.globalAlpha=1}}},
  popup:{mk:()=>popupE(0,0),box:[72,52]},
  rock8:{mk:()=>rock8E(0),box:[80,80],init:(s,e)=>{e.rot=.8}},
  troy:{mk:()=>STG[8].mid(),padL:90,tick:(e,t,s)=>{const [i,u]=zkCyc(t,[1.9,3.2]),d=ptOf(e,0);e.open=i===1;d.lock=!e.open;zkBob(e,t,6,.6);if(!e.open)return;   // とびらが開くと ウイルスが 飛び出す
    s.v=s.v||[0,1].map(()=>zkMk(()=>virusE(0,0,{n:99,k:0})));return [e,...s.v.map((q,j)=>{q.t=t;q.x=d.ox*e.k-10-u*40;q.y=e.y+d.oy*e.k+(j?1:-1)*(10+u*12);return q})]}},
  // ステージ9
  freeze:{mk:()=>freezeE(0),box:[70,70],tick:(e,t)=>{const [i,u]=zkCyc(t,[1.8,.9]);e.ice=i?.9-u:0;e.y=i?e.y:Math.sin(t*1.5)*6}},   // ときどき 固まる
  loop:{mk:()=>loopE(0),box:[130,130],init:(s,e)=>{e.ph=0},tick:(e,t)=>{e.cx=e.cy=0;e.x=Math.cos(t*3)*44;e.y=Math.sin(t*3)*44}},   // ぐるぐる回る
  repeat:{mk:()=>STG[9].mid(),padL:150,tick:(e,t)=>{const [i,u]=zkCyc(t,[1.1,1.1,2.2]);e.say={text:['1かいめ','2かいめ','3かいめ！'][i],t:u,d:.7};e.fx=Math.max(0,.2-u);zkBob(e,t,8,.8)}},   // 同じ攻撃を 3回 くり返す
  mugen:{mk:()=>STG[9].boss(),pad:44,tick:(e,t)=>{const T=10,u=t%T,n=Math.floor(t/T);e.rev=u>8.4?10-u:0;e.rot=t*.6+n*8+(u>8.4?(u-8.4)*5:0);e.loops=2-n%3;ptOf(e,0).lock=e.rev>0;mugenSet(e);zkBob(e,t,8,.5)}},   // 輪が回る。よみがえると 速く回る
  // ステージ10
  gate:{mk:()=>STG[10].mid(),tick:(e,t)=>{const [i]=zkCyc(t,[2,3.2]);e.open=i===1;ptOf(e,0).lock=!e.open;zkBob(e,t,8,.5)}},   // 目が開いている あいだだけ 弱点
  black:{mk:()=>STG[10].boss(),pad:60,tick:(e,t)=>{e.rot=t*.9;zkBob(e,t,6,.4);zkFx(e,t,3,.3)}}
};
const ZK_LV={};
function zkLive(x,W,H,t,big,id){
  const D=ZK_LIVE[id];let s=ZK_LV[id];
  if(!s){s=ZK_LV[id]={e:zkMk(D.mk)};const e=s.e;if(D.init)D.init(s,e);
    if(D.box){s.box=D.box;s.c=D.c||[0,0]}
    else{const q=bigCv(e.art).box,k=e.k,p=D.pad??16,l=D.padL||0,tp=D.padT||0;s.box=[q.w/2*k+p*2+l,q.h/2*k+p*2+tp];s.c=[((q.x+q.w/2)/2-170)*k-l/2,((q.y+q.h/2)/2-140)*k-tp/2]}}
  const e=s.e;e.t=t;e.flash=0;const L=(D.tick&&D.tick(e,t,s))||[e];
  const k=Math.min(W*(big?.92:1)/s.box[0],H*(big?.92:1)/s.box[1]),sv=ctx,vm=VIEW.mode;
  ctx=x;VIEW.mode='yoko';x.save();x.translate(W/2-s.c[0]*k,H/2-s.c[1]*k);x.scale(k,k);x.imageSmoothingEnabled=!D.box||!!D.smooth;   // 図鑑は いつも よこ向きの絵で
  try{if(D.pre)D.pre(e,t,s);for(const q of L)drawEnemy(q);if(D.post)D.post(e,t,s)}catch(_){}finally{x.restore();x.globalAlpha=1;ctx=sv;VIEW.mode=vm}
}
// カラマリ・コード：本編と同じ形（ケーブルの体・黄色い結び目・プラグの頭）を、図鑑の大きさで
function zkKara(x,W,H,t){const u=Math.min(W/104,H/78),n=11,S=[];for(let i=0;i<=n;i++){const q=i/n;S.push({x:W/2-40*u+i*7.4*u,y:H*.52+Math.sin(t*2.2-i*.55)*10*u*Math.min(1,i/3)-q*6*u})}
  x.save();x.lineCap='round';x.lineJoin='round';const line=(w,c)=>{x.beginPath();S.forEach((s,i)=>i?x.lineTo(s.x,s.y):x.moveTo(s.x,s.y));x.lineWidth=w*u;x.strokeStyle=c;x.stroke()};
  line(13,C.plum);line(6,C.mint);line(2.5,C.pink);
  if(S[8]){x.beginPath();x.arc(S[8].x,S[8].y-8*u,8*u,0,TAU);x.lineWidth=6*u;x.strokeStyle=C.plum;x.stroke();x.lineWidth=2.5*u;x.strokeStyle=C.mint;x.stroke()}
  for(const i of [3,6,10]){const s=S[i];x.beginPath();x.arc(s.x,s.y,7*u,0,TAU);x.fillStyle=C.butter;x.fill();x.lineWidth=1.6*u;x.strokeStyle=C.plum;x.stroke();x.beginPath();x.moveTo(s.x-3*u,s.y-3*u);x.lineTo(s.x+3*u,s.y+3*u);x.moveTo(s.x-3*u,s.y+3*u);x.lineTo(s.x+3*u,s.y-3*u);x.stroke()}
  const hx=S[0].x,hy=S[0].y;zkRR(x,hx-16*u,hy-14*u,31*u,28*u,9*u);x.fillStyle=C.plum;x.fill();zkRR(x,hx-14*u,hy-12*u,27*u,24*u,7*u);x.fillStyle=C.mint;x.fill();
  x.fillStyle=C.plum;x.fillRect(hx-23*u,hy-6*u,8*u,3*u);x.fillRect(hx-23*u,hy+3*u,8*u,3*u);
  x.beginPath();x.arc(hx-2*u,hy-4*u,4.5*u,0,TAU);x.fillStyle=C.cream;x.fill();x.lineWidth=1.5*u;x.strokeStyle=C.plum;x.stroke();x.beginPath();x.arc(hx-3*u,hy-4*u,2*u,0,TAU);x.fillStyle=C.plum;x.fill();
  zkRR(x,hx-11*u,hy+4*u,17*u,4.5*u,2*u);x.fillStyle=C.red;x.fill();x.restore()}
function zkTenten(x,W,H,t,big){const ph=t%4,fill=big?.62:.86;x.imageSmoothingEnabled=true;
  if(IMG.spin&&ph>3.2){const fr=(13+Math.floor((ph-3.2)/.8*16))%16,k=Math.min(W*fill/128,H*fill/116);x.drawImage(IMG.spin,fr*128,0,128,116,W/2-64*k,H/2-58*k,128*k,116*k)}
  else if(IMG.front){const w=IMG.front.naturalWidth,h=IMG.front.naturalHeight,k=Math.min(W*fill/w,H*fill/h),oy=Math.sin(t*2.4)*H*.03;x.drawImage(IMG.front,W/2-w*k/2,H/2-h*k/2+oy,w*k,h*k)}}
// スナアラシ大王：本編と同じ描き方（体・ノイズの画面・顔・アンテナ）を、図鑑の絵に描く
function zkBossDraw(x,cx,cy,s,t,face,o){
  x.save();x.translate(cx,cy);x.scale(s,s);
  if(o.chg)x.translate(rand(-1.6,1.6),rand(-1.2,1.2));
  if(o.hurt)x.translate(Math.sin(t*70)*3*o.hurt,0);
  if(o.fx>0){const k=1+o.fx*.5;x.scale(k,1-(k-1)*.45)}
  const bw=170,bh=136,L=-bw/2,Tp=-bh/2;
  x.lineCap='round';x.lineWidth=6;x.strokeStyle=C.plum;x.beginPath();x.moveTo(-28,Tp+2);x.lineTo(-52,Tp-28);x.moveTo(28,Tp+2);x.lineTo(52,Tp-28);x.stroke();
  for(const [ax,c] of [[-52,C.pink],[52,C.mint]]){x.beginPath();x.arc(ax,Tp-30,o.chg?9+2*Math.sin(t*24):8,0,TAU);x.fillStyle=o.chg&&Math.floor(t*12)%2?C.butter:c;x.fill();x.lineWidth=3;x.strokeStyle=C.plum;x.stroke()}
  zkRR(x,L-5,Tp,bw,bh,26);x.fillStyle=C.pink;x.fill();zkRR(x,L+5,Tp,bw,bh,26);x.fillStyle=C.mint;x.fill();zkRR(x,L,Tp,bw,bh,26);x.fillStyle=C.plum;x.fill();
  const sx=L+14,sy=Tp+14,sw=bw-62,sh=bh-28;
  x.save();zkRR(x,sx,sy,sw,sh,18);x.clip();x.imageSmoothingEnabled=false;if(SPR.noise&&SPR.noise.length)x.drawImage(SPR.noise[Math.floor(t*14)%4],sx,sy,sw,sh);
  if(face==='charge'){x.globalAlpha=.18+.12*Math.sin(t*30);x.fillStyle=C.butter;x.fillRect(sx,sy,sw,sh);x.globalAlpha=1}
  zkFaceTo(x,face,sx,sy,sw/22,sh/14);x.restore();
  const px=L+bw-38;x.beginPath();x.arc(px+12,Tp+30,10,0,TAU);x.fillStyle=C.butter;x.fill();x.lineWidth=3;x.strokeStyle=C.cream;x.stroke();
  x.beginPath();x.arc(px+12,Tp+58,10,0,TAU);x.fillStyle=C.coral;x.fill();x.stroke();
  x.textAlign='center';x.textBaseline='middle';x.font='11px "DotGothic16",monospace';x.fillStyle=C.cream;x.fillText('CH',px+12,Tp+84);x.font='15px "DotGothic16",monospace';x.fillStyle=C.mint;x.fillText('01',px+12,Tp+102);
  x.fillStyle=C.plum;x.fillRect(-56,Tp+bh,30,14);x.fillRect(26,Tp+bh,30,14);
  x.restore()}
// 見せ場：見たことのある表情の場面だけ、順に。表情のボタンでその場面へ
const ZK_BOSS_SEQ=[{f:'angry',d:2},{f:'charge',d:1.4,say:'むむむ…',chg:1},{f:'fire',d:1.2,say:'えーいっ！',atk:'ring'},{f:'angry',d:2.4,atk:'nums',need:'fire'},{f:'hurt',d:1.3,say:'いたた〜！'},{f:'worry',d:1.8,say:'ピンチ…！'}];
let zkBoss={i:0,t0:0};
const zkBossOk=q=>q.f==='angry'&&!q.need||!!ZK.f[q.need||q.f];
function zkBossJump(f){const i=ZK_BOSS_SEQ.findIndex(q=>q.f===f&&!q.need);if(i>=0)zkBoss={i,t0:performance.now()/1000}}
function zkBossScene(x,W,H,t,big){
  if(!big){zkBossDraw(x,W/2,H/2+H*.05,Math.min(W/210,H/178),t,(t%2.8)<.13?'blink':'angry',{});return}
  let st=ZK_BOSS_SEQ[zkBoss.i],lt=t-zkBoss.t0,guard=0;
  while((lt>st.d||!zkBossOk(st))&&guard++<20){zkBoss.t0+=zkBossOk(st)?st.d:lt;zkBoss.i=(zkBoss.i+1)%ZK_BOSS_SEQ.length;st=ZK_BOSS_SEQ[zkBoss.i];lt=t-zkBoss.t0}
  const s=Math.min(W/330,H/250),cx=W*.6,cy=H*.56,vol=lt%.8;
  let face=st.f;if(st.atk==='nums'&&vol<.3)face='fire';else if(face==='angry'&&(t%2.8)<.13)face='blink';
  const fx=st.atk==='ring'&&lt<.4?.4-lt:st.atk==='nums'&&vol<.3?.3-vol:0;
  zkBossDraw(x,cx,cy,s,t,face,{chg:st.chg,fx,hurt:st.f==='hurt'&&lt<.6?1-lt/.6:0});
  if(st.chg){for(let i=0;i<6;i++){const pr=(t*1.6+i/6)%1,a=i*TAU/6+t*1.2,r=lerp(110,26,pr)*s,px=cx-22*s+Math.cos(a)*r,py=cy+Math.sin(a)*r*.8;x.globalAlpha=pr;x.fillStyle=i%2?C.butter:C.pink;x.fillRect(px-1*s,py-4*s,3*s,9*s);x.fillRect(px-4*s,py-1*s,9*s,3*s)}x.globalAlpha=1}
  const orb=(ox,oy)=>{x.beginPath();x.arc(ox,oy,7*s,0,TAU);x.fillStyle=C.pink;x.fill();x.lineWidth=2*s;x.strokeStyle=C.plum;x.stroke();x.beginPath();x.arc(ox-2*s,oy-2*s,2.5*s,0,TAU);x.fillStyle=C.cream;x.fill()};
  if(st.atk==='ring'){const r=lt*170*s;for(let i=0;i<10;i++){if(i===6||i===7)continue;const a=i*TAU/10+.2;orb(cx-50*s+Math.cos(a)*r,cy+Math.sin(a)*r)}}   // 輪の弾（かならず通り道がある）
  if(st.atk==='nums'){for(let v=0;v*0.8<=lt;v++){const age=lt-v*.8;for(let j=-1;j<=1;j++){const a=Math.PI+j*.22,d=age*190*s,nx=cx-60*s+Math.cos(a)*d,ny=cy+Math.sin(a)*d;if(nx<-20)continue;
      zkRR(x,nx-9*s,ny-9*s,18*s,18*s,5*s);x.fillStyle=C.cream;x.fill();x.lineWidth=3*s;x.strokeStyle=C.plum;x.stroke();x.fillStyle=C.plum;x.font=`${Math.round(13*s)}px "DotGothic16",monospace`;x.textAlign='center';x.textBaseline='middle';x.fillText(String(j+2),nx,ny+s)}}}
  if(st.say&&lt<st.d-.12){const fs=Math.max(11,Math.round(15*s*1.1));x.font=`800 ${fs}px "M PLUS Rounded 1c",sans-serif`;const tw=x.measureText(st.say).width+fs*1.4,th=fs*1.9,bx=cx-102*s-tw,by=cy-58*s-th/2;
    x.globalAlpha=clamp(Math.min(lt*6,(st.d-lt)*5),0,1);zkRR(x,bx,by,tw,th,10*s);x.fillStyle=C.cream;x.fill();x.lineWidth=2.5*s;x.strokeStyle=C.plum;x.stroke();
    x.beginPath();x.moveTo(bx+tw-2,by+th*.35);x.lineTo(bx+tw+12*s,by+th*.6);x.lineTo(bx+tw-2,by+th*.75);x.closePath();x.fill();x.beginPath();x.moveTo(bx+tw-2,by+th*.35);x.lineTo(bx+tw+12*s,by+th*.6);x.lineTo(bx+tw-2,by+th*.75);x.stroke();
    x.fillStyle=C.plum;x.textAlign='center';x.textBaseline='middle';x.fillText(st.say,bx+tw/2,by+th/2+1);x.globalAlpha=1}
}

/* ===== ポータル用の口 ===== */
G.D=DIFF.normal;
// 本編の「図鑑の動き」をそのまま、好きな場所（px,py）・大きさ（k）で描く。まん中が (px,py)
function liveState(id){const D=ZK_LIVE[id];let s=ZK_LV[id];
  if(!s){s=ZK_LV[id]={e:zkMk(D.mk)};const e=s.e;if(D.init)D.init(s,e);
    if(D.box){s.box=D.box;s.c=D.c||[0,0]}
    else{const q=bigCv(e.art).box,k=e.k,p=D.pad??16,l=D.padL||0,tp=D.padT||0;s.box=[q.w/2*k+p*2+l,q.h/2*k+p*2+tp];s.c=[((q.x+q.w/2)/2-170)*k-l/2,((q.y+q.h/2)/2-140)*k-tp/2]}}
  return s}
function drawLiveAt(x,id,px,py,k,t){const D=ZK_LIVE[id];if(!D)return false;const s=liveState(id),e=s.e;e.t=t;e.flash=0;const L=(D.tick&&D.tick(e,t,s))||[e];
  const sv=ctx,vm=VIEW.mode;ctx=x;VIEW.mode='yoko';x.save();x.translate(px-s.c[0]*k,py-s.c[1]*k);x.scale(k,k);x.imageSmoothingEnabled=!D.box||!!D.smooth;
  try{if(D.pre)D.pre(e,t,s);for(const q of L)drawEnemy(q);if(D.post)D.post(e,t,s)}catch(_){}finally{x.restore();x.globalAlpha=1;ctx=sv;VIEW.mode=vm}return true}
// ステージ1のキャラ（ザザ・ブラウン・アンテナイカ・UFO・雲・ラグラグ・メイワクメール・グルグル・デカザザ・スナアラシ大王）：本編の drawEnemy の型で
const SIMPLE={zaza:'mini',braun:'braun1',ika:'fika',ufo:'ufo',cloud:'cloud',lag:'lag',mail:'mail',guru:'guru',deka:'deka',boss:'boss'};
const SIMPLE_E={};
function drawSimpleAt(x,id,px,py,k,t){const ty=SIMPLE[id];if(!ty)return false;let e=SIMPLE_E[id];if(!e)e=SIMPLE_E[id]={type:ty,t:0,x:0,y:0,flash:0,hp:1,maxhp:1,fx:0,ready:true,atk:1,ch:0};e.t=t;
  const sv=ctx;ctx=x;x.save();x.translate(px,py);x.scale(k,k);try{drawEnemy(e)}catch(_){}finally{x.restore();x.globalAlpha=1;ctx=sv}return true}
// どれでも：id を見て えらぶ
function drawCharAt(x,id,px,py,k,t){if(ZK_LIVE[id])return drawLiveAt(x,id,px,py,k,t);if(SIMPLE[id])return drawSimpleAt(x,id,px,py,k,t);
  const s=SPR[id]&&SPR[id][Math.floor(t*2.5)%SPR[id].length];if(s){x.save();x.translate(px,py);x.scale(k,k);x.imageSmoothingEnabled=false;x.drawImage(s.img,-s.w/2,-s.h/2);x.restore();return true}return false}
// 大きさの目安（ゲーム座標でのおよその幅・高さ）
function charBox(id){if(ZK_LIVE[id]){const s=liveState(id);return {w:s.box[0],h:s.box[1]}}const s=SPR[id]&&SPR[id][0];if(s)return {w:s.w,h:s.h};if(id==='guru')return {w:34,h:34};if(id==='boss')return {w:200,h:180};return {w:40,h:40}}
function init(base){buildSprites();return loadImages(base)}
return {R_A,RM_A,C,PAL,PAL2,SPR,IMG,G,VIEW,FACES,ST_BIG,ST_DRAW,ZK_LIVE,ZK_LV,SIMPLE,init,buildSprites,loadImages,drawEnemy,spr,sprK,mkSprite,zkLive,zkAnim,zkTenten,zkBossScene,zkBossDraw,zkKara,zkP404,bigCv,drawBig,zkMk,E,bubble,T,RSTARS,zkPic,drawLiveAt,drawSimpleAt,drawCharAt,charBox,setCtx:x=>{ctx=x},getCtx:()=>ctx};

})();
