const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const livesEl = document.getElementById("lives");
const statusEl = document.getElementById("status");
const statusMessageEl = document.getElementById("statusMessage");
const medalRowEl = document.getElementById("medalRow");
const gameRoot = document.querySelector(".game");
const hudEl = document.querySelector(".hud");
const inputPanelTextEl = document.querySelector(".input-panel__text");
const arena = document.querySelector(".arena");
const toneInput = document.getElementById("toneInput");
const toneHeadingMode = document.getElementById("toneHeadingMode");
const toneModeLabel = document.getElementById("toneModeLabel");
const toneExample = document.getElementById("toneExample");
const startBtn = document.getElementById("startBtn");
const replayBtn = document.getElementById("replayBtn");
const levelSelect = document.getElementById("levelSelect");
const levelPickerBtn = document.getElementById("levelPickerBtn");
const keypad = document.getElementById("keypad");
const keypadButtons = keypad ? Array.from(keypad.querySelectorAll(".keypad__key")) : [];
const backspaceBtn = document.getElementById("backspaceBtn");
const birdOverlay = document.getElementById("birdOverlay");
const birdMedal = document.getElementById("birdMedal");
const birdTitle = document.getElementById("birdTitle");
const birdText = document.getElementById("birdText");
const birdCloseBtn = document.getElementById("birdClose");
const levelOverlay = document.getElementById("levelOverlay");
const levelList = document.getElementById("levelList");
const levelCloseBtn = document.getElementById("levelClose");

const STORAGE_KEY = "toneRaindropProgress";
const INPUT_IDLE_CLEAR_MS = 1000;
const SPEECH_MIN_INTERVAL_MS = 320;
const MAX_FRAME_DELTA = 0.08;
const BIRD_TYPE_SPEED_MS = 22;
const BIRD_TYPE_PAUSE_SHORT_MS = 90;
const BIRD_TYPE_PAUSE_LONG_MS = 180;
const BIRD_TYPE_PAUSE_NEWLINE_MS = 120;
const USE_NUMBER_LABELS =
  new URLSearchParams(window.location.search).get("numbers") !== "0";

const TONE_SYMBOLS = {
  "1": "─",
  "2": "╱",
  "3": "∨",
  "4": "╲",
};

const MEDAL_TIERS = [
  { id: "bronze", label: "Bronze", score: 20, image: "medals/bronze.png" },
  { id: "silver", label: "Silver", score: 30, image: "medals/silver.png" },
  { id: "gold", label: "Gold", score: 40, image: "medals/gold.png" },
];
const SECRET_MEDAL = { id: "platinum", label: "Platinum", score: 50, image: "medals/platinum.png" };
const MEDAL_LOOKUP = new Map(
  [...MEDAL_TIERS, SECRET_MEDAL].map((medal) => [medal.id, medal])
);

