import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tuyatuvsfunbjeonbuwq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0V9d3aa8SD7b_Ako0TFHsQ_p_IHBggg";
const BUCKET = "voice-samples";
const TABLE = "voice_samples";
const DEFAULT_SYLLABLE = "bao";
const RECORDING_MS = 1450;
const POST_PROMPT_DELAY_MS = 320;
const PITCH_VERSION = 1;

const TONE_SETS = [
  {
    id: "ma",
    label: "ma",
    entries: [
      { tone: "1", character: "妈", pinyin: "ma1", meaning: "mother", image: "meaning_images/mother.jpg" },
      { tone: "2", character: "麻", pinyin: "ma2", meaning: "hemp", image: "meaning_images/hemp.jpg" },
      { tone: "3", character: "马", pinyin: "ma3", meaning: "horse", image: "meaning_images/horse.jpg" },
      { tone: "4", character: "骂", pinyin: "ma4", meaning: "scold", image: "meaning_images/scold.jpg" },
    ],
  },
  {
    id: "yi",
    label: "yi",
    entries: [
      { tone: "1", character: "衣", pinyin: "yi1", meaning: "clothes", image: "meaning_images/clothes.jpg" },
      { tone: "2", character: "姨", pinyin: "yi2", meaning: "aunt", image: "meaning_images/aunt.jpg" },
      { tone: "3", character: "椅", pinyin: "yi3", meaning: "chair", image: "meaning_images/chair.jpg" },
      { tone: "4", character: "亿", pinyin: "yi4", meaning: "100 million", image: "meaning_images/fortune.jpg" },
    ],
  },
  {
    id: "shi",
    label: "shi",
    entries: [
      { tone: "1", character: "师", pinyin: "shi1", meaning: "teacher", image: "meaning_images/teacher.jpg" },
      { tone: "2", character: "十", pinyin: "shi2", meaning: "ten", image: "meaning_images/ten.jpg" },
      { tone: "3", character: "史", pinyin: "shi3", meaning: "history", image: "meaning_images/history.jpg" },
      { tone: "4", character: "是", pinyin: "shi4", meaning: "is", image: "meaning_images/is.jpg" },
    ],
  },
  {
    id: "ba",
    label: "ba",
    entries: [
      { tone: "1", character: "八", pinyin: "ba1", meaning: "eight", image: "meaning_images/eight.jpg" },
      { tone: "2", character: "拔", pinyin: "ba2", meaning: "pull", image: "meaning_images/pull.jpg" },
      { tone: "3", character: "把", pinyin: "ba3", meaning: "hold", image: "meaning_images/hold.jpg" },
      { tone: "4", character: "爸", pinyin: "ba4", meaning: "dad", image: "meaning_images/dad.jpg" },
    ],
  },
  {
    id: "bao",
    label: "bao",
    entries: [
      { tone: "1", character: "包", pinyin: "bao1", meaning: "package", image: "meaning_images/package.jpg" },
      { tone: "2", character: "薄", pinyin: "bao2", meaning: "thin", image: "meaning_images/thin.jpg" },
      { tone: "3", character: "宝", pinyin: "bao3", meaning: "treasure", image: "meaning_images/treasure.jpg" },
      { tone: "4", character: "抱", pinyin: "bao4", meaning: "hug", image: "meaning_images/hug.jpg" },
    ],
  },
  {
    id: "qi",
    label: "qi",
    entries: [
      { tone: "1", character: "七", pinyin: "qi1", meaning: "seven", image: "meaning_images/seven.jpg" },
      { tone: "2", character: "旗", pinyin: "qi2", meaning: "flag", image: "meaning_images/flag.jpg" },
      { tone: "3", character: "起", pinyin: "qi3", meaning: "rise", image: "meaning_images/rise.jpg" },
      { tone: "4", character: "气", pinyin: "qi4", meaning: "air", image: "meaning_images/air.jpg" },
    ],
  },
  {
    id: "tang",
    label: "tang",
    entries: [
      { tone: "1", character: "汤", pinyin: "tang1", meaning: "soup", image: "meaning_images/soup.jpg" },
      { tone: "2", character: "糖", pinyin: "tang2", meaning: "sugar", image: "meaning_images/sugar.jpg" },
      { tone: "3", character: "躺", pinyin: "tang3", meaning: "lie down", image: "meaning_images/lie-down.jpg" },
      { tone: "4", character: "烫", pinyin: "tang4", meaning: "hot", image: "meaning_images/hot.jpg" },
    ],
  },
  {
    id: "yan",
    label: "yan",
    entries: [
      { tone: "1", character: "烟", pinyin: "yan1", meaning: "smoke", image: "meaning_images/smoke.jpg" },
      { tone: "2", character: "盐", pinyin: "yan2", meaning: "salt", image: "meaning_images/salt.jpg" },
      { tone: "3", character: "眼", pinyin: "yan3", meaning: "eye", image: "meaning_images/eye.jpg" },
      { tone: "4", character: "燕", pinyin: "yan4", meaning: "swallow", image: "meaning_images/swallow.jpg" },
    ],
  },
];
const TONE_SETS_BY_ID = Object.fromEntries(TONE_SETS.map((set) => [set.id, set]));

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const collectorTitle = document.getElementById("collectorTitle");
const syllableSelect = document.getElementById("syllableSelect");
const targetImage = document.getElementById("targetImage");
const targetCharacter = document.getElementById("targetCharacter");
const targetPinyin = document.getElementById("targetPinyin");
const targetMeaning = document.getElementById("targetMeaning");
const pitchCanvas = document.getElementById("pitchCanvas");
const pitchCtx = pitchCanvas.getContext("2d");
const levelMeter = document.getElementById("levelMeter");
const statusText = document.getElementById("statusText");
const failedDownload = document.getElementById("failedDownload");
const startBtn = document.getElementById("startBtn");
const recordOnceBtn = document.getElementById("recordOnceBtn");
const predictBtn = document.getElementById("predictBtn");
const replayBtn = document.getElementById("replayBtn");
const skipBtn = document.getElementById("skipBtn");
const modelStatus = document.getElementById("modelStatus");
const predictionResult = document.getElementById("predictionResult");
const predictionScores = document.getElementById("predictionScores");
const actualTonePanel = document.getElementById("actualTonePanel");
const actualToneButtons = Array.from(document.querySelectorAll(".actual-tone-btn"));
const countEls = {
  "1": document.getElementById("count1"),
  "2": document.getElementById("count2"),
  "3": document.getElementById("count3"),
  "4": document.getElementById("count4"),
};
const countLabelEls = {
  "1": document.getElementById("countLabel1"),
  "2": document.getElementById("countLabel2"),
  "3": document.getElementById("countLabel3"),
  "4": document.getElementById("countLabel4"),
};
const initialToneSet = getInitialToneSet();

