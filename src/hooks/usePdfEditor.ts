import { useCallback, useMemo, useState } from 'react';
import { buildEditedPdfFile, getFinalPdfName } from '../services/pdf.service';

const makePageSet = (pageCount: number): Set<number> =>
  new Set<number>(Array.from({ length: pageCount }, (_, index) => index + 1));

const toSortedPageNumbers = (pages: Set<number>) => {
  const pageNumbers: number[] = [];
  pages.forEach(pageNumber => pageNumbers.push(pageNumber));
  return pageNumbers.sort((a, b) => a - b);
};

export function usePdfEditor() {
  const [totalPages, setTotalPages] = useState(0);
  const [keptPages, setKeptPages] = useState<Set<number>>(() => new Set<number>());
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keptCount = keptPages.size;

  const selectedPageIndexes = useMemo(
    () => toSortedPageNumbers(keptPages).map(pageNumber => pageNumber - 1),
    [keptPages],
  );

  const setPageCount = useCallback((pageCount: number) => {
    setTotalPages(pageCount);
    setKeptPages(makePageSet(pageCount));
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setTotalPages(0);
    setKeptPages(new Set<number>());
    setIsBuilding(false);
    setError(null);
  }, []);

  const togglePage = useCallback((pageNumber: number, keep?: boolean) => {
    setKeptPages(prev => {
      const next = new Set<number>(prev);
      const shouldKeep = keep ?? !next.has(pageNumber);

      if (shouldKeep) {
        next.add(pageNumber);
      } else {
        next.delete(pageNumber);
      }

      return next;
    });
    setError(null);
  }, []);

  const selectAll = useCallback(() => {
    setKeptPages(makePageSet(totalPages));
    setError(null);
  }, [totalPages]);

  const removeAll = useCallback(() => {
    setKeptPages(new Set<number>());
    setError('Cần giữ ít nhất 1 trang trước khi lưu.');
  }, []);

  const keepOnlySelected = useCallback(() => {
    setKeptPages(prev => {
      const normalized = toSortedPageNumbers(prev)
        .filter(pageNumber => pageNumber >= 1 && pageNumber <= totalPages);
      return new Set<number>(normalized);
    });
    setError(keptPages.size === 0 ? 'Cần giữ ít nhất 1 trang trước khi lưu.' : null);
  }, [keptPages.size, totalPages]);

  const buildFinalPdf = useCallback(async (file: File) => {
    if (selectedPageIndexes.length === 0) {
      const message = 'Cần giữ ít nhất 1 trang trước khi lưu.';
      setError(message);
      throw new Error(message);
    }

    setIsBuilding(true);
    setError(null);

    try {
      return await buildEditedPdfFile(file, selectedPageIndexes, {
        filename: getFinalPdfName(file.name),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo PDF cuối cùng.';
      setError(message);
      throw err;
    } finally {
      setIsBuilding(false);
    }
  }, [selectedPageIndexes]);

  return {
    totalPages,
    keptPages,
    keptCount,
    selectedPageIndexes,
    isBuilding,
    error,
    setPageCount,
    reset,
    togglePage,
    selectAll,
    removeAll,
    keepOnlySelected,
    buildFinalPdf,
  };
}

export type PdfEditorState = ReturnType<typeof usePdfEditor>;