const WORDS_BY_TONE = {
  "1": [
    { text: "一", tones: "1", sv: "ett; en" },
    { text: "天", tones: "1", sv: "dag; himmel" },
    { text: "中", tones: "1", sv: "mitten; central" },
    { text: "书", tones: "1", sv: "bok" },
    { text: "东", tones: "1", sv: "öst" },
    { text: "新", tones: "1", sv: "ny" },
    { text: "多", tones: "1", sv: "många; mer" },
    { text: "开", tones: "1", sv: "öppna; starta" },
    { text: "高", tones: "1", sv: "hög" },
    { text: "家", tones: "1", sv: "hem; familj" },
  ],
  "2": [
    { text: "人", tones: "2", sv: "person; människa" },
    { text: "时", tones: "2", sv: "tid" },
    { text: "学", tones: "2", sv: "studera; lära" },
    { text: "前", tones: "2", sv: "fram; före" },
    { text: "来", tones: "2", sv: "komma" },
    { text: "行", tones: "2", sv: "fungera; gå bra" },
    { text: "年", tones: "2", sv: "år" },
    { text: "同", tones: "2", sv: "samma" },
    { text: "儿", tones: "2", sv: "barn; son" },
    { text: "国", tones: "2", sv: "land; stat" },
  ],
  "3": [
    { text: "我", tones: "3", sv: "jag" },
    { text: "你", tones: "3", sv: "du" },
    { text: "好", tones: "3", sv: "bra; god" },
    { text: "有", tones: "3", sv: "ha; finnas" },
    { text: "想", tones: "3", sv: "tänka; vilja" },
    { text: "里", tones: "3", sv: "i; inuti" },
    { text: "买", tones: "3", sv: "köpa" },
    { text: "老", tones: "3", sv: "gammal; äldre" },
    { text: "小", tones: "3", sv: "liten" },
    { text: "水", tones: "3", sv: "vatten" },
  ],
  "4": [
    { text: "是", tones: "4", sv: "vara (är)" },
    { text: "不", tones: "4", sv: "inte" },
    { text: "大", tones: "4", sv: "stor" },
    { text: "去", tones: "4", sv: "gå; åka" },
    { text: "看", tones: "4", sv: "titta; se" },
    { text: "会", tones: "4", sv: "kunna; möte" },
    { text: "上", tones: "4", sv: "upp; på" },
    { text: "下", tones: "4", sv: "ner; under" },
    { text: "在", tones: "4", sv: "vara i; finnas" },
    { text: "要", tones: "4", sv: "vilja; behöva" },
  ],
  "11": [
    { text: "今天", tones: "11", sv: "idag" },
    { text: "医生", tones: "11", sv: "läkare" },
    { text: "公司", tones: "11", sv: "företag" },
    { text: "咖啡", tones: "11", sv: "kaffe" },
    { text: "飞机", tones: "11", sv: "flygplan" },
    { text: "声音", tones: "11", sv: "ljud" },
    { text: "书包", tones: "11", sv: "skolväska" },
    { text: "交通", tones: "11", sv: "trafik; transport" },
    { text: "开车", tones: "11", sv: "köra bil" },
    { text: "司机", tones: "11", sv: "chaufför" },
  ],
  "12": [
    { text: "中国", tones: "12", sv: "Kina" },
    { text: "中文", tones: "12", sv: "kinesiska (språk)" },
    { text: "新闻", tones: "12", sv: "nyheter" },
    { text: "公园", tones: "12", sv: "park" },
    { text: "花园", tones: "12", sv: "trädgård" },
    { text: "当然", tones: "12", sv: "självklart; förstås" },
    { text: "虽然", tones: "12", sv: "fastän; även om" },
    { text: "依然", tones: "12", sv: "fortfarande" },
    { text: "交流", tones: "12", sv: "utbyta; kommunicera" },
    { text: "光荣", tones: "12", sv: "ära; heder" },
  ],
  "13": [
    { text: "开始", tones: "13", sv: "börja; starta" },
    { text: "机场", tones: "13", sv: "flygplats" },
    { text: "方法", tones: "13", sv: "metod; sätt" },
    { text: "清楚", tones: "13", sv: "tydlig; klart" },
    { text: "刚好", tones: "13", sv: "precis lagom; just i tid" },
    { text: "商场", tones: "13", sv: "köpcentrum" },
    { text: "发表", tones: "13", sv: "publicera; uttrycka" },
    { text: "参考", tones: "13", sv: "referens; hänvisa till" },
    { text: "听懂", tones: "13", sv: "förstå (när man hör)" },
    { text: "心里", tones: "13", sv: "innerst inne; i hjärtat" },
  ],
  "14": [
    { text: "工作", tones: "14", sv: "arbete; jobba" },
    { text: "知道", tones: "14", sv: "veta" },
    { text: "希望", tones: "14", sv: "hoppas; hopp" },
    { text: "帮助", tones: "14", sv: "hjälpa; hjälp" },
    { text: "高兴", tones: "14", sv: "glad" },
    { text: "天气", tones: "14", sv: "väder" },
    { text: "需要", tones: "14", sv: "behöva" },
    { text: "生日", tones: "14", sv: "födelsedag" },
    { text: "关系", tones: "14", sv: "relation" },
    { text: "经济", tones: "14", sv: "ekonomi" },
  ],
  "21": [
    { text: "学生", tones: "21", sv: "student; elev" },
    { text: "时间", tones: "21", sv: "tid" },
    { text: "明天", tones: "21", sv: "imorgon" },
    { text: "昨天", tones: "21", sv: "igår" },
    { text: "国家", tones: "21", sv: "land; nation" },
    { text: "文章", tones: "21", sv: "artikel; text" },
    { text: "房间", tones: "21", sv: "rum" },
    { text: "钱包", tones: "21", sv: "plånbok" },
    { text: "南方", tones: "21", sv: "söder; södra delen" },
    { text: "人家", tones: "21", sv: "andra; folk (vardagligt)" },
  ],
  "22": [
    { text: "学习", tones: "22", sv: "studera; lära sig" },
    { text: "同学", tones: "22", sv: "klasskamrat" },
    { text: "人民", tones: "22", sv: "folk; befolkning" },
    { text: "由于", tones: "22", sv: "på grund av" },
    { text: "然而", tones: "22", sv: "dock; emellertid" },
    { text: "及时", tones: "22", sv: "i tid; i rätt tid" },
    { text: "留学", tones: "22", sv: "studera utomlands" },
    { text: "形容", tones: "22", sv: "beskriva" },
    { text: "实习", tones: "22", sv: "praktik; praktisera" },
    { text: "其余", tones: "22", sv: "resten; övriga" },
  ],
  "23": [
    { text: "没有", tones: "23", sv: "inte ha; sakna" },
    { text: "如果", tones: "23", sv: "om" },
    { text: "还有", tones: "23", sv: "dessutom; också ha" },
    { text: "结果", tones: "23", sv: "resultat" },
    { text: "人口", tones: "23", sv: "befolkning" },
    { text: "传统", tones: "23", sv: "tradition" },
    { text: "合理", tones: "23", sv: "rimlig" },
    { text: "词典", tones: "23", sv: "ordbok" },
    { text: "明显", tones: "23", sv: "tydlig; uppenbar" },
    { text: "成本", tones: "23", sv: "kostnad" },
  ],
  "24": [
    { text: "然后", tones: "24", sv: "sedan; därefter" },
    { text: "文化", tones: "24", sv: "kultur" },
    { text: "城市", tones: "24", sv: "stad" },
    { text: "颜色", tones: "24", sv: "färg" },
    { text: "条件", tones: "24", sv: "villkor" },
    { text: "人类", tones: "24", sv: "mänskligheten" },
    { text: "词汇", tones: "24", sv: "ordförråd" },
    { text: "明确", tones: "24", sv: "tydlig; klargöra" },
    { text: "形势", tones: "24", sv: "läge; situation" },
    { text: "其次", tones: "24", sv: "för det andra; näst" },
  ],
  "31": [
    { text: "老师", tones: "31", sv: "lärare" },
    { text: "手机", tones: "31", sv: "mobiltelefon" },
    { text: "小心", tones: "31", sv: "försiktig; se upp" },
    { text: "好多", tones: "31", sv: "många; en hel del" },
    { text: "点心", tones: "31", sv: "snacks; fika (dim sum)" },
    { text: "早餐", tones: "31", sv: "frukost" },
    { text: "晚餐", tones: "31", sv: "middag" },
    { text: "老公", tones: "31", sv: "make (vardagligt)" },
    { text: "买单", tones: "31", sv: "betala (notan)" },
    { text: "保安", tones: "31", sv: "säkerhetsvakt" },
  ],
  "32": [
    { text: "美国", tones: "32", sv: "USA" },
    { text: "可能", tones: "32", sv: "kanske; möjlig" },
    { text: "本来", tones: "32", sv: "egentligen; från början" },
    { text: "旅游", tones: "32", sv: "resa; turism" },
    { text: "语言", tones: "32", sv: "språk" },
    { text: "理由", tones: "32", sv: "anledning" },
    { text: "选择", tones: "32", sv: "välja; val" },
    { text: "感觉", tones: "32", sv: "känsla; känna" },
    { text: "解决", tones: "32", sv: "lösa" },
    { text: "品牌", tones: "32", sv: "märke; varumärke" },
  ],
  "33": [
    { text: "你好", tones: "33", sv: "hej" },
    { text: "可以", tones: "33", sv: "kan; okej" },
    { text: "哪里", tones: "33", sv: "var" },
    { text: "老板", tones: "33", sv: "chef" },
    { text: "小姐", tones: "33", sv: "fröken; unga damen" },
    { text: "影响", tones: "33", sv: "påverkan; påverka" },
    { text: "手表", tones: "33", sv: "armbandsur" },
    { text: "理想", tones: "33", sv: "ideal; dröm" },
    { text: "口语", tones: "33", sv: "talspråk" },
    { text: "洗澡", tones: "33", sv: "duscha; bada" },
  ],
  "34": [
    { text: "考试", tones: "34", sv: "prov; examen" },
    { text: "以后", tones: "34", sv: "senare; efter" },
    { text: "准备", tones: "34", sv: "förbereda" },
    { text: "比较", tones: "34", sv: "jämföra; ganska" },
    { text: "改变", tones: "34", sv: "förändra" },
    { text: "访问", tones: "34", sv: "besöka" },
    { text: "讨论", tones: "34", sv: "diskutera" },
    { text: "感谢", tones: "34", sv: "tacka; vara tacksam" },
    { text: "保护", tones: "34", sv: "skydda" },
    { text: "只是", tones: "34", sv: "bara; endast" },
  ],
  "41": [
    { text: "地方", tones: "41", sv: "plats; ställe" },
    { text: "必须", tones: "41", sv: "måste" },
    { text: "放心", tones: "41", sv: "var lugn; känna sig trygg" },
    { text: "认真", tones: "41", sv: "seriöst; noggrant" },
    { text: "细心", tones: "41", sv: "noggrann; omsorgsfull" },
    { text: "教师", tones: "41", sv: "lärare (formellt)" },
    { text: "证书", tones: "41", sv: "certifikat; intyg" },
    { text: "上班", tones: "41", sv: "gå till jobbet; jobba" },
    { text: "下班", tones: "41", sv: "sluta jobbet" },
    { text: "看书", tones: "41", sv: "läsa (böcker)" },
  ],
  "42": [
    { text: "问题", tones: "42", sv: "problem; fråga" },
    { text: "事情", tones: "42", sv: "sak; ärende" },
    { text: "认为", tones: "42", sv: "anse; tycka" },
    { text: "后来", tones: "42", sv: "senare; sedan" },
    { text: "内容", tones: "42", sv: "innehåll" },
    { text: "个人", tones: "42", sv: "individ; personlig" },
    { text: "过程", tones: "42", sv: "process; förlopp" },
    { text: "客人", tones: "42", sv: "gäst; kund" },
    { text: "负责", tones: "42", sv: "ansvara för" },
    { text: "自然", tones: "42", sv: "natur; naturligt" },
  ],
  "43": [
    { text: "办法", tones: "43", sv: "metod; sätt" },
    { text: "地址", tones: "43", sv: "adress" },
    { text: "自己", tones: "43", sv: "själv" },
    { text: "密码", tones: "43", sv: "lösenord; kod" },
    { text: "记者", tones: "43", sv: "journalist; reporter" },
    { text: "作者", tones: "43", sv: "författare" },
    { text: "饭馆", tones: "43", sv: "restaurang" },
    { text: "进口", tones: "43", sv: "import" },
    { text: "数码", tones: "43", sv: "digital" },
    { text: "汉语", tones: "43", sv: "kinesiska (han-kinesiska)" },
  ],
  "44": [
    { text: "现在", tones: "44", sv: "nu" },
    { text: "但是", tones: "44", sv: "men" },
    { text: "再见", tones: "44", sv: "hej då" },
    { text: "重要", tones: "44", sv: "viktig" },
    { text: "世界", tones: "44", sv: "världen" },
    { text: "电话", tones: "44", sv: "telefon" },
    { text: "会议", tones: "44", sv: "möte; konferens" },
    { text: "运动", tones: "44", sv: "träning; sport" },
    { text: "变化", tones: "44", sv: "förändring" },
    { text: "见面", tones: "44", sv: "träffas" },
  ],
};