const state = {
  running: false,
  busy: false,
  stream: null,
  audioContext: null,
  analyser: null,
  analyserBuffer: null,
  mediaRecorder: null,
  pitchTimer: null,
  frames: [],
  toneSet: initialToneSet,
  currentTarget: initialToneSet.entries[0],
  lastTarget: null,
  targetQueue: [],
  zhVoice: null,
  model: null,
  pendingPrediction: null,
  stats: loadStats(initialToneSet.id),
  sessionId: getSessionId(),
};

renderToneSetOptions();
renderTarget(state.currentTarget);
renderStats();
renderToneLabels();
drawPitch([]);
loadVoices();
refreshModel();

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

startBtn.addEventListener("click", () => {
  if (state.running) {
    stopAuto();
    return;
  }
  startAuto();
});

recordOnceBtn.addEventListener("click", () => {
  if (!state.busy) {
    collectOne({ reuseTarget: true });
  }
});

predictBtn.addEventListener("click", () => {
  if (!state.busy) {
    testPrediction();
  }
});

replayBtn.addEventListener("click", () => {
  playReference(state.currentTarget);
});

skipBtn.addEventListener("click", () => {
  if (!state.busy) {
    state.currentTarget = nextTarget();
    renderTarget(state.currentTarget);
    setStatus(`Skipped. Next: ${state.currentTarget.pinyin}.`);
  }
});

syllableSelect.addEventListener("change", () => {
  if (state.busy || state.running) {
    syllableSelect.value = state.toneSet.id;
    setStatus("Stop the current recording before changing word group.");
    return;
  }
  setToneSet(syllableSelect.value);
});

actualToneButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!state.busy) {
      logPredictionFeedback(button.dataset.tone);
    }
  });
});

function getInitialToneSet() {
  const stored = localStorage.getItem("toneVoiceCollector.syllable.v1");
  return TONE_SETS_BY_ID[stored] || TONE_SETS_BY_ID[DEFAULT_SYLLABLE] || TONE_SETS[0];
}

function currentTargets() {
  return state.toneSet.entries;
}

function currentTargetsByTone() {
  return Object.fromEntries(currentTargets().map((target) => [target.tone, target]));
}

function targetForTone(tone) {
  return currentTargetsByTone()[String(tone)];
}

function pinyinForTone(tone) {
  return targetForTone(tone)?.pinyin || `${state.toneSet.id}${tone}`;
}

function getSessionId() {
  const key = "toneVoiceCollector.sessionId.v1";
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}

function emptyStats() {
  return { "1": 0, "2": 0, "3": 0, "4": 0 };
}

function loadStats(syllable) {
  try {
    const parsed = JSON.parse(localStorage.getItem("toneVoiceCollector.stats.v2") || "{}");
    if (parsed[syllable]) {
      return { ...emptyStats(), ...parsed[syllable] };
    }
  } catch {
    return emptyStats();
  }
  if (syllable === DEFAULT_SYLLABLE) {
    try {
      const legacy = JSON.parse(localStorage.getItem("toneVoiceCollector.stats.v1") || "{}");
      return { ...emptyStats(), ...legacy };
    } catch {
      return emptyStats();
    }
  }
  return emptyStats();
}

function saveStats() {
  let parsed = {};
  try {
    parsed = JSON.parse(localStorage.getItem("toneVoiceCollector.stats.v2") || "{}");
  } catch {
    parsed = {};
  }
  parsed[state.toneSet.id] = state.stats;
  localStorage.setItem("toneVoiceCollector.stats.v2", JSON.stringify(parsed));
}

function renderToneSetOptions() {
  syllableSelect.innerHTML = "";
  TONE_SETS.forEach((set, index) => {
    const option = document.createElement("option");
    option.value = set.id;
    option.textContent = `${index + 1}. ${set.label}`;
    syllableSelect.append(option);
  });
  syllableSelect.value = state.toneSet.id;
}

function renderStats() {
  Object.entries(countEls).forEach(([tone, el]) => {
    el.textContent = String(state.stats[tone] || 0);
  });
}

function renderToneLabels() {
  collectorTitle.textContent = `${state.toneSet.label} collector`;
  actualToneButtons.forEach((button) => {
    button.textContent = pinyinForTone(button.dataset.tone);
  });
  Object.entries(countLabelEls).forEach(([tone, el]) => {
    el.textContent = pinyinForTone(tone);
  });
  if (!state.pendingPrediction) {
    predictionResult.querySelector(".prediction-result__tone").textContent = "-";
    predictionResult.querySelector(
      ".prediction-result__meta"
    ).textContent = `Tap Test predict and say one ${state.toneSet.label} word.`;
    predictionScores.innerHTML = "";
  }
}

function setStatus(message) {
  statusText.textContent = message;
}

function renderTarget(target) {
  targetImage.src = target.image;
  targetImage.alt = target.meaning;
  targetCharacter.textContent = target.character;
  targetPinyin.textContent = target.pinyin;
  targetMeaning.textContent = target.meaning;
}

function setActualTonePanelVisible(visible) {
  actualTonePanel.hidden = !visible;
}

