import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  FileText, 
  AlertCircle, 
  ChevronLeft, 
  Play, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { SUBJECTS } from '../mockData';
import { cn } from '../lib/utils';

export const ExamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, fetchExamById } = useApp();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const exam = exams?.find(e => e.id === id);

  React.useEffect(() => {
    if (id && (!exam || !exam.questionStructure || exam.questionStructure.length === 0)) {
      setIsLoading(true);
      fetchExamById(id).finally(() => setIsLoading(false));
    }
  }, [id, exam, fetchExamById]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!exam || !exam.questionStructure || exam.questionStructure.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Không tìm thấy thông tin đề thi hoặc đề thi chưa có câu hỏi.</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 font-bold hover:underline">Quay lại trang chủ</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Exam Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-wider">
                  {SUBJECTS.find(s => s.id === exam.subjectId)?.name || exam.subjectId}
                </span>
                <span className="text-slate-400 font-bold text-sm">Mã đề: {exam.examCode}</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                {exam.title}
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <Clock className="w-4 h-4" />
                    Thời gian
                  </div>
                  <p className="text-xl font-black text-slate-900">{exam.durationMinutes} phút</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <FileText className="w-4 h-4" />
                    Số câu hỏi
                  </div>
                  <p className="text-xl font-black text-slate-900">{exam.questionStructure?.length || 0} câu</p>
                </div>
                <div className="space-y-1 hidden sm:block">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" />
                    Hình thức
                  </div>
                  <p className="text-xl font-black text-slate-900">Trắc nghiệm</p>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
                <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-800 leading-relaxed">
                  <p className="font-bold mb-1">Lưu ý trước khi làm bài:</p>
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Đề thi hiển thị dưới dạng ảnh gốc để đảm bảo độ chính xác.</li>
                    <li>Bạn có thể phóng to, thu nhỏ ảnh đề thi trong lúc làm bài.</li>
                    <li>Hệ thống tự động lưu đáp án sau mỗi lần chọn.</li>
                    <li>Bài làm sẽ tự động nộp khi hết thời gian.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24 hidden md:block"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Sẵn sàng chưa?</h3>
              <button 
                onClick={() => navigate(`/session/${exam.id}`)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200 active:scale-95 mb-4"
              >
                <Play className="w-6 h-6 fill-current" />
                Bắt đầu làm bài
              </button>
              <p className="text-center text-slate-400 text-xs font-medium">
                Bằng cách nhấn bắt đầu, thời gian sẽ bắt đầu đếm ngược ngay lập tức.
              </p>
            </motion.div>

            {/* Mobile Fixed Bottom Button */}
            <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-30">
              <button 
                onClick={() => navigate(`/session/${exam.id}`)}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-200 active:scale-95"
              >
                <Play className="w-6 h-6 fill-current" />
                Bắt đầu làm bài
              </button>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <h4 className="font-bold mb-4">Thống kê đề thi</h4>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Lượt làm bài</span>
                  <span className="font-bold">{exam.stats?.attemptCount?.toLocaleString('vi-VN') || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Điểm trung bình</span>
                  <span className="font-bold text-blue-400">
                    {exam.stats?.averageScore ? exam.stats.averageScore.toFixed(1) : '0.0'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Độ khó</span>
                  <span className={cn(
                    "font-bold",
                    exam.stats?.difficulty === 'Dễ' ? 'text-emerald-400' : 
                    exam.stats?.difficulty === 'Khó' ? 'text-rose-400' : 'text-amber-400'
                  )}>
                    {exam.stats?.difficulty || 'Trung bình'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
