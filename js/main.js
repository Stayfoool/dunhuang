/* ============================================================
   莫高 · 白日 — 敦煌洞窟白日漫游
   静的交给画,活的交给代码:视差 / 光柱 / 浮尘 / 飘带 / 散花
   ============================================================ */
"use strict";

/* ---------- 场景与素材 ---------- */
const AR = 1400 / 940;                 // 底图宽高比
const stage  = document.getElementById("stage");
const scene  = document.getElementById("scene");
const fx     = document.getElementById("fx");
const ctx    = fx.getContext("2d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const scenePos = { left: 0, top: 0, w: 0, h: 0 };
const lamp  = { x: 0, y: 0, tx: 0, ty: 0, moved: false }; // 场景内像素坐标(夜灯)
const motion = { v: 0 };                       // 交互运动量 0..1(驱动风声)
const lampProx = { v: 0 };                     // 灯与长明灯焰的邻近度

/* ---------- 崖面:三个洞窟,可穿行观赏 ----------
   史实核对:窟号、年代、事件均据公开资料;底图为 AI 原创插画,
   是「以某窟为原型所作的画」,不是该窟的扫描件或照片。 */
const CAVES = [
  { id: "c328", num: "328", img: "assets/cave-day.png", niche: true,
    name: { zh: "第 328 窟 · 空龛", en: "Cave 328 · The Empty Niche" },
    door: { zh: "空龛", en: "Niche" },
    proto: {
      zh: "原型:莫高窟第 328 窟(初唐)。龛内那尊跪姿供养菩萨 1924 年被兰登·华尔纳带往哈佛,原位自此空着。",
      en: "After Mogao Cave 328 (Early Tang). In 1924 Langdon Warner took its kneeling bodhisattva to Harvard; the niche has stood empty since.",
    },
    flames: [
      { x: 0.13, y: 0.895, s: 1.0,  ph: 0.0 },
      { x: 0.375, y: 0.945, s: 0.8, ph: 1.7 },
      { x: 0.63, y: 0.925, s: 0.9,  ph: 3.1 },
      { x: 0.885, y: 0.865, s: 1.1, ph: 4.6 },
    ],
    hotspots: [
      { x: 45.8, y:  9.5,
        title: "藻井 · 窟顶之心", sub: "斗四叠涩 · 莲花天穹",
        en: { title: "Caisson · Heart of the Ceiling", sub: "Stepped canopy · lotus sky",
          text: "At the centre of the ceiling a stepped zaojing caisson rises inward like an inverted sky, blooming with a single lotus. Dunhuang's most famous caisson riddle is the 'three hares, three ears' — Sui-dynasty ceilings (Cave 407 above all) show three hares chasing in a circle, sharing three ears, yet each seems to have two. It is Dunhuang's loveliest visual puzzle." },
        text: "窟顶正中的斗四藻井,层层叠涩如天穹倒悬,中心一朵盛放的莲花。敦煌藻井里最著名的图像谜题是「三兔共耳」——隋代诸窟(以第 407 窟最著)的三只兔子绕圈追逐,共用三只耳朵,却仿佛人人都有双耳。它是敦煌留给世界的图像谜题。" },
      { x: 11.0, y: 20.5,
        title: "飞天 · 无翼而翔", sub: "不靠翅膀,只凭飘带",
        en: { title: "Apsaras · Flight Without Wings", sub: "No wings — only ribbons",
          text: "Dunhuang apsaras have no wings and tread no clouds; they fly by ribbon and gesture alone. From the stiff, Western-looking figures of the early caves they grew into the weightless grace of High Tang — the painters' proof that flight needs no wings, only wind, silk, and heart." },
        text: "飞天不长翅膀,也不踏云朵,只凭一条飘带与自身姿态凌空。她们从早期西域式样的朴拙,一路飞成盛唐的轻盈——画工用线条证明:飞翔不必有翅膀,有风、有衣袂、有心即可。" },
      { x: 29.0, y: 57.0,
        title: "千佛 · 壁上织锦", sub: "成行成列 · 佛光普照",
        en: { title: "Thousand Buddhas · Woven Wall", sub: "Rows upon rows · light on all",
          text: "Small Buddhas alternate in azurite, malachite and red ochre, row upon row like a bolt of brocade. As daylight drifts across, each figure lights up in turn — the ancients called it 'Buddha-light shining on all'; we call it rhythm." },
        text: "小佛按石青、石绿、赭红交替排布,成行成列,远看如一匹织锦。日光缓缓移过,每尊小佛的高光依次亮起——古人称之为「佛光普照」,今人称之为韵律。" },
      { x: 50.2, y: 53.0,
        title: "主尊 · 一壁经变", sub: "把佛经画成一面墙",
        en: { title: "The Principal Buddha · One Wall of Sutra", sub: "A scripture painted as a wall",
          text: "The central Buddha wears a full-shoulder robe, halo within halo. Tang painters turned whole walls into sutra scenes — scripture made visible, so that those who could not read might 'read' before the wall. Information design, a thousand years early." },
        text: "正壁中央的立佛身披通肩袈裟,头光背光层层相套。唐人把整面墙壁画成一铺经变——将佛经化作画面,让不识字的人也能在壁前「读经」。这是一千年前的信息设计。" },
      { x: 86.2, y: 68.0,
        title: "真身 · 借灯还乡", sub: "第 328 窟 · 初唐跪姿菩萨",
        en: { sub: "Cave 328 · Kneeling Bodhisattva, Early Tang",
          title: "True Body · Home by Lamplight",
          text: "In 1924 Langdon Warner carried this kneeling bodhisattva from Cave 328 to Harvard; its niche has stood empty ever since. By day, the niche is empty. At night, hold your lamp here — a while — and the colours slowly wake, as if it knows this light. The pigments of a thousand years remain; the traveller too; all that is missing is the journey home." },
        photos: [
          { bg: "assets/bodhisattva.jpg", pos: "50% 18%",
            cap: { zh: "今日真身 · 哈佛艺术博物馆(照片 CC BY-SA 4.0 Patrick20242023 / Wikimedia Commons)",
                   en: "Today: Harvard Art Museums (photo CC BY-SA 4.0 Patrick20242023 / Wikimedia Commons)" } },
          { bg: "assets/warner-1924.jpg", pos: "50% 42%",
            cap: { zh: "1924 年,它被抬出 328 窟的那一天(公有领域 · 敦煌研究院)",
                   en: "1924: the day it was carried out of Cave 328 (public domain · Dunhuang Academy)" } },
        ],
        text: "1924 年,兰登·华尔纳将这尊跪姿供养菩萨带往哈佛,原位空龛至今。白天,龛是空的;入夜后把灯照在这里,久一点——颜色会一点点苏醒,像认得这盏灯。千年前的颜彩仍在,离乡的菩萨也仍在,只差一次还乡。" },
      { x: 55.0, y: 19.0, uvOnly: true,
        title: "题记 · 底层与过客", sub: "紫外荧光 · 重层壁画",
        en: { title: "Inscriptions · Layers & Passers-by", sub: "UV fluorescence · repainted walls",
          text: "The wall is a mille-feuille of time: Northern Wei beneath Sui-Tang, Sui-Tang beneath Song-Yuan. Later painters plastered and repainted; earlier work sank below. UV fluorescence makes the buried pigments surface again. What you see — inscription frames, unfinished sketches, repair seams — is artistic interpretation, not survey data. But the pilgrim inscriptions left on these walls in Chinese, Tibetan, Khotanese and Uyghur are real: they too were figures on the wall." },
        text: "莫高窟的墙是时间的千层饼:北魏之上叠隋唐,隋唐之上叠宋元。后人抹泥重绘,前朝便沉入底层;紫外荧光成像,能让底层颜料重新显形。此刻看见的题记框、未完成的底稿与修补接缝是艺术演绎,不是洞窟实测——但历代行旅留在壁上的汉文、藏文、于阗文、回鹘文题记是真的:他们也曾是这面墙的画中人。" },
    ],
  },
  { id: "jingbian", num: "220", img: "assets/cave-jingbian.png",
    name: { zh: "第 220 窟 · 经变", en: "Cave 220 · Sutra Tableau" },
    door: { zh: "经变", en: "Sutra" },
    proto: {
      zh: "原型:莫高窟第 220 窟(初唐 · 翟氏家窟)。南壁西方净土变、北壁药师经变;1944 年剥离表层宋画,初唐原作重现。",
      en: "After Mogao Cave 220 (Early Tang, the Zhai family cave). Pure Land on the south wall, Medicine Buddha on the north; in 1944 the overlying Song painting was removed and the Tang originals returned.",
    },
    flames: [ { x: 0.885, y: 0.85, s: 1.15, ph: 0.0 } ],
    hotspots: [
      { x: 65.0, y: 45.0,
        title: "经变 · 说法之会", sub: "第 220 窟 · 初唐贞观十六年",
        en: { title: "The Great Assembly", sub: "Cave 220 · Early Tang, Zhenguan 16 (642)",
          text: "In 642 the Zhai family opened this cave: the south wall a Western Pure Land, the north wall a Medicine Buddha tableau — tiered halls, ranks of musicians, lamp-towers blazing, one sutra unfolded into a whole assembly. In 1944 the Dunhuang Academy stripped away the Song painting laid over it, and these Early Tang originals saw light again." },
        text: "贞观十六年(642),翟氏一家开出此窟:南壁画西方净土变,北壁画药师经变——殿宇重重、伎乐成行、灯楼高燃,把一部经文铺成一壁会众。1944 年敦煌艺术研究所剥离表层宋画,这些初唐原作才重见天日。" },
      { x: 58.0, y: 16.0,
        title: "伎乐 · 天乐自鸣", sub: "药师经变 · 不鼓自鸣",
        en: { title: "Music That Plays Itself", sub: "Instruments that sound without hands",
          text: "Above the tableau, panpipes, konghou harps, zithers and flutes hang among the clouds and play themselves — no player in sight. Below, rows of dancers: whirling Central Asian turns, waist drums, long sleeves. The painter moved Chang'an's music into the Buddha's land: beauty itself is the performer, and the direction of the ribbons is the score of the wind." },
        text: "经变之上,排箫、箜篌、筝、笛自悬云间,不鼓自鸣;下方是成行的乐舞图,胡旋、腰鼓、长袖。画工把长安的乐舞搬进了佛国——美本身即是奏者,飘带翻卷的方向,就是风的乐谱。" },
      { x: 88.0, y: 84.0,
        title: "灯烛 · 长明之火", sub: "灯楼灯轮 · 开窟人的愿",
        en: { title: "The Lamp · Always Lit", sub: "Lamp-towers · the patron's wish",
          text: "The Medicine Buddha tableau paints tall lamp-towers and wheel-stands, tier upon tier of flame burning through the night — and here at the foot of the wall burns one more, the same wish in oil: while the lamp burns, the merit never dies. The lamp in the painting has been burning for its patron for fourteen hundred years." },
        text: "药师经变里画着高高的灯楼与灯轮,层层灯火通夜不熄;壁下这一盏,是同一个愿:灯不灭,功德就不熄。画里的灯,替开窟的人亮了一千四百年。" },
    ],
  },
  { id: "nirvana", num: "158", img: "assets/cave-nirvana.png",
    name: { zh: "第 158 窟 · 涅槃", en: "Cave 158 · Nirvana" },
    door: { zh: "涅槃", en: "Nirvana" },
    proto: {
      zh: "原型:莫高窟第 158 窟(中唐 · 涅槃窟)。主室横长,卧佛长约十五米;举哀人群中有各国王子,以割耳剺面之俗致哀。",
      en: "After Mogao Cave 158 (Middle Tang, the Nirvana cave). A wide hall with a reclining Buddha some fifteen metres long; among the mourners are foreign princes, who cut their ears and faces in grief.",
    },
    flames: [
      { x: 0.2, y: 0.93, s: 0.85, ph: 2.0 },
      { x: 0.78, y: 0.95, s: 0.9, ph: 4.1 },
    ],
    hotspots: [
      { x: 50.0, y: 52.0,
        title: "涅槃 · 右胁而卧", sub: "第 158 窟 · 中唐涅槃窟",
        en: { title: "Nirvana · Reclining on the Right Side", sub: "Cave 158 · Middle Tang, the Nirvana cave",
          text: "Cave 158 is a Middle Tang nirvana cave: the main chamber runs wide and long, and the reclining Buddha measures some fifteen metres. He lies on his right side, feet stacked, features at peace — in Buddhism nirvana is not death but release from the wheel of rebirth. The mourners stand around the couch, so that grief and stillness share one painting." },
        text: "第 158 窟是中唐的涅槃窟:主室横长,卧佛长约十五米。佛右胁而卧,双足相叠,眉目安然——涅槃在佛教里不是死去,是从轮回中超越。举哀的人群绕床而立,悲与安住在同一幅画里。" },
      { x: 17.0, y: 40.0,
        title: "举哀 · 弟子与各国王子", sub: "涅槃变 · 割耳剺面",
        en: { title: "Mourning · Disciples and Foreign Princes", sub: "The Nirvana tableau · cutting ear and face",
          text: "Before the couch runs the Nirvana tableau: Kasyapa, Ananda and the other disciples stricken; behind them the princes of many lands — the Tibetan btsan-po among them, and envoys of the Western Regions — mourning in the custom of cutting the ear and slashing the face. They are not figures from a text; they were the real world of that day, painted by someone who had watched it grieve." },
        text: "床前是《涅槃变》:迦叶、阿难等弟子怆然,后列各国王子——吐蕃赞普与西域诸国的使者,以割耳、剺面之俗表达哀恸。他们不是经文里的人物,是当时真实的世界。" },
    ],
  },
];
let CAVE_I = 0;
const currentCave = () => CAVES[CAVE_I];
/* 摊平为全局热点表(供每窟热点取全局索引,悬停音高按此排音) */
const HOTSPOTS = [];
CAVES.forEach((c) => c.hotspots.forEach((hs) => { hs.cave = c.id; hs._i = HOTSPOTS.length; HOTSPOTS.push(hs); }));

/* ---------- 底图:按洞窟按需加载并缓存 ---------- */
const imgStore = {};                       // caveId -> HTMLImageElement
function caveImg(c) {
  if (imgStore[c.id]) return imgStore[c.id];
  const im = new Image();
  im.src = c.img;
  im.decode().catch(() => {});
  imgStore[c.id] = im;
  return im;
}
const cimg = () => caveImg(currentCave());
/* 首窟先加载,其余在后台静默预热,换窟时不黑屏 */
CAVES.slice(1).forEach((c) => caveImg(c));

let lang = "zh";                            // 界面语言(提前声明,热点生成即用)

/* ---------- 场景铺满(复现 cover 裁切,保证朱砂点贴合画面) ---------- */
function sizeScene() {
  const w = innerWidth, h = innerHeight;
  let sw, sh;
  if (w / h > AR) { sw = w; sh = w / AR; } else { sh = h; sw = h * AR; }
  scene.style.width  = sw + "px";
  scene.style.height = sh + "px";
  scene.style.left   = (w - sw) / 2 + "px";
  scene.style.top    = (h - sh) / 2 + "px";
  scenePos.left = (w - sw) / 2;
  scenePos.top  = (h - sh) / 2;
  scenePos.w = sw; scenePos.h = sh;
  if (!lamp.moved) {
    lamp.x = lamp.tx = sw * 0.5;
    lamp.y = lamp.ty = sh * 0.45;
  } else {
    lamp.x = clamp(lamp.x, 0, sw);  lamp.y = clamp(lamp.y, 0, sh);
    lamp.tx = clamp(lamp.tx, 0, sw); lamp.ty = clamp(lamp.ty, 0, sh);
  }
}
addEventListener("resize", sizeScene);
sizeScene();

/* ---------- 朱砂点:只生成当前洞窟的,换窟时重建 ---------- */
const hotspotRefs = [];
function buildHotspots() {
  for (const r of hotspotRefs) r.b.remove();
  hotspotRefs.length = 0;
  for (const s of currentCave().hotspots) {
    const b = document.createElement("button");
    b.className = "hotspot" + (s.uvOnly ? " uv-only" : "");
    b.style.left = s.x + "%";
    b.style.top  = s.y + "%";
    b.setAttribute("aria-label", s.title);
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = (lang === "en" && s.en ? s.en.title : s.title).split(" · ")[0];
    b.appendChild(label);
    hotspotRefs.push({ s, b, label });
    /* 悬停轻音:每个热点一枚略高的音,像风过铃檐 */
    b.addEventListener("mouseenter", () => playTick(s._i));
    b.addEventListener("click", (e) => { e.stopPropagation(); openCard(s); });
    scene.appendChild(b);
  }
}
buildHotspots();

/* 悬停轻音 */
function playTick(i) {
  if (!audio || !soundOn) return;
  const { ac, master } = audio;
  const t = ac.currentTime;
  const o = ac.createOscillator(); o.type = "sine";
  o.frequency.value = 1046.5 * Math.pow(1.1225, i);      // 每个热点高一音
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.045, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.75);
}

