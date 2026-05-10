export type PdfPageSelection = {
  totalPages: number;
  keptPages: Set<number>;
  initialized: boolean;
};

export const makePdfPageSet = (pageCount: number): Set<number> =>
  new Set<number>(Array.from({ length: pageCount }, (_, index) => index + 1));

export const toSortedPdfPageNumbers = (pages: Set<number>) => {
  const pageNumbers: number[] = [];
  pages.forEach(pageNumber => pageNumbers.push(pageNumber));
  return pageNumbers.sort((a, b) => a - b);
};

export const createEmptyPdfPageSelection = (): PdfPageSelection => ({
  totalPages: 0,
  keptPages: new Set<number>(),
  initialized: false,
});

export function initializePdfPageSelection(
  current: PdfPageSelection,
  pageCount: number,
): PdfPageSelection {
  if (current.initialized) {
    return {
      ...current,
      totalPages: pageCount,
    };
  }

  return {
    totalPages: pageCount,
    keptPages: makePdfPageSet(pageCount),
    initialized: true,
  };
}