const SINGLE_TONES = ["1", "2", "3", "4"];
const DOUBLE_TONES = [
  "11",
  "12",
  "13",
  "14",
  "21",
  "22",
  "23",
  "24",
  "31",
  "32",
  "33",
  "34",
  "41",
  "42",
  "43",
  "44",
];
const DOUBLE_TONES_1X = DOUBLE_TONES.filter((tone) => tone.startsWith("1"));
const DOUBLE_TONES_2X = DOUBLE_TONES.filter((tone) => tone.startsWith("2"));
const DOUBLE_TONES_3X = DOUBLE_TONES.filter((tone) => tone.startsWith("3"));
const DOUBLE_TONES_4X = DOUBLE_TONES.filter((tone) => tone.startsWith("4"));
const DOUBLE_TONES_X1 = DOUBLE_TONES.filter((tone) => tone.endsWith("1"));
const DOUBLE_TONES_X2 = DOUBLE_TONES.filter((tone) => tone.endsWith("2"));
const DOUBLE_TONES_X3 = DOUBLE_TONES.filter((tone) => tone.endsWith("3"));
const DOUBLE_TONES_X4 = DOUBLE_TONES.filter((tone) => tone.endsWith("4"));

const LEVELS = [
  { id: "1-4", label: "1-4", tones: SINGLE_TONES, unlockScore: 0, speedScale: 1, spawnScale: 1 },
  { id: "1x", label: "1x", tones: DOUBLE_TONES_1X, unlockScore: 20, speedScale: 1, spawnScale: 1 },
  { id: "2x", label: "2x", tones: DOUBLE_TONES_2X, unlockScore: 20, speedScale: 1, spawnScale: 1 },
  { id: "3x", label: "3x", tones: DOUBLE_TONES_3X, unlockScore: 20, speedScale: 1, spawnScale: 1 },
  { id: "4x", label: "4x", tones: DOUBLE_TONES_4X, unlockScore: 20, speedScale: 1, spawnScale: 1 },
  { id: "x1", label: "x1", tones: DOUBLE_TONES_X1, unlockScore: 20, speedScale: 1, spawnScale: 1 },
  { id: "x2", label: "x2", tones: DOUBLE_TONES_X2, unlockScore: 20, speedScale: 1, spawnScale: 1 },
  { id: "x3", label: "x3", tones: DOUBLE_TONES_X3, unlockScore: 20, speedScale: 1, spawnScale: 1 },
  { id: "x4", label: "x4", tones: DOUBLE_TONES_X4, unlockScore: 20, speedScale: 1, spawnScale: 1 },
  {
    id: "1-44-slow",
    label: "1-44 (Slow)",
    tones: [...SINGLE_TONES, ...DOUBLE_TONES],
    unlockScore: 20,
    speedScale: 0.85,
    spawnScale: 1.2,
  },
  {
    id: "1-44",
    label: "1-44",
    tones: [...SINGLE_TONES, ...DOUBLE_TONES],
    unlockScore: 20,
    speedScale: 1,
    spawnScale: 1,
  },
];

LEVELS.forEach((level) => {
  level.wordPool = buildWordPool(level.tones);
});

const progress = loadProgress();
normalizeProgress();
ensureBaseUnlocks();
ensureBranchUnlocks();

const drops = [];
const splashes = [];
const reveals = [];
const translations = [];

const state = {
  running: false,
  gameOver: false,
  pauseUsed: false,
  finalReveal: false,
  useKeypad: false,
  score: 0,
  lives: 3,
  lastFrame: 0,
  lastSpawn: 0,
  baseSpawn: 1900,
  baseSpeed: 70,
  speedScale: 1,
  spawnScale: 1,
  safeBottom: 0,
  width: 0,
  height: 0,
  levelId: LEVELS[0].id,
  wordPool: [],
};

let lastSpoken = null;
let zhVoice = null;
let nextDropId = 0;
let idleClearTimer = null;
let lastSpeakAt = 0;
let birdTypingTimer = null;
let finalRevealFrame = null;
let finalRevealLastFrame = 0;
let levelOverlayOpenedAt = 0;
let levelOverlayIgnoreClick = false;

function loadProgress() {
  const fallback = { unlocked: new Set(), highscores: {}, lastLevel: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const data = JSON.parse(raw);
    return {
      unlocked: new Set(Array.isArray(data.unlocked) ? data.unlocked : []),
      highscores: data.highscores && typeof data.highscores === "object" ? data.highscores : {},
      lastLevel: typeof data.lastLevel === "string" ? data.lastLevel : null,
    };
  } catch (error) {
    return fallback;
  }
}

function saveProgress() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        unlocked: Array.from(progress.unlocked),
        highscores: progress.highscores,
        lastLevel: progress.lastLevel,
      })
    );
  } catch (error) {
    // Ignore storage errors (private mode, quota, etc.).
  }
}

function buildWordPool(tones) {
  const pool = [];
  tones.forEach((tone) => {
    const entries = WORDS_BY_TONE[tone];
    if (entries) {
      pool.push(...entries);
    }
  });
  return pool;
}

function ensureBaseUnlocks() {
  LEVELS.forEach((level) => {
    if (level.unlockScore === 0) {
      progress.unlocked.add(level.id);
    }
  });
}

