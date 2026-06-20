import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, Badge, Avatar, Dropdown, Space, Switch, Tooltip,
  Popover, List, Typography, Empty, Tag,
} from 'antd';
import {
  DashboardOutlined, FileProtectOutlined, UserOutlined, SettingOutlined,
  BellOutlined, LogoutOutlined, NodeIndexOutlined, TeamOutlined,
  BarChartOutlined, HistoryOutlined, BulbOutlined, BulbFilled,
  MenuFoldOutlined, MenuUnfoldOutlined, CheckCircleOutlined, CloseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

const HEADER_H = 68;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { themeMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, logout } = useAuth();
  const { notifications, markAsRead } = useComplaints();

  const myNotifications = notifications.filter(n => n.userId === user?.uid);
  const unreadCount = myNotifications.filter(n => !n.read).length;

  // Responsive detection
  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  const siderWidth = collapsed ? 80 : 260;

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    ...(userRole?.id === 'role-citizen' ? [
      {
        key: '/submit',
        icon: <FileProtectOutlined />,
        label: <Link to="/submit">Submit Complaint</Link>,
      },
      {
        key: '/my-complaints',
        icon: <HistoryOutlined />,
        label: <Link to="/my-complaints">Track Status</Link>,
      },
    ] : []),
    ...(userRole?.id !== 'role-citizen' && userRole?.id !== 'role-admin' ? [
      {
        key: '/assigned',
        icon: <FileTextOutlined />,
        label: <Link to="/assigned">Assigned Tasks</Link>,
      },
    ] : []),
    ...(userRole?.id === 'role-admin' ? [
      {
        key: '/admin/workflows',
        icon: <NodeIndexOutlined />,
        label: <Link to="/admin/workflows">Workflows</Link>,
      },
      {
        key: '/admin/users',
        icon: <TeamOutlined />,
        label: <Link to="/admin/users">User Management</Link>,
      },
      {
        key: '/admin/analytics',
        icon: <BarChartOutlined />,
        label: <Link to="/admin/analytics">System Reports</Link>,
      },
      {
        key: '/admin/logs',
        icon: <HistoryOutlined />,
        label: <Link to="/admin/logs">Audit Logs</Link>,
      },
    ] : []),
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">My Profile</Link>,
    },
  ];

  const userMenuItems = {
    items: [
      {
        key: 'profile', label: 'View Profile', icon: <UserOutlined />,
        onClick: () => navigate('/profile'),
      },
      { key: 'settings', label: 'Settings', icon: <SettingOutlined />, onClick: () => navigate('/profile') },
      { type: 'divider' },
      {
        key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true,
        onClick: () => { logout(); navigate('/login'); },
      },
    ],
  };

  const NotificationContent = () => (
    <div className="notif-panel" style={{ background: 'var(--card-bg)' }}>
      <div style={{
        padding: '16px 20px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <Title level={5} style={{ margin: 0, color: 'var(--text-main)' }}>
          Notifications {unreadCount > 0 && <Badge count={unreadCount} style={{ marginLeft: 8 }} />}
        </Title>
        {unreadCount > 0 && (
          <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }}
            onClick={() => myNotifications.filter(n => !n.read).forEach(n => markAsRead(n.id))}
          >
            Mark all read
          </Button>
        )}
      </div>
      {myNotifications.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <Empty description="No notifications" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <List
          dataSource={myNotifications.slice(0, 8)}
          renderItem={item => (
            <div
              className={`notif-item ${!item.read ? 'unread' : ''}`}
              onClick={() => !item.read && markAsRead(item.id)}
              style={{ background: item.read ? 'transparent' : 'rgba(22,119,255,0.04)' }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: item.read ? 'rgba(0,0,0,0.06)' : 'rgba(22,119,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BellOutlined style={{ fontSize: 14, color: item.read ? 'var(--text-muted)' : 'var(--primary-color)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{
                    fontSize: 13, color: 'var(--text-main)', display: 'block',
                    fontWeight: item.read ? 400 : 600, lineHeight: 1.4,
                  }}>
                    {item.message}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 2, display: 'block' }}>
                    {dayjs(item.timestamp).fromNow()}
                  </Text>
                </div>
                {!item.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );

  return (
    <Layout className="app-layout">
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className={`mobile-overlay ${mobileOpen ? 'visible' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sider
        className={`app-sider ${isMobile && mobileOpen ? 'mobile-open' : ''}`}
        width={260}
        collapsedWidth={80}
        collapsed={!isMobile && collapsed}
        theme="light"
        style={{ height: '100vh', position: 'fixed', zIndex: 200 }}
      >
        {/* Brand */}
        <div className="brand-logo" style={{ justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}>
          <div className="brand-icon">
            <FileProtectOutlined style={{ fontSize: 20, color: '#fff' }} />
          </div>
          {(!collapsed || isMobile) && (
            <span className="brand-text">RES<span>SOLVE</span></span>
          )}
        </div>

        {/* Role Badge in sidebar */}
        {(!collapsed || isMobile) && userRole && (
          <div style={{ padding: '8px 20px 12px' }}>
            <Tag
              color="blue"
              style={{ borderRadius: 20, fontSize: 11, fontWeight: 600, padding: '2px 10px', border: 'none', background: 'rgba(22,119,255,0.1)', color: 'var(--primary-color)' }}
            >
              {userRole.name}
            </Tag>
          </div>
        )}

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0, padding: '4px 0', flex: 1, overflow: 'auto' }}
        />

        {/* Bottom: theme toggle in sidebar */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
        }}>
          <Switch
            checked={themeMode === 'dark'}
            checkedChildren={<BulbFilled style={{ fontSize: 12 }} />}
            unCheckedChildren={<BulbOutlined style={{ fontSize: 12 }} />}
            onChange={toggleTheme}
            size="small"
          />
          {(!collapsed || isMobile) && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Text>
          )}
        </div>
      </Sider>

      {/* Main content layout */}
      <Layout
        className="app-content-layout"
        style={{ marginLeft: isMobile ? 0 : siderWidth, transition: 'margin-left 0.25s ease' }}
      >
        {/* Header */}
        <Header
          className="app-header"
          style={{
            background: themeMode === 'dark' ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.9)',
            padding: '0 20px',
            height: HEADER_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 150,
          }}
        >
          {/* Left side */}
          <Space size={12}>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined style={{ fontSize: 18 }} />}
                onClick={() => setMobileOpen(true)}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="right">
                <Button
                  type="text"
                  icon={collapsed
                    ? <MenuUnfoldOutlined style={{ fontSize: 18 }} />
                    : <MenuFoldOutlined style={{ fontSize: 18 }} />
                  }
                  onClick={() => setCollapsed(v => !v)}
                  style={{ width: 40, height: 40 }}
                />
              </Tooltip>
            )}
            <div className="hide-mobile">
              <Text style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-main)' }}>
                Welcome back, <span style={{ color: 'var(--primary-color)' }}>{user?.name?.split(' ')[0]}</span>
              </Text>
            </div>
          </Space>

          {/* Right side */}
          <Space size={8}>
            {/* Notification Bell */}
            <Popover
              content={<NotificationContent />}
              trigger="click"
              placement="bottomRight"
              arrow={false}
              overlayStyle={{ padding: 0 }}
              overlayInnerStyle={{ padding: 0, borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}
            >
              <Badge count={unreadCount} overflowCount={9}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  style={{ width: 40, height: 40, borderRadius: 10 }}
                />
              </Badge>
            </Popover>

            {/* Avatar + Dropdown */}
            <Dropdown menu={userMenuItems} placement="bottomRight" arrow={{ pointAtCenter: true }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 12px', borderRadius: 10, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                  size={36}
                  style={{ border: '2px solid var(--primary-color)', flexShrink: 0 }}
                />
                <div className="hide-mobile" style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{userRole?.name}</div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Page content */}
        <Content style={{ margin: '24px', minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
