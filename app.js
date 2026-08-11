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
const toneHeadingAction = document.getElementById("toneHeadingAction");
const toneModeLabel = document.getElementById("toneModeLabel");
const toneModeAction = document.getElementById("toneModeAction");
const toneExample = document.getElementById("toneExample");
const toneExampleWrap = document.getElementById("toneExampleWrap");
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
const toneModeButtons = Array.from(document.querySelectorAll(".mode-toggle__btn"));
const imagePad = document.getElementById("imagePad");

const STORAGE_KEY = "toneRaindropProgress";
const HANNES_KEY = "hannes";
const SUPABASE_URL = "https://tuyatuvsfunbjeonbuwq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0V9d3aa8SD7b_Ako0TFHsQ_p_IHBggg";
const VOICE_TABLE = "voice_samples";
const INPUT_IDLE_CLEAR_MS = 1000;
const SPEECH_MIN_INTERVAL_MS = 320;
const MAX_FRAME_DELTA = 0.08;
const BIRD_TYPE_SPEED_MS = 22;
const BIRD_TYPE_PAUSE_SHORT_MS = 90;
const BIRD_TYPE_PAUSE_LONG_MS = 180;
const BIRD_TYPE_PAUSE_NEWLINE_MS = 120;
const MEANING_SET_CHANGE_DELAY_MS = 650;
const MAX_REVIEW_LOG_ENTRIES = 5000;
const REVIEW_LOG_VERSION = 1;
const VOICE_FRAME_MS = 45;
const VOICE_SILENCE_MS = 260;
const VOICE_MAX_UTTERANCE_MS = 1500;
const VOICE_PREDICT_MS = 90;
const VOICE_ACCEPT_COOLDOWN_MS = 800;
const VOICE_MIN_VOICED_FRAMES = 7;
const VOICE_MIN_CONFIDENCE = 0.36;
const VOICE_FEEDBACK_SUPPRESS_MS = 1700;
const SKIP_33 = true;

const VOICE_DEFAULT_MODEL_OPTIONS = {
  k: 5,
  contourWeight: 0.8,
  distanceFloor: 0.08,
};

const VOICE_MODEL_OPTIONS_BY_SET = {
  ma: { k: 1, contourWeight: 0.35, distanceFloor: 0.04 },
  yi: { k: 3, contourWeight: 0.9, distanceFloor: 0.12 },
  shi: { k: 1, contourWeight: 0.9, distanceFloor: 0.04 },
  ba: { k: 3, contourWeight: 0.8, distanceFloor: 0.04 },
  bao: { k: 1, contourWeight: 0.35, distanceFloor: 0.04 },
  qi: { k: 3, contourWeight: 0.35, distanceFloor: 0.04 },
  tang: { k: 1, contourWeight: 0.35, distanceFloor: 0.04 },
  yan: { k: 9, contourWeight: 0.35, distanceFloor: 0.04 },
};

const HANNES_MODE = getHannesMode();
const TONE_MODE_OVERRIDE = getToneModeOverride();

const TONE_SYMBOLS = {
  "1": "─",
  "2": "╱",
  "3": "∨",
  "4": "╲",
};

const VIS_DROP_RADIUS = 12;
const VIS_DROP_PADDING = 4;
const VOICE_DROP_RADIUS = 12;
const VOICE_DROP_PADDING = 5;
const VOICE_DROP_LABEL_HEIGHT = 32;

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

const MEANING_TONE_SETS = [
  {
    id: "ma",
    label: "ma",
    entries: [
      { text: "妈", tones: "1", sv: "mamma", meaning: "mother", image: "meaning_images/mother.jpg" },
      { text: "麻", tones: "2", sv: "hampa; bedövad", meaning: "hemp", image: "meaning_images/hemp.jpg" },
      { text: "马", tones: "3", sv: "häst", meaning: "horse", image: "meaning_images/horse.jpg" },
      { text: "骂", tones: "4", sv: "skälla ut", meaning: "scold", image: "meaning_images/scold.jpg" },
    ],
  },
  {
    id: "yi",
    label: "yi",
    entries: [
      { text: "衣", tones: "1", sv: "kläder", meaning: "clothes", image: "meaning_images/clothes.jpg" },
      { text: "姨", tones: "2", sv: "moster; faster", meaning: "aunt", image: "meaning_images/aunt.jpg" },
      { text: "椅", tones: "3", sv: "stol", meaning: "chair", image: "meaning_images/chair.jpg" },
      { text: "亿", tones: "4", sv: "hundra miljoner", meaning: "100 million", image: "meaning_images/fortune.jpg" },
    ],
  },
  {
    id: "shi",
    label: "shi",
    entries: [
      { text: "师", tones: "1", sv: "lärare; mästare", meaning: "teacher", image: "meaning_images/teacher.jpg" },
      { text: "十", tones: "2", sv: "tio", meaning: "ten", image: "meaning_images/ten.jpg" },
      { text: "史", tones: "3", sv: "historia", meaning: "history", image: "meaning_images/history.jpg" },
      { text: "是", tones: "4", sv: "vara; är", meaning: "is", image: "meaning_images/is.jpg" },
    ],
  },
  {
    id: "ba",
    label: "ba",
    entries: [
      { text: "八", tones: "1", sv: "åtta", meaning: "eight", image: "meaning_images/eight.jpg" },
      { text: "拔", tones: "2", sv: "dra upp", meaning: "pull", image: "meaning_images/pull.jpg" },
      { text: "把", tones: "3", sv: "hålla; greppa", meaning: "hold", image: "meaning_images/hold.jpg" },
      { text: "爸", tones: "4", sv: "pappa", meaning: "dad", image: "meaning_images/dad.jpg" },
    ],
  },
  {
    id: "bao",
    label: "bao",
    entries: [
      { text: "包", tones: "1", sv: "paket; väska", meaning: "package", image: "meaning_images/package.jpg" },
      { text: "薄", tones: "2", sv: "tunn", meaning: "thin", image: "meaning_images/thin.jpg" },
      { text: "宝", tones: "3", sv: "skatt", meaning: "treasure", image: "meaning_images/treasure.jpg" },
      { text: "抱", tones: "4", sv: "krama; hålla om", meaning: "hug", image: "meaning_images/hug.jpg" },
    ],
  },
  {
    id: "qi",
    label: "qi",
    entries: [
      { text: "七", tones: "1", sv: "sju", meaning: "seven", image: "meaning_images/seven.jpg" },
      { text: "旗", tones: "2", sv: "flagga", meaning: "flag", image: "meaning_images/flag.jpg" },
      { text: "起", tones: "3", sv: "stiga upp", meaning: "rise", image: "meaning_images/rise.jpg" },
      { text: "气", tones: "4", sv: "luft; gas", meaning: "air", image: "meaning_images/air.jpg" },
    ],
  },
  {
    id: "tang",
    label: "tang",
    entries: [
      { text: "汤", tones: "1", sv: "soppa", meaning: "soup", image: "meaning_images/soup.jpg" },
      { text: "糖", tones: "2", sv: "socker", meaning: "sugar", image: "meaning_images/sugar.jpg" },
      { text: "躺", tones: "3", sv: "ligga", meaning: "lie down", image: "meaning_images/lie-down.jpg" },
      { text: "烫", tones: "4", sv: "het; skålla", meaning: "hot", image: "meaning_images/hot.jpg" },
    ],
  },
  {
    id: "yan",
    label: "yan",
    entries: [
      { text: "烟", tones: "1", sv: "rök", meaning: "smoke", image: "meaning_images/smoke.jpg" },
      { text: "盐", tones: "2", sv: "salt", meaning: "salt", image: "meaning_images/salt.jpg" },
      { text: "眼", tones: "3", sv: "öga", meaning: "eye", image: "meaning_images/eye.jpg" },
      { text: "燕", tones: "4", sv: "svala", meaning: "swallow", image: "meaning_images/swallow.jpg" },
    ],
  },
  {
    id: "yao",
    label: "yao",
    entries: [
      { text: "腰", tones: "1", sv: "midja", meaning: "waist", image: "meaning_images/waist.jpg" },
      { text: "摇", tones: "2", sv: "skaka; vagga", meaning: "shake", image: "meaning_images/shake.jpg" },
      { text: "咬", tones: "3", sv: "bita", meaning: "bite", image: "meaning_images/bite.jpg" },
      { text: "药", tones: "4", sv: "medicin", meaning: "medicine", image: "meaning_images/medicine.jpg" },
    ],
  },
  {
    id: "zhu",
    label: "zhu",
    entries: [
      { text: "猪", tones: "1", sv: "gris", meaning: "pig", image: "meaning_images/pig.jpg" },
      { text: "竹", tones: "2", sv: "bambu", meaning: "bamboo", image: "meaning_images/bamboo.jpg" },
      { text: "煮", tones: "3", sv: "koka", meaning: "boil", image: "meaning_images/boil.jpg" },
      { text: "住", tones: "4", sv: "bo; stanna", meaning: "home", image: "meaning_images/home.jpg" },
    ],
  },
  {
    id: "mao",
    label: "mao",
    entries: [
      { text: "猫", tones: "1", sv: "katt", meaning: "cat", image: "meaning_images/cat.jpg" },
      { text: "毛", tones: "2", sv: "hår; päls", meaning: "hair", image: "meaning_images/hair.jpg" },
      { text: "卯", tones: "3", sv: "hare; kanin", meaning: "rabbit", image: "meaning_images/rabbit.jpg" },
      { text: "帽", tones: "4", sv: "hatt", meaning: "hat", image: "meaning_images/hat.jpg" },
    ],
  },
  {
    id: "shu",
    label: "shu",
    entries: [
      { text: "书", tones: "1", sv: "bok", meaning: "book", image: "meaning_images/book.jpg" },
      { text: "熟", tones: "2", sv: "mogen; tillagad", meaning: "ripe", image: "meaning_images/ripe.jpg" },
      { text: "鼠", tones: "3", sv: "mus", meaning: "mouse", image: "meaning_images/mouse.jpg" },
      { text: "树", tones: "4", sv: "träd", meaning: "tree", image: "meaning_images/tree.jpg" },
    ],
  },
  {
    id: "guo",
    label: "guo",
    entries: [
      { text: "锅", tones: "1", sv: "gryta; kastrull", meaning: "pot", image: "meaning_images/pot.jpg" },
      { text: "国", tones: "2", sv: "land; stat", meaning: "country", image: "meaning_images/country.jpg" },
      { text: "果", tones: "3", sv: "frukt", meaning: "fruit", image: "meaning_images/fruit.jpg" },
      { text: "过", tones: "4", sv: "passera; gå över", meaning: "cross", image: "meaning_images/cross.jpg" },
    ],
  },
  {
    id: "xing",
    label: "xing",
    entries: [
      { text: "星", tones: "1", sv: "stjärna", meaning: "star", image: "meaning_images/star.jpg" },
      { text: "行", tones: "2", sv: "gå; fungera", meaning: "walk", image: "meaning_images/walk.jpg" },
      { text: "醒", tones: "3", sv: "vakna", meaning: "wake", image: "meaning_images/wake.jpg" },
      { text: "姓", tones: "4", sv: "efternamn", meaning: "name", image: "meaning_images/name.jpg" },
    ],
  },
  {
    id: "du",
    label: "du",
    entries: [
      { text: "都", tones: "1", sv: "huvudstad; storstad", meaning: "capital", image: "meaning_images/capital.jpg" },
      { text: "读", tones: "2", sv: "läsa", meaning: "read", image: "meaning_images/read.jpg" },
      { text: "赌", tones: "3", sv: "spela om pengar", meaning: "gamble", image: "meaning_images/gamble.jpg" },
      { text: "肚", tones: "4", sv: "mage", meaning: "belly", image: "meaning_images/belly.jpg" },
    ],
  },
  {
    id: "ji",
    label: "ji",
    entries: [
      { text: "鸡", tones: "1", sv: "höna; kyckling", meaning: "chicken", image: "meaning_images/chicken.jpg" },
      { text: "急", tones: "2", sv: "brådskande; akut", meaning: "urgent", image: "meaning_images/urgent.jpg" },
      { text: "几", tones: "3", sv: "några; hur många", meaning: "several", image: "meaning_images/several.jpg" },
      { text: "记", tones: "4", sv: "minnas; anteckna", meaning: "remember", image: "meaning_images/remember.jpg" },
    ],
  },
];

