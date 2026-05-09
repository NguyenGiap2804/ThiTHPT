import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, BookOpen, CheckCircle2, ChevronLeft, Clock, RotateCcw, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Attempt, AttemptAnswer } from '../types';
import { cn, formatTime } from '../lib/utils';

const formatAnswerValue = (value: unknown): React.ReactNode => {
  if (value === undefined || value === null || value === '') return 'Chưa trả lời';

  if (typeof value === 'object') {
    return (
      <div className="space-y-1">
        {Object.entries(value as Record<string, boolean | null>).map(([key, item]) => (
          <div key={key} className="flex justify-between gap-4 text-sm">
            <span>Ý {key}:</span>
            <span className="font-bold">{item === true ? 'ĐÚNG' : item === false ? 'SAI' : 'CHƯA CHỌN'}</span>
          </div>
        ))}
      </div>
    );
  }

  return String(value);
};

const getUserAnswerValue = (answer?: AttemptAnswer) => {
  if (!answer) return null;
  return answer.selectedOption ?? answer.trueFalseAnswers ?? answer.shortAnswer ?? null;
};

export const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { attempts, exams, fetchAttemptById, fetchExamById } = useApp();
  const [loadedAttempt, setLoadedAttempt] = useState<Attempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const attemptFromState = attempts.find(a => a.id === id);
  const attempt = loadedAttempt || attemptFromState || null;
  const exam = attempt ? exams.find(e => e.id === attempt.examId) : null;

  useEffect(() => {
    if (!id) return;
    if (attemptFromState?.answers && attemptFromState.answers.length > 0) return;

    setIsLoading(true);
    fetchAttemptById(id)
      .then(setLoadedAttempt)
      .finally(() => setIsLoading(false));
  }, [id, attemptFromState, fetchAttemptById]);

  useEffect(() => {
    if (attempt?.examId && (!exam || !exam.questionStructure || exam.questionStructure.length === 0)) {
      fetchExamById(attempt.examId);
    }
  }, [attempt?.examId, exam, fetchExamById]);

  const questionById = useMemo(() => {
    return new Map((exam?.questionStructure || []).map(q => [q.id, q]));
  }, [exam?.questionStructure]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Không tìm thấy kết quả bài thi.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 font-bold hover:underline">Quay lại trang chủ</Link>
        </div>
      </div>
    );
  }

  const totalQuestions = exam.totalQuestions || exam.questionStructure?.length || attempt.answers?.length || 0;
  const percentage = (attempt.score / 10) * 100;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Trang chủ
          </button>
          <button
            onClick={() => navigate(`/exam/${exam.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Làm lại
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8"
        >
          <div className="p-8 md:p-12 text-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <h1 className="text-xl md:text-2xl font-bold mb-2 opacity-90">{exam.title}</h1>
            <p className="text-sm opacity-75 mb-8">Hoàn thành lúc {new Date(attempt.date).toLocaleString('vi-VN')}</p>

            <div className="relative inline-flex items-center justify-center mb-8">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/20" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * percentage) / 100}
                  strokeLinecap="round"
                  className="text-white transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black">{attempt.score}</span>
                <span className="text-sm font-bold opacity-75">/ 10 điểm</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                <div className="text-2xl font-bold">{attempt.correctCount}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">Đúng</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                <div className="text-2xl font-bold">{attempt.wrongCount}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">Sai</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                <div className="text-2xl font-bold">{attempt.emptyCount}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold opacity-75">Trống</div>
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian làm bài</div>
                <div className="text-lg font-bold text-slate-900">{formatTime(attempt.timeSpent)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số câu</div>
                <div className="text-lg font-bold text-slate-900">{totalQuestions} câu</div>
              </div>
            </div>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          Xem lại bài làm
        </h2>

        <div className="space-y-4">
          {(attempt.answers || []).map((answer, idx) => {
            const question = questionById.get(answer.questionId);
            const isCorrect = answer.isCorrect === true;
            const isEmpty = answer.isCorrect === null;

            return (
              <motion.div
                key={answer.questionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  "bg-white rounded-2xl border overflow-hidden",
                  isCorrect ? "border-emerald-100" : isEmpty ? "border-slate-100" : "border-rose-100"
                )}
              >
                <div className="p-5 flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold",
                    isCorrect ? "bg-emerald-100 text-emerald-600" : isEmpty ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-600"
                  )}>
                    {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{question?.label || `Câu ${idx + 1}`}</div>
                    <div className="text-xs text-slate-500 font-medium">Điểm câu này: {answer.points ?? 0}</div>
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Bài làm của bạn</div>
                      <div className="font-bold text-slate-900">{formatAnswerValue(getUserAnswerValue(answer))}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-600/60 mb-2">Đáp án đúng</div>
                      <div className="font-bold text-emerald-700">{formatAnswerValue(answer.correctAnswer)}</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold">
                      <BookOpen className="w-5 h-5" />
                      Lời giải chi tiết
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm italic opacity-70">
                      {answer.explanation ? 'Đang cập nhật tính năng' : 'Đang cập nhật tính năng'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center pb-10 md:pb-0">
          <Link to="/" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all text-center shadow-lg shadow-slate-200">
            Về trang chủ
          </Link>
          <Link to="/history" className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all text-center shadow-sm">
            Lịch sử làm bài
          </Link>
        </div>
      </div>
    </div>
  );
};
