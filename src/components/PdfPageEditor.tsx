import React, { useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { CheckSquare, FileText, Loader2, Square, XCircle } from 'lucide-react';
import { PdfEditorState } from '../hooks/usePdfEditor';
import { pdfDocumentOptions } from '../lib/pdfjs';
import { cn } from '../lib/utils';

type PdfPageEditorProps = {
  fileUrl: string | null;
  fileName?: string;
  editor: PdfEditorState;
  busy?: boolean;
  status?: string;
  uploadProgress?: number | null;
};

type LazyPdfThumbnailProps = {
  pageNumber: number;
  kept: boolean;
  onToggle: (keep: boolean) => void;
};

const LazyPdfThumbnail: React.FC<LazyPdfThumbnailProps> = ({ pageNumber, kept, onToggle }) => {
  const itemRef = useRef<HTMLLabelElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = itemRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '500px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <label
      ref={itemRef}
      className={cn(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all',
        kept
          ? 'border-blue-300 ring-2 ring-blue-100'
          : 'border-slate-200 opacity-70 hover:opacity-100',
      )}
    >
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-xs font-black text-white backdrop-blur">
        <input
          type="checkbox"
          checked={kept}
          onChange={event => onToggle(event.target.checked)}
          className="h-4 w-4 rounded border-white/40 accent-blue-600"
          aria-label={`Giữ trang ${pageNumber}`}
        />
        Page {pageNumber}
      </div>

      <div className="flex aspect-[3/4] min-h-[220px] items-center justify-center bg-slate-100">
        {isVisible ? (
          <Page
            pageNumber={pageNumber}
            width={190}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            }
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <FileText className="h-8 w-8" />
            <span className="text-xs font-bold">Page {pageNumber}</span>
          </div>
        )}
      </div>

      <div className={cn(
        'flex items-center justify-between border-t px-3 py-2 text-xs font-black',
        kept ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-400',
      )}>
        <span>{kept ? 'KEEP' : 'REMOVE'}</span>
        {kept ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
      </div>
    </label>
  );
};

export const PdfPageEditor: React.FC<PdfPageEditorProps> = ({
  fileUrl,
  fileName,
  editor,
  busy = false,
  status = '',
  uploadProgress = null,
}) => {
  const {
    totalPages,
    keptPages,
    keptCount,
    error,
    setPageCount,
    togglePage,
    selectAll,
    removeAll,
    keepOnlySelected,
  } = editor;

  if (!fileUrl) {
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400">
        <FileText className="h-14 w-14 opacity-30" />
        <div>
          <p className="text-sm font-black text-slate-500">Chưa có PDF local</p>
          <p className="mt-1 text-xs font-semibold">Chọn file PDF để xem trang và loại bỏ trang thừa trước khi lưu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 p-4 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">{fileName || 'PDF đã chọn'}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">
              Tổng {totalPages || '--'} trang · Giữ {keptCount}/{totalPages || '--'} trang
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={busy || totalPages === 0}
              className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={removeAll}
              disabled={busy || totalPages === 0}
              className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              Remove All
            </button>
            <button
              type="button"
              onClick={keepOnlySelected}
              disabled={busy || totalPages === 0}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              Keep Only Selected
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      <Document
        key={fileUrl}
        file={fileUrl}
        options={pdfDocumentOptions}
        onLoadSuccess={({ numPages }) => setPageCount(numPages)}
        onLoadError={loadError => {
          console.error('PDF page editor failed to load document', loadError);
        }}
        loading={
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-bold">Đang đọc PDF local...</p>
          </div>
        }
        error={
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 bg-amber-50 p-8 text-center text-amber-700">
            <XCircle className="h-12 w-12" />
            <div>
              <p className="font-black">Không đọc được PDF này</p>
              <p className="mt-1 text-xs font-semibold">Vui lòng chọn lại file hoặc kiểm tra định dạng PDF.</p>
            </div>
          </div>
        }
      >
        <div className="grid max-h-[620px] grid-cols-1 gap-4 overflow-y-auto bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1;
            return (
              <LazyPdfThumbnail
                key={`${fileUrl}-${pageNumber}`}
                pageNumber={pageNumber}
                kept={keptPages.has(pageNumber)}
                onToggle={keep => togglePage(pageNumber, keep)}
              />
            );
          })}
        </div>
      </Document>

      {busy && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
            <p className="mt-4 text-sm font-black text-slate-900">{status || 'Đang xử lý PDF...'}</p>
            {uploadProgress !== null && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