MEANING_TONE_SETS.forEach((set) => {
  set.entries.forEach((entry) => {
    entry.familyId = set.id;
    entry.familyLabel = set.label;
  });
});

const SINGLE_TONES = ["1", "2", "3", "4"];
const MEANING_REVIEW_GROUP_SIZE = 4;
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
    id: "1-44-super-slow",
    label: "1-44 (Super Slow)",
    tones: [...SINGLE_TONES, ...DOUBLE_TONES],
    unlockScore: 20,
    speedScale: 0.6,
    spawnScale: 1.35,
  },
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

function buildMeaningLevels() {
  const levels = [];
  for (let start = 0; start < MEANING_TONE_SETS.length; start += MEANING_REVIEW_GROUP_SIZE) {
    const group = MEANING_TONE_SETS.slice(start, start + MEANING_REVIEW_GROUP_SIZE);
    const groupNumber = Math.floor(start / MEANING_REVIEW_GROUP_SIZE) + 1;

    group.forEach((set) => {
      levels.push({
        id: `meaning-${set.id}`,
        label: set.label,
        tones: SINGLE_TONES,
        unlockScore: levels.length === 0 ? 0 : 20,
        speedScale: 1,
        spawnScale: 1,
        meaningSetId: set.id,
      });
    });

    if (group.length > 1) {
      levels.push({
        id: `meaning-review-${groupNumber}`,
        label: `Review ${groupNumber}`,
        tones: SINGLE_TONES,
        unlockScore: 20,
        speedScale: 1,
        spawnScale: 1,
        meaningSetIds: group.map((set) => set.id),
      });
    }

    const cumulative = MEANING_TONE_SETS.slice(0, start + group.length);
    if (start > 0 && cumulative.length > group.length) {
      levels.push({
        id: `meaning-review-all-${groupNumber}`,
        label: `All 1-${cumulative.length}`,
        tones: SINGLE_TONES,
        unlockScore: 20,
        speedScale: 1,
        spawnScale: 1,
        meaningSetIds: cumulative.map((set) => set.id),
      });
    }
  }
  return levels;
}

const MEANING_LEVELS = buildMeaningLevels();
const ALL_LEVELS = [...MEANING_LEVELS, ...LEVELS];

ALL_LEVELS.forEach((level) => {
  level.wordPool = buildWordPool(level.tones);
});

const progress = loadProgress();
if (TONE_MODE_OVERRIDE) {
  progress.toneMode = TONE_MODE_OVERRIDE;
  saveProgress();
}
normalizeProgress();
ensureBaseUnlocks();
preserveMeaningUnlockOrder();
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
  runId: null,
  useKeypad: false,
  toneMode: progress.toneMode,
  useNumberLabels: progress.toneMode !== "symbols",
  useImagePad:
    progress.toneMode === "images" ||
    progress.toneMode === "shuffle" ||
    progress.toneMode === "meaning" ||
    progress.toneMode === "voice",
  useVisDrops: progress.toneMode === "vis",
  voiceListening: false,
  voiceStream: null,
  voiceAudioContext: null,
  voiceAnalyser: null,
  voiceAnalyserBuffer: null,
  voiceCaptureTimer: null,
  voicePredictTimer: null,
  voiceFrames: [],
  voiceUtteranceFrames: [],
  voiceIsSpeaking: false,
  voiceLastVoiceAt: 0,
  voiceModel: null,
  voiceModelFamilyId: null,
  voiceModelCache: new Map(),
  voiceLastAcceptedAt: 0,
  voiceLastStatusAt: 0,
  voiceFeedbackUntil: 0,
  hannesMode: HANNES_MODE,
  imagePadOrder: [],
  meaningSet: null,
  meaningPadOrder: [],
  meaningSetChangeAt: 0,
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
let imagePadButtons = [];

const IMAGE_PAD_TONES = [
  "1",
  "11",
  "12",
  "13",
  "14",
  "2",
  "21",
  "22",
  "23",
  "24",
  "3",
  "31",
  "32",
  "33",
  "34",
  "4",
  "41",
  "42",
  "43",
  "44",
];
const toneImageCache = new Map();
const meaningImageCache = new Map();
state.imagePadOrder = IMAGE_PAD_TONES.slice();

function getHannesMode() {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("hannes");
  if (override === "1" || override === "0") {
    const enabled = override === "1";
    try {
      window.localStorage.setItem(HANNES_KEY, enabled ? "1" : "0");
    } catch (error) {
      // Ignore storage errors.
    }
    return enabled;
  }
  try {
    const stored = window.localStorage.getItem(HANNES_KEY);
    if (stored === null) {
      window.localStorage.setItem(HANNES_KEY, "0");
      return false;
    }
    return stored === "1";
  } catch (error) {
    return false;
  }
}

function getToneModeOverride() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  if (["numbers", "symbols", "images", "shuffle", "vis", "meaning", "voice"].includes(mode)) {
    return normalizeToneMode(mode);
  }
  const value = params.get("numbers");
  if (value === "0") {
    return HANNES_MODE ? "images" : "symbols";
  }
  if (value === "1") {
    return "numbers";
  }
  return null;
}

function normalizeToneMode(mode) {
  if (mode === "voice") {
    return "voice";
  }
  if (mode === "meaning") {
    return "meaning";
  }
  if (HANNES_MODE) {
    if (mode === "images") {
      return "images";
    }
    if (mode === "shuffle") {
      return "shuffle";
    }
    if (mode === "vis") {
      return "vis";
    }
    return "numbers";
  }
  return mode === "symbols" ? "symbols" : "numbers";
}

function getUnlockMode() {
  if (state.toneMode === "images") {
    return "images";
  }
  if (state.toneMode === "shuffle") {
    return "shuffle";
  }
  if (state.toneMode === "vis") {
    return "vis";
  }
  if (state.toneMode === "voice") {
    return "voice";
  }
  if (state.toneMode === "meaning") {
    return "meaning";
  }
  return "numbers";
}

function loadProgress() {
  const fallback = {
    unlocked: new Set(),
    unlockedImage: new Set(),
    unlockedVis: new Set(),
    unlockedShuffle: new Set(),
    unlockedMeaning: new Set(),
    unlockedVoice: new Set(),
    highscores: {},
    highscoresImage: {},
    highscoresVis: {},
    highscoresShuffle: {},
    highscoresMeaning: {},
    highscoresVoice: {},
    reviewLog: [],
    reviewStats: {},
    lastLevel: null,
    toneMode: "numbers",
  };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const data = JSON.parse(raw);
    const unlocked = Array.isArray(data.unlocked) ? data.unlocked : [];
    const unlockedImage = Array.isArray(data.unlockedImage) ? data.unlockedImage : [];
    const unlockedVis = Array.isArray(data.unlockedVis) ? data.unlockedVis : [];
    const unlockedShuffle = Array.isArray(data.unlockedShuffle) ? data.unlockedShuffle : [];
    const unlockedMeaning = Array.isArray(data.unlockedMeaning) ? data.unlockedMeaning : [];
    const unlockedVoice = Array.isArray(data.unlockedVoice) ? data.unlockedVoice : [];
    return {
      unlocked: new Set(unlocked),
      unlockedImage: new Set(unlockedImage),
      unlockedVis: new Set(unlockedVis),
      unlockedShuffle: new Set(unlockedShuffle),
      unlockedMeaning: new Set(unlockedMeaning),
      unlockedVoice: new Set(unlockedVoice),
      highscores: data.highscores && typeof data.highscores === "object" ? data.highscores : {},
      highscoresImage:
        data.highscoresImage && typeof data.highscoresImage === "object"
          ? data.highscoresImage
          : {},
      highscoresVis:
        data.highscoresVis && typeof data.highscoresVis === "object"
          ? data.highscoresVis
          : {},
      highscoresShuffle:
        data.highscoresShuffle && typeof data.highscoresShuffle === "object"
          ? data.highscoresShuffle
          : {},
      highscoresMeaning:
        data.highscoresMeaning && typeof data.highscoresMeaning === "object"
          ? data.highscoresMeaning
          : {},
      highscoresVoice:
        data.highscoresVoice && typeof data.highscoresVoice === "object"
          ? data.highscoresVoice
          : {},
      reviewLog: Array.isArray(data.reviewLog)
        ? data.reviewLog.slice(-MAX_REVIEW_LOG_ENTRIES)
        : [],
      reviewStats:
        data.reviewStats && typeof data.reviewStats === "object" ? data.reviewStats : {},
      lastLevel: typeof data.lastLevel === "string" ? data.lastLevel : null,
      toneMode: normalizeToneMode(data.toneMode),
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
        unlockedImage: Array.from(progress.unlockedImage ?? []),
        unlockedVis: Array.from(progress.unlockedVis ?? []),
        unlockedShuffle: Array.from(progress.unlockedShuffle ?? []),
        unlockedMeaning: Array.from(progress.unlockedMeaning ?? []),
        unlockedVoice: Array.from(progress.unlockedVoice ?? []),
        highscores: progress.highscores,
        highscoresImage: progress.highscoresImage,
        highscoresVis: progress.highscoresVis,
        highscoresShuffle: progress.highscoresShuffle,
        highscoresMeaning: progress.highscoresMeaning,
        highscoresVoice: progress.highscoresVoice,
        reviewLog: progress.reviewLog,
        reviewStats: progress.reviewStats,
        lastLevel: progress.lastLevel,
        toneMode: progress.toneMode,
      })
    );
  } catch (error) {
    // Ignore storage errors (private mode, quota, etc.).
  }
}

function buildWordPool(tones) {
  const pool = [];
  tones.forEach((tone) => {
    if (SKIP_33 && tone === "33") {
      return;
    }
    const entries = WORDS_BY_TONE[tone];
    if (entries) {
      pool.push(...entries);
    }
  });
  return pool;
}

function isMeaningLevelMode(mode = state.toneMode) {
  return mode === "meaning" || mode === "voice";
}

function getLevelsForMode(mode = "numbers") {
  return isMeaningLevelMode(mode) ? MEANING_LEVELS : LEVELS;
}

function getLevelUnlockScore(level, mode = "numbers") {
  return level.unlockScore;
}

function getMeaningSetById(id) {
  return MEANING_TONE_SETS.find((set) => set.id === id) || null;
}

function getUnlockedSetForMode(mode = "numbers") {
  if (mode === "images") {
    return progress.unlockedImage;
  }
  if (mode === "vis") {
    return progress.unlockedVis;
  }
  if (mode === "shuffle") {
    return progress.unlockedShuffle;
  }
  if (mode === "meaning") {
    return progress.unlockedMeaning;
  }
  if (mode === "voice") {
    return progress.unlockedVoice;
  }
  return progress.unlocked;
}

function getHighscoresForMode(mode = state.toneMode) {
  if (mode === "images") {
    return progress.highscoresImage;
  }
  if (mode === "vis") {
    return progress.highscoresVis;
  }
  if (mode === "shuffle") {
    return progress.highscoresShuffle;
  }
  if (mode === "meaning") {
    return progress.highscoresMeaning;
  }
  if (mode === "voice") {
    return progress.highscoresVoice;
  }
  return progress.highscores;
}