function ensureBranchUnlocks() {
  if (progress.unlocked.has("4x")) {
    let changed = false;
    changed = unlockLevel("x1") || changed;
    changed = unlockLevel("1-44-slow") || changed;
    if (changed) {
      saveProgress();
    }
  }
}

function normalizeProgress() {
  const validIds = new Set(LEVELS.map((level) => level.id));
  if (progress.unlocked.has("1x-4x")) {
    progress.unlocked.delete("1x-4x");
    ["1x", "2x", "3x", "4x"].forEach((id) => progress.unlocked.add(id));
  }
  if (progress.lastLevel === "1x-4x") {
    progress.lastLevel = "1x";
  }
  if (progress.highscores["1x-4x"]) {
    const legacyScore = Number(progress.highscores["1x-4x"]) || 0;
    if (legacyScore && !progress.highscores["1x"]) {
      progress.highscores["1x"] = legacyScore;
    }
    delete progress.highscores["1x-4x"];
  }
  progress.unlocked.forEach((id) => {
    if (!validIds.has(id)) {
      progress.unlocked.delete(id);
    }
  });
  if (progress.lastLevel && !validIds.has(progress.lastLevel)) {
    progress.lastLevel = null;
  }
  saveProgress();
}

function getLevelById(levelId) {
  return LEVELS.find((level) => level.id === levelId) || LEVELS[0];
}

function getNextLevel(levelId) {
  const index = LEVELS.findIndex((level) => level.id === levelId);
  if (index === -1) {
    return null;
  }
  return LEVELS[index + 1] || null;
}

function unlockLevel(levelId) {
  if (progress.unlocked.has(levelId)) {
    return false;
  }
  progress.unlocked.add(levelId);
  return true;
}

function unlockUpToLevel(levelId) {
  const index = LEVELS.findIndex((level) => level.id === levelId);
  if (index === -1) {
    return false;
  }
  let unlockedAny = false;
  for (let i = 0; i <= index; i += 1) {
    const level = LEVELS[i];
    if (!progress.unlocked.has(level.id)) {
      progress.unlocked.add(level.id);
      unlockedAny = true;
    }
  }
  return unlockedAny;
}

function areAllPreviousUnlocked(levelId) {
  const index = LEVELS.findIndex((level) => level.id === levelId);
  if (index <= 0) {
    return true;
  }
  for (let i = 0; i < index; i += 1) {
    if (!progress.unlocked.has(LEVELS[i].id)) {
      return false;
    }
  }
  return true;
}

function isLevelUnlocked(levelId) {
  return progress.unlocked.has(levelId);
}

function buildLevelMedals(container, score) {
  MEDAL_TIERS.forEach((tier) => {
    if (score >= tier.score) {
      const img = document.createElement("img");
      img.className = "medal";
      img.src = tier.image;
      img.alt = `${tier.label} medal (${tier.score})`;
      container.appendChild(img);
    } else {
      const empty = document.createElement("span");
      empty.className = "medal medal--empty";
      empty.setAttribute("aria-label", `${tier.label} medal (${tier.score}) not yet achieved`);
      empty.title = `${tier.label} (${tier.score})`;
      container.appendChild(empty);
    }
  });

  if (score >= SECRET_MEDAL.score) {
    const img = document.createElement("img");
    img.className = "medal";
    img.src = SECRET_MEDAL.image;
    img.alt = `${SECRET_MEDAL.label} medal (${SECRET_MEDAL.score})`;
    container.appendChild(img);
  }
}

function renderLevelOverlay() {
  if (!levelList) {
    return;
  }
  levelList.replaceChildren();
  LEVELS.forEach((level) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "level-card";
    const unlocked = isLevelUnlocked(level.id);
    card.disabled = !unlocked;
    if (level.id === state.levelId) {
      card.classList.add("is-selected");
    }

    const name = document.createElement("div");
    name.className = "level-card__name";
    name.textContent = level.label;

    const medals = document.createElement("div");
    medals.className = "level-card__medals";
    buildLevelMedals(medals, getHighScore(level.id));

    card.append(name, medals);
    if (unlocked) {
      card.addEventListener("click", () => {
        setLevel(level.id, { announce: false });
        resetGame();
        closeLevelOverlay();
      });
    }
    levelList.appendChild(card);
  });
}

function renderLevelOptions() {
  levelSelect.innerHTML = "";
  LEVELS.forEach((level) => {
    const option = document.createElement("option");
    const unlocked = isLevelUnlocked(level.id);
    option.value = level.id;
    option.textContent = unlocked ? level.label : `${level.label} (Unlock ${level.unlockScore})`;
    option.disabled = !unlocked;
    levelSelect.appendChild(option);
  });

  if (isLevelUnlocked(state.levelId)) {
    levelSelect.value = state.levelId;
  } else {
    const firstUnlocked = LEVELS.find((level) => isLevelUnlocked(level.id));
    if (firstUnlocked) {
      levelSelect.value = firstUnlocked.id;
    }
  }

  renderLevelOverlay();
  updateLevelPickerButton();
}

function getHighScore(levelId) {
  return Number(progress.highscores[levelId]) || 0;
}

function updateHighScore() {
  highScoreEl.textContent = getHighScore(state.levelId);
}

function updateLevelPickerButton() {
  if (!levelPickerBtn || !levelSelect) {
    return;
  }
  const levelId = levelSelect.value || state.levelId;
  const level = getLevelById(levelId);
  levelPickerBtn.textContent = level ? level.label : "Level";
  levelPickerBtn.setAttribute("aria-label", `Level ${level ? level.label : ""}`.trim());
  levelPickerBtn.disabled = levelSelect.disabled;
}

function setLevel(levelId, { announce = true } = {}) {
  const level = getLevelById(levelId);
  state.levelId = level.id;
  state.wordPool = level.wordPool;
  state.speedScale = level.speedScale ?? 1;
  state.spawnScale = level.spawnScale ?? 1;
  progress.lastLevel = level.id;
  saveProgress();
  updateHighScore();
  levelSelect.value = level.id;
  updateLevelPickerButton();
  renderMedals();
  if (announce) {
    showMedalStatus();
  }
}

function loadVoices() {
  if (!window.speechSynthesis) {
    return;
  }
  const voices = window.speechSynthesis.getVoices();
  zhVoice =
    voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("zh")) ||
    voices.find((voice) => voice.lang && voice.lang.toLowerCase().includes("cmn")) ||
    null;
}

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text, { force = false } = {}) {
  if (!window.speechSynthesis) {
    return;
  }
  const now = performance.now();
  const synth = window.speechSynthesis;
  if (!force && now - lastSpeakAt < SPEECH_MIN_INTERVAL_MS && synth.speaking) {
    return;
  }
  lastSpeakAt = now;
  if (synth.pending || synth.speaking) {
    synth.cancel();
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  if (zhVoice) {
    utterance.voice = zhVoice;
  }
  synth.speak(utterance);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  const nextWidth = Math.round(rect.width * dpr);
  const nextHeight = Math.round(rect.height * dpr);
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.width = rect.width;
  state.height = rect.height;
  state.safeBottom = rect.height - 6;
  updateInputMode();
  updateStatusPlacement();
}

function updateHud() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
}

