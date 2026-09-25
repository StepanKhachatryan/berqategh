/**
 * Turning whatever a seller picks into the one photo the site accepts.
 *
 * A phone camera writes 4 to 15 MB, sometimes more; the site stores at most
 * 500 KB, a JPEG, with ԲերքաՏեղ in the top-right corner. All of that happens
 * here, on the phone, before a byte is sent:
 *
 *   1. the file must say it is a JPEG, PNG or WebP - what phone cameras and
 *      galleries produce. iPhones shoot HEIC, but hand a JPEG to any page that
 *      does not ask for HEIC, so they are covered without asking for it;
 *   2. it must actually decode as an image - a renamed file fails here,
 *      whatever its name says;
 *   3. it is scaled so its longer side is at most 1600px, which is sharp on
 *      any phone and a fraction of the camera's size;
 *   4. the mark is drawn on;
 *   5. it is encoded as JPEG, at lower quality, then smaller, until it is
 *      under the limit.
 *
 * The re-encode is also what strips the file's metadata. Camera photos carry
 * the GPS position they were taken at - often the seller's own yard - and a
 * canvas keeps pixels only.
 *
 * The storage bucket enforces JPEG and the 500 KB limit on its own, so a
 * client that skipped all this would be refused, not trusted.
 */

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

/** For the file input, so the picker offers only these. */
export const PHOTO_ACCEPT = ACCEPTED_TYPES.join(',');

/** The bucket allows 512 000 bytes; staying under 500 000 leaves a margin. */
export const MAX_PHOTO_BYTES = 500_000;

/** Nothing a phone camera takes is this big; anything that is, is not a photo. */
const MAX_INPUT_BYTES = 40 * 1024 * 1024;

const LONG_SIDE = 1600;
const QUALITIES = [0.86, 0.8, 0.72, 0.64, 0.56];

const MARK = 'ԲերքաՏեղ';
const MARK_FONT = '"Noto Sans Armenian", system-ui, sans-serif';

export interface PreparedPhoto {
  blob: Blob;
  /** An object URL for the preview; revoke it when done. */
  previewUrl: string;
  width: number;
  height: number;
}

export class PhotoError extends Error {}

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  // createImageBitmap applies the camera's rotation and is lighter on memory;
  // an <img> is the fallback for the browsers that lack it.
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to <img>, which some older Safaris decode more of.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new PhotoError('encode'))),
      'image/jpeg',
      quality,
    ),
  );
}

/**
 * The mark, top right. White with a soft dark halo, so it reads on a pale sky
 * and on dark soil alike, and sized to the photo rather than in pixels, so it
 * is the same share of a small picture as of a large one.
 */
function stamp(ctx: CanvasRenderingContext2D, width: number): void {
  const size = Math.max(16, Math.round(width * 0.042));
  const pad = Math.round(size * 0.7);

  ctx.save();
  ctx.font = `800 ${size}px ${MARK_FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = Math.round(size * 0.35);
  ctx.shadowOffsetY = Math.max(1, Math.round(size * 0.05));

  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.strokeStyle = 'rgba(16, 37, 26, 0.35)';
  ctx.strokeText(MARK, width - pad, pad);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fillText(MARK, width - pad, pad);
  ctx.restore();
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const typeOk = ACCEPTED_TYPES.includes(file.type) || (!file.type && ACCEPTED_EXTENSIONS.test(file.name));
  if (!typeOk) {
    throw new PhotoError('Այս ֆայլը լուսանկար չէ։ Ընտրե՛ք JPG, PNG կամ WebP նկար։');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new PhotoError('Ֆայլը չափազանց մեծ է։ Ընտրե՛ք հեռախոսով արված սովորական լուսանկար։');
  }

  let source: Awaited<ReturnType<typeof decode>>;
  try {
    source = await decode(file);
  } catch {
    throw new PhotoError('Չհաջողվեց բացել նկարը։ Փորձե՛ք այլ լուսանկար։');
  }

  // The mark in the site's own typeface; without this the first photo of a
  // visit could be stamped in a fallback font.
  try {
    await document.fonts.load(`800 32px ${MARK_FONT}`, MARK);
  } catch {
    // A fallback font is still a mark.
  }

  let scale = Math.min(1, LONG_SIDE / Math.max(source.width, source.height));

  // Quality first, then size: a smaller photo at good quality beats a large
  // one full of blocks. In practice the first or second try is under 500 KB.
  for (let attempt = 0; attempt < 4; attempt++) {
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new PhotoError('Չհաջողվեց մշակել նկարը։');

    // JPEG has no transparency: a PNG with a clear background would otherwise
    // come out black behind the fruit.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);
    stamp(ctx, width);

    for (const quality of QUALITIES) {
      const blob = await toJpeg(canvas, quality);
      if (blob.size <= MAX_PHOTO_BYTES) {
        if ('close' in source && typeof source.close === 'function') source.close();
        return { blob, previewUrl: URL.createObjectURL(blob), width, height };
      }
    }
    scale *= 0.75;
  }

  throw new PhotoError('Չհաջողվեց նկարը փոքրացնել։ Փորձե՛ք այլ լուսանկար։');
}