function ensureBaseUnlocks() {
  LEVELS.forEach((level) => {
    if (level.unlockScore === 0) {
      progress.unlocked.add(level.id);
      progress.unlockedImage.add(level.id);
      progress.unlockedVis.add(level.id);
      progress.unlockedShuffle.add(level.id);
    }
  });
  getLevelsForMode("meaning").forEach((level) => {
    if (getLevelUnlockScore(level, "meaning") === 0) {
      progress.unlockedMeaning.add(level.id);
    }
  });
  getLevelsForMode("voice").forEach((level) => {
    if (getLevelUnlockScore(level, "voice") === 0) {
      progress.unlockedVoice.add(level.id);
    }
  });
}

function ensureBranchUnlocks() {
  if (progress.unlocked.has("4x")) {
    let changed = false;
    changed = unlockLevel("x1") || changed;
    changed = unlockLevel("1-44-super-slow") || changed;
    changed = unlockLevel("1-44-slow") || changed;
    if (changed) {
      saveProgress();
    }
  }
  if (progress.unlockedImage.has("4x")) {
    let changed = false;
    changed = unlockLevel("x1", "images") || changed;
    changed = unlockLevel("1-44-super-slow", "images") || changed;
    changed = unlockLevel("1-44-slow", "images") || changed;
    if (changed) {
      saveProgress();
    }
  }
  if (progress.unlockedVis.has("4x")) {
    let changed = false;
    changed = unlockLevel("x1", "vis") || changed;
    changed = unlockLevel("1-44-super-slow", "vis") || changed;
    changed = unlockLevel("1-44-slow", "vis") || changed;
    if (changed) {
      saveProgress();
    }
  }
  if (progress.unlockedShuffle.has("4x")) {
    let changed = false;
    changed = unlockLevel("x1", "shuffle") || changed;
    changed = unlockLevel("1-44-super-slow", "shuffle") || changed;
    changed = unlockLevel("1-44-slow", "shuffle") || changed;
    if (changed) {
      saveProgress();
    }
  }
  if (progress.unlockedMeaning.has("4x")) {
    let changed = false;
    changed = unlockLevel("x1", "meaning") || changed;
    changed = unlockLevel("1-44-super-slow", "meaning") || changed;
    changed = unlockLevel("1-44-slow", "meaning") || changed;
    if (changed) {
      saveProgress();
    }
  }
  if (progress.unlockedVoice.has("4x")) {
    let changed = false;
    changed = unlockLevel("x1", "voice") || changed;
    changed = unlockLevel("1-44-super-slow", "voice") || changed;
    changed = unlockLevel("1-44-slow", "voice") || changed;
    if (changed) {
      saveProgress();
    }
  }
}

function preserveMeaningUnlockOrder() {
  preserveSequentialUnlockOrder(progress.unlockedMeaning);
  preserveSequentialUnlockOrder(progress.unlockedVoice);
}

function preserveSequentialUnlockOrder(unlockedSet) {
  const highestUnlockedIndex = MEANING_LEVELS.reduce(
    (highest, level, index) => (unlockedSet.has(level.id) ? index : highest),
    -1
  );
  if (highestUnlockedIndex <= 0) {
    return;
  }
  let changed = false;
  for (let i = 0; i <= highestUnlockedIndex; i += 1) {
    const level = MEANING_LEVELS[i];
    if (!unlockedSet.has(level.id)) {
      unlockedSet.add(level.id);
      changed = true;
    }
  }
  if (changed) {
    saveProgress();
  }
}

function normalizeProgress() {
  const validIds = new Set(ALL_LEVELS.map((level) => level.id));
  if (!progress.unlockedImage) {
    progress.unlockedImage = new Set();
  }
  if (!progress.unlockedVis) {
    progress.unlockedVis = new Set();
  }
  if (!progress.unlockedShuffle) {
    progress.unlockedShuffle = new Set();
  }
  if (!progress.unlockedMeaning) {
    progress.unlockedMeaning = new Set();
  }
  if (!progress.unlockedVoice) {
    progress.unlockedVoice = new Set();
  }
  if (progress.unlocked.has("1x-4x")) {
    progress.unlocked.delete("1x-4x");
    ["1x", "2x", "3x", "4x"].forEach((id) => progress.unlocked.add(id));
  }
  if (progress.unlocked.has("1-44-slow")) {
    progress.unlocked.add("1-44-super-slow");
  }
  if (progress.unlockedImage.has("1-44-slow")) {
    progress.unlockedImage.add("1-44-super-slow");
  }
  if (progress.unlockedVis.has("1-44-slow")) {
    progress.unlockedVis.add("1-44-super-slow");
  }
  if (progress.unlockedShuffle.has("1-44-slow")) {
    progress.unlockedShuffle.add("1-44-super-slow");
  }
  if (progress.unlockedMeaning.has("1-44-slow")) {
    progress.unlockedMeaning.add("1-44-super-slow");
  }
  if (progress.unlockedVoice.has("1-44-slow")) {
    progress.unlockedVoice.add("1-44-super-slow");
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
  progress.unlockedImage.forEach((id) => {
    if (!validIds.has(id)) {
      progress.unlockedImage.delete(id);
    }
  });
  progress.unlockedVis.forEach((id) => {
    if (!validIds.has(id)) {
      progress.unlockedVis.delete(id);
    }
  });
  progress.unlockedShuffle.forEach((id) => {
    if (!validIds.has(id)) {
      progress.unlockedShuffle.delete(id);
    }
  });
  progress.unlockedMeaning.forEach((id) => {
    if (!validIds.has(id)) {
      progress.unlockedMeaning.delete(id);
    }
  });
  progress.unlockedVoice.forEach((id) => {
    if (!validIds.has(id)) {
      progress.unlockedVoice.delete(id);
    }
  });
  if (progress.lastLevel && !validIds.has(progress.lastLevel)) {
    progress.lastLevel = null;
  }
  if (!progress.highscoresImage || typeof progress.highscoresImage !== "object") {
    progress.highscoresImage = {};
  }
  if (!progress.highscoresVis || typeof progress.highscoresVis !== "object") {
    progress.highscoresVis = {};
  }
  if (!progress.highscoresShuffle || typeof progress.highscoresShuffle !== "object") {
    progress.highscoresShuffle = {};
  }
  if (!progress.highscoresMeaning || typeof progress.highscoresMeaning !== "object") {
    progress.highscoresMeaning = {};
  }
  if (!progress.highscoresVoice || typeof progress.highscoresVoice !== "object") {
    progress.highscoresVoice = {};
  }
  if (!Array.isArray(progress.reviewLog)) {
    progress.reviewLog = [];
  } else if (progress.reviewLog.length > MAX_REVIEW_LOG_ENTRIES) {
    progress.reviewLog = progress.reviewLog.slice(-MAX_REVIEW_LOG_ENTRIES);
  }
  if (!progress.reviewStats || typeof progress.reviewStats !== "object") {
    progress.reviewStats = {};
  }
  progress.toneMode = normalizeToneMode(progress.toneMode);
  saveProgress();
}

function getLevelById(levelId) {
  return ALL_LEVELS.find((level) => level.id === levelId) || LEVELS[0];
}

function getNextLevel(levelId, mode = "numbers") {
  const levels = getLevelsForMode(mode);
  const index = levels.findIndex((level) => level.id === levelId);
  if (index === -1) {
    return null;
  }
  return levels[index + 1] || null;
}

function unlockLevel(levelId, mode = "numbers") {
  const unlockedSet = getUnlockedSetForMode(mode);
  if (unlockedSet.has(levelId)) {
    return false;
  }
  unlockedSet.add(levelId);
  return true;
}

function unlockUpToLevel(levelId, mode = "numbers") {
  const levels = getLevelsForMode(mode);
  const index = levels.findIndex((level) => level.id === levelId);
  if (index === -1) {
    return false;
  }
  let unlockedAny = false;
  const unlockedSet = getUnlockedSetForMode(mode);
  for (let i = 0; i <= index; i += 1) {
    const level = levels[i];
    if (!unlockedSet.has(level.id)) {
      unlockedSet.add(level.id);
      unlockedAny = true;
    }
  }
  return unlockedAny;
}

function areAllPreviousUnlocked(levelId, mode = "numbers") {
  const levels = getLevelsForMode(mode);
  const index = levels.findIndex((level) => level.id === levelId);
  if (index <= 0) {
    return true;
  }
  const unlockedSet = getUnlockedSetForMode(mode);
  for (let i = 0; i < index; i += 1) {
    if (!unlockedSet.has(levels[i].id)) {
      return false;
    }
  }
  return true;
}

function isLevelUnlocked(levelId, mode = "numbers") {
  const unlockedSet = getUnlockedSetForMode(mode);
  return unlockedSet.has(levelId);
}

function isLevelSelectable(levelId, mode = "numbers") {
  return isLevelUnlocked(levelId, mode) && getLevelsForMode(mode).some((level) => level.id === levelId);
}

function buildLevelMedals(container, score) {
  const hasPlatinum = score >= SECRET_MEDAL.score;
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
  } else {
    const spacer = document.createElement("span");
    spacer.className = "medal medal--ghost";
    spacer.setAttribute("aria-hidden", "true");
    container.appendChild(spacer);
  }
}