function setStatus(message) {
  if (!statusMessageEl || !medalRowEl) {
    if (statusEl) {
      statusEl.textContent = message;
    }
    return;
  }
  statusMessageEl.textContent = message;
  if (state.useKeypad) {
    statusEl?.classList.add("status--medals");
    statusMessageEl.hidden = true;
    medalRowEl.hidden = false;
    renderMedals();
  } else {
    statusEl?.classList.remove("status--medals");
    statusMessageEl.hidden = false;
    medalRowEl.hidden = true;
  }
  updateStatusPlacement();
}

function getMedalTierIds(score) {
  const earned = new Set();
  MEDAL_TIERS.forEach((tier) => {
    if (score >= tier.score) {
      earned.add(tier.id);
    }
  });
  if (score >= SECRET_MEDAL.score) {
    earned.add(SECRET_MEDAL.id);
  }
  return earned;
}

function pickHighestMedal(earnedIds) {
  const ordered = [...MEDAL_TIERS.map((tier) => tier.id), SECRET_MEDAL.id];
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    if (earnedIds.has(ordered[i])) {
      return ordered[i];
    }
  }
  return null;
}

function renderMedals() {
  if (!medalRowEl) {
    return;
  }
  const highScore = getHighScore(state.levelId);
  medalRowEl.replaceChildren();

  MEDAL_TIERS.forEach((tier) => {
    if (highScore >= tier.score) {
      const img = document.createElement("img");
      img.className = "medal";
      img.src = tier.image;
      img.alt = `${tier.label} medal (${tier.score})`;
      medalRowEl.appendChild(img);
    } else {
      const empty = document.createElement("span");
      empty.className = "medal medal--empty";
      empty.setAttribute("aria-label", `${tier.label} medal (${tier.score}) not yet achieved`);
      empty.title = `${tier.label} (${tier.score})`;
      medalRowEl.appendChild(empty);
    }
  });

  if (highScore >= SECRET_MEDAL.score) {
    const img = document.createElement("img");
    img.className = "medal";
    img.src = SECRET_MEDAL.image;
    img.alt = `${SECRET_MEDAL.label} medal (${SECRET_MEDAL.score})`;
    medalRowEl.appendChild(img);
  }
}

function showMedalStatus() {
  if (!statusMessageEl || !medalRowEl) {
    return;
  }
  statusEl?.classList.add("status--medals");
  statusMessageEl.hidden = true;
  medalRowEl.hidden = false;
  renderMedals();
  updateStatusPlacement();
}

function toPixels(value) {
  if (!value) {
    return 0;
  }
  const trimmed = value.trim();
  const amount = Number.parseFloat(trimmed);
  if (Number.isNaN(amount)) {
    return 0;
  }
  if (trimmed.endsWith("rem")) {
    const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return amount * rootSize;
  }
  if (trimmed.endsWith("vh")) {
    return (amount / 100) * window.innerHeight;
  }
  if (trimmed.endsWith("vw")) {
    return (amount / 100) * window.innerWidth;
  }
  return amount;
}

function getStatusInsetPx() {
  if (!statusEl) {
    return 0;
  }
  const insetValue = getComputedStyle(statusEl).getPropertyValue("--status-inset");
  return toPixels(insetValue);
}

function updateStatusPlacement() {
  if (!statusEl || !arena || statusEl.hasAttribute("hidden")) {
    return;
  }
  const arenaRect = arena.getBoundingClientRect();
  if (!arenaRect.height) {
    return;
  }
  const statusRect = statusEl.getBoundingClientRect();
  if (!statusRect.height) {
    return;
  }
  const insetPx = getStatusInsetPx();
  const shouldCenter = statusRect.height + insetPx > arenaRect.height;
  statusEl.classList.toggle("status--centered", shouldCenter);
}

function buildBirdDialog({ score, newMedalId, isHighScore, unlockedNextLevel }) {
  if (newMedalId) {
    const medal = MEDAL_LOOKUP.get(newMedalId);
    const lines = [];
    let text = `Congratulations! You earned the ${medal.label.toLowerCase()} medal!`;
    if (newMedalId === SECRET_MEDAL.id) {
      text =
        "I am EXTREMELY impressed, and I've created a new medal just for students like you - the platinum medal!";
    }
    lines.push(text);
    if (unlockedNextLevel) {
      lines.push("I have now unlocked the next level!");
    }
    return {
      title: "YOU GOT A MEDAL!",
      text: lines.join("\n"),
      medalId: newMedalId,
    };
  }

  if (isHighScore) {
    const nextTier = MEDAL_TIERS.find((tier) => score < tier.score);
    const text = nextTier
      ? `Congratulations! If you continue like this, you might get that ${nextTier.label.toLowerCase()} medal soon!`
      : "Congratulations! If you continue to excel like this, I might have to create a NEW medal!";
    return {
      title: "NEW HIGHSCORE!",
      text,
      medalId: null,
    };
  }

  return null;
}

function clearBirdTyping() {
  if (birdTypingTimer) {
    window.clearTimeout(birdTypingTimer);
  }
  birdTypingTimer = null;
}

function getBirdTypingDelay(character) {
  if (character === "\n") {
    return BIRD_TYPE_PAUSE_NEWLINE_MS;
  }
  if (character === "." || character === "!" || character === "?") {
    return BIRD_TYPE_PAUSE_LONG_MS;
  }
  if (character === "," || character === ";" || character === ":") {
    return BIRD_TYPE_PAUSE_SHORT_MS;
  }
  return BIRD_TYPE_SPEED_MS;
}

function typeBirdText(text) {
  if (!birdText) {
    return;
  }
  clearBirdTyping();
  birdText.textContent = "";
  let index = 0;

  const step = () => {
    if (!birdOverlay || birdOverlay.hidden) {
      clearBirdTyping();
      return;
    }
    birdText.textContent += text[index];
    index += 1;
    if (index >= text.length) {
      birdTypingTimer = null;
      return;
    }
    const delay = getBirdTypingDelay(text[index - 1]);
    birdTypingTimer = window.setTimeout(step, delay);
  };

  birdTypingTimer = window.setTimeout(step, BIRD_TYPE_SPEED_MS);
}

function showBird(dialog) {
  if (!birdOverlay || !birdText || !birdTitle) {
    return;
  }
  if (!dialog) {
    return;
  }
  birdTitle.textContent = dialog.title;
  typeBirdText(dialog.text);
  if (birdMedal) {
    if (dialog.medalId) {
      const medal = MEDAL_LOOKUP.get(dialog.medalId);
      birdMedal.src = medal.image;
      birdMedal.alt = `${medal.label} medal`;
      birdMedal.hidden = false;
    } else {
      birdMedal.hidden = true;
      birdMedal.removeAttribute("src");
      birdMedal.alt = "";
    }
  }
  birdOverlay.hidden = false;
  document.body.classList.add("bird-active");
}

function hideBird() {
  if (!birdOverlay) {
    return;
  }
  clearBirdTyping();
  birdOverlay.hidden = true;
  document.body.classList.remove("bird-active");
  if (birdMedal) {
    birdMedal.hidden = true;
    birdMedal.removeAttribute("src");
    birdMedal.alt = "";
  }
}

