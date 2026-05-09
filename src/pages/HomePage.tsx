import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SUBJECTS } from '../mockData';
import { 
  BookOpen, 
  ChevronRight, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  LayoutGrid, 
  List,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const HomePage: React.FC = () => {
  const { exams } = useApp();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExams = (exams || []).filter(e => {
    const matchesSubject = !selectedSubject || e.subjectId === selectedSubject;
    const matchesSearch = (e.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section - Simplified for Mobile */}
      <section className="relative bg-white pt-10 md:pt-20 pb-16 md:pb-32 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs md:text-sm font-black uppercase tracking-wider mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Luyện thi THPT 2025
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6 md:mb-8"
            >
              Chinh phục <br className="hidden md:block" />
              <span className="text-blue-600">kỳ thi THPT</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-xl text-slate-500 font-medium leading-relaxed mb-8 md:mb-10 max-w-2xl"
            >
              Hệ thống luyện thi mô phỏng CBT với đề thi ảnh gốc. 
              Làm quen với áp lực phòng thi ngay trên điện thoại.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={() => document.getElementById('exam-list')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-200 active:scale-95"
              >
                Làm đề ngay
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="exam-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
        {/* Subjects & Filters - Scrollable on Mobile */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 mb-8 md:mb-12">
          <div className="flex overflow-x-auto pb-4 md:pb-0 w-full lg:w-auto no-scrollbar gap-3">
            <button 
              onClick={() => setSelectedSubject(null)}
              className={cn(
                "whitespace-nowrap px-6 py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all active:scale-95",
                !selectedSubject ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
              )}
            >
              Tất cả
            </button>
            {SUBJECTS.map((subject) => (
              <button 
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={cn(
                  "whitespace-nowrap px-6 py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider transition-all active:scale-95",
                  selectedSubject === subject.id ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                )}
              >
                {subject.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm kiếm đề thi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-2xl transition-all outline-none font-medium shadow-sm"
              />
            </div>
            <div className="hidden md:flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-slate-100 text-slate-900 shadow-inner" : "text-slate-400 hover:text-slate-600")}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-slate-100 text-slate-900 shadow-inner" : "text-slate-400 hover:text-slate-600")}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Exam Grid/List */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={viewMode + (selectedSubject || 'all')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "grid gap-6",
              viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}
          >
            {filteredExams.map((exam) => (
              <Link 
                key={exam.id}
                to={`/exam/${exam.id}`}
                className={cn(
                  "group bg-white border border-slate-100 rounded-3xl transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 overflow-hidden",
                  viewMode === 'list' ? "flex items-center p-6" : "p-8"
                )}
              >
                <div className={cn(
                  "bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform",
                  viewMode === 'list' ? "mb-0 mr-6" : ""
                )}>
                  <BookOpen className="w-8 h-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-wider">
                      {exam.subjectId}
                    </span>
                    <span className="text-slate-300 font-bold text-xs">Mã đề: {exam.examCode}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                    {exam.title}
                  </h3>
                  
                  <div className="flex items-center gap-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {exam.durationMinutes} phút
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {exam.totalQuestions ?? exam.questionStructure?.length ?? 0} câu
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "hidden group-hover:flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-2xl transition-all",
                  viewMode === 'list' ? "ml-6" : "absolute bottom-8 right-8"
                )}>
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredExams.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy đề thi nào</h3>
            <p className="text-slate-500 font-medium">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        )}
      </main>
    </div>
  );
};
