import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Clock, FileText, Play, BarChart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubjectId } from '../types';

export const ExamListPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: SubjectId }>();
  const { subjects, exams } = useApp();
  const navigate = useNavigate();

  const subject = subjects.find(s => s.id === subjectId);
  const subjectExams = exams.filter(e => e.subjectId === subjectId);

  if (!subject) return <div>Không tìm thấy môn học</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Quay lại trang chủ
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className={`${subject.color} p-3 rounded-xl text-white`}>
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{subject.name}</h1>
          <p className="text-slate-500">Danh sách các đề thi và luyện tập</p>
        </div>
      </div>

      <div className="space-y-4">
        {subjectExams.length > 0 ? (
          subjectExams.map((exam, index) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {exam.title}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exam.durationMinutes} phút
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {exam.totalQuestions ?? exam.questionStructure?.length ?? 0} câu hỏi
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart className="w-4 h-4" />
                      Trạng thái: <span className="text-green-600">{exam.status}</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/exam/${exam.id}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Bắt đầu làm bài
                  <Play className="ml-2 w-4 h-4 fill-current" />
                </Link>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500">Hiện chưa có đề thi nào cho môn học này.</p>
          </div>
        )}
      </div>
    </div>
  );
};
