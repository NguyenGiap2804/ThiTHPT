import React, { createContext, useContext, useEffect, useState } from 'react';
import { Attempt, Subject, Exam, Notification, User } from '../types';
import { SUBJECTS } from '../mockData';
import { examApi, authApi, attemptApi, notificationApi } from '../lib/api';

interface AppContextType {
  subjects: Subject[];
  exams: Exam[];
  attempts: Attempt[];
  notifications: Notification[];
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  addAttempt: (attempt: Partial<Attempt>) => Promise<Attempt>;
  addExam: (exam: Exam) => Promise<void>;
  updateExam: (exam: Exam) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  fetchExamById: (id: string) => Promise<Exam | null>;
  fetchAttemptById: (id: string) => Promise<Attempt | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const readStoredUser = (): User | null => {
  try {
    const saved = localStorage.getItem('thpt_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects] = useState<Subject[]>(SUBJECTS);
  const [currentUser, setCurrentUser] = useState<User | null>(readStoredUser);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('thpt_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('thpt_user');
    }
  }, [currentUser]);

  useEffect(() => {
    const token = localStorage.getItem('thpt_token');
    if (!token) return;

    authApi.getProfile()
      .then(setCurrentUser)
      .catch(() => {
        localStorage.removeItem('thpt_token');
        localStorage.removeItem('thpt_user');
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    const filters = currentUser?.role === 'admin' ? { status: 'all' } : {};
    examApi.getAll(filters)
      .then(setExams)
      .catch((err) => {
        console.error('Failed to fetch exams', err);
        setExams([]);
      });
  }, [currentUser?.role]);

  useEffect(() => {
    if (!currentUser) {
      setAttempts([]);
      setNotifications([]);
      return;
    }

    const token = localStorage.getItem('thpt_token');
    if (!token) return;

    attemptApi.getUserAttempts()
      .then(setAttempts)
      .catch((err) => {
        console.error('Failed to fetch attempts', err);
        setAttempts([]);
      });

    notificationApi.getAll()
      .then(setNotifications)
      .catch((err) => {
        console.error('Failed to fetch notifications', err);
        setNotifications([]);
      });
  }, [currentUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setCurrentUser(response.user);
      localStorage.setItem('thpt_token', response.token);
      addNotification({
        title: 'Thành công',
        message: 'Chào mừng bạn đã trở lại!',
        type: 'success',
      });
    } catch (error) {
      addNotification({
        title: 'Lỗi',
        message: 'Không thể đăng nhập. Vui lòng kiểm tra tài khoản hoặc kết nối.',
        type: 'error',
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authApi.register({ email, password, name });
      setCurrentUser(response.user);
      localStorage.setItem('thpt_token', response.token);
      addNotification({
        title: 'Thành công',
        message: 'Đăng ký tài khoản thành công!',
        type: 'success',
      });
    } catch (error) {
      addNotification({
        title: 'Lỗi',
        message: 'Không thể đăng ký tài khoản lúc này.',
        type: 'error',
      });
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setAttempts([]);
    setNotifications([]);
    localStorage.removeItem('thpt_token');
  };

  const addAttempt = async (attempt: Partial<Attempt>) => {
    const savedAttempt = await attemptApi.submit(attempt);
    setAttempts(prev => [savedAttempt, ...prev.filter(item => item.id !== savedAttempt.id)]);
    return savedAttempt;
  };

  const addExam = async (exam: Exam) => {
    const savedExam = await examApi.create(exam);
    setExams(prev => [savedExam, ...prev.filter(item => item.id !== savedExam.id)]);
    addNotification({
      title: 'Thành công',
      message: 'Đã tạo đề thi mới',
      type: 'success',
    });
  };

  const updateExam = async (exam: Exam) => {
    const savedExam = await examApi.update(exam.id, exam);
    setExams(prev => prev.map(item => item.id === savedExam.id ? savedExam : item));
    addNotification({
      title: 'Thành công',
      message: 'Đã cập nhật đề thi',
      type: 'success',
    });
  };

  const deleteExam = async (id: string) => {
    await examApi.delete(id);
    setExams(prev => prev.filter(e => e.id !== id));
    addNotification({
      title: 'Thành công',
      message: 'Đã xóa đề thi khỏi hệ thống',
      type: 'success',
    });
  };

  const fetchExamById = async (id: string) => {
    try {
      const fullExam = await examApi.getById(id);
      setExams(prev => {
        const exists = prev.some(e => e.id === id);
        return exists ? prev.map(e => e.id === id ? fullExam : e) : [...prev, fullExam];
      });
      return fullExam;
    } catch (err) {
      console.error('Failed to fetch exam details', err);
      return null;
    }
  };

  const fetchAttemptById = async (id: string) => {
    try {
      const fullAttempt = await attemptApi.getById(id);
      setAttempts(prev => {
        const exists = prev.some(item => item.id === id);
        return exists ? prev.map(item => item.id === id ? fullAttempt : item) : [fullAttempt, ...prev];
      });
      return fullAttempt;
    } catch (err) {
      console.error('Failed to fetch attempt details', err);
      return null;
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (!id.startsWith('local-')) {
      notificationApi.markRead(id).catch((err) => {
        console.error('Failed to mark notification read', err);
      });
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationApi.markAllRead().catch((err) => {
      console.error('Failed to mark all notifications read', err);
    });
  };

  return (
    <AppContext.Provider value={{
      subjects,
      exams,
      attempts,
      notifications,
      currentUser,
      login,
      register,
      logout,
      addAttempt,
      addExam,
      updateExam,
      deleteExam,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      fetchExamById,
      fetchAttemptById,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
