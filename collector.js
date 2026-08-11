import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tuyatuvsfunbjeonbuwq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0V9d3aa8SD7b_Ako0TFHsQ_p_IHBggg";
const BUCKET = "voice-samples";
const TABLE = "voice_samples";
const SYLLABLE = "bao";
const RECORDING_MS = 1450;
const POST_PROMPT_DELAY_MS = 320;
const PITCH_VERSION = 1;

const TARGETS = [
  {
    tone: "1",
    character: "包",
    pinyin: "bao1",
    meaning: "package",
    image: "meaning_images/package.jpg",
  },
  {
    tone: "2",
    character: "薄",
    pinyin: "bao2",
    meaning: "thin",
    image: "meaning_images/thin.jpg",
  },
  {
    tone: "3",
    character: "宝",
    pinyin: "bao3",
    meaning: "treasure",
    image: "meaning_images/treasure.jpg",
  },
  {
    tone: "4",
    character: "抱",
    pinyin: "bao4",
    meaning: "hug",
    image: "meaning_images/hug.jpg",
  },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
const replayBtn = document.getElementById("replayBtn");
const skipBtn = document.getElementById("skipBtn");
const countEls = {
  "1": document.getElementById("count1"),
  "2": document.getElementById("count2"),
  "3": document.getElementById("count3"),
  "4": document.getElementById("count4"),
};

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
  currentTarget: TARGETS[0],
  lastTarget: null,
  targetQueue: [],
  zhVoice: null,
  stats: loadStats(),
  sessionId: getSessionId(),
};

renderTarget(state.currentTarget);
renderStats();
drawPitch([]);
loadVoices();

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

function loadStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem("toneVoiceCollector.stats.v1") || "{}");
    return { "1": 0, "2": 0, "3": 0, "4": 0, ...parsed };
  } catch {
    return { "1": 0, "2": 0, "3": 0, "4": 0 };
  }
}

function saveStats() {
  localStorage.setItem("toneVoiceCollector.stats.v1", JSON.stringify(state.stats));
}

function renderStats() {
  Object.entries(countEls).forEach(([tone, el]) => {
    el.textContent = String(state.stats[tone] || 0);
  });
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
    state.targetQueue = shuffled(TARGETS);
  }
  return state.targetQueue.shift() || TARGETS[0];
}

async function startAuto() {
  state.running = true;
  startBtn.textContent = "Stop";
  recordOnceBtn.disabled = true;
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
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;
    for (let i = 0; i < buffer.length - lag; i += 1) {
      const left = buffer[i];
      const right = buffer[i + lag];
      correlation += left * right;
      leftEnergy += left * left;
      rightEnergy += right * right;
    }
    const normalized = correlation / Math.sqrt(leftEnergy * rightEnergy || 1);
    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || bestCorrelation < 0.34) {
    return { pitchHz: null, rms, clarity: Math.max(0, bestCorrelation) };
  }
  return {
    pitchHz: sampleRate / bestLag,
    rms,
    clarity: bestCorrelation,
  };
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

async function uploadSample(sample) {
  const ext = extensionForMime(sample.mimeType);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const storagePath = `${SYLLABLE}/${state.sessionId}/${timestamp}_${sample.target.pinyin}_${sample.id}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, sample.blob, {
      contentType: baseMimeType(sample.mimeType),
      upsert: false,
    });
  if (uploadError) {
    exposeFailedBlob(sample.blob, sample.target);
    throw uploadError;
  }

  const metadata = {
    session_id: state.sessionId,
    client_sample_id: sample.id,
    syllable: SYLLABLE,
    target_tone: sample.target.tone,
    character: sample.target.character,
    pinyin: sample.target.pinyin,
    meaning: sample.target.meaning,
    storage_bucket: BUCKET,
    storage_path: storagePath,
    mime_type: sample.mimeType,
    duration_ms: sample.durationMs,
    size_bytes: sample.blob.size,
    audio_format: ext,
    sample_rate: sample.sampleRate,
    pitch_features: buildPitchFeatures(sample),
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

function baseMimeType(mimeType) {
  return (mimeType || "audio/webm").split(";")[0].trim() || "audio/webm";
}

function mean(values) {
  if (!values.length) {
    return null;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function exposeFailedBlob(blob, target) {
  const url = URL.createObjectURL(blob);
  failedDownload.href = url;
  failedDownload.download = `${SYLLABLE}_${target.pinyin}_${Date.now()}.webm`;
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
