import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Bell, CheckCircle2, FileText, Plus, Settings, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { adminApi } from '../../lib/api';
import { AdminStats } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { exams, attempts } = useApp();
  const [adminStats, setAdminStats] = React.useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    adminApi.getStats()
      .then((stats) => {
        setAdminStats(stats);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch admin stats', err);
        setError('Không tải được thống kê hệ thống.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const stats = [
    { label: 'Tổng số đề thi', value: adminStats?.totalExams ?? exams.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lượt làm bài', value: adminStats?.totalAttempts ?? attempts.length, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Học sinh', value: adminStats?.totalStudents ?? 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Thông báo mới', value: adminStats?.unreadNotifications ?? 0, icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const recentAttempts = adminStats?.recentAttempts ?? [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 font-medium">Theo dõi đề thi, học sinh và lượt làm bài thực tế.</p>
        </div>
        <Link
          to="/admin/exams"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Thêm đề thi mới
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`${stat.bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`${stat.color} w-6 h-6`} />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900">{isLoading ? '...' : stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Hoạt động gần đây</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {!isLoading && recentAttempts.length === 0 && (
              <div className="p-6 text-sm font-medium text-slate-500">Chưa có lượt làm bài nào.</div>
            )}
            {isLoading && (
              <div className="p-6 text-sm font-medium text-slate-500">Đang tải hoạt động...</div>
            )}
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-bold">{attempt.studentName} vừa hoàn thành {attempt.examTitle}</p>
                  <p className="text-slate-500 text-sm font-medium">
                    {new Date(attempt.submittedAt).toLocaleString('vi-VN')} · {attempt.score}/10 điểm
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Lối tắt quản lý</h2>
            <div className="space-y-3">
              <Link to="/admin/exams" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                <span className="font-bold text-slate-700">Quản lý đề thi</span>
              </Link>
              <Link to="/admin/users" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <Users className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                <span className="font-bold text-slate-700">Quản lý học sinh</span>
              </Link>
              <Link to="/admin/settings" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                <span className="font-bold text-slate-700">Cài đặt hệ thống</span>
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Trạng thái hệ thống
            </h3>
            <div className="flex justify-between text-sm">
              <span className="opacity-60">Điểm trung bình</span>
              <span className="font-bold text-emerald-400">{adminStats?.averageScore?.toFixed(2) ?? 'Chưa có dữ liệu'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
