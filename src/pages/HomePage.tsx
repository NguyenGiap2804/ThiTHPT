import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SUBJECTS } from '../mockData';
import { 
  BookOpen, 
  ChevronRight, 
  Clock, 
  FileText, 
  Search, 
  LayoutGrid, 
  Sparkles,
  Zap,
  Star,
  GraduationCap,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const HomePage: React.FC = () => {
  const { exams, attempts } = useApp();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const allExams = exams || [];
  const allAttempts = attempts || [];
  
  // LOGIC: Tính toán tiến độ dựa trên dữ liệu thật
  const progressData = useMemo(() => {
    return SUBJECTS.map(subject => {
      const subjectExams = allExams.filter(e => e.subjectId === subject.id);
      const attemptedExamIds = new Set(
        allAttempts
          .filter(a => subjectExams.some(e => e.id === a.examId))
          .map(a => a.examId)
      );
      
      const total = subjectExams.length;
      const done = attemptedExamIds.size;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      
      return {
        label: subject.name,
        id: subject.id,
        done,
        total,
        percent
      };
    }).filter(p => p.done > 0);
  }, [allExams, allAttempts]);

  // LOGIC: Hoạt động gần đây
  const recentActivities = useMemo(() => {
    return allAttempts
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 4)
      .map(attempt => {
        const exam = allExams.find(e => e.id === attempt.examId);
        return {
          id: attempt.id,
          title: exam?.title || 'Đề thi không xác định',
          score: attempt.score,
          date: new Date(attempt.submittedAt).toLocaleDateString('vi-VN'),
        };
      });
  }, [allAttempts, allExams]);

  // LOGIC: Lọc đề thi thực tế (Tìm kiếm + Môn học)
  const filteredExams = useMemo(() => {
    return allExams
      .filter(e => {
        const matchesSubject = !selectedSubject || e.subjectId === selectedSubject;
        const matchesSearch = (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (e.examCode || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSubject && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }, [allExams, selectedSubject, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Hero Section */}
      <section className="relative bg-white pt-6 pb-10 overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
              >
                <Sparkles className="w-3 h-3" />
                Hệ thống luyện thi thông minh
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                Luyện thi THPT <br/>
                <span className="text-blue-600">Đơn giản & Hiệu quả</span>
              </h1>
              
              <div className="relative max-w-md mx-auto md:mx-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm đề thi, mã đề, môn học..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-sm text-slate-700 shadow-sm"
                />
              </div>
            </div>
            
            <div className="hidden lg:block w-80 relative">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-white rounded-3xl shadow-xl border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-slate-900 text-sm">Tiến độ của bạn</h4>
                </div>
                <div className="space-y-4">
                  {progressData.length > 0 ? progressData.map(item => (
                    <div key={item.id}>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-500">
                        <span>{item.label}</span>
                        <span>{item.percent}%</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percent}%` }}
                          className="h-full rounded-full bg-blue-600" 
                        />
                      </div>
                    </div>
                  )) : (
                    <div className="py-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bắt đầu làm bài để thấy tiến độ</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Môn học Filters */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-10">
          <button 
            onClick={() => setSelectedSubject(null)}
            className={cn(
              "p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border-2",
              !selectedSubject ? "bg-slate-900 border-slate-900 shadow-lg" : "bg-white border-transparent hover:border-slate-100 shadow-sm"
            )}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", !selectedSubject ? "bg-white/10 text-white" : "bg-slate-50 text-slate-400")}>
              <LayoutGrid className="w-4 h-4" />
            </div>
            <span className={cn("font-black text-[9px] uppercase tracking-widest", !selectedSubject ? "text-white" : "text-slate-600")}>Tất cả</span>
          </button>
          
          {SUBJECTS.map((subject) => (
            <button 
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={cn(
                "p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border-2",
                selectedSubject === subject.id ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-100" : "bg-white border-transparent hover:border-slate-100 shadow-sm"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", selectedSubject === subject.id ? "bg-white/10 text-white" : "bg-blue-50 text-blue-600")}>
                <BookOpen className="w-4 h-4" />
              </div>
              <span className={cn("font-black text-[9px] uppercase tracking-widest", selectedSubject === subject.id ? "text-white" : "text-slate-600")}>{subject.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main List */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  {searchTerm || selectedSubject ? 'Kết quả tìm kiếm' : 'Đề thi mới nhất'}
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredExams.length} đề thi</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredExams.map((exam, idx) => (
                  <ExamCard key={exam.id} exam={exam} delay={idx * 0.03} />
                ))}
              </AnimatePresence>
            </div>

            {filteredExams.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100"
              >
                <Search className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Không tìm thấy đề thi phù hợp</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar Activities */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <History className="w-4 h-4 text-blue-600" />
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">Hoạt động gần đây</h4>
                </div>
                
                <div className="space-y-4">
                  {recentActivities.length > 0 ? recentActivities.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-900 leading-tight line-clamp-2 mb-1">{activity.title}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{activity.date}</span>
                          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                            {Number(activity.score || 0).toFixed(1)}đ
                          </span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chưa có hoạt động</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ExamCard = ({ exam, delay = 0 }: { exam: any, delay?: number }) => {
  // LOGIC: Việt hóa tên môn học
  const subjectName = useMemo(() => {
    return SUBJECTS.find(s => s.id === exam.subjectId)?.name || exam.subjectId;
  }, [exam.subjectId]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay }}
    >
      <Link 
        to={`/exam/${exam.id}`}
        className="group block bg-white rounded-2xl p-5 border border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all relative h-full"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-wider">
            {subjectName}
          </span>
          {exam.isFeatured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
        </div>

        <h3 className="text-sm font-black text-slate-800 mb-4 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
          {exam.title}
        </h3>

        <div className="flex items-center justify-between mt-auto text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              {exam.durationMinutes}p
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" />
              {exam.totalQuestions ?? 0} câu
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group-hover:bg-blue-700 shadow-lg shadow-blue-200/50">
            <span>Làm bài</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
