import { readFile, writeFile } from "node:fs/promises";

const SUPABASE_URL = "https://tuyatuvsfunbjeonbuwq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0V9d3aa8SD7b_Ako0TFHsQ_p_IHBggg";
const VOICE_TABLE = "voice_samples";
const OUTPUT_PATH = new URL("../voice-model.json", import.meta.url);
const APP_PATH = new URL("../app.js", import.meta.url);

const LABELS = ["1", "2", "3", "4"];
const FEATURE_NAMES = [
  "start",
  "q1",
  "mid",
  "q3",
  "end",
  "slope",
  "earlySlope",
  "lateSlope",
  "range",
  "minPosition",
  "maxPosition",
  "meanRel",
  "durationMs",
  "voicedFrameCount",
  "meanClarity",
  "clarityRange",
  "dipDepth",
  "riseAfterMin",
  "fallAfterMax",
  "turnCount",
  "upStepShare",
  "downStepShare",
];

const SYNTHETIC_VARIANTS_PER_WORD = 10;
const SYNTHETIC_WEIGHT = 0.34;
const HUMAN_WEIGHT = 1.35;
const KNN_OPTIONS = { k: 5, contourWeight: 0.72, distanceFloor: 0.04 };
const BLENDS = [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1];

async function main() {
  const appSource = await readFile(APP_PATH, "utf8");
  const appWords = extractSingleToneWords(appSource);
  const humanRows = await fetchHumanRows();
  const humanExamples = rowsToExamples(humanRows, { source: "human", weight: HUMAN_WEIGHT });
  const syntheticExamples = buildSyntheticExamples(appWords);
  const allExamples = [...humanExamples, ...syntheticExamples];
  const evaluation = evaluateLeaveOneSyllableOut(humanExamples, syntheticExamples);
  const model = buildHybridModel(allExamples, {
    blend: evaluation.bestBlend,
    appWords,
    humanExamples,
    syntheticExamples,
    evaluation,
  });

  await writeFile(OUTPUT_PATH, `${JSON.stringify(model)}\n`);
  printSummary(model);
}