function openLevelOverlay() {
  if (!levelOverlay) {
    return;
  }
  if (!levelOverlay.hidden) {
    return;
  }
  renderLevelOverlay();
  levelOverlay.hidden = false;
  levelOverlayOpenedAt = performance.now();
  levelOverlayIgnoreClick = true;
  document.body.classList.add("level-overlay-active");
}

function closeLevelOverlay() {
  if (!levelOverlay) {
    return;
  }
  levelOverlay.hidden = true;
  document.body.classList.remove("level-overlay-active");
  levelOverlayIgnoreClick = false;
}

function focusInput() {
  if (toneInput.hasAttribute("disabled") || state.useKeypad) {
    return;
  }
  try {
    toneInput.focus({ preventScroll: true });
  } catch (error) {
    toneInput.focus();
  }
}

function clearInputTimer() {
  if (idleClearTimer) {
    window.clearTimeout(idleClearTimer);
    idleClearTimer = null;
  }
}

function scheduleInputClear() {
  clearInputTimer();
  idleClearTimer = window.setTimeout(() => {
    idleClearTimer = null;
    if (!state.running) {
      return;
    }
    if (toneInput.value) {
      toneInput.value = "";
    }
  }, INPUT_IDLE_CLEAR_MS);
}

function sanitizeInput(value) {
  return value.replace(/[^1-4]/g, "").slice(0, 2);
}

function formatToneDigit(digit) {
  if (USE_NUMBER_LABELS) {
    return digit;
  }
  return TONE_SYMBOLS[digit] || digit;
}

function formatToneString(tones) {
  if (USE_NUMBER_LABELS) {
    return tones;
  }
  return tones
    .split("")
    .map((digit) => formatToneDigit(digit))
    .join("");
}

function updateToneLabels() {
  keypadButtons.forEach((button) => {
    const digit = button.dataset.digit;
    const label = formatToneDigit(digit);
    button.textContent = label;
    button.setAttribute(
      "aria-label",
      USE_NUMBER_LABELS ? `Tone ${digit}` : `Tone ${digit} (${label})`
    );
  });
  if (toneModeLabel) {
    toneModeLabel.textContent = USE_NUMBER_LABELS ? "numbers" : "symbols";
  }
  if (toneHeadingMode) {
    toneHeadingMode.textContent = USE_NUMBER_LABELS ? "numbers" : "symbols";
  }
  if (toneExample) {
    toneExample.textContent = USE_NUMBER_LABELS
      ? "23"
      : `${formatToneDigit("2")}${formatToneDigit("3")}`;
  }
}

function isPortraitLike() {
  return window.matchMedia("(orientation: portrait)").matches || window.innerHeight > window.innerWidth;
}

function updateInputMode() {
  state.useKeypad = isPortraitLike();
  if (gameRoot) {
    gameRoot.classList.toggle("game--keypad", state.useKeypad);
  }
  if (state.useKeypad) {
    toneInput.setAttribute("inputmode", "none");
    toneInput.setAttribute("readonly", "readonly");
    toneInput.setAttribute("tabindex", "-1");
    toneInput.blur();
  } else {
    toneInput.setAttribute("inputmode", "numeric");
    toneInput.removeAttribute("readonly");
    toneInput.removeAttribute("tabindex");
    closeLevelOverlay();
  }
  updateInputEnabled();
}

function updateInputEnabled() {
  if (state.useKeypad) {
    toneInput.setAttribute("disabled", "disabled");
  } else if (state.running) {
    toneInput.removeAttribute("disabled");
  } else {
    toneInput.setAttribute("disabled", "disabled");
  }
  keypadButtons.forEach((button) => {
    button.disabled = !state.running || !state.useKeypad;
  });
  if (backspaceBtn) {
    backspaceBtn.disabled = !state.running || !state.useKeypad;
  }
  updateLevelPickerButton();
}

function handleToneValue(value) {
  const cleaned = sanitizeInput(value);
  if (toneInput.value !== cleaned) {
    toneInput.value = cleaned;
  }
  if (cleaned) {
    scheduleInputClear();
  } else {
    clearInputTimer();
  }
  if (!state.running || !cleaned) {
    return;
  }
  const match = findMatch(cleaned);
  if (match) {
    clearDrop(match);
    toneInput.value = "";
    clearInputTimer();
    focusInput();
  }
}

function appendDigit(digit) {
  if (!state.running) {
    return;
  }
  const nextValue = sanitizeInput(`${toneInput.value}${digit}`);
  toneInput.value = nextValue;
  handleToneValue(nextValue);
}

function handleBackspace() {
  if (!state.running) {
    return;
  }
  if (!toneInput.value) {
    return;
  }
  const nextValue = toneInput.value.slice(0, -1);
  toneInput.value = nextValue;
  handleToneValue(nextValue);
}

function difficulty() {
  const level = 1 + state.score / 9;
  const spawnScale = state.spawnScale ?? 1;
  const speedScale = state.speedScale ?? 1;
  return {
    spawn: Math.max(850, state.baseSpawn / level) * spawnScale,
    speed: (state.baseSpeed + state.score * 2.5) * speedScale,
  };
}

function randomEntry() {
  if (!state.wordPool.length) {
    return null;
  }
  return state.wordPool[Math.floor(Math.random() * state.wordPool.length)];
}

function spawnDrop() {
  if (drops.length > 18 || !state.wordPool.length) {
    return;
  }
  const entry = randomEntry();
  if (!entry) {
    return;
  }
  const radius = 24 + Math.random() * 14;
  const margin = radius + 12;
  const x = margin + Math.random() * Math.max(0, state.width - margin * 2);
  const y = -radius - Math.random() * 40;
  const { speed } = difficulty();
  const drop = {
    id: nextDropId++,
    text: entry.text,
    tones: entry.tones,
    sv: entry.sv,
    x,
    y,
    radius,
    speed: speed + Math.random() * 20,
  };
  drops.push(drop);
  lastSpoken = drop;
  speak(drop.text);
}

function startGame() {
  if (state.running) {
    return;
  }
  if (!state.wordPool.length) {
    setStatus("No words loaded for this level.");
    return;
  }
  hideBird();
  hudEl?.removeAttribute("hidden");
  inputPanelTextEl?.removeAttribute("hidden");
  gameRoot?.classList.remove("game--final-reveal");
  state.running = true;
  state.gameOver = false;
  state.lastFrame = 0;
  state.lastSpawn = performance.now();
  gameRoot?.classList.add("game--running");
  statusEl.setAttribute("hidden", "hidden");
  levelSelect.disabled = true;
  updateInputEnabled();
  setStatus(
    state.pauseUsed
      ? "Resumed. Paused runs do not count for highscores or unlocks."
      : "Drops incoming... type the tone numbers."
  );
  startBtn.textContent = "Pause";
  focusInput();
  requestAnimationFrame(tick);
}