function setToneSet(toneSetId) {
  const nextSet = TONE_SETS_BY_ID[toneSetId];
  if (!nextSet || nextSet.id === state.toneSet.id) {
    syllableSelect.value = state.toneSet.id;
    return;
  }
  state.toneSet = nextSet;
  localStorage.setItem("toneVoiceCollector.syllable.v1", nextSet.id);
  state.stats = loadStats(nextSet.id);
  state.currentTarget = nextSet.entries[0];
  state.lastTarget = null;
  state.targetQueue = [];
  state.model = null;
  state.pendingPrediction = null;
  syllableSelect.value = nextSet.id;
  setActualTonePanelVisible(false);
  renderTarget(state.currentTarget);
  renderStats();
  renderToneLabels();
  drawPitch([]);
  setStatus(`Ready for ${nextSet.label}.`);
  refreshModel();
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nextTarget() {
  if (!state.targetQueue.length) {
    state.targetQueue = shuffled(currentTargets());
  }
  return state.targetQueue.shift() || currentTargets()[0];
}

async function startAuto() {
  state.running = true;
  startBtn.textContent = "Stop";
  recordOnceBtn.disabled = true;
  predictBtn.disabled = true;
  skipBtn.disabled = true;
  try {
    await ensureMic();
    while (state.running) {
      await collectOne();
      await delay(550);
    }
  } finally {
    state.running = false;
    state.busy = false;
    startBtn.textContent = "Start auto";
    recordOnceBtn.disabled = false;
    predictBtn.disabled = false;
    skipBtn.disabled = false;
  }
}

function stopAuto() {
  state.running = false;
  startBtn.textContent = "Stopping...";
}

async function collectOne({ reuseTarget = false } = {}) {
  if (state.busy) {
    return;
  }
  state.busy = true;
  failedDownload.hidden = true;
  failedDownload.removeAttribute("href");
  try {
    await ensureMic();
    const target = reuseTarget ? state.currentTarget : nextTarget();
    state.currentTarget = target;
    state.lastTarget = target;
    renderTarget(target);
    setStatus(`Listen: ${target.pinyin}.`);
    await playReference(target);
    await delay(POST_PROMPT_DELAY_MS);
    setStatus(`Recording ${target.pinyin}...`);
    const sample = await recordAudio(target);
    setStatus(`Uploading ${target.pinyin}...`);
    await uploadSample(sample);
    state.stats[target.tone] = (state.stats[target.tone] || 0) + 1;
    saveStats();
    renderStats();
    setStatus(`Uploaded ${target.pinyin}.`);
  } catch (error) {
    console.error(error);
    setStatus(`Upload/setup error: ${error.message || error}`);
  } finally {
    state.busy = false;
  }
}

async function testPrediction() {
  state.busy = true;
  predictBtn.disabled = true;
  setActualTonePanelVisible(false);
  state.pendingPrediction = null;
  failedDownload.hidden = true;
  failedDownload.removeAttribute("href");
  try {
    await ensureMic();
    setStatus("Recording test sample...");
    const sample = await recordAudio(state.currentTarget);
    const prediction = predictTone(sample.frames);
    state.pendingPrediction = { sample, prediction };
    renderPrediction(prediction);
    setActualTonePanelVisible(true);
    setStatus(
      `Predicted ${pinyinForTone(prediction.tone)} (${Math.round(
        prediction.confidence * 100
      )}%). Mark what you actually said.`
    );
  } catch (error) {
    console.error(error);
    setStatus(`Prediction error: ${error.message || error}`);
  } finally {
    state.busy = false;
    predictBtn.disabled = false;
  }
}

async function logPredictionFeedback(actualTone) {
  if (!state.pendingPrediction) {
    return;
  }
  const actualTarget = targetForTone(actualTone);
  if (!actualTarget) {
    return;
  }
  state.busy = true;
  actualToneButtons.forEach((button) => {
    button.disabled = true;
  });
  try {
    const { sample, prediction } = state.pendingPrediction;
    setStatus(`Logging actual ${actualTarget.pinyin}...`);
    await uploadSample(sample, {
      actualTarget,
      status: "prediction_eval",
      prediction,
    });
    state.pendingPrediction = null;
    setActualTonePanelVisible(false);
    setStatus(
      prediction.tone === actualTone
        ? `Logged: correct ${actualTarget.pinyin}.`
        : `Logged: predicted ${pinyinForTone(prediction.tone)}, actual ${actualTarget.pinyin}.`
    );
    await refreshModel();
  } catch (error) {
    console.error(error);
    setStatus(`Could not log feedback: ${error.message || error}`);
  } finally {
    actualToneButtons.forEach((button) => {
      button.disabled = false;
    });
    state.busy = false;
  }
}

async function ensureMic() {
  if (state.stream) {
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support microphone capture.");
  }
  state.stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  state.audioContext = new AudioContext();
  const source = state.audioContext.createMediaStreamSource(state.stream);
  state.analyser = state.audioContext.createAnalyser();
  state.analyser.fftSize = 2048;
  state.analyser.smoothingTimeConstant = 0;
  state.analyserBuffer = new Float32Array(state.analyser.fftSize);
  source.connect(state.analyser);
}

function getRecorderMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function extensionForMime(mimeType) {
  if (mimeType.includes("mp4")) {
    return "m4a";
  }
  if (mimeType.includes("ogg")) {
    return "ogg";
  }
  if (mimeType.includes("wav")) {
    return "wav";
  }
  return "webm";
}

function recordAudio(target) {
  return new Promise((resolve, reject) => {
    const mimeType = getRecorderMimeType();
    const chunks = [];
    const startedAt = performance.now();
    const sampleId = crypto.randomUUID();
    const recorder = new MediaRecorder(
      state.stream,
      mimeType ? { mimeType } : undefined
    );
    state.mediaRecorder = recorder;
    state.frames = [];
    startPitchCapture(startedAt);

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size) {
        chunks.push(event.data);
      }
    });

    recorder.addEventListener("error", () => {
      stopPitchCapture();
      reject(new Error("Recording failed."));
    });

    recorder.addEventListener("stop", () => {
      stopPitchCapture();
      const durationMs = Math.round(performance.now() - startedAt);
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      if (!blob.size) {
        reject(new Error("Recorded audio was empty."));
        return;
      }
      resolve({
        id: sampleId,
        target,
        blob,
        durationMs,
        mimeType: blob.type || recorder.mimeType || mimeType || "audio/webm",
        frames: state.frames,
        sampleRate: state.audioContext?.sampleRate || null,
      });
    });

    recorder.start();
    window.setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, RECORDING_MS);
  });
}

