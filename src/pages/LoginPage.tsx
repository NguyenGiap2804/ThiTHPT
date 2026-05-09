import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import logoBackground from '../assets/logo.png';
import logoIcon from '../assets/logoIcon.jpg';

type AuthMode = 'login' | 'register';

export const LoginPage: React.FC = () => {
  const { login, register } = useApp();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white overflow-hidden font-sans">
      
      {/* Left Side: Immersive Visual Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[20000ms] hover:scale-110"
          style={{ backgroundImage: `url(${logoBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/90 via-indigo-900/60 to-transparent" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full text-white text-xs font-bold uppercase tracking-[0.2em] border border-white/20 mb-12"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            THPT Exam Platform
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-8 tracking-tighter"
          >
            Nâng tầm <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">tri thức Việt.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-blue-100/80 text-xl font-medium max-w-lg leading-relaxed"
          >
            Hệ thống luyện thi thông minh giúp bạn chinh phục mọi kỳ thi THPT với kho đề đồ sộ và lời giải chi tiết.
          </motion.p>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-8 max-w-md">
            {[
              { label: 'Đề thi thử', value: '10k+', icon: CheckCircle2 },
              { label: 'Học sinh hài lòng', value: '98%', icon: CheckCircle2 }
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + (i * 0.1) }}
                className="p-6 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 group hover:bg-white/10 transition-colors"
              >
                <div className="text-4xl font-black text-white mb-2 tracking-tight group-hover:scale-105 transition-transform">{stat.value}</div>
                <div className="text-blue-300/80 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex items-center gap-4 text-blue-200/50 text-sm"
          >
            <div className="h-px w-12 bg-blue-200/20" />
            <span>Được tin dùng bởi hơn 50,000 học sinh toàn quốc</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 relative bg-slate-50/50">
        <div className="w-full max-w-md">
          {/* Brand Identity Header */}
          <div className="flex flex-col items-center mb-12">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 group"
            >
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-100 border border-slate-100 rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden">
                <img 
                  src={logoIcon} 
                  alt="THPT.PRO Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </motion.div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">THPT.PRO</h2>
            <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100">
              Hệ thống luyện thi thông minh
            </div>
          </div>

          <div className="mb-10 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                  {mode === 'login' ? 'Chào mừng bạn trở lại 👋' : 'Gia nhập cộng đồng THPT 🚀'}
                </h1>
                <p className="text-slate-500 font-medium leading-relaxed max-w-[280px] mx-auto">
                  {mode === 'login' 
                    ? 'Đăng nhập để tiếp tục hành trình chinh phục điểm 10.' 
                    : 'Tạo tài khoản để mở khóa kho đề thi và lời giải.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-4 text-red-600 shadow-lg shadow-red-100/50">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Lỗi hệ thống</span>
                      <span className="text-sm font-bold">{error}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Nguyễn Văn A"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-14 pr-6 py-4.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  placeholder="name@email.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                {mode === 'login' && (
                  <a href="#" className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-700 transition-colors">Quên mật khẩu?</a>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4.5 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/5 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-2xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-6 group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Đăng nhập ngay' : 'Bắt đầu ngay'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
             <p className="text-slate-500 text-sm font-medium">
               {mode === 'login' ? "Bạn là thành viên mới?" : "Bạn đã có tài khoản?"}
               <button 
                 onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                 className="ml-2 text-blue-600 font-black hover:underline underline-offset-8 decoration-2"
               >
                 {mode === 'login' ? 'Đăng ký miễn phí' : 'Đăng nhập tại đây'}
               </button>
             </p>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap justify-center gap-x-8 gap-y-2">
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Điều khoản</a>
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Bảo mật</a>
            <a href="#" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Hỗ trợ</a>
          </div>
        </div>
      </div>
    </div>
  );
};
