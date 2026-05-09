import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, History, LayoutDashboard, Home, Bell, User, LogOut, ChevronDown, ShieldCheck, Settings, Users, CheckCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import logIcon from '../assets/logoIcon.jpg';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { notifications, currentUser, logout, markNotificationRead, markAllNotificationsRead } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.read).length;
  const isAdmin = currentUser.role === 'admin';

  const adminNavItems = [
    { path: '/admin', label: 'Quản trị', icon: LayoutDashboard },
    { path: '/admin/exams', label: 'Đề thi', icon: FileText },
    { path: '/admin/users', label: 'Học sinh', icon: Users },
    { path: '/admin/settings', label: 'Hệ thống', icon: Settings },
  ];

  // Student sees a mobile-style navigation
  const studentNavItems = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/history', label: 'Lịch sử', icon: History },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <>
      {/* Top Navbar - Simplified for Admin, Mobile-style header for Student */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-50 group-hover:scale-110 transition-transform overflow-hidden border border-slate-100">
                  <img src={logIcon} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tight">Thi<span className="text-blue-600">THPT</span></span>
              </Link>
              
              {/* Desktop Nav - Only for Admin or when on large screens */}
              <div className={cn("hidden md:ml-10 md:flex md:space-x-4", !isAdmin && "md:flex")}>
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all gap-2",
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(prev => !prev)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative group"
                  aria-label="Thông báo"
                >
                  <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl z-50"
                      >
                        <div className="flex items-center justify-between px-3 py-2">
                          <div>
                            <p className="text-sm font-black text-slate-900">Thông báo</p>
                            <p className="text-xs font-bold text-slate-400">{unreadCount} chưa đọc</p>
                          </div>
                          <button
                            onClick={markAllNotificationsRead}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                            title="Đánh dấu tất cả đã đọc"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm font-bold text-slate-400">
                              Chưa có thông báo.
                            </div>
                          ) : (
                            notifications.slice(0, 10).map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => markNotificationRead(notification.id)}
                                className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                              >
                                <div className="flex items-start gap-3">
                                  <span className={cn(
                                    "mt-1 h-2.5 w-2.5 rounded-full",
                                    notification.read ? "bg-slate-200" : "bg-blue-600"
                                  )} />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-black text-slate-900">{notification.title}</p>
                                    <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">{notification.message}</p>
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                      {new Date(notification.timestamp).toLocaleString('vi-VN')}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-6 bg-slate-100 mx-1" />

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group border border-transparent hover:border-slate-200"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs",
                    isAdmin ? "bg-indigo-600" : "bg-blue-600"
                  )}>
                    {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-black text-slate-900 leading-tight">{currentUser.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{isAdmin ? 'Admin' : 'Học sinh'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden p-2"
                      >
                        <div className="px-4 py-3 border-b border-slate-50 mb-2">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tài khoản</p>
                          <p className="text-sm font-black text-slate-900 truncate">{currentUser.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm"
                        >
                          <User className="w-4 h-4" />
                          Trang cá nhân
                        </Link>
                        <button 
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-bold text-sm"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Only for Students on Mobile */}
      {!isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 z-40 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          {studentNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-all",
                location.pathname === item.path ? "text-blue-600" : "text-slate-400"
              )}
            >
              <item.icon className={cn("w-6 h-6", location.pathname === item.path && "scale-110")} />
              <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
          <Link
            to="/profile"
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all",
              location.pathname === '/profile' ? "text-blue-600" : "text-slate-400"
            )}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-wider">Cá nhân</span>
          </Link>
        </div>
      )}
    </>
  );
};
