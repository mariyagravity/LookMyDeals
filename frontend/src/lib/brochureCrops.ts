import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { BrochureProductCandidate } from '../types';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_PDF_PAGES = 10;

/** Fill missing AI boxes for dense, regular grid flyers. Merchants can refine these with the crop editor. */
export function addGridFallbackCropBoxes(candidates: BrochureProductCandidate[]): BrochureProductCandidate[] {
  const byPage = new Map<number, BrochureProductCandidate[]>();
  for (const candidate of candidates) {
    const pageNumber = candidate.pageNumber || 1;
    byPage.set(pageNumber, [...(byPage.get(pageNumber) || []), candidate]);
  }
  const fallbackBoxes = new Map<string, NonNullable<BrochureProductCandidate['cropBox']>>();
  for (const pageCandidates of byPage.values()) {
    const missing = pageCandidates.filter((candidate) => !candidate.cropBox);
    if (missing.length < 4) continue;
    const count = pageCandidates.length;
    const columns = count >= 18 && count % 6 === 0 ? 6 : 5;
    const rows = Math.ceil(count / columns);
    pageCandidates.forEach((candidate, index) => {
      if (candidate.cropBox) return;
      const column = index % columns;
      const row = Math.floor(index / columns);
      const cellWidth = 1 / columns;
      const cellHeight = 1 / rows;
      // Focus on the merchandise area in a typical flyer tile, avoiding its
      // title strip and price badge. The crop tool remains available to refine it.
      fallbackBoxes.set(candidate.id, {
        x: column * cellWidth + cellWidth * 0.06,
        y: row * cellHeight + cellHeight * 0.24,
        width: cellWidth * 0.88,
        height: cellHeight * 0.52,
      });
    });
  }
  return candidates.map((candidate) => {
    const cropBox = fallbackBoxes.get(candidate.id);
    return cropBox ? { ...candidate, cropBox, notes: [...candidate.notes, 'Approximate grid crop; adjust it in the crop editor before publishing.'] } : candidate;
  });
}

export async function validateBrochureFile(file: File): Promise<void> {
  if (file.type !== 'application/pdf') return;
  const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const document = await loadingTask.promise;
  const pageCount = document.numPages;
  await loadingTask.destroy();
  if (pageCount > MAX_PDF_PAGES) throw new Error(`This brochure has ${pageCount} pages. Please upload a PDF with ${MAX_PDF_PAGES} pages or fewer.`);
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create a product crop.')), 'image/jpeg', 0.86);
  });
}

function makeCrop(source: HTMLCanvasElement, candidate: BrochureProductCandidate): Promise<Blob> | null {
  const box = candidate.cropBox;
  if (!box) return null;
  // Keep the exact model/editor box. Extra padding often pulls tile labels and
  // price badges into the product image on tightly packed retail flyers.
  const x = Math.max(0, Math.floor(box.x * source.width));
  const y = Math.max(0, Math.floor(box.y * source.height));
  const right = Math.min(source.width, Math.ceil((box.x + box.width) * source.width));
  const bottom = Math.min(source.height, Math.ceil((box.y + box.height) * source.height));
  const cropWidth = Math.max(1, right - x);
  const cropHeight = Math.max(1, bottom - y);
  const scale = Math.min(1, 512 / Math.max(cropWidth, cropHeight));
  const cropped = document.createElement('canvas');
  cropped.width = Math.max(1, Math.round(cropWidth * scale));
  cropped.height = Math.max(1, Math.round(cropHeight * scale));
  const context = cropped.getContext('2d');
  if (!context) return Promise.reject(new Error('Could not prepare the crop canvas.'));
  context.drawImage(source, x, y, cropWidth, cropHeight, 0, 0, cropped.width, cropped.height);
  return canvasBlob(cropped);
}

export async function renderBrochurePagePreview(file: File, pageNumber = 1): Promise<string> {
  const canvas = document.createElement('canvas');
  if (file.type === 'application/pdf') {
    const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const pdf = await loadingTask.promise;
    try {
      const page = await pdf.getPage(Math.min(Math.max(1, pageNumber), pdf.numPages));
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 1800 / Math.max(baseViewport.width, baseViewport.height)) });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not render the brochure page.');
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      return canvas.toDataURL('image/jpeg', 0.9);
    } finally {
      await loadingTask.destroy();
    }
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not render the brochure page.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    bitmap.close();
  }
}

export async function cropBrochureProducts(file: File, candidates: BrochureProductCandidate[]): Promise<Map<string, Blob>> {
  const output = new Map<string, Blob>();
  if (file.type === 'application/pdf') {
    const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const pdf = await loadingTask.promise;
    try {
      const byPage = new Map<number, BrochureProductCandidate[]>();
      for (const candidate of candidates) {
        if (!candidate.cropBox) continue;
        const pageNumber = candidate.pageNumber || 1;
        if (pageNumber <= pdf.numPages) byPage.set(pageNumber, [...(byPage.get(pageNumber) || []), candidate]);
      }
      for (const [pageNumber, pageCandidates] of byPage) {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 2000 / Math.max(baseViewport.width, baseViewport.height));
        const viewport = page.getViewport({ scale });
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = Math.ceil(viewport.width);
        pageCanvas.height = Math.ceil(viewport.height);
        const context = pageCanvas.getContext('2d');
        if (!context) throw new Error('Could not render a brochure page.');
        await page.render({ canvas: pageCanvas, canvasContext: context, viewport }).promise;
        for (const candidate of pageCandidates) {
          const blobPromise = makeCrop(pageCanvas, candidate);
          if (blobPromise) output.set(candidate.id, await blobPromise);
        }
      }
    } finally {
      await loadingTask.destroy();
    }
    return output;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const source = document.createElement('canvas');
    source.width = Math.max(1, Math.round(bitmap.width * scale));
    source.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = source.getContext('2d');
    if (!context) throw new Error('Could not read the brochure image.');
    context.drawImage(bitmap, 0, 0, source.width, source.height);
    for (const candidate of candidates) {
      const blobPromise = makeCrop(source, candidate);
      if (blobPromise) output.set(candidate.id, await blobPromise);
    }
  } finally {
    bitmap.close();
  }
  return output;
}