function renderLevelOverlay() {
  if (!levelList) {
    return;
  }
  levelList.replaceChildren();
  const mode = getUnlockMode();
  getLevelsForMode(mode).forEach((level) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "level-card";
    const unlocked = isLevelUnlocked(level.id, mode);
    card.disabled = !unlocked;
    if (level.id === state.levelId) {
      card.classList.add("is-selected");
    }

    const name = document.createElement("div");
    name.className = "level-card__name";
    name.textContent = formatLevelLabel(level.label);

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
  const mode = getUnlockMode();
  getLevelsForMode(mode).forEach((level) => {
    const option = document.createElement("option");
    const unlocked = isLevelUnlocked(level.id, mode);
    option.value = level.id;
    const displayLabel = formatLevelLabel(level.label);
    option.textContent = unlocked
      ? displayLabel
      : `${displayLabel} (Unlock ${getLevelUnlockScore(level, mode)})`;
    option.disabled = !unlocked;
    levelSelect.appendChild(option);
  });

  if (isLevelSelectable(state.levelId, mode)) {
    levelSelect.value = state.levelId;
  } else {
    const firstUnlocked = getLevelsForMode(mode).find((level) => isLevelUnlocked(level.id, mode));
    if (firstUnlocked) {
      levelSelect.value = firstUnlocked.id;
    }
  }

  renderLevelOverlay();
  updateLevelPickerButton();
}

function getHighScore(levelId) {
  const highscores = getHighscoresForMode();
  return Number(highscores[levelId]) || 0;
}

function getReviewItemKey(drop) {
  return [
    drop.familyId || "",
    drop.text || "",
    drop.tones || "",
    drop.meaning || "",
  ].join("|");
}

function getMeaningEntryForTone(tones) {
  if (!isMeaningFamilyMode()) {
    return null;
  }
  return ensureMeaningSet({ render: false }).entries.find((entry) => entry.tones === tones) || null;
}

function createReviewId(drop, now) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${state.runId || "idle"}-${drop.id}-${now}-${randomPart}`;
}

function updateReviewStats(event) {
  const key = event.itemKey;
  if (!progress.reviewStats[key]) {
    progress.reviewStats[key] = {
      text: event.text,
      tones: event.tones,
      familyId: event.familyId,
      familyLabel: event.familyLabel,
      meaning: event.meaning,
      sv: event.sv,
      attempts: 0,
      correct: 0,
      incorrect: 0,
      missed: 0,
      totalResponseMs: 0,
      averageResponseMs: null,
      currentCorrectStreak: 0,
      lastReviewedAt: null,
      lastOutcome: null,
      lastSelectedTones: null,
    };
  }
  const stats = progress.reviewStats[key];
  stats.attempts += 1;
  if (event.outcome === "correct") {
    stats.correct += 1;
    stats.currentCorrectStreak += 1;
  } else {
    stats.currentCorrectStreak = 0;
    if (event.outcome === "missed") {
      stats.missed += 1;
    } else {
      stats.incorrect += 1;
    }
  }
  if (Number.isFinite(event.responseMs)) {
    stats.totalResponseMs += event.responseMs;
    stats.averageResponseMs = Math.round(stats.totalResponseMs / stats.attempts);
  }
  stats.lastReviewedAt = event.occurredAt;
  stats.lastOutcome = event.outcome;
  stats.lastSelectedTones = event.selectedTones;
}

function recordReview(
  drop,
  outcome,
  { selectedTones = null, inputMethod = "unknown", voicePrediction = null } = {}
) {
  if (!drop) {
    return;
  }
  drop.reviewAttemptCount = (drop.reviewAttemptCount || 0) + 1;
  const now = Date.now();
  const level = getLevelById(state.levelId);
  const meaningSetScope = isMeaningFamilyMode()
    ? getMeaningSetsForLevel(level).map((set) => set.id)
    : null;
  const selectedMeaningEntry = selectedTones ? getMeaningEntryForTone(selectedTones) : null;
  const responseMs = Number.isFinite(drop.spawnedAtMs)
    ? Math.max(0, Math.round(performance.now() - drop.spawnedAtMs))
    : null;
  const event = {
    version: REVIEW_LOG_VERSION,
    id: createReviewId(drop, now),
    runId: state.runId,
    dropId: drop.id,
    occurredAt: new Date(now).toISOString(),
    occurredAtMs: now,
    shownAt: drop.spawnedAt ? new Date(drop.spawnedAt).toISOString() : null,
    shownAtMs: drop.spawnedAt ?? null,
    responseMs,
    outcome,
    inputMethod,
    selectedTones,
    selectedMeaning: selectedMeaningEntry?.meaning ?? null,
    predictionConfidence: voicePrediction?.confidence ?? null,
    predictionMethod: voicePrediction?.method ?? null,
    predictionScores: voicePrediction?.scores ?? null,
    expectedTones: drop.tones,
    itemKey: getReviewItemKey(drop),
    text: drop.text,
    tones: drop.tones,
    sv: drop.sv,
    meaning: drop.meaning ?? null,
    familyId: drop.familyId ?? null,
    familyLabel: drop.familyLabel ?? null,
    mode: state.toneMode,
    levelId: state.levelId,
    levelLabel: level.label,
    meaningSetScope,
    scoreBefore: state.score,
    livesBefore: state.lives,
    attemptNumberForDrop: drop.reviewAttemptCount,
  };
  progress.reviewLog.push(event);
  if (progress.reviewLog.length > MAX_REVIEW_LOG_ENTRIES) {
    progress.reviewLog.splice(0, progress.reviewLog.length - MAX_REVIEW_LOG_ENTRIES);
  }
  updateReviewStats(event);
  saveProgress();
}

function updateHighScore() {
  highScoreEl.textContent = getHighScore(state.levelId);
}

function updateToneModeToggle() {
  if (!toneModeButtons.length) {
    return;
  }
  const activeMode = state.toneMode;
  toneModeButtons.forEach((button) => {
    if (button.hidden) {
      return;
    }
    const isActive = button.dataset.mode === activeMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function configureToneModeButtons() {
  if (!toneModeButtons.length) {
    return;
  }
  const numbersButton = toneModeButtons[0];
  const altButton = toneModeButtons[1];
  const shuffleButton = toneModeButtons[2];
  const visButton = toneModeButtons[3];
  const meaningButton = toneModeButtons[4];
  const voiceButton = toneModeButtons[5];
  if (numbersButton) {
    numbersButton.dataset.mode = "numbers";
    numbersButton.textContent = "123";
    numbersButton.setAttribute("aria-label", "Numbers");
  }
  if (altButton) {
    altButton.dataset.mode = HANNES_MODE ? "images" : "symbols";
    altButton.textContent = HANNES_MODE ? "Images" : "Symbols";
    altButton.setAttribute("aria-label", HANNES_MODE ? "Images" : "Symbols");
  }
  if (shuffleButton) {
    shuffleButton.dataset.mode = "shuffle";
    shuffleButton.hidden = !HANNES_MODE;
  }
  if (visButton) {
    visButton.dataset.mode = "vis";
    visButton.textContent = "Vis";
    visButton.setAttribute("aria-label", "Vis");
    visButton.hidden = !HANNES_MODE;
  }
  if (meaningButton) {
    meaningButton.dataset.mode = "meaning";
    meaningButton.textContent = "Meanings";
    meaningButton.setAttribute("aria-label", "Meanings");
    meaningButton.hidden = false;
  }
  if (voiceButton) {
    voiceButton.dataset.mode = "voice";
    voiceButton.textContent = "Voice";
    voiceButton.setAttribute("aria-label", "Voice");
    voiceButton.hidden = false;
  }
}

function isMeaningMode() {
  return state.toneMode === "meaning";
}

function isVoiceMode(mode = state.toneMode) {
  return mode === "voice";
}

function isMeaningFamilyMode(mode = state.toneMode) {
  return mode === "meaning" || mode === "voice";
}

function isImagePadMode(mode = state.toneMode) {
  return mode === "images" || mode === "shuffle" || isMeaningFamilyMode(mode);
}

function shuffledItems(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickMeaningSet(excludeId = null, sets = MEANING_TONE_SETS) {
  const sourceSets = sets && sets.length ? sets : MEANING_TONE_SETS;
  const candidates =
    sourceSets.length > 1 && excludeId
      ? sourceSets.filter((set) => set.id !== excludeId)
      : sourceSets;
  return candidates[Math.floor(Math.random() * candidates.length)] || sourceSets[0];
}

function getMeaningSetsForLevel(level = getLevelById(state.levelId)) {
  if (level?.meaningSetId) {
    const set = getMeaningSetById(level.meaningSetId);
    return set ? [set] : MEANING_TONE_SETS;
  }
  if (Array.isArray(level?.meaningSetIds) && level.meaningSetIds.length) {
    const sets = level.meaningSetIds.map(getMeaningSetById).filter(Boolean);
    return sets.length ? sets : MEANING_TONE_SETS;
  }
  return MEANING_TONE_SETS;
}

function pickMeaningSetForLevel(level = getLevelById(state.levelId), excludeId = null) {
  const sets = getMeaningSetsForLevel(level);
  return pickMeaningSet(sets.length > 1 ? excludeId : null, sets);
}

function setMeaningSet(set, { render = true } = {}) {
  if (!set) {
    return;
  }
  state.meaningSet = set;
  state.meaningPadOrder = shuffledItems(set.entries);
  state.meaningSetChangeAt = 0;
  state.voiceModel = null;
  state.voiceModelFamilyId = null;
  if (render) {
    renderImagePad();
  }
  if (isVoiceMode()) {
    loadVoiceModelForCurrentSet();
  }
}

function ensureMeaningSet({ render = true } = {}) {
  const sets = getMeaningSetsForLevel();
  if (sets.length === 1) {
    if (state.meaningSet?.id !== sets[0].id) {
      setMeaningSet(sets[0], { render });
    }
    return sets[0];
  }
  if (!state.meaningSet || !sets.some((set) => set.id === state.meaningSet.id)) {
    setMeaningSet(pickMeaningSet(null, sets), { render });
  }
  return state.meaningSet;
}

function queueMeaningSetChange() {
  if (!isMeaningFamilyMode() || getMeaningSetsForLevel().length <= 1 || drops.length) {
    return;
  }
  state.meaningSetChangeAt = performance.now() + MEANING_SET_CHANGE_DELAY_MS;
}

function maybeAdvanceMeaningSet(timestamp) {
  if (
    !isMeaningFamilyMode() ||
    drops.length ||
    splashes.length ||
    reveals.length ||
    translations.length ||
    getMeaningSetsForLevel().length <= 1 ||
    !state.meaningSetChangeAt
  ) {
    return;
  }
  if (timestamp < state.meaningSetChangeAt) {
    return;
  }
  setMeaningSet(pickMeaningSetForLevel(getLevelById(state.levelId), state.meaningSet?.id));
}

function getMeaningImage(entry) {
  const key = `${entry.familyId}-${entry.tones}`;
  if (!meaningImageCache.has(key)) {
    const img = new Image();
    img.src = entry.image;
    meaningImageCache.set(key, img);
  }
  return meaningImageCache.get(key);
}

function renderMeaningPad() {
  const set = ensureMeaningSet({ render: false });
  const entriesOrder =
    state.meaningPadOrder && state.meaningPadOrder.length ? state.meaningPadOrder : set.entries;
  entriesOrder.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "image-pad__btn";
    button.dataset.tones = entry.tones;
    button.setAttribute("aria-label", `${entry.meaning}: ${entry.sv}`);

    const img = document.createElement("img");
    const meaningImage = getMeaningImage(entry);
    img.src = meaningImage.src;
    img.alt = entry.sv;
    button.appendChild(img);

    const label = document.createElement("span");
    label.className = "image-pad__label";
    label.textContent = entry.meaning;
    button.appendChild(label);

    button.addEventListener("click", () => {
      if (!state.useImagePad) {
        return;
      }
      if (isVoiceMode()) {
        if (!state.running) {
          playToneSample(entry.tones);
        }
        return;
      }
      if (state.running) {
        handleImageEntry(entry.tones);
        return;
      }
      playToneSample(entry.tones);
    });

    imagePad.appendChild(button);
  });
}

function renderImagePad() {
  if (!imagePad) {
    return;
  }
  imagePad.replaceChildren();
  if (isVoiceMode()) {
    imagePadButtons = [];
    return;
  }
  if (isMeaningFamilyMode()) {
    renderMeaningPad();
    imagePadButtons = Array.from(imagePad.querySelectorAll(".image-pad__btn"));
    return;
  }
  const tonesOrder = state.imagePadOrder && state.imagePadOrder.length ? state.imagePadOrder : IMAGE_PAD_TONES;
  tonesOrder.forEach((tones) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "image-pad__btn";
    button.dataset.tones = tones;
    button.setAttribute("aria-label", `Tone ${tones}`);

    const img = document.createElement("img");
    img.src = `tone_grid_images/${tones}.png`;
    img.alt = `Tone ${tones}`;
    button.appendChild(img);

    button.addEventListener("click", () => {
      if (!state.useImagePad) {
        return;
      }
      if (state.running) {
        handleImageEntry(tones);
        return;
      }
      playToneSample(tones);
    });

    imagePad.appendChild(button);
    getToneImage(tones);
  });
  imagePadButtons = Array.from(imagePad.querySelectorAll(".image-pad__btn"));
}

function playToneSample(tones) {
  if (state.toneMode === "vis") {
    return;
  }
  if (isMeaningFamilyMode()) {
    const set = ensureMeaningSet();
    const entry = set.entries.find((candidate) => candidate.tones === tones);
    if (!entry) {
      return;
    }
    lastSpoken = entry;
    speak(entry.text, { force: true });
    setStatus(`Replaying: ${entry.text}`);
    return;
  }
  const entries = WORDS_BY_TONE[tones];
  if (!entries || !entries.length) {
    return;
  }
  const entry = entries[Math.floor(Math.random() * entries.length)];
  lastSpoken = entry;
  speak(entry.text, { force: true });
  setStatus(`Replaying: ${entry.text}`);
}

function shuffleImagePadOrder() {
  const order = [...IMAGE_PAD_TONES];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  state.imagePadOrder = order;
  renderImagePad();
}

function getToneImage(tones) {
  if (!toneImageCache.has(tones)) {
    const img = new Image();
    img.src = `tone_grid_images/${tones}.png`;
    toneImageCache.set(tones, img);
  }
  return toneImageCache.get(tones);
}

async function ensureVoiceMic() {
  if (state.voiceStream && state.voiceAudioContext && state.voiceAnalyser) {
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support microphone capture.");
  }
  state.voiceStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  state.voiceAudioContext = new AudioContextClass();
  const source = state.voiceAudioContext.createMediaStreamSource(state.voiceStream);
  state.voiceAnalyser = state.voiceAudioContext.createAnalyser();
  state.voiceAnalyser.fftSize = 2048;
  state.voiceAnalyser.smoothingTimeConstant = 0;
  state.voiceAnalyserBuffer = new Float32Array(state.voiceAnalyser.fftSize);
  source.connect(state.voiceAnalyser);
}

async function startVoiceInput() {
  if (!isVoiceMode() || state.voiceListening) {
    return;
  }
  state.voiceListening = true;
  state.voiceFrames = [];
  state.voiceUtteranceFrames = [];
  state.voiceIsSpeaking = false;
  state.voiceLastVoiceAt = 0;
  state.voiceLastAcceptedAt = 0;
  try {
    await loadVoiceModelForCurrentSet();
    await ensureVoiceMic();
    if (!state.running || !isVoiceMode()) {
      stopVoiceInput();
      return;
    }
    setStatus("Listening... say the word that matches a falling character.");
    state.voiceCaptureTimer = window.setInterval(captureVoiceFrame, VOICE_FRAME_MS);
    state.voicePredictTimer = window.setInterval(runVoicePrediction, VOICE_PREDICT_MS);
  } catch (error) {
    console.warn("Voice input unavailable", error);
    state.voiceListening = false;
    setStatus(`Voice unavailable: ${error.message || error}`);
  }
}

function stopVoiceInput() {
  if (state.voiceCaptureTimer) {
    window.clearInterval(state.voiceCaptureTimer);
    state.voiceCaptureTimer = null;
  }
  if (state.voicePredictTimer) {
    window.clearInterval(state.voicePredictTimer);
    state.voicePredictTimer = null;
  }
  if (state.voiceStream) {
    state.voiceStream.getTracks().forEach((track) => track.stop());
  }
  state.voiceStream = null;
  if (state.voiceAudioContext) {
    state.voiceAudioContext.close().catch(() => {});
  }
  state.voiceAudioContext = null;
  state.voiceAnalyser = null;
  state.voiceAnalyserBuffer = null;
  state.voiceFrames = [];
  state.voiceUtteranceFrames = [];
  state.voiceIsSpeaking = false;
  state.voiceLastVoiceAt = 0;
  state.voiceFeedbackUntil = 0;
  state.voiceListening = false;
}

function clearVoiceCaptureState() {
  state.voiceFrames = [];
  state.voiceUtteranceFrames = [];
  state.voiceIsSpeaking = false;
  state.voiceLastVoiceAt = 0;
}

function suppressVoiceFeedbackRecognition(durationMs = VOICE_FEEDBACK_SUPPRESS_MS) {
  state.voiceFeedbackUntil = Math.max(state.voiceFeedbackUntil || 0, performance.now() + durationMs);
  state.voiceLastAcceptedAt = performance.now();
  clearVoiceCaptureState();
}

function captureVoiceFrame() {
  if (!state.voiceAnalyser || !state.voiceAnalyserBuffer || !state.voiceAudioContext) {
    return;
  }
  const now = performance.now();
  if (now < state.voiceFeedbackUntil) {
    clearVoiceCaptureState();
    return;
  }
  state.voiceAnalyser.getFloatTimeDomainData(state.voiceAnalyserBuffer);
  const estimate = estimatePitch(state.voiceAnalyserBuffer, state.voiceAudioContext.sampleRate);
  const frame = {
    absoluteT: now,
    t: 0,
    pitchHz: estimate.pitchHz ? Math.round(estimate.pitchHz * 10) / 10 : null,
    rms: Math.round(estimate.rms * 10000) / 10000,
    clarity: Math.round(estimate.clarity * 1000) / 1000,
  };
  state.voiceFrames.push(frame);
  const oldest = now - VOICE_MAX_UTTERANCE_MS * 1.8;
  while (state.voiceFrames.length && state.voiceFrames[0].absoluteT < oldest) {
    state.voiceFrames.shift();
  }

  const isVoiced = Boolean(frame.pitchHz) && frame.rms >= 0.012 && frame.clarity >= 0.55;
  if (isVoiced && !state.voiceIsSpeaking) {
    state.voiceUtteranceFrames = [];
    state.voiceIsSpeaking = true;
  }
  if (state.voiceIsSpeaking) {
    state.voiceUtteranceFrames.push(frame);
    const utteranceStart = state.voiceUtteranceFrames[0]?.absoluteT ?? now;
    state.voiceUtteranceFrames = state.voiceUtteranceFrames.filter(
      (candidate) => candidate.absoluteT >= utteranceStart &&
        now - candidate.absoluteT <= VOICE_MAX_UTTERANCE_MS + VOICE_SILENCE_MS
    );
  }
  if (isVoiced) {
    state.voiceLastVoiceAt = now;
  }
}

function normalizeVoiceFrames(frames) {
  if (!frames.length) {
    return [];
  }
  const start = frames[0].absoluteT;
  return frames.map((frame) => ({
    t: Math.round(frame.absoluteT - start),
    pitchHz: frame.pitchHz,
    rms: frame.rms,
    clarity: frame.clarity,
  }));
}

async function loadVoiceModelForCurrentSet() {
  const set = ensureMeaningSet({ render: false });
  if (!set) {
    state.voiceModel = null;
    state.voiceModelFamilyId = null;
    return;
  }
  if (state.voiceModelFamilyId === set.id && state.voiceModel) {
    return;
  }
  if (state.voiceModelCache.has(set.id)) {
    state.voiceModel = state.voiceModelCache.get(set.id);
    state.voiceModelFamilyId = set.id;
    return;
  }
  const model = await fetchVoiceModel(set);
  state.voiceModelCache.set(set.id, model);
  if (state.meaningSet?.id === set.id) {
    state.voiceModel = model;
    state.voiceModelFamilyId = set.id;
  }
}

async function fetchVoiceModel(set) {
  const url = `${SUPABASE_URL}/rest/v1/${VOICE_TABLE}?select=target_tone,pitch_features,status&syllable=eq.${encodeURIComponent(
    set.id
  )}&status=eq.uploaded&limit=400`;
  try {
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Supabase ${response.status}`);
    }
    const rows = await response.json();
    return buildVoiceKnnModel(Array.isArray(rows) ? rows : [], set);
  } catch (error) {
    console.warn("Could not load voice model", error);
    return buildVoiceKnnModel([], set);
  }
}