function extractSingleToneWords(source) {
  const words = new Map();
  const entryPattern =
    /\{\s*text:\s*"([^"]+)"\s*,\s*tones:\s*"([1-4])"\s*,\s*sv:\s*"([^"]*)"/g;
  let match = null;
  while ((match = entryPattern.exec(source))) {
    const [, text, tone, sv] = match;
    if ([...text].length !== 1) {
      continue;
    }
    words.set(`${text}:${tone}`, {
      text,
      tone,
      sv,
      syllable: inferSyllableFromNearbySource(source, match.index) || null,
    });
  }
  return [...words.values()];
}

function inferSyllableFromNearbySource(source, index) {
  const start = Math.max(0, index - 700);
  const context = source.slice(start, index);
  const matches = [...context.matchAll(/id:\s*"([a-z]+)"/g)];
  return matches[matches.length - 1]?.[1] || null;
}

async function fetchHumanRows() {
  const fields = "syllable,target_tone,pinyin,pitch_features,status";
  const url = `${SUPABASE_URL}/rest/v1/${VOICE_TABLE}?select=${fields}&status=eq.uploaded&limit=5000`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

function rowsToExamples(rows, { source, weight }) {
  return rows
    .map((row) => ({
      tone: String(row.target_tone || ""),
      syllable: row.syllable || pinyinToSyllable(row.pinyin) || null,
      pinyin: row.pinyin || null,
      vector: contourVector(row.pitch_features?.frames || []),
      source,
      weight,
    }))
    .filter((example) => LABELS.includes(example.tone) && example.vector)
    .map((example) => ({ ...example, contour: example.vector.contour }));
}

function pinyinToSyllable(pinyin) {
  return String(pinyin || "").replace(/[1-5]$/, "") || null;
}

function buildSyntheticExamples(words) {
  const examples = [];
  words.forEach((word, wordIndex) => {
    for (let variant = 0; variant < SYNTHETIC_VARIANTS_PER_WORD; variant += 1) {
      const frames = syntheticFramesForTone(word.tone, wordIndex, variant);
      const vector = contourVector(frames);
      if (vector) {
        examples.push({
          tone: word.tone,
          syllable: word.syllable,
          pinyin: word.syllable ? `${word.syllable}${word.tone}` : null,
          text: word.text,
          vector,
          contour: vector.contour,
          source: "synthetic",
          weight: SYNTHETIC_WEIGHT,
        });
      }
    }
  });
  return examples;
}

function syntheticFramesForTone(tone, wordIndex, variant) {
  const random = mulberry32(hashNumber(`${tone}:${wordIndex}:${variant}`));
  const durationMs = 450 + random() * 380;
  const frameCount = 10 + Math.floor(random() * 8);
  const basePitch = 145 + random() * 95;
  const amplitude = 0.82 + random() * 0.42;
  const slopeJitter = (random() - 0.5) * 0.75;
  const halfThird = tone === "3" && random() < 0.45;
  const template = toneTemplate(tone, { halfThird }).map(
    (value, index) =>
      value * amplitude + slopeJitter * (index / 4 - 0.5) + (random() - 0.5) * 0.45
  );
  return Array.from({ length: frameCount }, (_, index) => {
    const progress = frameCount === 1 ? 0 : index / (frameCount - 1);
    const semitone = interpolateTemplate(template, progress) + (random() - 0.5) * 0.32;
    const t = Math.round(progress * durationMs);
    return {
      t,
      pitchHz: Math.round(basePitch * 2 ** (semitone / 12) * 10) / 10,
      rms: Math.round((0.025 + random() * 0.045) * 10000) / 10000,
      clarity: Math.round((0.72 + random() * 0.2) * 1000) / 1000,
    };
  });
}

function toneTemplate(tone, { halfThird = false } = {}) {
  if (tone === "1") {
    return [1.25, 1.45, 1.35, 1.25, 1.2];
  }
  if (tone === "2") {
    return [-2.6, -1.8, -0.55, 1.2, 2.9];
  }
  if (tone === "3") {
    return halfThird ? [0.2, -1.7, -3.1, -3.4, -3.1] : [0.7, -1.7, -3.7, -2.7, -0.8];
  }
  return [3.2, 1.25, -0.45, -2.05, -3.35];
}

function interpolateTemplate(template, progress) {
  const position = progress * (template.length - 1);
  const low = Math.floor(position);
  const high = Math.min(template.length - 1, Math.ceil(position));
  const mix = position - low;
  return template[low] * (1 - mix) + template[high] * mix;
}

function evaluateLeaveOneSyllableOut(humanExamples, syntheticExamples) {
  const syllables = [...new Set(humanExamples.map((example) => example.syllable).filter(Boolean))].sort();
  const folds = [];
  syllables.forEach((syllable) => {
    const test = humanExamples.filter((example) => example.syllable === syllable);
    const trainHuman = humanExamples.filter((example) => example.syllable !== syllable);
    if (test.length < 4 || trainHuman.length < 8) {
      return;
    }
    const train = [...trainHuman, ...syntheticExamples];
    const model = buildHybridModel(train, { blend: 0.5 });
    const fold = {
      syllable,
      total: test.length,
      softmaxCorrect: 0,
      knnCorrect: 0,
      blendCorrectByBlend: Object.fromEntries(BLENDS.map((blend) => [String(blend), 0])),
    };
    test.forEach((example) => {
      const prediction = predictHybrid(example.vector, model);
      if (prediction.softmaxTone === example.tone) {
        fold.softmaxCorrect += 1;
      }
      if (prediction.knnTone === example.tone) {
        fold.knnCorrect += 1;
      }
      BLENDS.forEach((blend) => {
        const tone = bestTone(blendScores(prediction.softmaxScores, prediction.knnScores, blend));
        if (tone === example.tone) {
          fold.blendCorrectByBlend[String(blend)] += 1;
        }
      });
    });
    folds.push(fold);
  });

  const total = folds.reduce((sum, fold) => sum + fold.total, 0);
  const blendTotals = Object.fromEntries(BLENDS.map((blend) => [String(blend), 0]));
  folds.forEach((fold) => {
    BLENDS.forEach((blend) => {
      blendTotals[String(blend)] += fold.blendCorrectByBlend[String(blend)];
    });
  });
  const bestBlend =
    BLENDS.map((blend) => ({
      blend,
      correct: blendTotals[String(blend)] || 0,
      accuracy: total ? (blendTotals[String(blend)] || 0) / total : 0,
    })).sort((a, b) => b.accuracy - a.accuracy || Math.abs(a.blend - 0.5) - Math.abs(b.blend - 0.5))[0]
      ?.blend ?? 0.5;

  return {
    folds,
    total,
    softmaxAccuracy: accuracy(folds.reduce((sum, fold) => sum + fold.softmaxCorrect, 0), total),
    knnAccuracy: accuracy(folds.reduce((sum, fold) => sum + fold.knnCorrect, 0), total),
    blendAccuracies: Object.fromEntries(
      Object.entries(blendTotals).map(([blend, correct]) => [blend, accuracy(correct, total)])
    ),
    bestBlend,
  };
}

function buildHybridModel(examples, { blend = 0.5, appWords = [], humanExamples = [], syntheticExamples = [], evaluation = null } = {}) {
  const globalMedianPitch = median(
    examples.map((example) => example.vector.medianPitchHz).filter(Number.isFinite)
  );
  const rows = examples
    .map((example) => ({
      tone: example.tone,
      source: example.source,
      weight: example.weight || 1,
      vector: example.vector,
      values: vectorValues(example.vector, globalMedianPitch),
      contour: example.contour,
    }))
    .filter((example) => example.values);
  const stats = vectorStats(rows.map((row) => row.values));
  const trainingRows = rows.map((row) => ({
    ...row,
    standardized: standardizeVector(row.values, stats),
  }));
  const softmax = trainSoftmax(trainingRows);
  const counts = countByTone(rows);
  return {
    kind: "general-tone-v1",
    generatedAt: new Date().toISOString(),
    labels: LABELS,
    featureNames: FEATURE_NAMES,
    globalMedianPitch: round(globalMedianPitch, 4),
    blend,
    softmax: {
      means: stats.means.map((value) => round(value, 6)),
      stds: stats.stds.map((value) => round(value, 6)),
      weights: softmax.weights.map((row) => row.map((value) => round(value, 6))),
      biases: softmax.biases.map((value) => round(value, 6)),
    },
    knn: {
      options: KNN_OPTIONS,
      counts,
      samples: trainingRows.map((row) => ({
        tone: row.tone,
        source: row.source,
        weight: round(row.weight, 4),
        values: row.standardized.map((value) => round(value, 5)),
        contour: row.contour.map((value) => round(value, 5)),
      })),
    },
    training: {
      humanSamples: humanExamples.length,
      syntheticSamples: syntheticExamples.length,
      syntheticWords: appWords.length,
      counts,
      evaluation,
    },
  };
}

function trainSoftmax(rows) {
  const dimensions = rows[0]?.standardized.length || FEATURE_NAMES.length;
  const weights = LABELS.map(() => Array.from({ length: dimensions }, () => 0));
  const biases = LABELS.map(() => 0);
  const sampleWeightTotal = rows.reduce((sum, row) => sum + (row.weight || 1), 0) || 1;
  const learningRate = 0.095;
  const l2 = 0.0015;
  for (let epoch = 0; epoch < 900; epoch += 1) {
    const weightGrads = LABELS.map(() => Array.from({ length: dimensions }, () => 0));
    const biasGrads = LABELS.map(() => 0);
    rows.forEach((row) => {
      const logits = weights.map((classWeights, classIndex) =>
        dot(classWeights, row.standardized) + biases[classIndex]
      );
      const probabilities = softmax(logits);
      const rowWeight = row.weight || 1;
      LABELS.forEach((label, classIndex) => {
        const expected = row.tone === label ? 1 : 0;
        const delta = (probabilities[classIndex] - expected) * rowWeight;
        for (let index = 0; index < dimensions; index += 1) {
          weightGrads[classIndex][index] += delta * row.standardized[index];
        }
        biasGrads[classIndex] += delta;
      });
    });
    const rate = learningRate / (1 + epoch / 460);
    LABELS.forEach((_, classIndex) => {
      for (let index = 0; index < dimensions; index += 1) {
        const grad =
          weightGrads[classIndex][index] / sampleWeightTotal + l2 * weights[classIndex][index];
        weights[classIndex][index] -= rate * grad;
      }
      biases[classIndex] -= rate * (biasGrads[classIndex] / sampleWeightTotal);
    });
  }
  return { weights, biases };
}

function predictHybrid(vector, model) {
  const values = vectorValues(vector, model.globalMedianPitch);
  const standardized = standardizeVector(values, model.softmax);
  const logits = model.softmax.weights.map(
    (weights, index) => dot(weights, standardized) + model.softmax.biases[index]
  );
  const softmaxScores = Object.fromEntries(
    softmax(logits).map((score, index) => [LABELS[index], score])
  );
  const knnScores = predictKnn(vector, values, model);
  const combinedScores = blendScores(softmaxScores, knnScores, model.blend);
  return {
    tone: bestTone(combinedScores),
    softmaxTone: bestTone(softmaxScores),
    knnTone: bestTone(knnScores),
    softmaxScores,
    knnScores,
    scores: combinedScores,
  };
}

function predictKnn(vector, values, model) {
  const options = model.knn.options || KNN_OPTIONS;
  const standardized = standardizeVector(values, model.softmax);
  const rawScores = { "1": 0.001, "2": 0.001, "3": 0.001, "4": 0.001 };
  const neighbors = model.knn.samples
    .map((sample) => {
      const featureDistance = euclideanDistance(standardized, sample.values) / Math.sqrt(sample.values.length);
      const contourDistance = dtwDistance(vector.contour, sample.contour);
      return {
        tone: sample.tone,
        weight: sample.weight || 1,
        distance: contourDistance * options.contourWeight + featureDistance * (1 - options.contourWeight),
      };
    })
    .sort((a, b) => a.distance - b.distance);
  const k = Math.min(options.k, neighbors.length);
  neighbors.slice(0, k).forEach((neighbor, index) => {
    const rankWeight = 1 - index / Math.max(1, k + 1);
    rawScores[neighbor.tone] +=
      (neighbor.weight || 1) * rankWeight / Math.max(options.distanceFloor, neighbor.distance);
  });
  return normalizeScores(rawScores);
}

function blendScores(softmaxScores, knnScores, blend) {
  const scores = {};
  LABELS.forEach((label) => {
    scores[label] = (softmaxScores[label] || 0) * blend + (knnScores[label] || 0) * (1 - blend);
  });
  return normalizeScores(scores);
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
  const diffs = smoothed.slice(1).map((value, index) => value - smoothed[index]);
  const strongDiffs = diffs.filter((value) => Math.abs(value) >= 0.18);
  const turnCount = strongDiffs.slice(1).reduce((count, value, index) => {
    const previous = strongDiffs[index];
    return count + (Math.sign(value) !== Math.sign(previous) ? 1 : 0);
  }, 0);
  const durationMs = Math.max(0, (voiced[voiced.length - 1]?.t || 0) - (voiced[0]?.t || 0));
  const clarities = voiced.map((frame) => frame.clarity).filter(Number.isFinite);
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
    durationMs,
    voicedFrameCount: voiced.length,
    meanClarity: mean(clarities) ?? 0,
    clarityRange: clarities.length ? Math.max(...clarities) - Math.min(...clarities) : 0,
    dipDepth: Math.max(0, Math.min(start, end) - minValue),
    riseAfterMin: end - minValue,
    fallAfterMax: maxValue - end,
    turnCount,
    upStepShare: diffs.length ? diffs.filter((value) => value > 0.18).length / diffs.length : 0,
    downStepShare: diffs.length ? diffs.filter((value) => value < -0.18).length / diffs.length : 0,
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
  return groups.sort((a, b) => segmentScore(b) - segmentScore(a))[0] || [];
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
    vector.durationMs,
    vector.voicedFrameCount,
    vector.meanClarity,
    vector.clarityRange,
    vector.dipDepth,
    vector.riseAfterMin,
    vector.fallAfterMax,
    vector.turnCount,
    vector.upStepShare,
    vector.downStepShare,
  ];
}

function vectorStats(vectors) {
  const dimensions = vectors[0]?.length || 0;
  const means = Array.from({ length: dimensions }, (_, index) =>
    mean(vectors.map((vector) => vector[index])) ?? 0
  );
  const stds = Array.from({ length: dimensions }, (_, index) => {
    const variance = mean(vectors.map((vector) => (vector[index] - means[index]) ** 2)) ?? 0;
    return Math.sqrt(variance) || 1;
  });
  return { means, stds };
}

function standardizeVector(vector, stats) {
  return vector.map((value, index) => (value - stats.means[index]) / stats.stds[index]);
}

function euclideanDistance(left, right) {
  return Math.sqrt(left.reduce((sum, value, index) => sum + (value - (right[index] ?? 0)) ** 2, 0));
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
        Math.min(costs[(i - 1) * width + j], costs[i * width + j - 1], costs[(i - 1) * width + j - 1]);
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
  return Object.fromEntries(Object.entries(scores).map(([tone, value]) => [tone, Math.max(0, value) / total]));
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

function softmax(values) {
  const maxValue = Math.max(...values);
  const expValues = values.map((value) => Math.exp(value - maxValue));
  const total = expValues.reduce((sum, value) => sum + value, 0) || 1;
  return expValues.map((value) => value / total);
}

function dot(left, right) {
  return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
}

function mean(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) {
    return null;
  }
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function median(values) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) {
    return null;
  }
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

function accuracy(correct, total) {
  return total ? round(correct / total, 4) : 0;
}

function round(value, decimals = 4) {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function hashNumber(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function printSummary(model) {
  const evaluation = model.training.evaluation;
  console.log(`Human samples: ${model.training.humanSamples}`);
  console.log(`Synthetic samples: ${model.training.syntheticSamples} from ${model.training.syntheticWords} words`);
  console.log(`LOSO total: ${evaluation.total}`);
  console.log(`LOSO softmax: ${(evaluation.softmaxAccuracy * 100).toFixed(1)}%`);
  console.log(`LOSO kNN: ${(evaluation.knnAccuracy * 100).toFixed(1)}%`);
  console.log(`LOSO best blend ${evaluation.bestBlend}: ${(evaluation.blendAccuracies[String(evaluation.bestBlend)] * 100).toFixed(1)}%`);
  console.log(`Wrote ${OUTPUT_PATH.pathname}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