function startPitchCapture(startedAt) {
  stopPitchCapture();
  state.pitchTimer = window.setInterval(() => {
    if (!state.analyser || !state.analyserBuffer || !state.audioContext) {
      return;
    }
    state.analyser.getFloatTimeDomainData(state.analyserBuffer);
    const estimate = estimatePitch(state.analyserBuffer, state.audioContext.sampleRate);
    const frame = {
      t: Math.round(performance.now() - startedAt),
      pitchHz: estimate.pitchHz ? Math.round(estimate.pitchHz * 10) / 10 : null,
      rms: Math.round(estimate.rms * 10000) / 10000,
      clarity: Math.round(estimate.clarity * 1000) / 1000,
    };
    state.frames.push(frame);
    levelMeter.style.width = `${Math.min(100, Math.round(estimate.rms * 520))}%`;
    drawPitch(state.frames);
  }, 45);
}

function stopPitchCapture() {
  if (state.pitchTimer) {
    window.clearInterval(state.pitchTimer);
    state.pitchTimer = null;
  }
  levelMeter.style.width = "0%";
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
  return {
    pitchHz,
    rms,
    clarity,
  };
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

function drawPitch(frames) {
  const { width, height } = pitchCanvas;
  pitchCtx.clearRect(0, 0, width, height);
  pitchCtx.fillStyle = "rgba(2, 25, 35, 0.9)";
  pitchCtx.fillRect(0, 0, width, height);
  pitchCtx.strokeStyle = "rgba(232, 247, 251, 0.18)";
  pitchCtx.lineWidth = 1;
  for (let y = 20; y < height; y += 30) {
    pitchCtx.beginPath();
    pitchCtx.moveTo(0, y);
    pitchCtx.lineTo(width, y);
    pitchCtx.stroke();
  }

  const voiced = frames.filter((frame) => frame.pitchHz);
  if (!voiced.length) {
    return;
  }
  const maxT = Math.max(RECORDING_MS, frames[frames.length - 1]?.t || RECORDING_MS);
  const minPitch = 70;
  const maxPitch = 420;
  pitchCtx.strokeStyle = "#f5c451";
  pitchCtx.lineWidth = 3;
  pitchCtx.beginPath();
  let started = false;
  frames.forEach((frame) => {
    if (!frame.pitchHz) {
      started = false;
      return;
    }
    const x = (frame.t / maxT) * width;
    const clamped = Math.max(minPitch, Math.min(maxPitch, frame.pitchHz));
    const y = height - ((clamped - minPitch) / (maxPitch - minPitch)) * (height - 18) - 9;
    if (!started) {
      pitchCtx.moveTo(x, y);
      started = true;
    } else {
      pitchCtx.lineTo(x, y);
    }
  });
  pitchCtx.stroke();
}

async function uploadSample(
  sample,
  { actualTarget = sample.target, status = "uploaded", prediction = null } = {}
) {
  const ext = extensionForMime(sample.mimeType);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const folder = status === "prediction_eval" ? "prediction-evals" : "training";
  const syllable = state.toneSet.id;
  const storagePath = `${syllable}/${folder}/${state.sessionId}/${timestamp}_${actualTarget.pinyin}_${sample.id}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, sample.blob, {
      contentType: baseMimeType(sample.mimeType),
      upsert: false,
    });
  if (uploadError) {
    exposeFailedBlob(sample.blob, actualTarget);
    throw uploadError;
  }

  const metadata = {
    session_id: state.sessionId,
    client_sample_id: sample.id,
    syllable,
    target_tone: actualTarget.tone,
    character: actualTarget.character,
    pinyin: actualTarget.pinyin,
    meaning: actualTarget.meaning,
    storage_bucket: BUCKET,
    storage_path: storagePath,
    mime_type: sample.mimeType,
    duration_ms: sample.durationMs,
    size_bytes: sample.blob.size,
    audio_format: ext,
    sample_rate: sample.sampleRate,
    pitch_features: buildPitchFeatures(sample),
    predicted_tone: prediction?.tone ?? null,
    prediction_confidence: prediction ? Math.round(prediction.confidence * 1000) / 1000 : null,
    prediction_method: prediction?.method ?? null,
    prediction_scores: prediction?.scores ?? null,
    prediction_features: prediction?.features ?? null,
    is_prediction_correct: prediction ? prediction.tone === actualTarget.tone : null,
    user_agent: navigator.userAgent,
    device: {
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      devicePixelRatio: window.devicePixelRatio || 1,
      screen: {
        width: window.screen?.width || null,
        height: window.screen?.height || null,
      },
    },
    status,
  };

  const { error: insertError } = await supabase.from(TABLE).insert(metadata);
  if (insertError) {
    throw insertError;
  }
}

function buildPitchFeatures(sample) {
  const voiced = sample.frames.filter((frame) => frame.pitchHz);
  const pitches = voiced.map((frame) => frame.pitchHz);
  return {
    version: PITCH_VERSION,
    recordingMs: RECORDING_MS,
    frameCount: sample.frames.length,
    voicedFrameCount: voiced.length,
    meanPitchHz: mean(pitches),
    minPitchHz: pitches.length ? Math.min(...pitches) : null,
    maxPitchHz: pitches.length ? Math.max(...pitches) : null,
    firstPitchHz: pitches[0] || null,
    lastPitchHz: pitches[pitches.length - 1] || null,
    frames: sample.frames,
  };
}

async function refreshModel() {
  const syllable = state.toneSet.id;
  modelStatus.textContent = "Loading model...";
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("target_tone,pinyin,pitch_features,status")
      .eq("syllable", syllable)
      .limit(400);
    if (error) {
      throw error;
    }
    if (state.toneSet.id !== syllable) {
      return;
    }
    state.model = buildKnnModel(data || []);
    renderModelStatus();
  } catch (error) {
    console.warn("Could not load Supabase training data", error);
    if (state.toneSet.id !== syllable) {
      return;
    }
    state.model = null;
    modelStatus.textContent =
      "Using fallback contour heuristic. Run updated SQL to allow model training from collected samples.";
  }
}

function buildKnnModel(rows) {
  const samples = rows
    .map((row) => ({
      tone: String(row.target_tone),
      vector: contourVector(row.pitch_features?.frames || []),
    }))
    .filter((sample) => targetForTone(sample.tone) && sample.vector);
  const counts = countByTone(samples);
  if (!samples.length) {
    return {
      kind: "heuristic",
      samples,
      counts,
    };
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
    return {
      kind: "heuristic",
      samples,
      counts,
    };
  }
  const stats = vectorStats(vectors.map((sample) => sample.values));
  return {
    kind: "knn",
    counts,
    globalMedianPitch,
    stats,
    samples: vectors.map((sample) => ({
      tone: sample.tone,
      values: standardizeVector(sample.values, stats),
      contour: sample.vector.contour,
    })),
  };
}

function renderModelStatus() {
  if (!state.model || state.model.kind !== "knn") {
    const counts = state.model?.counts || {};
    modelStatus.textContent = `Using fallback contour heuristic. Readable samples: ${formatCounts(counts)}.`;
    return;
  }
  modelStatus.textContent = `Using kNN contour model. Samples: ${formatCounts(state.model.counts)}.`;
}

function formatCounts(counts) {
  return currentTargets().map((target) => `${target.pinyin}:${counts[target.tone] || 0}`).join(" ");
}

function countByTone(samples) {
  return samples.reduce((counts, sample) => {
    counts[sample.tone] = (counts[sample.tone] || 0) + 1;
    return counts;
  }, {});
}

function predictTone(frames) {
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
  if (state.model?.kind === "knn") {
    return predictWithKnn(vector, state.model);
  }
  return predictWithHeuristic(vector);
}

function predictWithKnn(vector, model) {
  const values = vectorValues(vector, model.globalMedianPitch);
  const standardized = standardizeVector(values, model.stats);
  const rawScores = {};
  currentTargets().forEach((target) => { rawScores[target.tone] = 0.001; });
  const neighbors = model.samples
    .map((sample) => {
      const featureDistance = euclideanDistance(standardized, sample.values) / Math.sqrt(sample.values.length);
      const contourDistance = dtwDistance(vector.contour, sample.contour);
      return {
        tone: sample.tone,
        distance: contourDistance * 0.62 + featureDistance * 0.38,
      };
    })
    .sort((a, b) => a.distance - b.distance);
  const k = Math.min(7, neighbors.length);
  neighbors.slice(0, k).forEach((neighbor, index) => {
    const rankWeight = 1 - index / Math.max(1, k + 1);
    rawScores[neighbor.tone] += rankWeight / Math.max(0.08, neighbor.distance);
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

function predictWithHeuristic(vector) {
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
  const q1 = points[1];
  const mid = points[2];
  const q3 = points[3];
  const end = points[4];
  const meanSemi = mean(smoothed) ?? 0;
  return {
    medianPitchHz,
    start,
    q1,
    mid,
    q3,
    end,
    mean: meanSemi,
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

function renderPrediction(prediction) {
  const target = targetForTone(prediction.tone);
  predictionResult.querySelector(".prediction-result__tone").textContent = target?.pinyin || "-";
  predictionResult.querySelector(".prediction-result__meta").textContent =
    prediction.reason ||
    `${target.character} / ${target.meaning}. ${prediction.method}, confidence ${Math.round(
      prediction.confidence * 100
    )}%.`;
  predictionScores.replaceChildren();
  currentTargets().forEach((targetOption) => {
    const score = prediction.scores[targetOption.tone] || 0;
    const item = document.createElement("div");
    item.className = "prediction-score";
    item.innerHTML = `<span>${targetOption.pinyin} ${Math.round(score * 100)}%</span><div class="prediction-score__bar"><span style="--score-width: ${Math.round(
      score * 100
    )}%"></span></div>`;
    predictionScores.appendChild(item);
  });
}

function baseMimeType(mimeType) {
  return (mimeType || "audio/webm").split(";")[0].trim() || "audio/webm";
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

function exposeFailedBlob(blob, target) {
  const url = URL.createObjectURL(blob);
  failedDownload.href = url;
  failedDownload.download = `${state.toneSet.id}_${target.pinyin}_${Date.now()}.webm`;
  failedDownload.hidden = false;
}

function loadVoices() {
  if (!window.speechSynthesis) {
    return;
  }
  const voices = window.speechSynthesis.getVoices();
  state.zhVoice =
    voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("zh")) ||
    voices.find((voice) => voice.lang && voice.lang.toLowerCase().includes("cmn")) ||
    null;
}

function playReference(target) {
  if (!window.speechSynthesis) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (synth.pending || synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(target.character);
    utterance.lang = "zh-CN";
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    if (state.zhVoice) {
      utterance.voice = state.zhVoice;
    }
    const fallback = window.setTimeout(resolve, 1700);
    utterance.onend = () => {
      window.clearTimeout(fallback);
      resolve();
    };
    utterance.onerror = () => {
      window.clearTimeout(fallback);
      resolve();
    };
    synth.speak(utterance);
  });
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
