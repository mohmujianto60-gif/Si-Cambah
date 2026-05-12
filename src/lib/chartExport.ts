// Si-CAMBAH — helpers untuk export chart Recharts ke PNG / SVG.
//
// Recharts render ke SVG, jadi SVG export = grab innerHTML <svg> element.
// PNG export = render SVG ke <canvas> via html2canvas, lalu download.

import html2canvas from 'html2canvas';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download chart container as PNG via html2canvas.
 * Pass the wrapper div ref (not the SVG itself) so background & padding
 * also get captured.
 */
export async function downloadChartPng(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2, // retina-quality
    logging: false,
    useCORS: true,
  });
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal generate PNG'));
        return;
      }
      triggerDownload(blob, filename);
      resolve();
    }, 'image/png');
  });
}

/**
 * Download the first <svg> inside the container as a standalone .svg file.
 */
export function downloadChartSvg(
  element: HTMLElement,
  filename: string,
): void {
  const svg = element.querySelector('svg');
  if (!svg) throw new Error('SVG tidak ditemukan di chart');

  // Clone supaya kita bisa inline computed styles tanpa mengganggu DOM asli
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  if (!clone.getAttribute('xmlns:xlink')) {
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);
  const blob = new Blob([source], {
    type: 'image/svg+xml;charset=utf-8',
  });
  triggerDownload(blob, filename);
}