/* ---------- 故事卡片 ---------- */
const card     = document.getElementById("card");
const cardMask = document.getElementById("cardMask");
const cardImg  = document.getElementById("cardImg");

function openCard(s) {
  /* 双语:英文取该热点自带的 en 文案 */
  const loc = (lang === "en" && s.en) ? s.en : s;
  document.getElementById("cardTitle").textContent = loc.title;
  document.getElementById("cardSub").textContent   = loc.sub;
  document.getElementById("cardText").textContent  = loc.text;
  /* 卡片配图:单图=当前洞窟底图对应处放大 300%;photos 数组=真迹照片拼版 */
  if (s.photos) {
    cardImg.style.backgroundImage = "none";
    cardImg.style.backgroundSize = "";
    cardImg.style.backgroundPosition = "";
    cardImg.innerHTML =
      '<div class="card-img-stack">' +
      s.photos.map(p => {
        const cap = typeof p.cap === "string" ? p.cap : p.cap[lang];
        return `<div style="background-image:url('${p.bg}');background-position:${p.pos}">` +
               `<span class="card-img-cap">${cap}</span></div>`;
      }).join("") +
      "</div>";
  } else {
    cardImg.innerHTML = "";
    cardImg.style.backgroundImage = `url('${cimg().src}')`;
    /* 同一张底图放大 300%,把热点所在处移到图框正中
       推导:left = P·(1-B)·W,要求图像上 f=c 处落在图框 0.5 处
       → P = (0.5 - c·B) / (1 - B) */
    const B = 3;                               // background-size 300%
    const px = (p) => (0.5 - (p / 100) * B) / (1 - B) * 100;
    cardImg.style.backgroundSize = B * 100 + "%";
    cardImg.style.backgroundPosition =
      clamp(px(s.x), 0, 100) + "% " + clamp(px(s.y), 0, 100) + "%";
  }
  card.classList.add("open");
  card.setAttribute("aria-hidden", "false");
  cardMask.classList.add("show");
  document.body.classList.add("card-open");
}
function closeCard() {
  card.classList.remove("open");
  card.setAttribute("aria-hidden", "true");
  cardMask.classList.remove("show");
  document.body.classList.remove("card-open");
}
document.getElementById("cardClose").addEventListener("click", closeCard);
cardMask.addEventListener("click", closeCard);
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeCard();
    creditsPanel.classList.remove("open");
    creditsPanel.setAttribute("aria-hidden", "true");
  }
});

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* ---------- 视差:壁画微移,画布反向,景深三层 ---------- */
const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
function pointer(e) {
  const p = e.touches ? e.touches[0] : e;
  if (pano.on) {
    /* 环视时镜头由拖拽接管,视差归零,只留灯跟着指尖 */
    parallax.tx = parallax.ty = 0;
  } else {
    parallax.tx = (p.clientX / innerWidth  - 0.5) * 2;   // -1 .. 1
    parallax.ty = (p.clientY / innerHeight - 0.5) * 2;
  }
  if (!lamp.moved) {
    lamp.moved = true;
    lamp.x = lamp.tx = p.clientX - scenePos.left;
    lamp.y = lamp.ty = p.clientY - scenePos.top;
  } else {
    lamp.tx = p.clientX - scenePos.left;
    lamp.ty = p.clientY - scenePos.top;
  }
}
addEventListener("mousemove", pointer, { passive: true });
addEventListener("touchmove", pointer, { passive: true });

