import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { Notification } from '../types';
import { cn } from '../lib/utils';

interface ToastProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.filter(n => !n.read).slice(0, 5).map((notif) => (
          <ToastItem key={notif.id} notification={notif} onClose={() => onClose(notif.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    warning: 'bg-amber-50 border-amber-100',
    info: 'bg-blue-50 border-blue-100',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md",
        bgColors[notification.type || 'info']
      )}
    >
      <div className="shrink-0 mt-0.5">
        {icons[notification.type || 'info']}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-black text-slate-900 leading-none mb-1">
          {notification.title}
        </h5>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {notification.message}
        </p>
      </div>
      <button 
        onClick={onClose}
        className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors text-slate-400"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