function pauseGame() {
  state.running = false;
  state.pauseUsed = true;
  gameRoot?.classList.remove("game--running");
  updateInputEnabled();
  clearInputTimer();
  statusEl.removeAttribute("hidden");
  startBtn.textContent = "Resume";
  setStatus("Paused. Score will not count for highscores or unlocks.");
}

function resetGame() {
  drops.length = 0;
  splashes.length = 0;
  reveals.length = 0;
  translations.length = 0;
  clearInputTimer();
  hideBird();
  hudEl?.removeAttribute("hidden");
  inputPanelTextEl?.removeAttribute("hidden");
  state.score = 0;
  state.lives = 3;
  state.lastFrame = 0;
  state.lastSpawn = 0;
  state.running = false;
  state.gameOver = false;
  state.finalReveal = false;
  state.pauseUsed = false;
  gameRoot?.classList.remove("game--running");
  gameRoot?.classList.remove("game--final-reveal");
  levelSelect.disabled = false;
  statusEl.removeAttribute("hidden");
  updateInputEnabled();
  updateHud();
  updateHighScore();
  showMedalStatus();
  startBtn.textContent = "Start";
}

function maybeUnlockNextLevel() {
  const nextLevel = getNextLevel(state.levelId);
  let unlockedLevel = null;
  let unlockedAny = false;

  if (nextLevel && !isLevelUnlocked(nextLevel.id) && state.score >= nextLevel.unlockScore) {
    if (nextLevel.id === "1-44" && !areAllPreviousUnlocked(nextLevel.id)) {
      return null;
    }
    unlockedAny = unlockUpToLevel(nextLevel.id) || unlockedAny;
    unlockedLevel = nextLevel;
  }

  if (progress.unlocked.has("4x")) {
    unlockedAny = unlockLevel("x1") || unlockedAny;
    unlockedAny = unlockLevel("1-44-slow") || unlockedAny;
  }

  if (unlockedAny) {
    renderLevelOptions();
  }

  return unlockedLevel;
}

function finalizeRun() {
  const baseMessage = `Game over. Score: ${state.score}.`;
  if (state.pauseUsed) {
    setStatus(`${baseMessage} Paused runs don't save.`);
    return;
  }
  let message = baseMessage;
  const previousHigh = getHighScore(state.levelId);
  const previousMedals = getMedalTierIds(previousHigh);
  let isHighScore = false;
  if (state.score > previousHigh) {
    progress.highscores[state.levelId] = state.score;
    message = `${message} New high score!`;
    isHighScore = true;
  }
  const newHigh = Math.max(previousHigh, state.score);
  const newMedals = getMedalTierIds(newHigh);
  const addedMedals = new Set(
    [...newMedals].filter((medalId) => !previousMedals.has(medalId))
  );
  const newMedalId = pickHighestMedal(addedMedals);
  if (newMedalId) {
    message = `${message} Medal earned!`;
  }
  const unlocked = maybeUnlockNextLevel();
  if (unlocked) {
    message = `${message} Unlocked ${unlocked.label}.`;
  }
  saveProgress();
  updateHighScore();
  renderMedals();
  setStatus(message);

  const birdDialog = buildBirdDialog({
    score: state.score,
    newMedalId,
    isHighScore,
    unlockedNextLevel: Boolean(unlocked),
  });
  showBird(birdDialog);
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  state.finalReveal = false;
  clearInputTimer();
  gameRoot?.classList.remove("game--running");
  gameRoot?.classList.remove("game--final-reveal");
  hudEl?.removeAttribute("hidden");
  inputPanelTextEl?.removeAttribute("hidden");
  levelSelect.disabled = false;
  updateInputEnabled();
  startBtn.textContent = "Restart";
  statusEl.removeAttribute("hidden");
  finalizeRun();
}

function addSplash(x, y, radius) {
  splashes.push({ x, y, radius, life: 0 });
}

function addReveal(x, y, tones, size, duration = 0.9) {
  reveals.push({
    x,
    y,
    tones,
    display: formatToneString(tones),
    size,
    life: 0,
    duration,
  });
}

function wrapLines(text, fontSize, maxWidth) {
  ctx.save();
  ctx.font = `600 ${fontSize}px "Fira Sans", "Noto Sans SC", sans-serif`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) {
    lines.push(line);
  }
  ctx.restore();
  return lines.length ? lines : [text];
}

function addTranslation(x, y, text, radius) {
  if (!text) {
    return;
  }
  const fontSize = Math.max(12, Math.min(18, radius * 0.55));
  const maxWidth = Math.max(120, Math.min(220, state.width - 32));
  const safeHalf = maxWidth / 2;
  const safeX = Math.min(state.width - 16 - safeHalf, Math.max(16 + safeHalf, x));
  const lines = wrapLines(text, fontSize, maxWidth);
  translations.push({
    x: safeX,
    y,
    lines,
    fontSize,
    life: 0,
    duration: 0.9,
  });
}

function startFinalReveal() {
  if (state.finalReveal) {
    return;
  }
  state.finalReveal = true;
  state.running = false;
  clearInputTimer();
  gameRoot?.classList.remove("game--running");
  gameRoot?.classList.add("game--final-reveal");
  updateInputEnabled();
  statusEl.setAttribute("hidden", "hidden");
  hudEl?.setAttribute("hidden", "hidden");
  inputPanelTextEl?.setAttribute("hidden", "hidden");

  const remainingDrops = drops.splice(0, drops.length);
  remainingDrops.forEach((drop) => {
    const reveal = {
      x: drop.x,
      y: Math.min(state.safeBottom - 12, drop.y),
      tones: drop.tones,
      display: formatToneString(drop.tones),
      size: Math.max(16, drop.radius * 0.7),
      life: 0,
      duration: 0.5,
    };
    reveals.push(reveal);
  });

  const start = performance.now();
  finalRevealLastFrame = start;

  const step = (now) => {
    const delta = Math.min((now - finalRevealLastFrame) / 1000, MAX_FRAME_DELTA);
    finalRevealLastFrame = now;
    drawScene(delta);
    if (now - start < 500) {
      finalRevealFrame = requestAnimationFrame(step);
    } else {
      finalRevealFrame = null;
      state.finalReveal = false;
      endGame();
    }
  };

  finalRevealFrame = requestAnimationFrame(step);
}

function clearDrop(drop) {
  const index = drops.indexOf(drop);
  if (index === -1) {
    return;
  }
  drops.splice(index, 1);
  state.score += 1;
  updateHud();
  addSplash(drop.x, drop.y, drop.radius + 6);
  addTranslation(drop.x, drop.y, drop.sv, drop.radius);
}

function missDrop(drop) {
  const index = drops.indexOf(drop);
  if (index === -1) {
    return;
  }
  drops.splice(index, 1);
  state.lives -= 1;
  updateHud();
  const revealDuration = state.lives <= 0 ? 0.5 : 0.9;
  addReveal(
    drop.x,
    Math.min(state.safeBottom - 12, drop.y),
    drop.tones,
    Math.max(16, drop.radius * 0.7),
    revealDuration
  );
  if (state.lives <= 0) {
    startFinalReveal();
  } else {
    setStatus(`Missed: ${formatToneString(drop.tones)}`);
  }
}