/* ---------- 昼夜:0 白日 → 1 夜游 ---------- */
const night = { v: 0, target: 0 };
const nightVeil = document.getElementById("nightVeil");
const muralGlow = document.getElementById("muralGlow");
const lampGlow  = document.getElementById("lampGlow");
const nightToggle = document.getElementById("nightToggle");
const hintEl = document.getElementById("hint");
const HINT_KEYS = { day: "day", night: "night", uv: "uv" };

/* ---------- 双语文案 ---------- */
const I18N = {
  zh: {
    chip: "莫高 · 白日",
    introTitle: "莫高 · 白日",
    quote: "白日入窟,千年未醒。",
    note: "敦煌 · 莫高窟 · 三窟白日漫游",
    enter: "入&ensp;窟",
    phasePrefix: "此刻莫高 · ",
    phases: { dawn: "晨光", morning: "上午", noon: "正午", afternoon: "西斜", dusk: "暮色", night: "夜" },
    hintDay: "移动光影,随你流转 · 点朱砂,听壁上故事 · ← → 过窟",
    hintNight: "一盏灯随你走 · 照久处,颜色回鲜 · ← → 过窟",
    hintUV: "紫外灯下\u00a0\u00a0·\u00a0\u00a0看见被覆盖的底层",
    hintPano: "按住拖动,环视洞窟\u00a0\u00a0·\u00a0\u00a0转身,是进来时的门",
    ariaNight: "入夜", ariaDay: "破晓", ariaPano: "环视洞窟", ariaWall: "回到墙上",
    creditsChip: "素材与授权",
    creditsTitle: "素材与授权",
    credits: [
      "洞窟壁画底图 — AI 生成原创插画(imagegen)。三窟分别以莫高窟第 328、220、158 窟为原型所作,不是任何真实洞窟的扫描或照片。",
      "菩萨照片 — CC BY-SA 4.0 · Patrick20242023 / Wikimedia Commons(裁切并覆盖展签、压暗射灯)。",
      "1924 年历史照片 — 公有领域 · 敦煌研究院。",
      "全部声音 — 浏览器 Web Audio 实时合成,无音频素材。",
      "紫外显形层 — 艺术演绎,非洞窟实测数据。",
      "窟号、年代与史实依据公开资料;窟内画面为艺术再创作。",
      "完整清单见仓库 CREDITS.md。",
    ],
    walking: "穿过崖壁…",
    caveAria: (n) => `前往第 ${n} 窟`,
  },
  en: {
    chip: "Mogao · Daylight",
    introTitle: "MOGAO · DAYLIGHT",
    quote: "Daylight enters the cave. A thousand years have not awakened.",
    note: "The Mogao Caves, Dunhuang · three caves, a daylight wandering",
    enter: "ENTER",
    phasePrefix: "Right now at Mogao · ",
    phases: { dawn: "First Light", morning: "Morning", noon: "Noon", afternoon: "Western Sun", dusk: "Dusk", night: "Night" },
    hintDay: "Move with the light · Tap the cinnabar dots · ← → Change cave",
    hintNight: "A lamp follows you · Dwell long, colours wake · ← → Change cave",
    hintUV: "Under UV light\u00a0\u00a0·\u00a0\u00a0see what was painted over",
    hintPano: "Press and drag to look around\u00a0\u00a0·\u00a0\u00a0behind you is the door you came in by",
    ariaNight: "Enter night", ariaDay: "Break of day", ariaPano: "Look around", ariaWall: "Back to the wall",
    creditsChip: "Credits & Licensing",
    creditsTitle: "Credits & Licensing",
    credits: [
      "Cave mural base — original AI-generated illustrations (imagegen). The three caves are drawn after Mogao Caves 328, 220 and 158; none is a scan or photo of a real cave.",
      "Bodhisattva photo — CC BY-SA 4.0 · Patrick20242023 / Wikimedia Commons (cropped; label covered; spotlights dimmed).",
      "1924 historical photo — public domain · Dunhuang Academy.",
      "All sound — synthesized live in your browser with Web Audio; no audio files.",
      "UV layer — artistic interpretation, not survey data.",
      "Cave numbers, dates and events follow published sources; the painted scenes are artistic re-creations.",
      "Full list: CREDITS.md in the repository.",
    ],
    walking: "Walking the cliff…",
    caveAria: (n) => `Go to Cave ${n}`,
  },
};
const T = () => I18N[lang];

function hintForState() {
  if (pano.on) return T().hintPano;
  return uv.on ? T().hintUV : (night.target ? T().hintNight : T().hintDay);
}

function setNight(toNight) {
  night.target = toNight ? 1 : 0;
  document.body.classList.toggle("night", toNight);
  nightToggle.textContent = toNight ? "日" : "夜";
  nightToggle.setAttribute("aria-label", toNight ? T().ariaDay : T().ariaNight);
  hintEl.textContent = hintForState();
  /* 风声的明暗由主循环按帧调制,这里不再直接设值 */
}
nightToggle.addEventListener("click", () => { setNight(night.target === 0); });

/* ============================================================
   时间驱动日照:光柱角度/色温/强弱由此刻敦煌的太阳决定
   莫高窟约 40.04°N, 94.81°E,窟面东——晨光斜入最盛,正午微光,午后转暗
   ============================================================ */
const shaftEl = document.querySelector(".shaft");
const shaftCoreEl = document.querySelector(".shaft-core");
const introPhase = document.getElementById("introPhase");
const shaftEnd = { x: 0.52, y: 0.78 };         // 光带末端(比例坐标,随太阳更新)
let autoNight = false;

/* 太阳位置(NOAA 近似):返回高度角/方位角(度) */
function solarPos(date) {
  const rad = Math.PI / 180;
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
  const eps = 23.439 * rad;
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));       // 赤纬
  const ra = (Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / rad + 360) % 360; // 赤经 0..360
  /* 格林尼治恒星时 → 敦煌(94.81°E)地方时角 */
  const gmstDeg = (((18.697374558 + 24.06570982441908 * n) * 15) % 360 + 360) % 360;
  let haDeg = gmstDeg + 94.81 - ra;
  haDeg = ((haDeg % 360) + 360) % 360;
  if (haDeg > 180) haDeg -= 360;                                  // -180..180
  const H = haDeg * rad;
  const lat = 40.04 * rad;
  const sinAlt = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));    // 弧度
  const alt = altRad / rad;                                       // 输出用角度
  const cosAz = (Math.sin(decl) - sinAlt * Math.sin(lat)) /
                Math.max(1e-9, Math.cos(altRad) * Math.cos(lat));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) / rad;
  if (haDeg > 0) az = 360 - az;                                   // 时角为正 → 太阳在西
  return { alt, az };
}

function phaseName(alt, az) {
  if (alt <= -6) return "night";
  if (alt < 10) return az < 170 ? "dawn" : "dusk";
  if (az < 150) return "morning";
  if (az < 210) return "noon";
  return "afternoon";
}

function applyDaylight() {
  const { alt, az } = solarPos(new Date());
  const phaseKey = phaseName(alt, az);
  introPhase.textContent = T().phasePrefix + T().phases[phaseKey];

  /* 强度 = 高度角曲线 × 朝东对准度(窟面东,方位 95° 附近最盛) */
  let elevF;
  if (alt <= -6) elevF = 0;
  else if (alt < 4) elevF = 0.55 * (alt + 6) / 10;
  else if (alt < 30) elevF = 0.55 + 0.45 * (alt - 4) / 26;
  else if (alt < 60) elevF = 1 - 0.5 * (alt - 30) / 30;
  else elevF = 0.5;
  const azF = Math.max(0, Math.cos((az - 95) * Math.PI / 180));
  const strength = elevF * (0.25 + 0.75 * azF);
  const k = 0.25 + 0.75 * strength;                        // 光柱透明度系数
  const warmth = Math.max(0, Math.min(1, (14 - alt) / 26));
  const angle = Math.max(96, Math.min(150, 96 + (az - 90) * 0.4));

  /* 色温:中性(255,240,214) ↔ 暖(255,205,150) */
  const mix = (a, b) => Math.round(a + (b - a) * warmth);
  const R = 255, G = mix(240, 205), B2 = mix(214, 150);
  shaftEl.style.background = `linear-gradient(${angle}deg,` +
    `rgba(${R},${G},${B2},${(0.30 * k).toFixed(3)}) 0%,` +
    `rgba(${R},${G},${B2},${(0.14 * k).toFixed(3)}) 26%,` +
    `rgba(${R},${G},${B2},${(0.05 * k).toFixed(3)}) 46%,` +
    `rgba(${R},${G},${B2},0) 62%)`;
  shaftCoreEl.style.background = `linear-gradient(${angle}deg,` +
    `rgba(${R},${G},${B2},${(0.22 * k).toFixed(3)}) 0%,` +
    `rgba(${R},${G},${B2},0) 58%)`;
  const bx = Math.max(14, Math.min(46, 30 + (angle - 118) * 0.5));
  shaftCoreEl.style.clipPath = `polygon(0 0, 46% 0, ${bx.toFixed(1)}% 100%, 0 100%)`;

  /* 浮尘光带末端随角度移动 */
  const ar = angle * Math.PI / 180;
  shaftEnd.x = 0.06 + Math.sin(ar) * 0.62;
  shaftEnd.y = 0.10 + Math.cos(ar) * 0.72;

  /* 敦煌入夜 → 自动以夜游模式开场(手动仍可切换) */
  autoNight = phaseKey === "night";
  return phaseKey;
}
applyDaylight();
setInterval(applyDaylight, 60000);

