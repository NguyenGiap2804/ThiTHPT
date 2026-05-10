import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ChevronLeft, Clock, Columns, Layout, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnswerSheet } from '../components/AnswerSheet';
import { ExamImageViewer } from '../components/ExamImageViewer';
import { AttemptAnswer } from '../types';
import { cn, formatTime } from '../lib/utils';

export const ExamSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, addAttempt, addNotification, fetchExamById } = useApp();

  const exam = exams.find(e => e.id === id);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [layout, setLayout] = useState<'split' | 'stacked'>('split');

  useEffect(() => {
    if (id && (!exam || !exam.questionStructure || exam.questionStructure.length === 0)) {
      fetchExamById(id);
    }
  }, [id, exam, fetchExamById]);

  useEffect(() => {
    if (exam?.durationMinutes && !timerReady) {
      setTimeLeft(exam.durationMinutes * 60);
      setTimerReady(true);
    }
  }, [exam?.durationMinutes, timerReady]);

  useEffect(() => {
    if (exam?.questionStructure && answers.length === 0) {
      setAnswers(exam.questionStructure.map(q => ({ questionId: q.id })));
    }
  }, [exam?.questionStructure, answers.length]);

  const handleSubmit = useCallback(async () => {
    if (!exam?.questionStructure || isFinished) return;

    setIsFinished(true);
    setShowConfirmSubmit(false);

    try {
      const savedAttempt = await addAttempt({
        examId: exam.id,
        timeSpent: exam.durationMinutes * 60 - timeLeft,
        answers,
      });

      addNotification({
        title: 'Nộp bài thành công',
        message: `Bạn đã hoàn thành bài thi ${exam.title} với điểm số ${savedAttempt.score}.`,
        type: 'success',
      });
      
      // Navigate and REPLACE the history entry so they can't go back
      navigate(`/result/${savedAttempt.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to submit attempt', error);
      setIsFinished(false);
      addNotification({
        title: 'Lỗi',
        message: 'Không thể nộp bài lúc này. Vui lòng kiểm tra kết nối và thử lại.',
        type: 'error',
      });
    }
  }, [exam, answers, timeLeft, isFinished, addAttempt, addNotification, navigate]);

  useEffect(() => {
    if (!timerReady || isFinished) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerReady, timeLeft, isFinished, handleSubmit]);

  if (!exam || !exam.questionStructure || answers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  const answeredCount = answers.filter(a => a.selectedOption || a.trueFalseAnswers || a.shortAnswer).length;

  const handleAnswerChange = (questionId: string, answer: Partial<AttemptAnswer>) => {
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, ...answer } : a));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev =>
      prev.includes(questionId) ? prev.filter(item => item !== questionId) : [...prev, questionId]
    );
  };

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-col font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="hidden md:inline">Thoát</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold text-slate-900 leading-tight truncate">
              {exam.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              {answeredCount}/{exam.questionStructure.length} câu đã trả lời
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className={cn(
            "flex items-center gap-2 px-3 md:px-5 py-2.5 rounded-2xl font-mono font-bold text-base md:text-xl transition-all shadow-sm",
            timeLeft < 300
              ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200 animate-pulse"
              : "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
          )}>
            <Clock className={cn("w-5 h-5 md:w-6 md:h-6", timeLeft < 300 ? "text-rose-500" : "text-slate-400")} />
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => setLayout(l => l === 'split' ? 'stacked' : 'split')}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hidden lg:block"
            title="Thay đổi bố cục"
          >
            {layout === 'split' ? <Layout className="w-6 h-6" /> : <Columns className="w-6 h-6" />}
          </button>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            disabled={isFinished}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 text-white px-4 md:px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-200 active:scale-95 text-sm md:text-base"
          >
            {isFinished ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isFinished ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </header>

      <main className={cn(
        "flex-1 p-4 md:p-6 gap-6",
        layout === 'split'
          ? "flex flex-col overflow-y-auto lg:flex-row lg:h-full lg:overflow-hidden"
          : "flex flex-col overflow-y-auto"
      )}>
        <div className={cn(
          "transition-all duration-500 ease-in-out shrink-0",
          layout === 'split'
            ? "w-full h-[65vh] min-h-[520px] lg:flex-[1.4] lg:h-full lg:min-h-0 lg:overflow-hidden"
            : "w-full h-[800px]"
        )}>
          <div className="h-full bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 relative">
            {(exam.imagePages || []).length > 0 ? (
              <ExamImageViewer images={exam.imagePages || []} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-bold">
                Đề thi chưa có ảnh trang đề.
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "transition-all duration-500 ease-in-out min-w-0",
          layout === 'split'
            ? "w-full min-h-[720px] lg:flex-1 lg:h-full lg:min-h-0 lg:overflow-hidden"
            : "w-full min-h-[720px]"
        )}>
          <AnswerSheet
            questions={exam.questionStructure}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            flaggedQuestions={flaggedQuestions}
            onToggleFlag={toggleFlag}
            currentIdx={currentIdx}
            onJumpToQuestion={setCurrentIdx}
          />
        </div>
      </main>

      <AnimatePresence>
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmSubmit(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full overflow-hidden"
            >
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
                flaggedQuestions.length > 0 ? "bg-amber-100" : (answeredCount < exam.questionStructure.length ? "bg-rose-100" : "bg-emerald-100")
              )}>
                {flaggedQuestions.length > 0 ? (
                  <AlertTriangle className="w-10 h-10 text-amber-600" />
                ) : (
                  answeredCount < exam.questionStructure.length ? (
                    <AlertTriangle className="w-10 h-10 text-rose-600" />
                  ) : (
                    <Send className="w-10 h-10 text-emerald-600" />
                  )
                )}
              </div>

              <h2 className="text-2xl font-black text-slate-900 text-center mb-4 tracking-tight">
                {flaggedQuestions.length > 0 ? "Còn câu đang đánh dấu!" : (answeredCount < exam.questionStructure.length ? "Chưa làm hết câu hỏi!" : "Xác nhận nộp bài?")}
              </h2>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-600 text-center leading-relaxed">
                    Bạn đã hoàn thành <span className="font-bold text-blue-600">{answeredCount} / {exam.questionStructure.length}</span> câu hỏi.
                  </p>
                </div>

                {flaggedQuestions.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-sm text-amber-800 font-medium leading-relaxed text-center">
                      Bạn đang đánh dấu <span className="font-bold">{flaggedQuestions.length} câu</span> cần xem lại: 
                      <span className="block mt-1 font-bold">
                        {flaggedQuestions.map(id => {
                          const idx = exam.questionStructure.findIndex(q => q.id === id);
                          return `Câu ${idx + 1}`;
                        }).join(', ')}
                      </span>
                    </p>
                  </div>
                )}

                {answeredCount < exam.questionStructure.length && (
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-sm text-rose-800 font-medium leading-relaxed text-center">
                      Lưu ý: Bạn còn <span className="font-bold">{exam.questionStructure.length - answeredCount} câu</span> chưa chọn đáp án. Nộp bài bây giờ sẽ không thể sửa đổi kết quả.
                    </p>
                  </div>
                )}

                {flaggedQuestions.length === 0 && answeredCount === exam.questionStructure.length && (
                  <p className="text-sm text-slate-500 text-center px-4 leading-relaxed">
                    Bạn đã hoàn thành đầy đủ các câu hỏi. Hãy nhấn nộp bài để xem kết quả ngay nhé!
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                >
                  Tiếp tục làm
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isFinished}
                  className={cn(
                    "flex-1 px-6 py-4 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                    flaggedQuestions.length > 0 || answeredCount < exam.questionStructure.length 
                      ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" 
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  )}
                >
                  {isFinished ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Nộp bài ngay
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full overflow-hidden"
            >
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-rose-600" />
              </div>

              <h2 className="text-2xl font-black text-slate-900 text-center mb-4 tracking-tight">
                Xác nhận thoát?
              </h2>

              <p className="text-sm text-slate-500 text-center mb-8 px-4 leading-relaxed font-medium">
                Nếu thoát bây giờ, toàn bộ tiến trình làm bài của bạn sẽ bị mất và không thể khôi phục. Bạn có chắc chắn muốn rời khỏi bài thi?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                >
                  Quay lại
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  Đồng ý thoát
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
