import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp, Spin, theme } from 'antd';
import MainLayout from './components/Layout/MainLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ComplaintProvider } from './context/ComplaintContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SystemDataProvider, useSystemData } from './context/SystemDataContext';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Public/Login';
import Register from './pages/Public/Register';
import SubmitComplaint from './pages/Citizen/SubmitComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import WorkflowBuilder from './pages/Admin/WorkflowBuilder';
import AuditLogs from './pages/Admin/AuditLogs';
import UserManagement from './pages/Admin/UserManagement';
import Analytics from './pages/Admin/Analytics';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa' }}>
        <Spin size="large" description="Authenticating..." />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole.id))) {
    // If not allowed, redirect to a safe page based on role
    if (userRole?.id === 'role-admin') {
      return <Navigate to="/admin/workflows" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
};

const PublicRoute = ({ children }) => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa' }}>
        <Spin size="large" description="Loading..." />
      </div>
    );
  }
  
  if (user) {
    if (userRole?.id === 'role-admin') {
      return <Navigate to="/admin/workflows" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const RootRedirect = () => {
  const { user, userRole, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa' }}>
        <Spin size="large" description="Loading application..." />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole?.id === 'role-admin') {
    return <Navigate to="/admin/workflows" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const MainAppStructure = () => {
  const { loading: systemLoading } = useSystemData();

  if (systemLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa' }}>
        <Spin size="large" description="Initializing system database..." />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        <Route path="/" element={<RootRedirect />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Citizen-only Routes */}
        <Route path="/submit" element={
          <ProtectedRoute allowedRoles={['role-citizen']}>
            <SubmitComplaint />
          </ProtectedRoute>
        } />
        <Route path="/my-complaints" element={
          <ProtectedRoute allowedRoles={['role-citizen']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Officer-only Routes */}
        <Route path="/assigned" element={
          <ProtectedRoute allowedRoles={[
            'role-warden', 'role-principal', 'role-dean',
            'role-vro', 'role-mro', 'role-collector',
            'role-inspector', 'role-commissioner',
            'role-doctor', 'role-health-director',
            'role-mvi', 'role-rto',
          ]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/complaint/:id" element={<ProtectedRoute><ComplaintDetails /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/workflows" element={
          <ProtectedRoute allowedRoles={['role-admin']}>
            <WorkflowBuilder />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['role-admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute allowedRoles={['role-admin']}>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/admin/logs" element={
          <ProtectedRoute allowedRoles={['role-admin']}>
            <AuditLogs />
          </ProtectedRoute>
        } />
        
        {/* Redirect any other route to root redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const AppContent = () => {
  const { themeMode } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 10,
          fontFamily: 'Plus Jakarta Sans',
        },
      }}
    >
      <AntdApp>
        <SystemDataProvider>
          <AuthProvider>
            <ComplaintProvider>
              <MainAppStructure />
            </ComplaintProvider>
          </AuthProvider>
        </SystemDataProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