/* ---------- 入窟 ---------- */
const intro = document.getElementById("intro");
const enterBtn = document.getElementById("enter");
cimg().decode().then(() => { enterBtn.disabled = false; buildFreshImage(); })
               .catch(() => { enterBtn.disabled = false; });
enterBtn.addEventListener("click", () => {
  intro.classList.add("gone");
  document.body.classList.add("entered");
  initAudio();
  /* 敦煌此刻是夜 → 自动入夜游(手动仍可切换) */
  if (autoNight && night.target === 0) setNight(true);
  /* 触屏设备没有悬停 → 入窟直接进环视,拖拽即观看 */
  if (PANO_COARSE) setPano(true);
});

/* ============================================================
   颜料回鲜:灯照久处,颜色苏醒;离开后像记忆一样缓缓褪去
   ============================================================ */
const freshCv  = document.getElementById("fresh");
const fctx     = freshCv.getContext("2d");
const nicheStatueEl = document.getElementById("nicheStatue");
const nicheEl  = document.getElementById("niche");
let freshImg   = null;          // 当前洞窟的“本色版”底图(惰性生成,按窟缓存)
const freshStore = {};          // caveId -> canvas
let heat       = null;          // 热场:每格 0..1(按洞窟各自保存)
const heatStore = {};           // caveId -> Float32Array
let heatW = 0, heatH = 0;
const CELL = 46;                // 热场格边长(场景像素)
const HEAT_TAU = 6.5;           // 褪去时间常数(秒)

function sizeFresh() {
  freshCv.width  = scenePos.w * DPR;
  freshCv.height = scenePos.h * DPR;
  fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  heatW = Math.ceil(scenePos.w / CELL);
  heatH = Math.ceil(scenePos.h / CELL);
  for (const id of Object.keys(heatStore)) delete heatStore[id];   // 尺寸变了,热场重建
  heat = heatStore[currentCave().id] = new Float32Array(heatW * heatH);
}

/* 预计算“本色版”底图:手动做饱和度/亮度增强,不依赖 ctx.filter 兼容性 */
function buildFreshImage(src) {
  if (!src || !src.naturalWidth) return null;
  const c = document.createElement("canvas");
  c.width = src.naturalWidth; c.height = src.naturalHeight;
  const cx = c.getContext("2d");
  cx.drawImage(src, 0, 0);
  const id = cx.getImageData(0, 0, c.width, c.height);
  const p = id.data, SAT = 1.42, BRI = 1.05;
  for (let i = 0; i < p.length; i += 4) {
    const l = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2];
    p[i]     = Math.min(255, (l + (p[i]     - l) * SAT) * BRI);
    p[i + 1] = Math.min(255, (l + (p[i + 1] - l) * SAT) * BRI);
    p[i + 2] = Math.min(255, (l + (p[i + 2] - l) * SAT) * BRI);
  }
  cx.putImageData(id, 0, 0);
  freshImg = c;
  freshStore[currentCave().id] = c;
  return c;
}

/* 当前洞窟的本色版:已有则直接用,没有就现算一次 */
function freshFor() {
  const id = currentCave().id;
  if (freshStore[id]) return (freshImg = freshStore[id]);
  return buildFreshImage(cimg());
}

function updateHeat(dt, lr, gainOn) {
  /* 灯下加热:灯所在格及周围,越近越快 */
  if (gainOn && lr > 0) {
    const lampCX = lamp.x / CELL, lampCY = lamp.y / CELL;
    const rC = lr / CELL;
    const x0 = Math.max(0, Math.floor(lampCX - rC)), x1 = Math.min(heatW - 1, Math.ceil(lampCX + rC));
    const y0 = Math.max(0, Math.floor(lampCY - rC)), y1 = Math.min(heatH - 1, Math.ceil(lampCY + rC));
    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        const dx = gx + 0.5 - lampCX, dy = gy + 0.5 - lampCY;
        const dist = Math.hypot(dx, dy);
        if (dist < rC) {
          const i = gy * heatW + gx;
          heat[i] = Math.min(1.15, heat[i] + dt * 0.5 * (1 - (dist / rC) * 0.75));
        }
      }
    }
  }
  /* 全场冷却(日夜都在冷却,只是夜里加热快过冷却) */
  const decay = Math.exp(-dt / HEAT_TAU);
  for (let i = 0; i < heat.length; i++) heat[i] *= decay;
}

/* 真身龛位置的回鲜热度:取龛中心附近 2x2 格平均 */
const NICHE = { x: 0.862, y: 0.62 };           // 龛内 statue 中心(场景比例)
function nicheHeat() {
  if (!heat) return 0;
  const gx = Math.min(heatW - 1, Math.max(0, Math.floor(NICHE.x * scenePos.w / CELL)));
  const gy = Math.min(heatH - 1, Math.max(0, Math.floor(NICHE.y * scenePos.h / CELL)));
  let s = 0, n = 0;
  for (let dy = 0; dy <= 1; dy++)
    for (let dx = 0; dx <= 1; dx++) {
      const ix = Math.min(heatW - 1, gx + dx), iy = Math.min(heatH - 1, gy + dy);
      s += heat[iy * heatW + ix]; n++;
    }
  return s / n;
}

function drawFresh(nv) {
  if (!heat) return;
  const src = freshFor();                     // 当前洞窟的本色版
  if (!src) return;
  fctx.clearRect(0, 0, scenePos.w, scenePos.h);
  const k = src.width / scenePos.w;           // 场景像素 → 底图像素
  const cs = CELL + 0.5;
  for (let gy = 0; gy < heatH; gy++) {
    for (let gx = 0; gx < heatW; gx++) {
      const h = heat[gy * heatW + gx];
      if (h < 0.02) continue;
      const a = Math.min(1, h) * nv * 0.92;
      if (a < 0.01) continue;
      fctx.globalAlpha = a;
      fctx.drawImage(src,
        gx * CELL * k, gy * CELL * k, CELL * k, CELL * k,
        gx * CELL, gy * CELL, cs, cs);
    }
  }
  fctx.globalAlpha = 1;
}

/* ============================================================
   画布动效:浮尘 / 飘带 / 散花
   ============================================================ */
let W = 0, H = 0, DPR = 1;
function sizeFx() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  fx.width = W * DPR; fx.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener("resize", sizeFx);
sizeFx();
addEventListener("resize", sizeFresh);
sizeFresh();

const rand = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

/* ----- 浮尘:聚在天光带里,微微明灭 ----- */
const dust = [];
for (let i = 0; i < 68; i++) {
  dust.push({
    t: Math.random(),                       // 沿光带的参数
    off: rand(-1, 1),                       // 垂直于光带的偏移
    r: rand(0.6, 1.9),
    sp: rand(0.010, 0.028),
    ph: rand(0, TAU),
    tw: rand(0.4, 1.0),
  });
}
/* 光带:自左上入窟,末端随真实太阳角度移动 */
function shaftPoint(t, off) {
  const x0 = 0.04 * W, y0 = 0.02 * H, x1 = shaftEnd.x * W, y1 = shaftEnd.y * H;
  const cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
  const nx = -(y1 - y0), ny = x1 - x0;                 // 法向
  const len = Math.hypot(nx, ny);
  const spread = (0.05 + 0.13 * t) * W;                // 越往下越散
  return { x: cx + nx / len * off * spread, y: cy + ny / len * off * spread };
}

/* ----- 飘带:三绺,贝塞尔中线 + 渐变宽度的绸面 ----- */
const RIBBONS = [
  { phase: 0.0,  yBase: 0.16, amp: 0.055, wid: 15, hue: [176, 62, 40]  },
  { phase: 2.1,  yBase: 0.26, amp: 0.070, wid: 11, hue: [196, 132, 74] },
  { phase: 4.4,  yBase: 0.35, amp: 0.048, wid: 13, hue: [86, 104, 128] },
];
function ribbonCenter(r, t, time) {
  /* 横贯画面的三次曲线,控制点随风摆动 */
  const y = r.yBase + Math.sin(time * 0.00035 + r.phase) * 0.02
          + Math.sin(t * Math.PI) * r.amp * Math.sin(time * 0.0006 + r.phase + t * 2.4);
  const x = -0.05 + t * 1.1;
  return { x: x * W, y: y * H };
}
function drawRibbon(r, time) {
  const N = 64, pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = ribbonCenter(r, t, time);
    const w = r.wid * Math.sin(Math.PI * t) * (0.55 + 0.45 * Math.sin(time * 0.0009 + r.phase * 2 + t * 5));
    pts.push({ x: c.x, y: c.y, w: Math.max(w, 0.4) });
  }
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const p = pts[i];
    if (i === 0) ctx.moveTo(p.x, p.y - p.w); else ctx.lineTo(p.x, p.y - p.w);
  }
  for (let i = N; i >= 0; i--) {
    const p = pts[i];
    ctx.lineTo(p.x, p.y + p.w);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, W, H * 0.5);
  const [R, G, Bl] = r.hue;
  g.addColorStop(0,   `rgba(${R},${G},${Bl},0.30)`);
  g.addColorStop(0.5, `rgba(${R + 30},${G + 20},${Bl - 20},0.16)`);
  g.addColorStop(1,   `rgba(${R},${G},${Bl},0.26)`);
  ctx.fillStyle = g;
  ctx.fill();
}

