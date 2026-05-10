import { pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (pdfjs.GlobalWorkerOptions.workerSrc !== pdfWorkerUrl) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export { pdfjs };

export const pdfDocumentOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};