function runVoicePrediction() {
  if (!state.running || !isVoiceMode() || !drops.length || !state.voiceIsSpeaking) {
    return;
  }
  const now = performance.now();
  if (now < state.voiceFeedbackUntil) {
    clearVoiceCaptureState();
    return;
  }
  const firstFrameAt = state.voiceUtteranceFrames[0]?.absoluteT ?? now;
  const silenceMs = now - state.voiceLastVoiceAt;
  const durationMs = now - firstFrameAt;
  if (silenceMs < VOICE_SILENCE_MS && durationMs < VOICE_MAX_UTTERANCE_MS) {
    return;
  }
  const frames = normalizeVoiceFrames(state.voiceUtteranceFrames);
  state.voiceUtteranceFrames = [];
  state.voiceIsSpeaking = false;
  const prediction = predictVoiceTone(frames);
  if (!prediction || prediction.method === "none") {
    return;
  }
  if (now - state.voiceLastAcceptedAt < VOICE_ACCEPT_COOLDOWN_MS) {
    return;
  }
  const voicedCount = prediction.features?.voicedFrameCount || 0;
  if (voicedCount < VOICE_MIN_VOICED_FRAMES || prediction.confidence < VOICE_MIN_CONFIDENCE) {
    return;
  }
  state.voiceLastAcceptedAt = now;
  state.voiceFrames = [];
  handleVoiceEntry(prediction);
}

function handleVoiceEntry(prediction) {
  const tones = prediction.tone;
  const entry = ensureMeaningSet({ render: false }).entries.find((candidate) => candidate.tones === tones);
  const matches = findMatches(tones);
  const label = entry ? `${entry.familyLabel}${tones}` : tones;
  if (matches.length) {
    matches
      .sort((a, b) => b.y - a.y)
      .forEach((match) =>
        clearDrop(match, { selectedTones: tones, inputMethod: "voice", voicePrediction: prediction })
      );
    setStatus(matches.length === 1 ? `Heard ${label}.` : `Heard ${label}. Cleared ${matches.length}.`);
  } else {
    recordIncorrectAnswer(tones, "voice", { voicePrediction: prediction });
    setStatus(`Heard ${label}, but no matching drop.`);
  }
}

function buildVoiceKnnModel(rows, set) {
  const options = VOICE_MODEL_OPTIONS_BY_SET[set.id] || VOICE_DEFAULT_MODEL_OPTIONS;
  const validTones = new Set(set.entries.map((entry) => entry.tones));
  const samples = rows
    .map((row) => ({
      tone: String(row.target_tone),
      vector: contourVector(row.pitch_features?.frames || []),
    }))
    .filter((sample) => validTones.has(sample.tone) && sample.vector);
  const counts = countByTone(samples);
  if (!samples.length) {
    return { kind: "heuristic", counts, samples: [], options };
  }
  const globalMedianPitch = median(
    samples.map((sample) => sample.vector.medianPitchHz).filter(Number.isFinite)
  );
  const vectors = samples
    .map((sample) => ({
      tone: sample.tone,
      vector: sample.vector,
      values: vectorValues(sample.vector, globalMedianPitch),
    }))
    .filter((sample) => sample.values);
  if (!vectors.length) {
    return { kind: "heuristic", counts, samples: [], options };
  }
  const stats = vectorStats(vectors.map((sample) => sample.values));
  return {
    kind: "knn",
    counts,
    options,
    globalMedianPitch,
    stats,
    samples: vectors.map((sample) => ({
      tone: sample.tone,
      values: standardizeVector(sample.values, stats),
      contour: sample.vector.contour,
    })),
  };
}

function predictVoiceTone(frames) {
  const vector = contourVector(frames);
  if (!vector) {
    return {
      tone: "1",
      confidence: 0,
      method: "none",
      scores: { "1": 0, "2": 0, "3": 0, "4": 0 },
      reason: "Not enough voiced pitch frames.",
    };
  }
  if (state.voiceModel?.kind === "knn") {
    return predictWithVoiceKnn(vector, state.voiceModel);
  }
  return predictWithVoiceHeuristic(vector);
}

function predictWithVoiceKnn(vector, model) {
  const options = model.options || VOICE_DEFAULT_MODEL_OPTIONS;
  const values = vectorValues(vector, model.globalMedianPitch);
  const standardized = standardizeVector(values, model.stats);
  const rawScores = { "1": 0.001, "2": 0.001, "3": 0.001, "4": 0.001 };
  const neighbors = model.samples
    .map((sample) => {
      const featureDistance = euclideanDistance(standardized, sample.values) / Math.sqrt(sample.values.length);
      const contourDistance = dtwDistance(vector.contour, sample.contour);
      return {
        tone: sample.tone,
        distance:
          contourDistance * options.contourWeight +
          featureDistance * (1 - options.contourWeight),
      };
    })
    .sort((a, b) => a.distance - b.distance);
  const k = Math.min(options.k, neighbors.length);
  neighbors.slice(0, k).forEach((neighbor, index) => {
    const rankWeight = 1 - index / Math.max(1, k + 1);
    rawScores[neighbor.tone] += rankWeight / Math.max(options.distanceFloor, neighbor.distance);
  });
  const scores = normalizeScores(rawScores);
  const tone = bestTone(scores);
  return {
    tone,
    confidence: scores[tone],
    method: "kNN contour",
    scores,
    features: vector,
  };
}