/* ----- 散花:飞天撒下的花瓣,缓缓飘落 ----- */
const petals = [];
const PETAL_COLORS = [
  ["201, 96, 66",  "232, 158, 118"],
  ["166, 124, 58", "222, 186, 118"],
  ["122, 96, 150", "188, 160, 208"],
];
let petalTimer = 0;
function spawnPetal() {
  const c = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
  petals.push({
    x: rand(0.05, 0.95) * W,
    y: -20,
    vy: rand(14, 30),
    sway: rand(18, 42),
    ph: rand(0, TAU),
    rot: rand(0, TAU),
    vr: rand(-1.2, 1.2),
    s: rand(3.2, 6.5),
    c,
    life: 0,
  });
}
function drawPetal(p, dt, mul) {
  p.life += dt;
  p.y += p.vy * dt;
  p.x += Math.sin(p.life * 1.4 + p.ph) * p.sway * dt;
  p.rot += p.vr * dt;
  const fade = Math.min(1, p.life * 0.8) *
               clamp((H * 0.92 - p.y) / (H * 0.18), 0, 1) * mul;
  if (fade <= 0) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = fade * 0.85;
  const g = ctx.createLinearGradient(-p.s, 0, p.s, 0);
  g.addColorStop(0, `rgba(${p.c[0]},0.9)`);
  g.addColorStop(1, `rgba(${p.c[1]},0.9)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, p.s, p.s * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/* ---------- 长明灯焰:各窟自备,入夜后亮起 ---------- */
function currentFlames() { return currentCave().flames; }
/* Ken Burns 缓推的近似同步:46s alternate ease-in-out,1.02 → 1.075 */
function muralScale(time) {
  const ph = (time / 46000) % 2;
  const tri = ph < 1 ? ph : 2 - ph;
  const eased = tri * tri * (3 - 2 * tri);
  return 1.02 + 0.055 * eased;
}
function drawFlameAt(x, y, f, alpha) {
  const wab = Math.sin(performance.now() * 0.006 + f.ph) * 0.8 + Math.sin(performance.now() * 0.0023 + f.ph * 2) * 0.5;
  const fh = 13 * f.s * (1 + wab * 0.12);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  /* 外晕 */
  const g = ctx.createRadialGradient(x, y, 0, x, y, 52 * f.s);
  g.addColorStop(0, `rgba(255, 190, 110, ${0.30 * alpha})`);
  g.addColorStop(0.5, `rgba(220, 130, 60, ${0.10 * alpha})`);
  g.addColorStop(1, "rgba(220, 130, 60, 0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, 52 * f.s, 0, TAU); ctx.fill();
  /* 焰身 */
  ctx.globalAlpha = alpha;
  const fl = ctx.createLinearGradient(x, y - fh, x, y + 3);
  fl.addColorStop(0, "rgba(255, 236, 180, 0.95)");
  fl.addColorStop(0.55, "rgba(250, 170, 80, 0.9)");
  fl.addColorStop(1, "rgba(200, 90, 40, 0.7)");
  ctx.fillStyle = fl;
  ctx.beginPath();
  ctx.moveTo(x, y - fh);
  ctx.bezierCurveTo(x + 4.5 * f.s, y - fh * 0.45, x + 3.5 * f.s, y, x, y + 3);
  ctx.bezierCurveTo(x - 3.5 * f.s, y, x - 4.5 * f.s, y - fh * 0.45, x, y - fh);
  ctx.fill();
  /* 焰心 */
  ctx.fillStyle = `rgba(255, 250, 220, ${0.9 * alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y - fh * 0.28, 1.4 * f.s, 3.2 * f.s * (1 + wab * 0.1), 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/* 平面模式:按 Ken Burns 同步的位置画 */
function drawFlame(f, time, alpha) {
  const s = muralScale(time);
  const x = scenePos.left + (0.5 + (f.x - 0.5) * s) * scenePos.w - parallax.x * 14;
  const y = scenePos.top  + (0.5 + (f.y - 0.5) * s) * scenePos.h - parallax.y * 10;
  drawFlameAt(x, y, f, alpha);
}

/* ============================================================
   环境音:纯 WebAudio 合成,零素材
   白日:洞窟风声(布朗噪声低通)+ 偶尔的风铃回声
   入夜:风声转沉,灯焰轻微噼啪
   ============================================================ */
let audio = null, soundOn = true;
const soundToggle = document.getElementById("soundToggle");

function initAudio() {
  if (audio) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    const master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    /* 风:布朗噪声 → 低通,频率慢速呼吸 */
    const len = ac.sampleRate * 3;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let lv = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      lv = (lv + 0.02 * w) / 1.02;
      d[i] = lv * 3.5;
    }
    const wind = ac.createBufferSource();
    wind.buffer = buf; wind.loop = true;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 360; lp.Q.value = 0.5;
    const wg = ac.createGain(); wg.gain.value = 0.5;
    /* 声像:风声随灯的水平位置左右移动 */
    const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    wind.connect(lp); lp.connect(wg);
    if (pan) { wg.connect(pan); pan.connect(master); } else { wg.connect(master); }
    wind.start();
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.06;
    const lfoG = ac.createGain(); lfoG.gain.value = 130;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
    /* 回声总线:风铃的洞窟混响 */
    const delay = ac.createDelay(1.2); delay.delayTime.value = 0.33;
    const fb = ac.createGain(); fb.gain.value = 0.35;
    const fbLp = ac.createBiquadFilter();
    fbLp.type = "lowpass"; fbLp.frequency.value = 1500;
    delay.connect(fbLp); fbLp.connect(fb); fb.connect(delay);
    delay.connect(master);
    audio = { ac, master, lp, wg, delay, pan };
    master.gain.setTargetAtTime(soundOn ? 0.16 : 0, ac.currentTime, 1.2);
    soundToggle.classList.toggle("on", soundOn);
    if (uv.on) startHum();
    scheduleChime();
    scheduleCrackle();
  } catch (e) { audio = null; }
}

const NOTES = [392, 440, 523.25, 587.33, 659.25];
function chime() {
  if (!audio) return;
  const { ac, master, delay } = audio;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.value = NOTES[Math.floor(Math.random() * NOTES.length)] * 2;
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  o.connect(g); g.connect(master); g.connect(delay);
  o.start(t); o.stop(t + 3.4);
}
function scheduleChime() {
  if (!audio) return;
  chime();
  setTimeout(scheduleChime, (night.v > 0.5 ? rand(14, 26) : rand(9, 18)) * 1000);
}
function crackle() {
  if (!audio) return;
  const { ac, master } = audio;
  const n = Math.floor(ac.sampleRate * 0.03);
  const b = ac.createBuffer(1, n, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = ac.createBufferSource(); s.buffer = b;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass"; hp.frequency.value = 2400;
  const g = ac.createGain(); g.gain.value = 0.05 * night.v * (0.35 + 0.65 * lampProx.v);
  s.connect(hp); hp.connect(g); g.connect(master); s.start();
}
function scheduleCrackle() {
  if (!audio) return;
  if (night.v > 0.25) crackle();
  setTimeout(scheduleCrackle, rand(0.5, 3.0) * 1000);
}

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? "音" : "静";
  soundToggle.classList.toggle("on", soundOn);
  if (audio) audio.master.gain.setTargetAtTime(soundOn ? 0.16 : 0, audio.ac.currentTime, 0.6);
});

/* 页面隐藏时暂停,回来再续 */
document.addEventListener("visibilitychange", () => {
  if (!audio) return;
  if (document.hidden) audio.ac.suspend();
  else audio.ac.resume();
});

/* ============================================================
   紫外模式:第三盏灯——显形被覆盖的底层
   榜题框 / 未完成的底稿 / 重层修复接缝,全部程序化绘制
   ============================================================ */
const uv = { on: false };
const uvToggle = document.getElementById("uvToggle");
const uvCv  = document.getElementById("uv");
const uctx  = uvCv.getContext("2d");
let uvBuf = null;                              // 离屏:预绘制的隐藏层
let humNodes = null;

addEventListener("resize", sizeUv);
sizeUv();

function sizeUv() {
  uvCv.width  = scenePos.w * DPR;
  uvCv.height = scenePos.h * DPR;
  uctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  buildUvLayer();
}

function buildUvLayer() {
  uvBuf = document.createElement("canvas");
  uvBuf.width  = scenePos.w * DPR;
  uvBuf.height = scenePos.h * DPR;
  const c = uvBuf.getContext("2d");
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const w = scenePos.w, h = scenePos.h;
  const SW = scenePos.w / 1400;                // 相对底图基准的缩放

  /* 榜题框:竖排伪文字,荧光青白 */
  const panels = [
    [0.175, 0.28, 0.050, 0.150], [0.385, 0.205, 0.045, 0.125],
    [0.635, 0.245, 0.050, 0.135], [0.295, 0.60, 0.040, 0.115],
    [0.575, 0.565, 0.046, 0.125],
  ];
  for (const [px, py, pw, ph] of panels) {
    const x = px * w, y = py * h, pw2 = pw * w, ph2 = ph * h;
    c.strokeStyle = "rgba(150, 216, 255, 0.55)";
    c.lineWidth = 1.6 * SW;
    c.strokeRect(x, y, pw2, ph2);
    c.strokeStyle = "rgba(150, 216, 255, 0.22)";
    c.strokeRect(x + 4 * SW, y + 4 * SW, pw2 - 8 * SW, ph2 - 8 * SW);
    /* 竖排伪文字:每列若干短横段 */
    const cols = Math.max(2, Math.floor(pw2 / (14 * SW)));
    c.strokeStyle = "rgba(168, 226, 255, 0.60)";
    c.lineWidth = 1.3 * SW;
    for (let col = 0; col < cols; col++) {
      const cx = x + (col + 0.5) * pw2 / cols;
      let cy = y + 10 * SW;
      while (cy < y + ph2 - 10 * SW) {
        const len = (5 + Math.random() * 11) * SW;
        c.globalAlpha = 0.35 + Math.random() * 0.5;
        c.beginPath();
        c.moveTo(cx - 3.2 * SW, cy);
        c.lineTo(cx + 3.2 * SW, cy);
        c.stroke();
        cy += len + 5 * SW;
      }
    }
    c.globalAlpha = 1;
  }

  /* 底稿:未完成的千佛圆光(虚线圆),成排 */
  c.setLineDash([5 * SW, 6 * SW]);
  c.strokeStyle = "rgba(150, 216, 255, 0.30)";
  c.lineWidth = 1.2 * SW;
  for (let gy2 = 0; gy2 < 3; gy2++) {
    for (let gx2 = 0; gx2 < 7; gx2++) {
      const cx = (0.435 + gx2 * 0.045) * w;
      const cy = (0.44 + gy2 * 0.052) * h;
      c.beginPath();
      c.arc(cx, cy, 11 * SW, 0, TAU);
      c.stroke();
      /* 未画完的肩线 */
      c.beginPath();
      c.arc(cx, cy + 13 * SW, 8 * SW, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
    }
  }
  c.setLineDash([]);

  /* 重层修复接缝:一道贯穿的斜线 + 两块补丁轮廓 */
  c.strokeStyle = "rgba(170, 140, 255, 0.34)";
  c.lineWidth = 2 * SW;
  c.setLineDash([14 * SW, 10 * SW]);
  c.beginPath();
  c.moveTo(0.04 * w, 0.40 * h);
  c.quadraticCurveTo(0.5 * w, 0.335 * h, 0.97 * w, 0.415 * h);
  c.stroke();
  c.setLineDash([]);
  c.strokeStyle = "rgba(170, 140, 255, 0.26)";
  c.strokeRect(0.205 * w, 0.435 * h, 0.085 * w, 0.09 * h);
  c.strokeRect(0.72 * w, 0.315 * h, 0.07 * w, 0.075 * h);
}

/* 紫外嗡鸣:低频锯齿波 + 慢速振幅抖动 */
function startHum() {
  if (!audio || humNodes) return;
  const { ac, master } = audio;
  const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = 48;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 150;
  const g = ac.createGain(); g.gain.value = 0;
  const lfo = ac.createOscillator(); lfo.frequency.value = 7.3;
  const lg = ac.createGain(); lg.gain.value = 0.006;
  lfo.connect(lg); lg.connect(g.gain);
  o.connect(lp); lp.connect(g); g.connect(master);
  o.start(); lfo.start();
  g.gain.setTargetAtTime(0.016, ac.currentTime, 0.5);
  humNodes = { o, lfo, g };
}
function stopHum() {
  if (!humNodes || !audio) return;
  const hn = humNodes;
  hn.g.gain.setTargetAtTime(0, audio.ac.currentTime, 0.25);
  setTimeout(() => { try { hn.o.stop(); hn.lfo.stop(); } catch (e) {} }, 900);
  humNodes = null;
}

uvToggle.addEventListener("click", () => {
  uv.on = !uv.on;
  document.body.classList.toggle("uv", uv.on);
  uvToggle.classList.toggle("on", uv.on);
  hintEl.textContent = hintForState();
  if (uv.on) startHum(); else stopHum();
});

/* ============================================================
   崖面:在洞窟之间行走
   换窟时先沉入黑暗,走一段脚步,再从新窟的壁上亮起来
   ============================================================ */
const cliffEl  = document.getElementById("cliff");
const walkVeil = document.getElementById("walkVeil");
const walkText = document.getElementById("walkText");
const chipCave = document.getElementById("chipCave");
const protoEl  = document.getElementById("protoLine");
const muralEl  = document.getElementById("mural");
let walking = false;

function buildCliff() {
  cliffEl.innerHTML = "";
  CAVES.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cave-door";
    b.title = c.proto[lang];
    b.setAttribute("aria-label", T().caveAria(c.num));
    const shortName = c.door ? c.door[lang] : (c.name[lang].split(" · ")[1] || c.name[lang]);
    b.innerHTML =
      `<span class="door-num">${c.num}</span>` +
      `<span class="door-name">${shortName}</span>`;
    b.addEventListener("click", () => gotoCave(i));
    cliffEl.appendChild(b);
  });
  syncCliff();
}

