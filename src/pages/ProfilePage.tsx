import React from 'react';
import { CalendarDays, Mail, ShieldCheck, Trophy, User, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatScore, formatTime } from '../lib/utils';

export const ProfilePage: React.FC = () => {
  const { currentUser, attempts } = useApp();

  if (!currentUser) return null;

  const completedAttempts = attempts.length;
  const averageScore = completedAttempts > 0
    ? attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / completedAttempts
    : null;
  const totalTime = attempts.reduce((sum, attempt) => sum + Number(attempt.timeSpent || 0), 0);
  const bestScore = completedAttempts > 0
    ? Math.max(...attempts.map((attempt) => Number(attempt.score || 0)))
    : null;

  const stats = [
    { label: 'Lượt làm bài', value: completedAttempts, icon: Trophy },
    { label: 'Điểm trung bình', value: averageScore === null ? 'Chưa có' : formatScore(averageScore, 2), icon: ShieldCheck },
    { label: 'Điểm cao nhất', value: bestScore === null ? 'Chưa có' : formatScore(bestScore, 2), icon: Trophy },
    { label: 'Tổng thời gian', value: formatTime(totalTime), icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                <User className="h-10 w-10" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Trang cá nhân</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{currentUser.name}</h1>
                <p className="mt-1 text-sm font-bold uppercase tracking-wide text-blue-600">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : 'Học sinh'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="mb-5 text-lg font-black text-slate-900">Thông tin cơ bản</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <Mail className="mt-0.5 h-5 w-5 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Email</p>
                  <p className="truncate text-sm font-bold text-slate-800">{currentUser.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Vai trò</p>
                  <p className="text-sm font-bold text-slate-800">{currentUser.role === 'admin' ? 'Admin' : 'Học sinh'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <CalendarDays className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Ngày tạo</p>
                  <p className="text-sm font-bold text-slate-800">
                    {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">{stat.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
