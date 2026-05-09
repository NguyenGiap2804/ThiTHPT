import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { cn } from './lib/utils';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ExamDetailPage } from './pages/ExamDetailPage';
import { ExamSessionPage } from './pages/ExamSessionPage';
import { ResultPage } from './pages/ResultPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ExamManagement } from './pages/admin/ExamManagement';
import { SystemSettings } from './pages/admin/SystemSettings';
import { UserManagement } from './pages/admin/UserManagement';
import { LoginPage } from './pages/LoginPage';
import { Toast } from './components/Toast';

const AppRoutes = () => {
  const { currentUser, notifications, markNotificationRead } = useApp();

  if (!currentUser) {
    return (
      <>
        <Toast notifications={notifications} onClose={markNotificationRead} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-slate-50 font-sans",
      !isAdmin && "pb-20 md:pb-0" // Space for bottom nav on mobile
    )}>
      <Toast notifications={notifications} onClose={markNotificationRead} />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <HomePage />} />
          <Route path="/exam/:id" element={<ExamDetailPage />} />
          <Route path="/session/:id" element={<ExamSessionPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
          
          {/* Admin Routes */}
          {isAdmin ? (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/exams" element={<ExamManagement />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
            </>
          ) : (
            <Route path="/admin/*" element={<Navigate to="/" replace />} />
          )}
          
          <Route path="/login" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
          <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
        </Routes>
      </main>
      
      {/* Footer - Only for Desktop or Admin */}
      <footer className={cn(
        "bg-white border-t border-slate-200 py-8",
        !isAdmin && "hidden md:block"
      )}>
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; 2024 THPT Exam Prep. Hệ thống luyện thi trực tuyến dành cho học sinh Việt Nam.
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}