function syncCliff() {
  Array.prototype.forEach.call(cliffEl.children, (el, i) => {
    el.classList.toggle("on", i === CAVE_I);
    el.setAttribute("aria-current", i === CAVE_I ? "true" : "false");
  });
}

/* 把当前洞窟画上去:底图 / 夜光层 / 题签 / 原型小注 / 真身龛 */
function paintCave() {
  const c = currentCave();
  muralEl.style.backgroundImage   = `url('${c.img}')`;
  muralGlow.style.backgroundImage = `url('${c.img}')`;
  chipCave.textContent = c.name[lang];
  protoEl.textContent  = c.proto[lang];
  nicheEl.style.display = c.niche ? "" : "none";
}

/* 换窟:热点重建 / 取回该窟的热场与本色版 / 重绘紫外层 */
function swapCave() {
  paintCave();
  buildHotspots();
  const id = currentCave().id;
  if (!heatStore[id]) heatStore[id] = new Float32Array(heatW * heatH);
  heat = heatStore[id];
  freshFor();
  buildUvLayer();
  syncCliff();
  if (pano.on) sizePano();          // 换窟后按新底图重算圆柱比例
}

/* 脚步声:低频噪声短促两下,像在甬道里走了两步 */
function playStep() {
  if (!audio || !soundOn) return;
  const { ac, master, delay } = audio;
  for (let k = 0; k < 2; k++) {
    const t0 = ac.currentTime + k * 0.26;
    const n = Math.floor(ac.sampleRate * 0.09);
    const b = ac.createBuffer(1, n, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const s = ac.createBufferSource(); s.buffer = b;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 240;
    const g = ac.createGain(); g.gain.value = 0.10;
    s.connect(lp); lp.connect(g);
    g.connect(master); g.connect(delay);
    s.start(t0);
  }
}

function gotoCave(i) {
  if (walking || i === CAVE_I || i < 0 || i >= CAVES.length) return;
  walking = true;
  closeCard();
  const dur = reduced ? 240 : 820;
  walkText.textContent = T().walking;
  walkVeil.classList.add("on");
  /* 先排定时器、再放声音:任何一步出错都不能让黑幕挂在屏幕上 */
  setTimeout(() => {
    try { CAVE_I = i; swapCave(); }
    catch (e) { console.error("swapCave failed:", e); }
    walkVeil.classList.remove("on");
  }, dur);
  setTimeout(() => { walking = false; }, dur + (reduced ? 160 : 880));
  try { playStep(); } catch (e) { /* 声音失败不妨碍走过去 */ }
}

document.getElementById("prevCave").addEventListener("click", () => {
  gotoCave((CAVE_I - 1 + CAVES.length) % CAVES.length);
});
document.getElementById("nextCave").addEventListener("click", () => {
  gotoCave((CAVE_I + 1) % CAVES.length);
});
addEventListener("keydown", (e) => {
  if (!document.body.classList.contains("entered")) return;
  if (e.key === "ArrowLeft")  gotoCave((CAVE_I - 1 + CAVES.length) % CAVES.length);
  if (e.key === "ArrowRight") gotoCave((CAVE_I + 1) % CAVES.length);
});

paintCave();
buildCliff();

/* ============================================================
   环视:在洞窟里转过身去
   前半圈是壁画(底图铺满 180° 圆柱),后半圈是入口的岩壁与门洞
   Canvas 圆柱投影:按视线角逐条带取样,拖拽即转头,松手带惯性
   ============================================================ */
const pano = {
  on: false, yaw: 0, pitch: 0, vyaw: 0, vpitch: 0,
  touched: false,
};
const panoCv = document.getElementById("pano");
const pctx = panoCv.getContext("2d");
const panoToggle = document.getElementById("panoToggle");
const PANO_SPAN = Math.PI;                     // 前壁壁画占满 180°
const PANO_HFOV_MAX = 105 * Math.PI / 180;     // 一次望进的视野(上限,桌面)
const PANO_HFOV_MIN = 62 * Math.PI / 180;      // 窄屏下限:让壁画足够大
const PANO_STRETCH = 1.15;                     // 纵向纹素最多放宽的比例
const PANO_DRIFT = 0.045;                      // 没动手时,目光自己慢慢游
const PANO_BLEND = 0.32;                       // 壁画与岩壁接缝的过渡角宽
let panoW = 0, panoH = 0, panoR = 0, panoDH = 0, panoHFov = PANO_HFOV_MAX;
let pDrag = null;
let backWall = null;

const normAng = (a) => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const panoPitchLim = () => Math.max(0, (panoDH - panoH) / 2);

function sizePano() {
  panoW = innerWidth; panoH = innerHeight;
  panoCv.width = panoW * DPR; panoCv.height = panoH * DPR;
  pctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const src = cimg();
  const iw = (src && src.naturalWidth) || 1400;
  const ih = (src && src.naturalHeight) || 940;
  /* 视野自适应:竖屏上壁画要够大。以"竖向铺满屏幕"为目标反推视野,
     但纹素纵向最多放宽 15%(再大就变形),且视野收在 62°~105° 之间 */
  const kFill = panoH / ih;
  const tanMax = (panoW / 2) * PANO_STRETCH * PANO_SPAN / (kFill * iw);
  panoHFov = clamp(2 * Math.atan(tanMax), PANO_HFOV_MIN, PANO_HFOV_MAX);
  panoR = (panoW / 2) / Math.tan(panoHFov / 2);
  const kH = panoR * PANO_SPAN / iw;             // 横向 texel 比例(由圆柱几何决定)
  const kV = Math.max(kH, Math.min(kFill, kH * PANO_STRETCH));
  panoDH = ih * kV;
  pano.pitch = clamp(pano.pitch, -panoPitchLim(), panoPitchLim());
}
addEventListener("resize", sizePano);
sizePano();

/* 入口那面岩壁:程序化画一次,全局共用 */
function buildBackWall() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#33241a"); g.addColorStop(0.55, "#241811"); g.addColorStop(1, "#120c08");
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  /* 烟熏黑 */
  for (let i = 0; i < 26; i++) {
    const r = 50 + Math.random() * 150;
    const gx = Math.random() * 1024, gy = Math.random() * 170;
    const rg = x.createRadialGradient(gx, gy, 0, gx, gy, r);
    rg.addColorStop(0, "rgba(0,0,0,0.20)"); rg.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = rg; x.fillRect(gx - r, gy - r, r * 2, r * 2);
  }
  /* 岩粒 */
  for (let i = 0; i < 6200; i++) {
    x.fillStyle = `rgba(${150 + Math.random() * 60 | 0},${115 + Math.random() * 50 | 0},${72 + Math.random() * 40 | 0},${(Math.random() * 0.07).toFixed(3)})`;
    x.fillRect(Math.random() * 1024, Math.random() * 512, 1.4, 1.4);
  }
  /* 靠近地面的暖土色 */
  const g2 = x.createLinearGradient(0, 360, 0, 512);
  g2.addColorStop(0, "rgba(128,94,58,0)"); g2.addColorStop(1, "rgba(128,94,58,0.30)");
  x.fillStyle = g2; x.fillRect(0, 360, 1024, 152);
  /* 门洞:进来时走的那扇,透一点天光 */
  const dw = 110, dh2 = 210, dxc = 512, dyT = 512 - dh2;
  const arch = (inset) => {
    x.beginPath();
    x.moveTo(dxc - dw / 2 + inset, 512);
    x.lineTo(dxc - dw / 2 + inset, dyT + dw / 2);
    x.arc(dxc, dyT + dw / 2, dw / 2 - inset, Math.PI, 0);
    x.lineTo(dxc + dw / 2 - inset, 512);
    x.closePath();
  };
  arch(0); x.fillStyle = "rgba(6,4,2,0.92)"; x.fill();
  const lg = x.createLinearGradient(0, dyT, 0, 512);
  lg.addColorStop(0, "rgba(238,208,152,0.55)");
  lg.addColorStop(0.45, "rgba(214,176,118,0.24)");
  lg.addColorStop(1, "rgba(190,150,98,0.08)");
  arch(6); x.fillStyle = lg; x.fill();
  arch(0); x.strokeStyle = "rgba(168,136,92,0.45)"; x.lineWidth = 2.5; x.stroke();
  /* 门外的光洒在地上 */
  const fg = x.createRadialGradient(dxc, 500, 10, dxc, 500, 230);
  fg.addColorStop(0, "rgba(226,190,130,0.16)");
  fg.addColorStop(1, "rgba(226,190,130,0)");
  x.fillStyle = fg; x.fillRect(dxc - 240, 330, 480, 182);
  /* 两侧接缝处被壁画反光照亮,过渡更自然 */
  for (const side of [0, 1]) {
    const eg = x.createLinearGradient(side ? 1024 : 0, 0, side ? 844 : 180, 0);
    eg.addColorStop(0, "rgba(196,158,106,0.22)");
    eg.addColorStop(1, "rgba(196,158,106,0)");
    x.fillStyle = eg;
    x.fillRect(side ? 844 : 0, 0, 180, 512);
  }
  /* 裂缝 */
  x.strokeStyle = "rgba(0,0,0,0.35)"; x.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    let cx0 = Math.random() * 1024, cy0 = Math.random() * 280;
    x.beginPath(); x.moveTo(cx0, cy0);
    for (let s = 0; s < 6; s++) {
      cx0 += (Math.random() - 0.5) * 60; cy0 += 20 + Math.random() * 40;
      x.lineTo(cx0, cy0);
    }
    x.stroke();
  }
  backWall = c;
}

