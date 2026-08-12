(function installToneForest(global) {
  "use strict";

  function softmax(values) {
    const maximum = Math.max(...values);
    const exponential = values.map((value) => Math.exp(value - maximum));
    const total = exponential.reduce((sum, value) => sum + value, 0) || 1;
    return exponential.map((value) => value / total);
  }

  function predict(model, features, temperatureOverride = null) {
    if (!model?.forest?.trees?.length) {
      throw new Error("Tone forest has no trees");
    }
    const probabilities = [0, 0, 0, 0];
    model.forest.trees.forEach((tree) => {
      let node = 0;
      while ((tree.f[node] ?? -1) >= 0) {
        node = features[tree.f[node]] <= tree.t[node] ? tree.l[node] : tree.r[node];
      }
      const leaf = tree.p[node] || [];
      probabilities.forEach((_, index) => {
        probabilities[index] += leaf[index] || 0;
      });
    });
    const treeCount = model.forest.trees.length;
    const temperature = Number.isFinite(temperatureOverride)
      ? temperatureOverride
      : Number.isFinite(model.temperature)
        ? model.temperature
        : 1;
    return softmax(
      probabilities.map((value) => Math.log(Math.max(1e-7, value / treeCount)) / temperature)
    );
  }

  function convolution1d(input, layer) {
    const output = layer.weight.map((kernels, outputIndex) =>
      input[0].map((_, position) => {
        let value = layer.bias[outputIndex] || 0;
        kernels.forEach((kernel, inputIndex) => {
          kernel.forEach((weight, kernelIndex) => {
            const sourceIndex = position + kernelIndex - (layer.padding || 0);
            if (sourceIndex >= 0 && sourceIndex < input[inputIndex].length) {
              value += weight * input[inputIndex][sourceIndex];
            }
          });
        });
        return Math.max(0, value);
      })
    );
    return output;
  }

  function linear(input, layer, activation = false) {
    return layer.weight.map((weights, outputIndex) => {
      const value = weights.reduce(
        (sum, weight, inputIndex) => sum + weight * (input[inputIndex] || 0),
        layer.bias[outputIndex] || 0
      );
      return activation ? Math.max(0, value) : value;
    });
  }

  function predictCnn(model, sequence, scalars) {
    let values = convolution1d(sequence, model.layers.conv1);
    values = convolution1d(values, model.layers.conv2);
    const means = values.map(
      (channel) => channel.reduce((sum, value) => sum + value, 0) / channel.length
    );
    const maxima = values.map((channel) => Math.max(...channel));
    const pooled = [...means, ...maxima];
    const hidden = linear([...pooled, ...scalars], model.layers.hidden, true);
    const logits = linear(hidden, model.layers.output);
    const temperature = Number.isFinite(model.temperature) ? model.temperature : 1;
    return softmax(logits.map((value) => value / temperature));
  }

  function predictEnsemble(model, features, sequence, scalars) {
    const forest = predict(model, features, 1);
    const cnn = predictCnn(model.cnn, sequence, scalars);
    const forestShare = model.blend?.forestShare ?? 0.55;
    const combined = forest.map(
      (value, index) => value * forestShare + (cnn[index] || 0) * (1 - forestShare)
    );
    const temperature = Number.isFinite(model.temperature) ? model.temperature : 1;
    return {
      scores: softmax(
        combined.map((value) => Math.log(Math.max(1e-7, value)) / temperature)
      ),
      forest,
      cnn,
    };
  }

  global.ToneForest = Object.freeze({ predict, predictCnn, predictEnsemble });
})(globalThis);
