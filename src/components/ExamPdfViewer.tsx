import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'motion/react';
import {
  FileWarning,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Setup pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ExamPdfViewerProps {
  pdfUrl: string | null;
}

export const ExamPdfViewer: React.FC<ExamPdfViewerProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoaded(true);
  };

  const updateContainerWidth = useCallback(() => {
    if (scrollContainerRef.current) {
      // Subtract padding (p-8 = 32px each side)
      setContainerWidth(scrollContainerRef.current.clientWidth - 64);
    }
  }, []);

  useEffect(() => {
    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
  }, [updateContainerWidth, isFullScreen]);

  const syncCurrentPage = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || numPages === 0) return;

    const containerRect = container.getBoundingClientRect();
    const targetY = containerRect.top + Math.min(containerRect.height * 0.35, 300);

    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    pageRefs.current.forEach((page, index) => {
      if (!page) return;
      const rect = page.getBoundingClientRect();
      const distance = Math.abs(rect.top - targetY);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    setCurrentPage(bestIndex + 1);
  }, [numPages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      window.requestAnimationFrame(syncCurrentPage);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [syncCurrentPage]);

  const scrollToPage = (pageNumber: number) => {
    const index = pageNumber - 1;
    pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(pageNumber);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col bg-[#2e3136] overflow-hidden transition-all duration-500 font-sans",
        isFullScreen ? "fixed inset-0 z-[100]" : "h-full"
      )}
    >
      {/* Top Header/Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#1a1c1e] text-slate-300 border-b border-slate-700/50 shadow-lg z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#2b2d31] rounded-lg px-3 py-1.5 border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trang</span>
            <span className="text-sm font-black text-white">{currentPage}</span>
            <span className="text-[11px] text-slate-500">/ {numPages || '--'}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#2b2d31] rounded-lg px-2 py-1 border border-slate-700">
            <button onClick={handleZoomOut} className="p-1 rounded hover:bg-slate-700 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-medium w-12 text-center text-slate-400">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={handleZoomIn} className="p-1 rounded hover:bg-slate-700 transition-colors">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
            title={isFullScreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> : <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Thumbnails */}
        {numPages > 0 && (
          <aside className="w-44 bg-[#1e2024] border-r border-slate-700/30 flex flex-col overflow-hidden hidden md:flex">
            <div className="p-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-700/20">
              Xem trước trang
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
              <Document file={pdfUrl} loading={null}>
                {Array.from(new Array(numPages), (_, index) => (
                  <button
                    key={`thumb_${index + 1}`}
                    onClick={() => scrollToPage(index + 1)}
                    className={cn(
                      "relative group w-full rounded-lg border-2 transition-all duration-300 overflow-hidden shadow-sm bg-[#2b2d31]",
                      currentPage === index + 1
                        ? "border-blue-500 shadow-blue-900/20 ring-4 ring-blue-500/10"
                        : "border-transparent hover:border-slate-600"
                    )}
                  >
                    <div className="pointer-events-none">
                      <Page
                        pageNumber={index + 1}
                        width={140}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </div>
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white backdrop-blur-[2px]">
                      {index + 1}
                    </div>
                  </button>
                ))}
              </Document>
            </div>
          </aside>
        )}

        {/* PDF Content Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-[#323639] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent p-8 scroll-smooth"
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-sm font-medium">Đang tải đề thi...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 p-8 text-center bg-[#2b2d31]">
                <FileWarning className="w-16 h-16 text-amber-500" />
                <div className="max-w-md">
                  <h3 className="text-xl font-bold text-white">Không thể hiển thị đề thi</h3>
                  <p className="text-sm mt-3 text-slate-400 leading-relaxed">
                    {typeof pdfUrl === 'string' && pdfUrl.startsWith('http') ? (
                      <>
                        Trình duyệt không thể lấy file từ server (Lỗi CORS hoặc kết nối).
                        Hãy đảm bảo bạn đã cấu hình CORS trên Supabase cho domain <strong>{window.location.hostname}</strong>.
                      </>
                    ) : (
                      <>
                        Có lỗi xảy ra khi xử lý file PDF này. Vui lòng thử chọn lại file hoặc kiểm tra định dạng file.
                      </>
                    )}
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all text-sm"
                    >
                      Thử lại
                    </button>
                    {typeof pdfUrl === 'string' && (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Mở trực tiếp trong tab mới
                      </a>
                    )}
                  </div>
                </div>
              </div>
            }
          >
            <div className="flex flex-col items-center gap-8 pb-20">
              {Array.from(new Array(numPages), (_, index) => (
                <div
                  key={`page_${index + 1}`}
                  ref={el => pageRefs.current[index] = el}
                  className="relative"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "200px" }}
                    transition={{ duration: 0.5 }}
                    className="shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white rounded-sm overflow-hidden"
                  >
                    <Page
                      pageNumber={index + 1}
                      scale={zoom}
                      width={Math.min(containerWidth, 1200)}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      loading={
                        <div
                          style={{ width: Math.min(containerWidth, 900) * zoom, aspectRatio: '3/4' }}
                          className="bg-white flex items-center justify-center"
                        >
                          <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                        </div>
                      }
                    />
                  </motion.div>
                  <div className="absolute -left-12 top-0 text-slate-500 text-xs font-bold md:block hidden">
                    P.{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};
