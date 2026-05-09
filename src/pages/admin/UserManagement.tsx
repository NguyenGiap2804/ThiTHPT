import React from 'react';
import { Mail, RefreshCw, Search, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { AdminUser } from '../../types';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';

export const UserManagement: React.FC = () => {
  const { currentUser, addNotification } = useApp();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('Không tải được danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((user) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  });

  const toggleRole = async (user: AdminUser) => {
    const nextRole = user.role === 'admin' ? 'student' : 'admin';
    if (user.id === currentUser?.id && nextRole === 'student') {
      addNotification({
        title: 'Không thể đổi quyền',
        message: 'Bạn không thể tự hạ quyền tài khoản đang đăng nhập.',
        type: 'warning',
      });
      return;
    }

    try {
      const updated = await adminApi.updateUser(user.id, { role: nextRole });
      setUsers((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      addNotification({
        title: 'Đã cập nhật phân quyền',
        message: `${updated.name} hiện là ${updated.role === 'admin' ? 'quản trị viên' : 'học sinh'}.`,
        type: 'success',
      });
    } catch (err) {
      addNotification({
        title: 'Lỗi',
        message: 'Không thể cập nhật phân quyền người dùng.',
        type: 'error',
      });
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Xóa tài khoản ${user.name}?`)) return;

    try {
      await adminApi.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      addNotification({
        title: 'Đã xóa tài khoản',
        message: `${user.name} đã được xóa khỏi hệ thống.`,
        type: 'success',
      });
    } catch (err) {
      addNotification({
        title: 'Không thể xóa',
        message: 'Tài khoản có thể đang có dữ liệu bài làm hoặc bạn đang xóa chính mình.',
        type: 'error',
      });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý học sinh</h1>
          <p className="text-slate-500 font-medium">Theo dõi tài khoản, email và phân quyền người dùng.</p>
        </div>
        <button
          onClick={loadUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-60"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Làm mới
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none font-medium"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Quyền</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm font-bold text-slate-500">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              )}
              {!isLoading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm font-bold text-slate-500">
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              )}
              {!isLoading && filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-white',
                        user.role === 'admin' ? 'bg-indigo-600' : 'bg-blue-600'
                      )}>
                        {user.role === 'admin' ? <ShieldCheck className="w-5 h-5" /> : <UserRound className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => toggleRole(user)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider',
                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                      )}
                    >
                      {user.role === 'admin' ? 'Quản trị' : 'Học sinh'}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={user.id === currentUser?.id}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        title={user.id === currentUser?.id ? 'Không thể xóa chính mình' : 'Xóa tài khoản'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
