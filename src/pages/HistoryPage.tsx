import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'motion/react';
import { History as HistoryIcon, Calendar, Clock, Award, ChevronRight } from 'lucide-react';
import { formatDate, formatTime, cn, formatScore } from '../lib/utils';
import { Link, Navigate } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const { attempts, subjects, currentUser } = useApp();

  if (currentUser?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-600 p-3 rounded-xl text-white">
          <HistoryIcon className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lịch sử làm bài</h1>
          <p className="text-slate-500">Theo dõi quá trình luyện tập của bạn</p>
        </div>
      </div>

      {attempts.length > 0 ? (
        <div className="space-y-4">
          {attempts.map((attempt, index) => {
            const subject = subjects.find(s => s.id === attempt.subjectId);
            return (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase", subject?.color || 'bg-slate-500')}>
                        {subject?.name}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(attempt.date)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {attempt.examTitle}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-orange-500" />
                        Điểm: <span className="font-bold text-slate-900">{formatScore(attempt.score)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Thời gian: <span className="font-bold text-slate-900">{formatTime(attempt.timeSpent)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-green-600 font-bold">{attempt.correctCount} Đúng</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-red-600 font-bold">{attempt.wrongCount} Sai</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/result/${attempt.id}`}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all border border-slate-200 hover:border-blue-200"
                  >
                    Xem chi tiết
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có lịch sử</h3>
          <p className="text-slate-500 mb-6">Hãy bắt đầu làm bài thi đầu tiên để theo dõi kết quả!</p>
          <Link to="/" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            Làm bài ngay
          </Link>
        </div>
      )}
    </div>
  );
};