function predictWithVoiceHeuristic(vector) {
  const { slope, earlySlope, lateSlope, range, minPosition, end, start, meanRel } = vector;
  const scores = {
    "1": 0.35,
    "2": 0.35,
    "3": 0.35,
    "4": 0.35,
  };
  if (Math.abs(slope) < 1.8 && range < 4.2) {
    scores["1"] += 1.4;
  }
  if (slope > 1.8 && lateSlope > 0.7) {
    scores["2"] += 1.35 + Math.min(1, slope / 8);
  }
  if (earlySlope < -1.2 && lateSlope > 0.8 && minPosition > 0.18 && minPosition < 0.82) {
    scores["3"] += 1.65 + Math.min(1, range / 9);
  }
  if (slope < -2.2 && end < start - 1.5) {
    scores["4"] += 1.45 + Math.min(1, Math.abs(slope) / 8);
  }
  if (meanRel > 1.4 && Math.abs(slope) < 3) {
    scores["1"] += 0.35;
  }
  if (meanRel < -1.4 && range > 3) {
    scores["3"] += 0.25;
  }
  const normalized = normalizeScores(scores);
  const tone = bestTone(normalized);
  return {
    tone,
    confidence: normalized[tone],
    method: "contour heuristic",
    scores: normalized,
    features: vector,
  };
}

function estimatePitch(buffer, sampleRate) {
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    sumSquares += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquares / buffer.length);
  if (rms < 0.012) {
    return { pitchHz: null, rms, clarity: 0 };
  }

  const minLag = Math.floor(sampleRate / 520);
  const maxLag = Math.floor(sampleRate / 65);
  const difference = new Float32Array(maxLag + 1);
  for (let lag = 1; lag <= maxLag; lag += 1) {
    let sum = 0;
    for (let i = 0; i < buffer.length - maxLag; i += 1) {
      const delta = buffer[i] - buffer[i + lag];
      sum += delta * delta;
    }
    difference[lag] = sum;
  }

  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let lag = 1; lag <= maxLag; lag += 1) {
    runningSum += difference[lag];
    cmnd[lag] = difference[lag] * lag / (runningSum || 1);
  }

  let bestLag = -1;
  const threshold = 0.14;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    if (cmnd[lag] < threshold) {
      while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) {
        lag += 1;
      }
      bestLag = lag;
      break;
    }
  }

  if (bestLag === -1) {
    let bestValue = Infinity;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      if (cmnd[lag] < bestValue) {
        bestValue = cmnd[lag];
        bestLag = lag;
      }
    }
  }

  const clarity = Math.max(0, Math.min(1, 1 - cmnd[bestLag]));
  if (bestLag <= 0 || clarity < 0.55) {
    return { pitchHz: null, rms, clarity };
  }

  const betterLag = parabolicLag(cmnd, bestLag);
  const pitchHz = sampleRate / betterLag;
  if (!Number.isFinite(pitchHz) || pitchHz < 65 || pitchHz > 520) {
    return { pitchHz: null, rms, clarity };
  }
  return { pitchHz, rms, clarity };
}

function parabolicLag(values, index) {
  if (index <= 0 || index >= values.length - 1) {
    return index;
  }
  const previous = values[index - 1];
  const current = values[index];
  const next = values[index + 1];
  const divisor = previous + next - 2 * current;
  if (!divisor) {
    return index;
  }
  return index + (previous - next) / (2 * divisor);
}

function contourVector(frames) {
  const voiced = mainVoicedSegment(frames);
  if (voiced.length < 5) {
    return null;
  }
  const pitches = fixOctaveJumps(voiced.map((frame) => frame.pitchHz));
  const medianPitchHz = median(pitches);
  if (!medianPitchHz) {
    return null;
  }
  const semitones = pitches.map((pitchHz) => 12 * Math.log2(pitchHz / medianPitchHz));
  const smoothed = smoothValues(smoothValues(semitones));
  const points = resampleValues(smoothed, 5);
  const contour = resampleValues(smoothed, 20);
  const minValue = Math.min(...smoothed);
  const maxValue = Math.max(...smoothed);
  const minIndex = smoothed.indexOf(minValue);
  const maxIndex = smoothed.indexOf(maxValue);
  const start = points[0];
  const mid = points[2];
  const end = points[4];
  return {
    medianPitchHz,
    start,
    q1: points[1],
    mid,
    q3: points[3],
    end,
    mean: mean(smoothed) ?? 0,
    meanRel: 0,
    slope: end - start,
    earlySlope: mid - start,
    lateSlope: end - mid,
    range: maxValue - minValue,
    minPosition: smoothed.length > 1 ? minIndex / (smoothed.length - 1) : 0,
    maxPosition: smoothed.length > 1 ? maxIndex / (smoothed.length - 1) : 0,
    voicedFrameCount: voiced.length,
    contour,
  };
}

function mainVoicedSegment(frames) {
  const sorted = frames
    .filter((frame) => frame.pitchHz && frame.pitchHz >= 65 && frame.pitchHz <= 520)
    .filter((frame) => (frame.clarity ?? 0) >= 0.55)
    .sort((a, b) => a.t - b.t);
  if (!sorted.length) {
    return [];
  }
  const maxRms = Math.max(...sorted.map((frame) => frame.rms || 0));
  const rmsFloor = Math.max(0.014, maxRms * 0.18);
  const voiced = sorted.filter((frame) => (frame.rms || 0) >= rmsFloor);
  const groups = [];
  voiced.forEach((frame) => {
    const previousGroup = groups[groups.length - 1];
    const previousFrame = previousGroup?.[previousGroup.length - 1];
    if (!previousFrame || frame.t - previousFrame.t > 170) {
      groups.push([frame]);
    } else {
      previousGroup.push(frame);
    }
  });
  return groups
    .sort((a, b) => segmentScore(b) - segmentScore(a))[0] || [];
}

function segmentScore(segment) {
  const rmsTotal = segment.reduce((sum, frame) => sum + (frame.rms || 0), 0);
  return segment.length * 0.65 + rmsTotal * 35;
}

function fixOctaveJumps(pitches) {
  if (!pitches.length) {
    return [];
  }
  const fixed = [pitches[0]];
  for (let i = 1; i < pitches.length; i += 1) {
    let pitch = pitches[i];
    const previous = fixed[fixed.length - 1];
    while (pitch / previous > 1.65) {
      pitch /= 2;
    }
    while (previous / pitch > 1.65) {
      pitch *= 2;
    }
    fixed.push(pitch);
  }
  return fixed;
}

function vectorValues(vector, globalMedianPitch = vector.medianPitchHz) {
  if (!vector || !globalMedianPitch) {
    return null;
  }
  const meanRel = 12 * Math.log2(vector.medianPitchHz / globalMedianPitch);
  return [
    vector.start,
    vector.q1,
    vector.mid,
    vector.q3,
    vector.end,
    vector.slope,
    vector.earlySlope,
    vector.lateSlope,
    vector.range,
    vector.minPosition,
    vector.maxPosition,
    meanRel,
  ];
}

function vectorStats(vectors) {
  const dimensions = vectors[0]?.length || 0;
  const means = Array.from({ length: dimensions }, (_, index) =>
    mean(vectors.map((vector) => vector[index])) ?? 0
  );
  const stds = Array.from({ length: dimensions }, (_, index) => {
    const variance =
      mean(vectors.map((vector) => (vector[index] - means[index]) ** 2)) ?? 0;
    return Math.sqrt(variance) || 1;
  });
  return { means, stds };
}

function standardizeVector(vector, stats) {
  return vector.map((value, index) => (value - stats.means[index]) / stats.stds[index]);
}

function euclideanDistance(left, right) {
  return Math.sqrt(
    left.reduce((sum, value, index) => sum + (value - (right[index] ?? 0)) ** 2, 0)
  );
}

function dtwDistance(left, right) {
  if (!left?.length || !right?.length) {
    return 99;
  }
  const width = right.length + 1;
  const costs = new Float32Array((left.length + 1) * width);
  costs.fill(Infinity);
  costs[0] = 0;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = Math.abs(left[i - 1] - right[j - 1]);
      const index = i * width + j;
      costs[index] =
        cost +
        Math.min(
          costs[(i - 1) * width + j],
          costs[i * width + j - 1],
          costs[(i - 1) * width + j - 1]
        );
    }
  }
  return costs[left.length * width + right.length] / (left.length + right.length);
}

function smoothValues(values) {
  return values.map((value, index) => {
    const window = values.slice(Math.max(0, index - 1), Math.min(values.length, index + 2));
    return median(window) ?? value;
  });
}

function resampleValues(values, count) {
  if (values.length === 1) {
    return Array.from({ length: count }, () => values[0]);
  }
  return Array.from({ length: count }, (_, index) => {
    const position = (index / (count - 1)) * (values.length - 1);
    const low = Math.floor(position);
    const high = Math.min(values.length - 1, Math.ceil(position));
    const mix = position - low;
    return values[low] * (1 - mix) + values[high] * mix;
  });
}

function normalizeScores(scores) {
  const total = Object.values(scores).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  return Object.fromEntries(
    Object.entries(scores).map(([tone, value]) => [tone, Math.max(0, value) / total])
  );
}

function bestTone(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "1";
}

function countByTone(samples) {
  return samples.reduce((counts, sample) => {
    counts[sample.tone] = (counts[sample.tone] || 0) + 1;
    return counts;
  }, {});
}

function mean(values) {
  if (!values.length) {
    return null;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function median(values) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) {
    return null;
  }
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2
    ? clean[middle]
    : (clean[middle - 1] + clean[middle]) / 2;
}

function setToneMode(mode, { persist = true } = {}) {
  const normalized = normalizeToneMode(mode);
  if (progress.toneMode === normalized && state.toneMode === normalized) {
    return;
  }
  if (state.toneMode === "voice" && normalized !== "voice") {
    stopVoiceInput();
  }
  progress.toneMode = normalized;
  state.toneMode = normalized;
  state.useNumberLabels = normalized !== "symbols";
  state.useImagePad = isImagePadMode(normalized);
  state.useVisDrops = normalized === "vis";
  gameRoot?.classList.toggle("game--image-mode", state.useImagePad);
  gameRoot?.classList.toggle("game--vis-mode", state.useVisDrops);
  gameRoot?.classList.toggle("game--meaning-mode", isMeaningFamilyMode(normalized));
  gameRoot?.classList.toggle("game--voice-mode", normalized === "voice");
  if (state.useImagePad) {
    toneInput.value = "";
    clearInputTimer();
    if (normalized === "shuffle") {
      shuffleImagePadOrder();
    } else if (isMeaningFamilyMode(normalized)) {
      setMeaningSet(pickMeaningSetForLevel(getLevelById(state.levelId), state.meaningSet?.id));
    } else {
      state.imagePadOrder = IMAGE_PAD_TONES.slice();
      renderImagePad();
    }
  }
  if (persist) {
    saveProgress();
  }
  renderLevelOptions();
  if (!isLevelSelectable(state.levelId, getUnlockMode())) {
    const firstUnlocked = getLevelsForMode(getUnlockMode()).find((level) =>
      isLevelUnlocked(level.id, getUnlockMode())
    );
    if (firstUnlocked) {
      setLevel(firstUnlocked.id, { announce: false });
    }
  }
  updateToneLabels();
  updateHighScore();
  renderMedals();
  updateInputEnabled();
}

function updateLevelPickerButton() {
  if (!levelPickerBtn || !levelSelect) {
    return;
  }
  const levelId = levelSelect.value || state.levelId;
  const level = getLevelById(levelId);
  levelPickerBtn.textContent = level ? formatLevelLabel(level.label) : "Level";
  levelPickerBtn.setAttribute("aria-label", `Level ${level ? level.label : ""}`.trim());
  levelPickerBtn.disabled = levelSelect.disabled;
}

