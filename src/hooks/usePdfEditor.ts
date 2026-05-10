import { useCallback, useMemo, useState } from 'react';
import {
  createEmptyPdfPageSelection,
  initializePdfPageSelection,
  makePdfPageSet,
  toSortedPdfPageNumbers,
} from '../services/pdf-page-selection.service';
import { buildEditedPdfFile, getFinalPdfName } from '../services/pdf.service';

export function usePdfEditor() {
  const [selection, setSelection] = useState(createEmptyPdfPageSelection);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { totalPages, keptPages } = selection;
  const keptCount = keptPages.size;

  const selectedPageIndexes = useMemo(
    () => toSortedPdfPageNumbers(keptPages).map(pageNumber => pageNumber - 1),
    [keptPages],
  );

  const setPageCount = useCallback((pageCount: number) => {
    setSelection(prev => initializePdfPageSelection(prev, pageCount));
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setSelection(createEmptyPdfPageSelection());
    setIsBuilding(false);
    setError(null);
  }, []);

  const togglePage = useCallback((pageNumber: number, keep?: boolean) => {
    setSelection(prev => {
      const next = new Set<number>(prev.keptPages);
      const shouldKeep = keep ?? !next.has(pageNumber);

      if (shouldKeep) {
        next.add(pageNumber);
      } else {
        next.delete(pageNumber);
      }

      return {
        ...prev,
        keptPages: next,
      };
    });
    setError(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelection(prev => ({
      ...prev,
      keptPages: makePdfPageSet(prev.totalPages),
      initialized: true,
    }));
    setError(null);
  }, []);

  const removeAll = useCallback(() => {
    setSelection(prev => ({
      ...prev,
      keptPages: new Set<number>(),
      initialized: true,
    }));
    setError('Cần giữ ít nhất 1 trang trước khi lưu.');
  }, []);

  const keepOnlySelected = useCallback(() => {
    setSelection(prev => {
      const normalized = toSortedPdfPageNumbers(prev.keptPages)
        .filter(pageNumber => pageNumber >= 1 && pageNumber <= prev.totalPages);
      return {
        ...prev,
        keptPages: new Set<number>(normalized),
        initialized: true,
      };
    });
    setError(keptPages.size === 0 ? 'Cần giữ ít nhất 1 trang trước khi lưu.' : null);
  }, [keptPages.size]);

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
