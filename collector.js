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
const TARGETS_BY_TONE = Object.fromEntries(TARGETS.map((target) => [target.tone, target]));

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
const predictBtn = document.getElementById("predictBtn");
const replayBtn = document.getElementById("replayBtn");
const skipBtn = document.getElementById("skipBtn");
const modelStatus = document.getElementById("modelStatus");
const predictionResult = document.getElementById("predictionResult");
const predictionScores = document.getElementById("predictionScores");
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
  model: null,
  stats: loadStats(),
  sessionId: getSessionId(),
};

renderTarget(state.currentTarget);
renderStats();
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
  failedDownload.hidden = true;
  failedDownload.removeAttribute("href");
  try {
    await ensureMic();
    setStatus("Recording test sample...");
    const sample = await recordAudio(state.currentTarget);
    const prediction = predictTone(sample.frames);
    renderPrediction(prediction);
    setStatus(
      `Predicted ${TARGETS_BY_TONE[prediction.tone]?.pinyin || `bao${prediction.tone}`} (${Math.round(
        prediction.confidence * 100
      )}%).`
    );
  } catch (error) {
    console.error(error);
    setStatus(`Prediction error: ${error.message || error}`);
  } finally {
    state.busy = false;
    predictBtn.disabled = false;
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

async function refreshModel() {
  modelStatus.textContent = "Loading model...";
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("target_tone,pinyin,pitch_features")
      .eq("syllable", SYLLABLE)
      .limit(400);
    if (error) {
      throw error;
    }
    state.model = buildCentroidModel(data || []);
    renderModelStatus();
  } catch (error) {
    console.warn("Could not load Supabase training data", error);
    state.model = null;
    modelStatus.textContent =
      "Using fallback contour heuristic. Run updated SQL to allow model training from collected samples.";
  }
}

function buildCentroidModel(rows) {
  const samples = rows
    .map((row) => ({
      tone: String(row.target_tone),
      vector: contourVector(row.pitch_features?.frames || []),
    }))
    .filter((sample) => TARGETS_BY_TONE[sample.tone] && sample.vector);
  const counts = countByTone(samples);
  const hasEnoughData = TARGETS.every((target) => (counts[target.tone] || 0) >= 3);
  if (!hasEnoughData) {
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
      values: vectorValues(sample.vector, globalMedianPitch),
    }))
    .filter((sample) => sample.values);
  const stats = vectorStats(vectors.map((sample) => sample.values));
  const standardized = vectors.map((sample) => ({
    tone: sample.tone,
    values: standardizeVector(sample.values, stats),
  }));
  const centroids = {};
  TARGETS.forEach((target) => {
    const toneVectors = standardized
      .filter((sample) => sample.tone === target.tone)
      .map((sample) => sample.values);
    centroids[target.tone] = averageVector(toneVectors);
  });
  return {
    kind: "centroid",
    counts,
    globalMedianPitch,
    stats,
    centroids,
  };
}

function renderModelStatus() {
  if (!state.model || state.model.kind !== "centroid") {
    const counts = state.model?.counts || {};
    modelStatus.textContent = `Using fallback contour heuristic. Readable samples: ${formatCounts(counts)}.`;
    return;
  }
  modelStatus.textContent = `Using Supabase-trained model. Samples: ${formatCounts(state.model.counts)}.`;
}

function formatCounts(counts) {
  return TARGETS.map((target) => `${target.pinyin}:${counts[target.tone] || 0}`).join(" ");
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
  if (state.model?.kind === "centroid") {
    return predictWithCentroids(vector, state.model);
  }
  return predictWithHeuristic(vector);
}

function predictWithCentroids(vector, model) {
  const values = vectorValues(vector, model.globalMedianPitch);
  const standardized = standardizeVector(values, model.stats);
  const distances = {};
  TARGETS.forEach((target) => {
    distances[target.tone] = euclideanDistance(standardized, model.centroids[target.tone]);
  });
  const maxDistance = Math.max(...Object.values(distances));
  const rawScores = {};
  TARGETS.forEach((target) => {
    rawScores[target.tone] = Math.max(0.001, maxDistance - distances[target.tone] + 0.001);
  });
  const scores = normalizeScores(rawScores);
  const tone = bestTone(scores);
  return {
    tone,
    confidence: scores[tone],
    method: "dataset centroid",
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
  const voiced = frames
    .filter((frame) => frame.pitchHz && frame.pitchHz >= 65 && frame.pitchHz <= 520)
    .filter((frame) => (frame.clarity ?? 1) >= 0.33)
    .sort((a, b) => a.t - b.t);
  if (voiced.length < 5) {
    return null;
  }
  const pitches = voiced.map((frame) => frame.pitchHz);
  const medianPitchHz = median(pitches);
  if (!medianPitchHz) {
    return null;
  }
  const semitones = voiced.map((frame) => 12 * Math.log2(frame.pitchHz / medianPitchHz));
  const smoothed = smoothValues(semitones);
  const points = resampleValues(smoothed, 5);
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
  };
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

function averageVector(vectors) {
  if (!vectors.length) {
    return [];
  }
  return vectors[0].map((_, index) => mean(vectors.map((vector) => vector[index])) ?? 0);
}

function euclideanDistance(left, right) {
  return Math.sqrt(
    left.reduce((sum, value, index) => sum + (value - (right[index] ?? 0)) ** 2, 0)
  );
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
  const target = TARGETS_BY_TONE[prediction.tone];
  predictionResult.querySelector(".prediction-result__tone").textContent = target?.pinyin || "-";
  predictionResult.querySelector(".prediction-result__meta").textContent =
    prediction.reason ||
    `${target.character} / ${target.meaning}. ${prediction.method}, confidence ${Math.round(
      prediction.confidence * 100
    )}%.`;
  predictionScores.replaceChildren();
  TARGETS.forEach((targetOption) => {
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