/* 圆柱投影渲染:条带取自真实角度差,边缘不拉伸 */
function renderPano(nv) {
  const src = cimg();
  if (!backWall) buildBackWall();
  pctx.fillStyle = "#080504";
  pctx.fillRect(0, 0, panoW, panoH);
  if (!src || !src.naturalWidth) return;
  const iw = src.naturalWidth, ih = src.naturalHeight;
  const dh = panoDH, dy = (panoH - dh) / 2 + pano.pitch;
  const half = panoHFov / 2;
  const STEP = 10;
  for (let sx = 0; sx < panoW; sx += STEP) {
    const a0 = normAng(pano.yaw + Math.atan((sx - panoW / 2) / panoR));
    const a1 = normAng(pano.yaw + Math.atan((sx + STEP - panoW / 2) / panoR));
    const am = normAng(pano.yaw + Math.atan((sx + STEP / 2 - panoW / 2) / panoR));
    const w = STEP + 1.2;
    if (Math.abs(am) < PANO_SPAN / 2) {                       /* 前壁壁画 */
      let u0 = (a0 / PANO_SPAN + 0.5) * iw, u1 = (a1 / PANO_SPAN + 0.5) * iw;
      let su = Math.min(u0, u1), sw2 = Math.abs(u1 - u0);
      if (sw2 > iw * 0.04) { su = u0; sw2 = 2; }              /* 跨缝兜底 */
      su = clamp(su, 0, Math.max(0, iw - sw2));
      pctx.drawImage(src, su, 0, Math.max(sw2, 0.5), ih, sx, dy, w, dh);
    } else {                                                  /* 后壁岩壁 */
      const t0 = ((a0 - PANO_SPAN / 2) % TAU + TAU) % TAU;
      const t1 = ((a1 - PANO_SPAN / 2) % TAU + TAU) % TAU;
      let bu = Math.min(t0, t1) / Math.PI * backWall.width;
      let bw2 = Math.abs(t1 - t0) / Math.PI * backWall.width;
      if (bw2 > backWall.width * 0.04) { bu = t0 / Math.PI * backWall.width; bw2 = 2; }
      bu = clamp(bu, 0, Math.max(0, backWall.width - bw2));
      pctx.drawImage(backWall, bu, 0, Math.max(bw2, 0.5), backWall.height, sx, dy, w, dh);
    }
    /* 接缝压暗:壁画边缘沉进岩影里 */
    const d = Math.min(Math.abs(normAng(am - PANO_SPAN / 2)), Math.abs(normAng(am + PANO_SPAN / 2)));
    if (d < PANO_BLEND) {
      pctx.fillStyle = `rgba(5,3,2,${(0.85 * (1 - d / PANO_BLEND)).toFixed(3)})`;
      pctx.fillRect(sx, dy, w, dh);
    }
  }
  /* 长明灯焰(环视坐标) */
  if (nv > 0.005) {
    for (const f of currentFlames()) {
      const a = normAng((f.x - 0.5) * PANO_SPAN - pano.yaw);
      if (Math.abs(a) > half) continue;
      drawFlameAt(panoW / 2 + panoR * Math.tan(a), dy + f.y * dh, f, nv);
    }
  }
}

/* 环视下朱砂点按视角投影到屏幕 */
function layoutPanoHotspots() {
  const half = panoHFov / 2;
  const dy = (panoH - panoDH) / 2 + pano.pitch;
  for (const r of hotspotRefs) {
    const s = r.s;
    const a = normAng((s.x / 100 - 0.5) * PANO_SPAN - pano.yaw);
    if (Math.abs(a) > half * 1.25) { r.b.style.display = "none"; continue; }
    const sx = panoW / 2 + panoR * Math.tan(a);
    const sy = dy + (s.y / 100) * panoDH;
    if (sy < -50 || sy > panoH + 50) { r.b.style.display = "none"; continue; }
    r.b.style.display = "";
    r.b.style.left = (sx - scenePos.left) + "px";
    r.b.style.top  = (sy - scenePos.top) + "px";
    r.b.style.opacity = clamp(1 - (Math.abs(a) / half - 0.82) / 0.35, 0, 1).toFixed(3);
  }
}

function restoreFlatHotspots() {
  for (const r of hotspotRefs) {
    r.b.style.left = r.s.x + "%";
    r.b.style.top  = r.s.y + "%";
    r.b.style.display = "";
    r.b.style.opacity = "";
  }
}

/* 拖拽 = 转头:墙面跟手,松手带一点惯性
   触屏与鼠标统一走 Pointer Events;手势交给 CSS touch-action 处理 */
let pMoved = false, pDownEl = null, pSuppressEl = null;

function panoDown(x, y, target) {
  if (!pano.on) return false;
  /* 从哪里起手都能转(包括朱砂点上),拖过就算拖,不再当点按 */
  if (target && target.closest && target.closest("#card, #creditsPanel")) return false;
  pDrag = { x, y, yaw: pano.yaw, pitch: pano.pitch };
  pMoved = false;
  pDownEl = target || null;
  pSuppressEl = null;
  pano.vyaw = pano.vpitch = 0;
  return true;
}
function panoMove(x, y) {
  if (!pDrag) return;
  if (Math.abs(x - pDrag.x) + Math.abs(y - pDrag.y) > 8) pMoved = true;
  const ny = pDrag.yaw - (x - pDrag.x) / panoR;
  pano.vyaw = clamp(normAng(ny - pano.yaw), -0.09, 0.09);
  pano.yaw = ny;
  pano.pitch = clamp(pDrag.pitch + (y - pDrag.y), -panoPitchLim(), panoPitchLim());
  pano.touched = true;
}
function panoUp() {
  /* 只吞"从哪个元素起手"的那次点击(触屏的 click 落在起手目标上),
     不影响之后任何别的按钮 */
  if (pDrag && pMoved && pDownEl) {
    pSuppressEl = pDownEl;
    setTimeout(() => { pSuppressEl = null; }, 500);
  }
  pDrag = null;
}

stage.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  panoDown(e.clientX, e.clientY, e.target);
});
stage.addEventListener("pointermove", (e) => panoMove(e.clientX, e.clientY));
stage.addEventListener("pointerup", panoUp);
stage.addEventListener("pointercancel", panoUp);
addEventListener("mouseup", panoUp);            /* 拖出窗口的兜底 */
stage.addEventListener("click", (e) => {
  if (pSuppressEl && (e.target === pSuppressEl ||
      (pSuppressEl.contains && pSuppressEl.contains(e.target)))) {
    e.stopPropagation(); e.preventDefault();
  }
}, true);

