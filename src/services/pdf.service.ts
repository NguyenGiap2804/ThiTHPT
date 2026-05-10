type BuildEditedPdfOptions = {
  filename?: string;
};

export function getFinalPdfName(originalName: string, fallback = 'exam-final.pdf') {
  const trimmed = originalName.trim();
  if (!trimmed) return fallback;

  const withoutExtension = trimmed.replace(/\.pdf$/i, '');
  return `${withoutExtension}-final.pdf`;
}

export function normalizeSelectedPageIndexes(pageIndexes: number[], pageCount: number) {
  const uniqueIndexes = new Set<number>();

  for (const pageIndex of pageIndexes) {
    if (!Number.isInteger(pageIndex)) {
      throw new Error('Selected PDF page indexes must be integers.');
    }
    if (pageIndex < 0 || pageIndex >= pageCount) {
      throw new Error(`Selected PDF page index ${pageIndex} is out of range.`);
    }
    uniqueIndexes.add(pageIndex);
  }

  return Array.from(uniqueIndexes).sort((a, b) => a - b);
}

export async function buildEditedPdfFile(
  sourceFile: File,
  selectedPageIndexes: number[],
  options: BuildEditedPdfOptions = {},
) {
  if (selectedPageIndexes.length === 0) {
    throw new Error('Select at least one page before saving the PDF.');
  }

  const { PDFDocument } = await import('pdf-lib');
  const sourceBytes = await sourceFile.arrayBuffer();
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const pageCount = sourcePdf.getPageCount();
  const normalizedIndexes = normalizeSelectedPageIndexes(selectedPageIndexes, pageCount);

  if (normalizedIndexes.length === 0) {
    throw new Error('Select at least one page before saving the PDF.');
  }

  const finalPdf = await PDFDocument.create();
  const copiedPages = await finalPdf.copyPages(sourcePdf, normalizedIndexes);
  copiedPages.forEach(page => finalPdf.addPage(page));

  const pdfBytes = await finalPdf.save();
  const filename = options.filename || getFinalPdfName(sourceFile.name);

  return new File([pdfBytes], filename, { type: 'application/pdf' });
}