function findMatch(tones) {
  const matches = drops.filter((drop) => drop.tones === tones);
  if (!matches.length) {
    return null;
  }
  return matches.reduce((closest, drop) => (drop.y > closest.y ? drop : closest));
}

function drawDrop(drop) {
  const { x, y, radius } = drop;
  const gradient = ctx.createLinearGradient(x, y - radius, x, y + radius);
  gradient.addColorStop(0, "rgba(145, 229, 246, 0.95)");
  gradient.addColorStop(1, "rgba(12, 139, 158, 0.9)");

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.bezierCurveTo(x + radius * 0.9, y - radius * 0.2, x + radius * 0.6, y + radius * 0.9, x, y + radius);
  ctx.bezierCurveTo(x - radius * 0.6, y + radius * 0.9, x - radius * 0.9, y - radius * 0.2, x, y - radius);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.25, y - radius * 0.2, radius * 0.2, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `600 ${Math.max(14, radius * 0.75)}px "ZCOOL KuaiLe", "Noto Sans SC", sans-serif`;
  ctx.fillStyle = "rgba(5, 33, 43, 0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(drop.text, x, y + radius * 0.1);
  ctx.restore();
}

function drawSplashes(delta) {
  splashes.forEach((splash) => {
    splash.life += delta;
  });

  for (let i = splashes.length - 1; i >= 0; i -= 1) {
    const splash = splashes[i];
    if (splash.life > 0.45) {
      splashes.splice(i, 1);
      continue;
    }
    const progressLife = splash.life / 0.45;
    ctx.strokeStyle = `rgba(145, 229, 246, ${0.6 - progressLife})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(splash.x, splash.y, splash.radius + progressLife * 12, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawReveals(delta) {
  reveals.forEach((reveal) => {
    reveal.life += delta;
  });

  for (let i = reveals.length - 1; i >= 0; i -= 1) {
    const reveal = reveals[i];
    const duration = reveal.duration ?? 0.9;
    if (reveal.life > duration) {
      reveals.splice(i, 1);
      continue;
    }
    const progressLife = reveal.life / duration;
    const alpha = 0.95 - progressLife * 0.95;
    const y = reveal.y - progressLife * 18;

    ctx.save();
    ctx.font = `700 ${reveal.size}px "Fira Sans", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = `rgba(3, 26, 36, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.strokeText(reveal.display || reveal.tones, reveal.x, y);
    ctx.fillStyle = `rgba(255, 92, 77, ${alpha})`;
    ctx.fillText(reveal.display || reveal.tones, reveal.x, y);
    ctx.restore();
  }
}

function drawTranslations(delta) {
  translations.forEach((translation) => {
    translation.life += delta;
  });

  for (let i = translations.length - 1; i >= 0; i -= 1) {
    const translation = translations[i];
    if (translation.life > translation.duration) {
      translations.splice(i, 1);
      continue;
    }
    const progressLife = translation.life / translation.duration;
    const alpha = 0.95 - progressLife * 0.95;
    const y = translation.y - progressLife * 16;
    const lineHeight = translation.fontSize * 1.2;
    const totalHeight = translation.lines.length * lineHeight;
    let currentY = y - (totalHeight - lineHeight) / 2;

    ctx.save();
    ctx.font = `600 ${translation.fontSize}px "Fira Sans", "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = `rgba(3, 26, 36, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.fillStyle = `rgba(145, 229, 246, ${alpha})`;

    translation.lines.forEach((line) => {
      ctx.strokeText(line, translation.x, currentY);
      ctx.fillText(line, translation.x, currentY);
      currentY += lineHeight;
    });
    ctx.restore();
  }
}

function drawScene(delta) {
  ctx.clearRect(0, 0, state.width, state.height);
  drops.forEach(drawDrop);
  drawSplashes(delta);
  drawReveals(delta);
  drawTranslations(delta);
}

function tick(timestamp) {
  if (!state.running) {
    return;
  }
  if (!state.lastFrame) {
    state.lastFrame = timestamp;
  }
  const delta = Math.min((timestamp - state.lastFrame) / 1000, MAX_FRAME_DELTA);
  state.lastFrame = timestamp;

  const { spawn } = difficulty();
  if (timestamp - state.lastSpawn > spawn) {
    spawnDrop();
    state.lastSpawn = timestamp;
  }

  drops.forEach((drop) => {
    drop.y += drop.speed * delta;
  });

  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const drop = drops[i];
    if (drop.y + drop.radius > state.safeBottom) {
      missDrop(drop);
    }
  }

  drawScene(delta);
  if (state.running) {
    requestAnimationFrame(tick);
  }
}

function handlePointer(event) {
  if (!drops.length) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const hit = drops.find((drop) => {
    const dx = drop.x - x;
    const dy = drop.y - y;
    return Math.hypot(dx, dy) < drop.radius;
  });
  if (hit) {
    lastSpoken = hit;
    speak(hit.text, { force: true });
    setStatus(`Replaying: ${hit.text}`);
  }
}

startBtn.addEventListener("click", () => {
  if (state.finalReveal) {
    return;
  }
  if (state.running) {
    pauseGame();
    return;
  }
  if (state.gameOver) {
    resetGame();
  }
  startGame();
});

toneInput.addEventListener("input", () => {
  handleToneValue(toneInput.value);
});

replayBtn.addEventListener("click", () => {
  if (!lastSpoken) {
    return;
  }
  speak(lastSpoken.text, { force: true });
  setStatus(`Replaying: ${lastSpoken.text}`);
});

if (birdCloseBtn) {
  birdCloseBtn.addEventListener("click", hideBird);
}
if (birdOverlay) {
  birdOverlay.addEventListener("click", (event) => {
    if (event.target === birdOverlay) {
      hideBird();
    }
  });
}

keypadButtons.forEach((button) => {
  button.addEventListener("click", () => {
    appendDigit(button.dataset.digit);
  });
});

if (backspaceBtn) {
  backspaceBtn.addEventListener("click", () => {
    handleBackspace();
  });
}

if (levelPickerBtn) {
  levelPickerBtn.addEventListener("click", () => {
    if (!state.useKeypad || levelPickerBtn.disabled) {
      return;
    }
    openLevelOverlay();
  });
}

if (levelSelect) {
  levelSelect.addEventListener("change", () => {
    const selected = levelSelect.value;
    if (!isLevelUnlocked(selected)) {
      levelSelect.value = state.levelId;
      return;
    }
    setLevel(selected, { announce: false });
    resetGame();
  });
}

if (levelCloseBtn) {
  levelCloseBtn.addEventListener("click", closeLevelOverlay);
}


canvas.addEventListener("pointerdown", handlePointer);
window.addEventListener("resize", resizeCanvas);
window.visualViewport?.addEventListener("resize", resizeCanvas);
if ("ResizeObserver" in window && arena) {
  const observer = new ResizeObserver(() => resizeCanvas());
  observer.observe(arena);
}

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

resizeCanvas();
renderLevelOptions();
updateToneLabels();
const initialLevel =
  progress.lastLevel && isLevelUnlocked(progress.lastLevel) ? progress.lastLevel : LEVELS[0].id;
setLevel(initialLevel, { announce: false });
resetGame();
updateHud();
updateHighScore();