function setPano(on) {
  if (pano.on === on) return;
  pano.on = on;
  document.body.classList.toggle("pano", on);
  panoToggle.classList.toggle("on", on);
  panoToggle.textContent = on ? "壁" : "环";
  panoToggle.setAttribute("aria-label", on ? T().ariaWall : T().ariaPano);
  if (on) {
    sizePano();
    pano.yaw = 0; pano.pitch = 0; pano.vyaw = pano.vpitch = 0; pano.touched = false;
    try { playStep(); } catch (e) {}
  } else {
    restoreFlatHotspots();
  }
  hintEl.textContent = hintForState();
}
panoToggle.addEventListener("click", () => setPano(!pano.on));

/* 手机/平板:没有悬停,入窟即进环视,拖拽就是全部的观看方式 */
const PANO_COARSE = matchMedia("(pointer: coarse)").matches;

/* ============================================================
   双语切换与素材授权面板
   ============================================================ */
const langToggle = document.getElementById("langToggle");
const creditsToggle = document.getElementById("creditsToggle");
const creditsPanel = document.getElementById("creditsPanel");
const creditsTitle = document.getElementById("creditsTitle");
const creditsList = document.getElementById("creditsList");
const introTitle = document.getElementById("introTitle");
const introQuote = document.getElementById("introQuote");
const introNote = document.getElementById("introNote");
const chipText = document.getElementById("chipText");

function applyLang() {
  const t = T();
  document.body.classList.toggle("en", lang === "en");
  chipText.textContent = t.chip;
  introTitle.textContent = t.introTitle;
  introQuote.textContent = t.quote;
  introNote.textContent = t.note;
  enterBtn.innerHTML = t.enter;
  langToggle.textContent = lang === "zh" ? "EN" : "中";
  langToggle.setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换为中文");
  hintEl.textContent = hintForState();
  creditsToggle.textContent = t.creditsChip;
  creditsTitle.textContent = t.creditsTitle;
  creditsList.innerHTML = t.credits.map((s) => `<li>${s}</li>`).join("");
  for (const { s, label } of hotspotRefs) {
    const t2 = (lang === "en" && s.en) ? s.en.title : s.title;
    label.textContent = t2.split(" · ")[0];
  }
  buildCliff();                       // 崖面门牌重排语言
  chipCave.textContent = currentCave().name[lang];
  applyDaylight();
}

langToggle.addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  closeCard();
  applyLang();
});

creditsToggle.addEventListener("click", () => {
  const open = !creditsPanel.classList.contains("open");
  creditsPanel.classList.toggle("open", open);
  creditsPanel.setAttribute("aria-hidden", String(!open));
});

/* ---------- 主循环 ---------- */
let last = performance.now();
let lastNV = 0;
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  /* 视差插值 */
  parallax.x += (parallax.tx - parallax.x) * 0.055;
  parallax.y += (parallax.ty - parallax.y) * 0.055;
  const mx = parallax.x, my = parallax.y;
  scene.style.transform = `translate3d(${-mx * 14}px, ${-my * 10}px, 0)`;

  /* 昼夜过渡(约三秒沉入黑夜) */
  night.v += (night.target - night.v) * 0.016;
  const nv = night.v < 0.001 ? 0 : night.v > 0.999 ? 1 : night.v;

  /* 环视:惯性衰减 + 未动手时目光缓缓游移 */
  if (pano.on) {
    if (!pDrag) {
      pano.yaw += pano.vyaw; pano.vyaw *= 0.94;
      pano.pitch = clamp(pano.pitch + pano.vpitch, -panoPitchLim(), panoPitchLim());
      pano.vpitch *= 0.94;
      if (!pano.touched) pano.yaw += PANO_DRIFT * dt;
    }
    pano.yaw = normAng(pano.yaw);
  }

  /* 灯:跟随 + 烛光抖动 */
  const lampPX = lamp.x, lampPY = lamp.y;
  lamp.x += (lamp.tx - lamp.x) * 0.11;
  lamp.y += (lamp.ty - lamp.y) * 0.11;
  /* 交互运动量:灯/指尖的移动速度(平滑),驱动风声 */
  const instSpeed = Math.hypot(lamp.x - lampPX, lamp.y - lampPY) / Math.max(dt, 0.001);
  motion.v += (Math.min(1, instSpeed / 1100) - motion.v) * 0.04;
  let lr = 0;
  if (nv > 0.001) {
    const flick = 1
      + Math.sin(now * 0.009) * 0.022
      + Math.sin(now * 0.0027 + 1.3) * 0.030;
    lr = Math.max(scenePos.w, scenePos.h) * 0.16 * flick;
    scene.style.setProperty("--lx", lamp.x + "px");
    scene.style.setProperty("--ly", lamp.y + "px");
    scene.style.setProperty("--lr", lr + "px");
  }
  /* 灯与最近灯焰的邻近度:让噼啪声变密变近 */
  if (nv > 0.05) {
    let best = 0;
    for (const f of currentFlames()) {
      const fx2 = (0.5 + (f.x - 0.5) * muralScale(now)) * scenePos.w;
      const fy2 = (0.5 + (f.y - 0.5) * muralScale(now)) * scenePos.h;
      const d = Math.hypot(lamp.x - fx2, lamp.y - fy2) /
                (Math.max(scenePos.w, scenePos.h) * 0.16);
      best = Math.max(best, Math.max(0, 1 - d));
    }
    lampProx.v += (best - lampProx.v) * 0.06;
  } else {
    lampProx.v *= 0.98;
  }
  /* 音随交互:风声滤波/增益随运动量,声像随灯位 */
  if (audio) {
    const t = audio.ac.currentTime;
    audio.lp.frequency.setTargetAtTime(360 - 130 * nv + 240 * motion.v, t, 0.12);
    audio.wg.gain.setTargetAtTime((0.5 - 0.18 * nv) * (1 + 0.65 * motion.v), t, 0.12);
    if (audio.pan) {
      const panV = lamp.moved
        ? Math.max(-0.9, Math.min(0.9, (lamp.x / scenePos.w - 0.5) * 1.5)) : 0;
      audio.pan.pan.setTargetAtTime(panV, t, 0.15);
    }
  }
  nightVeil.style.opacity = (nv * 0.87).toFixed(3);
  muralGlow.style.opacity = nv.toFixed(3);
  lampGlow.style.opacity  = nv.toFixed(3);

  /* 颜料回鲜:夜里灯照久处苏醒;白天存量缓缓褪去 */
  if (heat) {
    const gainOn = nv > 0.03;
    updateHeat(dt, lr, gainOn);
    drawFresh(nv);
    nicheStatueEl.style.opacity = (0.12 + 0.88 * Math.min(1, nicheHeat() * 1.15)).toFixed(3);
  }
  lastNV = nv;

  ctx.clearRect(0, 0, W, H);

  /* 浮尘(夜里的浮尘沉入黑暗,只剩灯边一点) */
  const time = now;
  for (const d of dust) {
    d.t += d.sp * dt * 0.4;
    if (d.t > 1) d.t = 0;
    const p = shaftPoint(d.t, d.off + Math.sin(time * 0.0005 + d.ph) * 0.06);
    const tw = 0.5 + 0.5 * Math.sin(time * 0.0016 * d.tw + d.ph);
    ctx.globalAlpha = (0.16 + 0.30 * tw * (1 - d.t * 0.55)) * (1 - nv * 0.62);
    ctx.fillStyle = "rgb(236, 205, 148)";
    ctx.beginPath();
    ctx.arc(p.x - mx * 6, p.y - my * 4, d.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* 飘带(夜里的绸带隐去) */
  if (!reduced && nv < 0.98 && !pano.on) {
    ctx.globalAlpha = 1 - nv;
    for (const r of RIBBONS) drawRibbon(r, time);
    ctx.globalAlpha = 1;
  }

  /* 散花(夜里停止散花,存量落完) */
  if (!reduced && nv < 0.9 && !pano.on) {
    petalTimer -= dt;
    if (petalTimer <= 0 && petals.length < 14) {
      spawnPetal();
      petalTimer = rand(1.2, 2.8);
    }
    ctx.globalAlpha = 1 - nv * 0.9;
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      drawPetal(p, dt, 1 - nv * 0.9);
      if (p.y > H + 40) petals.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  /* 长明灯焰(只在夜里;环视模式由 renderPano 自行投影绘制) */
  if (nv > 0.005 && !pano.on) {
    for (const f of currentFlames()) drawFlame(f, time, nv);
  }

  /* 紫外层:荧光闪烁 + 扫描带 */
  if (uv.on && uvBuf) {
    uctx.clearRect(0, 0, W, H);
    const flick = reduced ? 0.82
      : 0.74 + 0.18 * Math.sin(now * 0.004) + 0.08 * Math.sin(now * 0.0133 + 2.0);
    uctx.globalAlpha = Math.min(1, Math.max(0.3, flick));
    uctx.drawImage(uvBuf, 0, 0, scenePos.w, scenePos.h);
    /* 扫描亮带缓缓横移 */
    if (!reduced) {
      const sweep = ((now * 0.055) % (scenePos.w + 340)) - 170;
      const g2 = uctx.createLinearGradient(sweep - 130, 0, sweep + 130, 0);
      g2.addColorStop(0, "rgba(140, 190, 255, 0)");
      g2.addColorStop(0.5, "rgba(140, 190, 255, 0.075)");
      g2.addColorStop(1, "rgba(140, 190, 255, 0)");
      uctx.fillStyle = g2;
      uctx.fillRect(sweep - 130, 0, 260, scenePos.h);
    }
    uctx.globalAlpha = 1;
  }

  /* 环视渲染与朱砂点投影 */
  if (pano.on) {
    renderPano(nv);
    layoutPanoHotspots();
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* 初始文案:放在最后——applyLang 用到的 DOM 引用此时才全部就位 */
applyLang();
