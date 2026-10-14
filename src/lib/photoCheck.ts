/**
 * A check, on the phone itself, that a photo is not sexual before it is
 * uploaded.
 *
 * The model is the open-source NSFW classifier behind nsfwjs (MobileNetV2,
 * ~2.6 MB), run with TensorFlow.js. Both are fetched from the jsDelivr CDN,
 * pinned to exact versions, and only when a seller actually picks a photo -
 * nobody else downloads anything, and none of it goes through Netlify.
 *
 * It fails open: if the model cannot be loaded (no connection to the CDN),
 * the photo goes through, and buyers' reports and the owner's review are the
 * net behind it. A determined person can always get past a check that runs in
 * their own browser; this stops the casual case, which is nearly all of it.
 */

const TFJS_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/infinitered/nsfwjs@d55a54c51f14380670064cc129b2ea51029c5e46/models/mobilenet_v2/model.json';
const SIZE = 224;

/** The model's five outputs, in order. */
const CLASSES = ['drawing', 'hentai', 'neutral', 'porn', 'sexy'] as const;
export type PhotoScores = Record<(typeof CLASSES)[number], number>;

// Only the handful of TensorFlow.js calls used here.
interface Tensor {
  data(): Promise<Float32Array>;
  dispose(): void;
}
interface TfLike {
  loadLayersModel(url: string): Promise<{ predict(input: unknown): Tensor }>;
  tidy<T>(fn: () => T): T;
  browser: { fromPixels(source: HTMLCanvasElement): { toFloat(): { div(n: number): { reshape(s: number[]): unknown } } } };
}

let modelPromise: Promise<{ tf: TfLike; model: { predict(input: unknown): Tensor } }> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.appendChild(script);
  });
}

function loadModel() {
  modelPromise ??= (async () => {
    const w = window as unknown as { tf?: TfLike };
    if (!w.tf) await loadScript(TFJS_URL);
    if (!w.tf) throw new Error('TensorFlow.js did not load');
    const model = await w.tf.loadLayersModel(MODEL_URL);
    return { tf: w.tf, model };
  })();
  // A failed load is not cached: the next photo tries again.
  modelPromise.catch(() => {
    modelPromise = null;
  });
  return modelPromise;
}

async function scoresFor(src: string): Promise<PhotoScores> {
  const { tf, model } = await loadModel();

  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.getContext('2d')!.drawImage(img, 0, 0, SIZE, SIZE);

  const output = tf.tidy(() =>
    model.predict(tf.browser.fromPixels(canvas).toFloat().div(255).reshape([1, SIZE, SIZE, 3])),
  );
  const values = await output.data();
  output.dispose();
  return Object.fromEntries(CLASSES.map((name, i) => [name, values[i]])) as PhotoScores;
}

/**
 * True when the photo looks sexual. Null when it could not be checked (the
 * model did not load), which the form treats as a pass.
 */
export async function looksExplicit(src: string): Promise<boolean | null> {
  try {
    const s = await scoresFor(src);
    return s.porn + s.hentai >= 0.5 || s.sexy >= 0.8;
  } catch {
    return null;
  }
}

/** For checking the model itself; not used by the app. */
export { scoresFor as _scoresFor };
