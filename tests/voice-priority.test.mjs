import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function loadFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should be defined in app.js`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) {
      return vm.runInNewContext(`(${source.slice(start, index + 1)})`);
    }
  }
  throw new Error(`${name} should have a closing brace`);
}

const findLowestDrop = loadFunction("findLowestDrop");
const shouldAcceptVoicePredictionEarly = loadFunction("shouldAcceptVoicePredictionEarly");

const drops = [
  { id: 10, tones: "1", y: 120 },
  { id: 20, tones: "2", y: 310 },
  { id: 30, tones: "3", y: 205 },
];

test("the lowest drop is frozen as the priority target", () => {
  assert.equal(findLowestDrop(drops).id, 20);
  assert.equal(findLowestDrop([]), null);
});

test("an unfinished utterance can accept the lowest drop early", () => {
  assert.equal(shouldAcceptVoicePredictionEarly({ tone: "2" }, 20, drops), true);
});

test("an unfinished utterance defers predictions for higher drops", () => {
  assert.equal(shouldAcceptVoicePredictionEarly({ tone: "1" }, 20, drops), false);
  assert.equal(shouldAcceptVoicePredictionEarly({ tone: "3" }, 20, drops), false);
});

test("early acceptance is disabled if the frozen target is gone", () => {
  assert.equal(shouldAcceptVoicePredictionEarly({ tone: "2" }, 20, drops.filter((drop) => drop.id !== 20)), false);
});