function setLevel(levelId, { announce = true } = {}) {
  const level = getLevelById(levelId);
  state.levelId = level.id;
  state.wordPool = level.wordPool;
  state.speedScale = level.speedScale ?? 1;
  state.spawnScale = level.spawnScale ?? 1;
  if (isMeaningFamilyMode()) {
    setMeaningSet(pickMeaningSetForLevel(level, state.meaningSet?.id));
  }
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

function speak(text, { force = false, allowDuringVoiceGame = false } = {}) {
  if (!window.speechSynthesis) {
    return;
  }
  if (state.toneMode === "vis" || (isVoiceMode() && state.running && !allowDuringVoiceGame)) {
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
  state.visTileSize = computeVisTileSize();
  updateViewportHeight();
  updateInputMode();
  updateStatusPlacement();
}

function updateViewportHeight() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--vh", `${viewportHeight / 100}px`);
}

function computeVisTileSize() {
  const rootSize =
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const gap = 0.35 * rootSize;
  const padWidth = Math.min(420, state.width);
  const size = (padWidth - gap * 4) / 5;
  return Math.max(48, Math.min(96, size));
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
    let text = "";
    if (score >= SECRET_MEDAL.score) {
      text =
        "Congratulations! I am proud to see you keep pushing the limits even after the highest reward!";
    } else if (nextTier) {
      text = `Congratulations! If you continue like this, you might get that ${nextTier.label.toLowerCase()} medal soon!`;
    } else {
      text = "Congratulations! If you continue to excel like this, I might have to create a NEW medal!";
    }
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
  if (toneInput.hasAttribute("disabled") || state.useKeypad || state.useImagePad) {
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
  if (state.useNumberLabels) {
    return digit;
  }
  return TONE_SYMBOLS[digit] || digit;
}

function formatToneString(tones) {
  if (state.useNumberLabels) {
    return tones;
  }
  return tones
    .split("")
    .map((digit) => formatToneDigit(digit))
    .join("");
}

function shouldUseImageReveals() {
  return isImagePadMode() && state.toneMode !== "vis";
}

function getToneModeLabel() {
  if (state.toneMode === "images") {
    return "images";
  }
  if (state.toneMode === "shuffle") {
    return "images";
  }
  if (state.toneMode === "meaning") {
    return "meanings";
  }
  if (state.toneMode === "voice") {
    return "words";
  }
  if (state.toneMode === "vis") {
    return "numbers";
  }
  return state.useNumberLabels ? "numbers" : "symbols";
}

function formatLevelLabel(label) {
  if (state.useNumberLabels) {
    return label;
  }
  return label.replace(/[1-4]/g, (digit) => formatToneDigit(digit));
}

function updateToneLabels() {
  const usesImages = isImagePadMode();
  const actionLabel = isVoiceMode() ? "say" : usesImages ? "tap" : "type";
  keypadButtons.forEach((button) => {
    const digit = button.dataset.digit;
    const label = formatToneDigit(digit);
    button.textContent = label;
    button.setAttribute(
      "aria-label",
      state.useNumberLabels ? `Tone ${digit}` : `Tone ${digit} (${label})`
    );
  });
  if (toneModeLabel) {
    toneModeLabel.textContent = getToneModeLabel();
  }
  if (toneModeAction) {
    toneModeAction.textContent = actionLabel;
  }
  if (toneHeadingMode) {
    toneHeadingMode.textContent = getToneModeLabel();
  }
  if (toneHeadingAction) {
    toneHeadingAction.textContent = actionLabel;
  }
  if (toneExample) {
    toneExample.textContent = state.useNumberLabels
      ? "23"
      : `${formatToneDigit("2")}${formatToneDigit("3")}`;
  }
  if (toneExampleWrap) {
    toneExampleWrap.hidden = usesImages;
  }
  updateToneModeToggle();
  updateLevelPickerButton();
  renderLevelOverlay();
}

function isPortraitLike() {
  return window.matchMedia("(orientation: portrait)").matches || window.innerHeight > window.innerWidth;
}

function updateInputMode() {
  state.useKeypad = isPortraitLike();
  if (gameRoot) {
    gameRoot.classList.toggle("game--keypad", state.useKeypad);
    gameRoot.classList.toggle("game--image-mode", state.useImagePad);
    gameRoot.classList.toggle("game--vis-mode", state.useVisDrops);
    gameRoot.classList.toggle("game--meaning-mode", isMeaningFamilyMode());
    gameRoot.classList.toggle("game--voice-mode", isVoiceMode());
  }
  updateLevelCloseLabel();
  if (state.useKeypad) {
    toneInput.setAttribute("inputmode", "none");
    toneInput.setAttribute("readonly", "readonly");
    toneInput.setAttribute("tabindex", "-1");
    toneInput.blur();
  } else {
    toneInput.setAttribute("inputmode", "numeric");
    toneInput.removeAttribute("readonly");
    toneInput.removeAttribute("tabindex");
  }
  updateInputEnabled();
}

function updateLevelCloseLabel() {
  if (!levelCloseBtn) {
    return;
  }
  if (HANNES_MODE && isPortraitLike()) {
    levelCloseBtn.textContent = "×";
    levelCloseBtn.setAttribute("aria-label", "Close");
    levelCloseBtn.classList.add("level-close--compact");
  } else {
    levelCloseBtn.textContent = "Close";
    levelCloseBtn.removeAttribute("aria-label");
    levelCloseBtn.classList.remove("level-close--compact");
  }
}

function updateInputEnabled() {
  if (state.useImagePad) {
    toneInput.setAttribute("disabled", "disabled");
  } else if (state.useKeypad) {
    toneInput.setAttribute("disabled", "disabled");
  } else if (state.running) {
    toneInput.removeAttribute("disabled");
  } else {
    toneInput.setAttribute("disabled", "disabled");
  }
  keypadButtons.forEach((button) => {
    button.disabled = !state.running || !state.useKeypad || state.useImagePad;
  });
  if (backspaceBtn) {
    backspaceBtn.disabled = !state.running || !state.useKeypad || state.useImagePad;
  }
  imagePadButtons.forEach((button) => {
    button.disabled = !state.useImagePad;
  });
  if (replayBtn) {
    replayBtn.disabled = state.toneMode === "vis" || (state.running && isVoiceMode());
  }
  updateInputVisibility();
  updateLevelPickerButton();
}

function updateInputVisibility() {
  const showImages = state.useImagePad && !isVoiceMode();
  const hideTextInput = showImages || isVoiceMode();
  if (toneInput) {
    toneInput.hidden = hideTextInput;
  }
  if (backspaceBtn) {
    backspaceBtn.hidden = hideTextInput;
  }
  if (keypad) {
    keypad.hidden = hideTextInput || !state.useKeypad;
  }
  if (imagePad) {
    imagePad.hidden = !showImages;
  }
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
    clearDrop(match, { selectedTones: cleaned, inputMethod: "typing" });
    toneInput.value = "";
    clearInputTimer();
    focusInput();
  } else if (shouldTrackUnmatchedToneInput(cleaned)) {
    recordIncorrectAnswer(cleaned, "typing");
  }
}

function handleImageEntry(tones) {
  if (!state.running) {
    return;
  }
  const match = findMatch(tones);
  if (match) {
    clearDrop(match, { selectedTones: tones, inputMethod: "image-pad" });
  } else {
    recordIncorrectAnswer(tones, "image-pad");
  }
}

function appendDigit(digit) {
  if (!state.running) {
    return;
  }
  if (state.useImagePad) {
    return;
  }
  const currentValue = toneInput.value;
  const nextValue = sanitizeInput(`${currentValue}${digit}`);
  if (nextValue === currentValue) {
    return;
  }
  toneInput.value = nextValue;
  handleToneValue(nextValue);
}

function handleBackspace() {
  if (!state.running) {
    return;
  }
  if (state.useImagePad) {
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

function getActiveWordPool() {
  if (isMeaningFamilyMode()) {
    return ensureMeaningSet().entries;
  }
  return state.wordPool;
}

function randomEntry() {
  const pool = getActiveWordPool();
  if (!pool.length) {
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnDrop() {
  if (drops.length > 18 || !getActiveWordPool().length) {
    return;
  }
  const entry = randomEntry();
  if (!entry) {
    return;
  }
  const isVis = state.toneMode === "vis";
  const isVoice = isVoiceMode();
  const voiceSize = isVoice ? computeVoiceDropSize() : null;
  const size = isVis ? state.visTileSize || 72 : isVoice ? voiceSize.width : null;
  const radius = isVis ? size / 2 : isVoice ? voiceSize.height / 2 : 24 + Math.random() * 14;
  const margin = radius + 12;
  const x = margin + Math.random() * Math.max(0, state.width - margin * 2);
  const y = -radius - Math.random() * 40;
  const { speed } = difficulty();
  const drop = {
    id: nextDropId++,
    text: entry.text,
    tones: entry.tones,
    sv: entry.sv,
    meaning: entry.meaning ?? null,
    familyId: entry.familyId ?? null,
    familyLabel: entry.familyLabel ?? null,
    spawnedAt: Date.now(),
    spawnedAtMs: performance.now(),
    reviewAttemptCount: 0,
    x,
    y,
    radius,
    size,
    cardWidth: voiceSize?.width ?? null,
    cardHeight: voiceSize?.height ?? null,
    renderMode: isVis ? "vis" : isVoice ? "voice-meaning" : "raindrop",
    image: isVis ? getToneImage(entry.tones) : isMeaningFamilyMode() ? getMeaningImage(entry) : null,
    speed: speed + Math.random() * 20,
  };
  drops.push(drop);
  lastSpoken = drop;
  if (!isVis && !isVoiceMode()) {
    speak(drop.text);
  }
}

function startGame() {
  if (state.running) {
    return;
  }
  if (!getActiveWordPool().length) {
    setStatus("No words loaded for this level.");
    return;
  }
  if (
    state.toneMode === "shuffle" &&
    !state.running &&
    state.score === 0 &&
    drops.length === 0
  ) {
    shuffleImagePadOrder();
  }
  if (isMeaningFamilyMode()) {
    ensureMeaningSet();
    state.meaningSetChangeAt = 0;
  }
  hideBird();
  hudEl?.removeAttribute("hidden");
  inputPanelTextEl?.removeAttribute("hidden");
  gameRoot?.classList.remove("game--final-reveal");
  state.running = true;
  state.gameOver = false;
  state.runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  state.lastFrame = 0;
  state.lastSpawn = performance.now();
  gameRoot?.classList.add("game--running");
  statusEl.setAttribute("hidden", "hidden");
  levelSelect.disabled = true;
  updateInputEnabled();
  setStatus(
    state.pauseUsed
      ? "Resumed. Paused runs do not count for highscores or unlocks."
      : isVoiceMode()
        ? "Drops incoming... say the matching word."
        : isMeaningMode()
        ? "Drops incoming... tap the matching meaning."
        : "Drops incoming... type the tone numbers."
  );
  startBtn.textContent = "Pause";
  if (isVoiceMode()) {
    startVoiceInput();
  }
  focusInput();
  requestAnimationFrame(tick);
}

function pauseGame() {
  state.running = false;
  state.pauseUsed = true;
  stopVoiceInput();
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
  stopVoiceInput();
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
  let unlockedLevel = null;
  let unlockedAny = false;
  const mode = getUnlockMode();
  const nextLevel = getNextLevel(state.levelId, mode);

  if (
    nextLevel &&
    !isLevelUnlocked(nextLevel.id, mode) &&
    state.score >= getLevelUnlockScore(nextLevel, mode)
  ) {
    if (nextLevel.id === "1-44" && !areAllPreviousUnlocked(nextLevel.id, mode)) {
      return null;
    }
    unlockedAny = unlockUpToLevel(nextLevel.id, mode) || unlockedAny;
    unlockedLevel = nextLevel;
  }

  const unlockedSet =
    getUnlockedSetForMode(mode);
  if (unlockedSet.has("4x")) {
    unlockedAny = unlockLevel("x1", mode) || unlockedAny;
    unlockedAny = unlockLevel("1-44-super-slow", mode) || unlockedAny;
    unlockedAny = unlockLevel("1-44-slow", mode) || unlockedAny;
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
  const highscores = getHighscoresForMode();
  const previousHigh = getHighScore(state.levelId);
  const previousMedals = getMedalTierIds(previousHigh);
  let isHighScore = false;
  if (state.score > previousHigh) {
    highscores[state.levelId] = state.score;
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
  stopVoiceInput();
  state.gameOver = true;
  state.finalReveal = false;
  clearInputTimer();
  toneInput.value = "";
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

function addReveal(x, y, tones, size, duration = 0.9, image = null) {
  reveals.push({
    x,
    y,
    tones,
    display: formatToneString(tones),
    size,
    life: 0,
    duration,
    image,
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
  stopVoiceInput();
  clearInputTimer();
  gameRoot?.classList.remove("game--running");
  gameRoot?.classList.add("game--final-reveal");
  updateInputEnabled();
  statusEl.setAttribute("hidden", "hidden");
  hudEl?.setAttribute("hidden", "hidden");
  inputPanelTextEl?.setAttribute("hidden", "hidden");

  const remainingDrops = drops.splice(0, drops.length);
  remainingDrops.forEach((drop) => {
    const revealImage = shouldUseImageReveals()
      ? drop.image || getToneImage(drop.tones)
      : null;
    addReveal(
      drop.x,
      Math.min(state.safeBottom - 12, drop.y),
      drop.tones,
      Math.max(16, drop.radius * 0.7),
      0.5,
      revealImage
    );
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

function clearDrop(
  drop,
  { selectedTones = drop.tones, inputMethod = "unknown", voicePrediction = null } = {}
) {
  const index = drops.indexOf(drop);
  if (index === -1) {
    return;
  }
  recordReview(drop, "correct", { selectedTones, inputMethod, voicePrediction });
  drops.splice(index, 1);
  state.score += 1;
  updateHud();
  addSplash(drop.x, drop.y, drop.radius + 6);
  addTranslation(drop.x, drop.y, drop.sv, drop.radius);
  queueMeaningSetChange();
}

function playVoiceMissFeedback(drop) {
  if (!isVoiceMode() || !drop?.text) {
    return;
  }
  lastSpoken = drop;
  suppressVoiceFeedbackRecognition();
  speak(drop.text, { force: true, allowDuringVoiceGame: true });
}

function missDrop(drop) {
  const index = drops.indexOf(drop);
  if (index === -1) {
    return;
  }
  recordReview(drop, "missed", { selectedTones: null, inputMethod: "timeout" });
  drops.splice(index, 1);
  state.lives -= 1;
  updateHud();
  playVoiceMissFeedback(drop);
  const revealDuration = state.lives <= 0 ? 0.5 : 0.9;
  const revealImage = shouldUseImageReveals()
    ? drop.image || getToneImage(drop.tones)
    : null;
  addReveal(
    drop.x,
    Math.min(state.safeBottom - 12, drop.y),
    drop.tones,
    Math.max(16, drop.radius * 0.7),
    revealDuration,
    revealImage
  );
  if (state.lives <= 0) {
    startFinalReveal();
  } else {
    queueMeaningSetChange();
    setStatus(`Missed: ${formatToneString(drop.tones)}`);
  }
}

function findMatch(tones) {
  const matches = findMatches(tones);
  if (!matches.length) {
    return null;
  }
  return matches.reduce((closest, drop) => (drop.y > closest.y ? drop : closest));
}

function findMatches(tones) {
  return drops.filter((drop) => drop.tones === tones);
}

function findReviewTarget() {
  if (!drops.length) {
    return null;
  }
  return drops.reduce((closest, drop) => (drop.y > closest.y ? drop : closest));
}

function shouldTrackUnmatchedToneInput(tones) {
  if (!drops.length) {
    return false;
  }
  const lengths = drops.map((drop) => drop.tones.length);
  const maxLength = Math.max(...lengths);
  if (maxLength > 1 && tones.length < 2) {
    return false;
  }
  return tones.length >= Math.min(maxLength, 2);
}

function recordIncorrectAnswer(selectedTones, inputMethod, { voicePrediction = null } = {}) {
  const target = findReviewTarget();
  if (!target) {
    return;
  }
  recordReview(target, "incorrect", { selectedTones, inputMethod, voicePrediction });
}

function drawDrop(drop) {
  if (drop.renderMode === "vis") {
    drawVisDrop(drop);
    return;
  }
  if (drop.renderMode === "voice-meaning") {
    drawVoiceMeaningDrop(drop);
    return;
  }
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

function computeVoiceDropSize() {
  if (state.width < 380) {
    return { width: 78, height: 104 };
  }
  if (state.width < 520) {
    return { width: 86, height: 112 };
  }
  return { width: 96, height: 124 };
}

function drawImageCover(image, x, y, width, height) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (sourceRatio > targetRatio) {
    sourceWidth = sourceHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = sourceWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function fitCanvasText(text, maxWidth, fontSize, weight = 700) {
  ctx.save();
  let next = text || "";
  ctx.font = `${weight} ${fontSize}px "Fira Sans", "Noto Sans SC", sans-serif`;
  if (ctx.measureText(next).width <= maxWidth) {
    ctx.restore();
    return next;
  }
  while (next.length > 1 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  ctx.restore();
  return `${next}...`;
}

function fitCanvasTextLines(text, maxWidth, fontSize, maxLines = 2) {
  ctx.save();
  ctx.font = `700 ${fontSize}px "Fira Sans", "Noto Sans SC", sans-serif`;
  const lines = wrapLines(text || "", fontSize, maxWidth);
  ctx.restore();
  if (lines.length <= maxLines) {
    return lines;
  }
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = fitCanvasText(kept[maxLines - 1], maxWidth, fontSize, 700);
  return kept;
}

function drawVoiceMeaningDrop(drop) {
  const width = drop.cardWidth || computeVoiceDropSize().width;
  const height = drop.cardHeight || computeVoiceDropSize().height;
  const left = drop.x - width / 2;
  const top = drop.y - height / 2;
  const image = drop.image;
  const imageLeft = left + VOICE_DROP_PADDING;
  const imageTop = top + VOICE_DROP_PADDING;
  const imageWidth = width - VOICE_DROP_PADDING * 2;
  const imageHeight = height - VOICE_DROP_LABEL_HEIGHT - VOICE_DROP_PADDING * 2;
  const labelCenterY = top + height - VOICE_DROP_LABEL_HEIGHT / 2 - 1;
  const labelMaxWidth = width - VOICE_DROP_PADDING * 2;
  const labelLines = fitCanvasTextLines(drop.sv || drop.meaning || "", labelMaxWidth, 12, 2);

  ctx.save();
  roundedRectPath(ctx, left, top, width, height, VOICE_DROP_RADIUS);
  ctx.fillStyle = "rgba(8, 54, 69, 0.82)";
  ctx.fill();
  ctx.strokeStyle = "rgba(145, 229, 246, 0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (image && image.complete && image.naturalWidth) {
    ctx.save();
    roundedRectPath(ctx, imageLeft, imageTop, imageWidth, imageHeight, VOICE_DROP_RADIUS - 3);
    ctx.clip();
    drawImageCover(image, imageLeft, imageTop, imageWidth, imageHeight);
    ctx.restore();
  } else {
    ctx.fillStyle = "rgba(145, 229, 246, 0.18)";
    roundedRectPath(ctx, imageLeft, imageTop, imageWidth, imageHeight, VOICE_DROP_RADIUS - 3);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(232, 247, 251, 0.96)";
  ctx.font = `700 12px "Fira Sans", "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineHeight = 12.5;
  const firstLineY = labelCenterY - ((labelLines.length - 1) * lineHeight) / 2;
  labelLines.forEach((line, index) => {
    ctx.fillText(fitCanvasText(line, labelMaxWidth, 12, 700), drop.x, firstLineY + index * lineHeight);
  });
  ctx.restore();
}

function drawVisDrop(drop) {
  const size = drop.size || 72;
  const half = size / 2;
  const left = drop.x - half;
  const top = drop.y - half;
  const image = drop.image;

  ctx.save();
  roundedRectPath(ctx, left, top, size, size, VIS_DROP_RADIUS);
  ctx.fillStyle = "rgba(8, 54, 69, 0.7)";
  ctx.fill();
  ctx.strokeStyle = "rgba(145, 229, 246, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  if (image && image.complete && image.naturalWidth) {
    const inner = size - VIS_DROP_PADDING * 2;
    const innerLeft = left + VIS_DROP_PADDING;
    const innerTop = top + VIS_DROP_PADDING;
    const innerRadius = Math.max(2, VIS_DROP_RADIUS - VIS_DROP_PADDING);
    ctx.save();
    roundedRectPath(ctx, innerLeft, innerTop, inner, inner, innerRadius);
    ctx.clip();
    ctx.drawImage(image, innerLeft, innerTop, inner, inner);
    ctx.restore();
  } else if (image && !image.complete) {
    image.addEventListener("load", () => {}, { once: true });
  }
  ctx.restore();
}

function roundedRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
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

    if (reveal.image) {
      drawRevealImage(reveal, y, alpha);
    }

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

function drawRevealImage(reveal, y, alpha) {
  const size = Math.max(48, reveal.size * 2.6);
  const half = size / 2;
  const left = reveal.x - half;
  const top = y - half;
  const image = reveal.image;
  const radius = Math.min(VIS_DROP_RADIUS, size / 4);

  ctx.save();
  ctx.globalAlpha = alpha;
  roundedRectPath(ctx, left, top, size, size, radius);
  ctx.fillStyle = "rgba(8, 54, 69, 0.7)";
  ctx.fill();
  ctx.strokeStyle = "rgba(145, 229, 246, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();
  if (image && image.complete && image.naturalWidth) {
    const inner = size - VIS_DROP_PADDING * 2;
    const innerLeft = left + VIS_DROP_PADDING;
    const innerTop = top + VIS_DROP_PADDING;
    const innerRadius = Math.max(2, radius - VIS_DROP_PADDING);
    ctx.save();
    roundedRectPath(ctx, innerLeft, innerTop, inner, inner, innerRadius);
    ctx.clip();
    ctx.drawImage(image, innerLeft, innerTop, inner, inner);
    ctx.restore();
  }
  ctx.restore();
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

  maybeAdvanceMeaningSet(timestamp);

  const { spawn } = difficulty();
  const waitingForMeaningSetChange =
    isMeaningFamilyMode() && !drops.length && Boolean(state.meaningSetChangeAt);
  if (!waitingForMeaningSetChange && timestamp - state.lastSpawn > spawn) {
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
  if (state.toneMode === "vis" || isVoiceMode()) {
    return;
  }
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
  if (state.useImagePad) {
    return;
  }
  handleToneValue(toneInput.value);
});

replayBtn.addEventListener("click", () => {
  if (state.toneMode === "vis" || (state.running && isVoiceMode())) {
    return;
  }
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

toneModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setToneMode(button.dataset.mode);
  });
});

if (levelPickerBtn) {
  levelPickerBtn.addEventListener("click", () => {
    if (levelPickerBtn.disabled) {
      return;
    }
    openLevelOverlay();
  });
}

if (levelSelect) {
  levelSelect.addEventListener("change", () => {
    const selected = levelSelect.value;
    const mode = getUnlockMode();
    if (!isLevelSelectable(selected, mode)) {
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

if (medalRowEl) {
  medalRowEl.addEventListener("click", () => {
    if (levelSelect.disabled) {
      return;
    }
    openLevelOverlay();
  });
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

configureToneModeButtons();
renderImagePad();
resizeCanvas();
renderLevelOptions();
updateToneLabels();
const initialLevel =
  progress.lastLevel && isLevelUnlocked(progress.lastLevel, "numbers")
    ? progress.lastLevel
    : LEVELS[0].id;
const initialMode = getUnlockMode();
const initialModeLevels = getLevelsForMode(initialMode);
const initialModeLevel =
  initialModeLevels.find((level) => isLevelUnlocked(level.id, initialMode)) ||
  initialModeLevels[0] ||
  LEVELS[0];
setLevel(
  state.toneMode === "images" || state.toneMode === "vis" || isMeaningFamilyMode()
    ? initialModeLevel.id
    : initialLevel,
  {
  announce: false,
  }
);
resetGame();
updateHud();
updateHighScore();
