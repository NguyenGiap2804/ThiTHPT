import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ImageOff, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { cn, getImageUrl } from '../lib/utils';

interface ExamImageViewerProps {
  images: string[];
}

export const ExamImageViewer: React.FC<ExamImageViewerProps> = ({ images }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(0.85);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageUrls = images.map(getImageUrl);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.4));
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const markImageFailed = (url: string) => {
    setFailedImages(prev => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const scrollToPage = (idx: number) => {
    pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(idx);
  };

  useEffect(() => {
    const observerOptions = {
      root: scrollContainerRef.current,
      threshold: 0.3,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-page-index') || '0');
          setCurrentPage(index);
        }
      });
    }, observerOptions);

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [images.length]);

  useEffect(() => {
    setFailedImages(new Set());
    setCurrentPage(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [images.join('|')]);

  return (
    <div className={cn(
      "relative flex flex-col bg-[#2e3136] overflow-hidden transition-all duration-500 font-sans",
      isFullScreen ? "fixed inset-0 z-[100]" : "h-full"
    )}>
      {/* Top Header/Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#1a1c1e] text-slate-300 border-b border-slate-700/50 shadow-lg z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#2b2d31] rounded-lg px-3 py-1.5 border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trang</span>
            <span className="text-sm font-black text-white">{currentPage + 1}</span>
            <span className="text-[11px] text-slate-500">/ {images.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#2b2d31] rounded-lg px-2 py-1 border border-slate-700">
            <button onClick={handleZoomOut} className="p-1 rounded hover:bg-slate-700 transition-colors">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-medium w-10 text-center text-slate-400">
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
        <aside className="w-40 bg-[#1e2024] border-r border-slate-700/30 flex flex-col overflow-hidden hidden md:flex">
          <div className="p-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-700/20">
            Trang tài liệu
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
            {imageUrls.map((imageUrl, idx) => (
              <button
                key={idx}
                onClick={() => scrollToPage(idx)}
                className={cn(
                  "relative group w-full aspect-[3/4] rounded-lg border-2 transition-all duration-300 overflow-hidden shadow-sm",
                  currentPage === idx 
                    ? "border-blue-500 shadow-blue-900/20 ring-4 ring-blue-500/10" 
                    : "border-transparent hover:border-slate-600 bg-[#2b2d31]"
                )}
              >
                {failedImages.has(imageUrl) ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
                    <ImageOff className="h-6 w-6" />
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={`Thumb ${idx + 1}`}
                    className={cn(
                      "w-full h-full object-cover transition-opacity duration-300",
                      currentPage === idx ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                    )}
                    referrerPolicy="no-referrer"
                    onError={() => markImageFailed(imageUrl)}
                  />
                )}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white backdrop-blur-[2px]">
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Document Content Area - Continuous Scroll */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-[#323639] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent p-8 scroll-smooth"
        >
          <div className="flex flex-col items-center gap-8 min-h-full">
            {imageUrls.map((imageUrl, idx) => (
              <motion.div
                key={idx}
                ref={el => pageRefs.current[idx] = el}
                data-page-index={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                style={{ 
                  scale: zoom,
                  transformOrigin: 'top center'
                }}
                className="shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm bg-white h-fit max-w-[900px] w-full"
              >
                {failedImages.has(imageUrl) ? (
                  <div className="flex min-h-[360px] w-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
                    <ImageOff className="h-10 w-10 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-700">Không tải được ảnh trang {idx + 1}</p>
                      <p className="mt-1 max-w-md text-xs font-medium text-slate-400">
                        File ảnh không còn tồn tại trên server lưu trữ. Vui lòng tải lại file đề trong trang quản trị.
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt={`Exam Page ${idx + 1}`}
                    className="w-full h-auto select-none"
                    referrerPolicy="no-referrer"
                    onError={() => markImageFailed(imageUrl)}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
