import React from 'react';
import { Activity, Database, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { AdminSystemStatus } from '../../types';
import { cn } from '../../lib/utils';

export const SystemSettings: React.FC = () => {
  const [status, setStatus] = React.useState<AdminSystemStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadStatus = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getSystemStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch system status', err);
      setError('Không tải được trạng thái hệ thống.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const cards = [
    { label: 'API', value: status?.apiStatus === 'ok' ? 'Đang hoạt động' : 'Chưa rõ', icon: Activity, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Database', value: status?.databaseName ?? 'Chưa rõ', icon: Database, tone: 'text-blue-600 bg-blue-50' },
    { label: 'Đề thi', value: status?.stats.totalExams ?? 0, icon: Server, tone: 'text-indigo-600 bg-indigo-50' },
    { label: 'Bài làm', value: status?.stats.totalAttempts ?? 0, icon: ShieldCheck, tone: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-slate-500 font-medium">Kiểm tra kết nối API, SQL Server và các chỉ số vận hành chính.</p>
        </div>
        <button
          onClick={loadStatus}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-60"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Kiểm tra lại
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', card.tone)}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-2xl font-black text-slate-900 truncate">{isLoading ? '...' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin kết nối</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="font-bold text-slate-400">Thời gian server</span>
              <span className="font-semibold text-slate-700 text-right">
                {status?.serverTime ? new Date(status.serverTime).toLocaleString('vi-VN') : '...'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-bold text-slate-400">Điểm trung bình</span>
              <span className="font-semibold text-slate-700">{status?.stats.averageScore?.toFixed(2) ?? 'Chưa có dữ liệu'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-bold text-slate-400">Học sinh</span>
              <span className="font-semibold text-slate-700">{status?.stats.totalStudents ?? '...'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Checklist deploy</h2>
          <div className="space-y-3">
            {[
              'Chạy migration trước khi deploy production.',
              'Đặt JWT_SECRET, CORS_ORIGIN và biến MSSQL trong server/.env.',
              'Không commit uploads, node_modules, dist hoặc .env.',
              'Upload production nên chuyển sang object storage khi có domain thật.',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm font-semibold text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
