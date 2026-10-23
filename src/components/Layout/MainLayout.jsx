import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, Badge, Avatar, Dropdown, Space, Switch, Tooltip,
  Popover, List, Typography, Empty, Tag, Modal, Input, AutoComplete, Card, Row, Col,
} from 'antd';
import {
  DashboardOutlined, FileProtectOutlined, UserOutlined, SettingOutlined,
  BellOutlined, LogoutOutlined, NodeIndexOutlined, TeamOutlined,
  BarChartOutlined, HistoryOutlined, BulbOutlined, BulbFilled,
  MenuFoldOutlined, MenuUnfoldOutlined, CheckCircleOutlined, CloseOutlined,
  FileTextOutlined, SwapOutlined, QuestionCircleOutlined, SearchOutlined,
  ClockCircleOutlined, ThunderboltOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useComplaints } from '../../context/ComplaintContext';
import { useTheme } from '../../context/ThemeContext';
import { useSystemData } from '../../context/SystemDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Logo from '../Logo';

dayjs.extend(relativeTime);

const { Header, Sider, Content } = Layout;
const { Text, Title, Paragraph } = Typography;

const HEADER_H = 68;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const { themeMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, logout, switchPersona } = useAuth();
  const { complaints, notifications, markAsRead, markAllNotificationsRead } = useComplaints();
  const { users, roles, departments } = useSystemData();

  const myNotifications = notifications.filter(n => n.userId === user?.uid || n.userId === user?.id);
  const unreadCount = myNotifications.filter(n => !n.read).length;

  // Responsive listener
  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  const siderWidth = collapsed ? 80 : 260;

  // Search auto-complete options
  const searchOptions = complaints.slice(0, 15).map(c => ({
    value: c.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
        <div>
          <Text strong style={{ fontSize: 13, display: 'block' }}>{c.title?.slice(0, 40)}...</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>#{c.id} · {c.status}</Text>
        </div>
        <Tag color={c.priority === 'Critical' ? 'red' : c.priority === 'High' ? 'orange' : 'blue'} style={{ fontSize: 10 }}>
          {c.priority}
        </Tag>
      </div>
    ),
  }));

  const handleSelectSearch = (val) => {
    navigate(`/complaint/${val}`);
    setSearchVal('');
  };

  // Persona options for quick testing
  const personaMenuItems = [
    {
      key: 'grp-citizen',
      type: 'group',
      label: '🧑 Citizens (Filing Grievances)',
      children: [
        { key: 'u-bob', label: 'Bob Citizen (Standard Resident)' },
        { key: 'u-sara', label: 'Sara Student (Hostel Resident)' },
      ],
    },
    {
      key: 'grp-officers-l1',
      type: 'group',
      label: '🛡️ Level 1 Responders (Department Officers)',
      children: [
        { key: 'u-alice', label: 'Alice Warden (Hostel L1)' },
        { key: 'u-carol', label: 'Carol Inspector (Municipal L1)' },
        { key: 'u-eve', label: 'Dr. Eve (Health L1)' },
        { key: 'u-victor', label: 'Victor VRO (Revenue L1)' },
        { key: 'u-frank', label: 'Frank MVI (Transport L1)' },
      ],
    },
    {
      key: 'grp-officers-l2',
      type: 'group',
      label: '⚖️ Senior Escalation Authorities (L2 / L3)',
      children: [
        { key: 'u-henry', label: 'Dr. Henry Principal (Hostel L2)' },
        { key: 'u-mike', label: 'Mike Commissioner (Municipal L2)' },
        { key: 'u-dave', label: 'Dave MRO (Revenue L2)' },
        { key: 'u-cathy', label: 'Cathy Collector IAS (Revenue L3)' },
      ],
    },
    {
      key: 'grp-admin',
      type: 'group',
      label: '👑 System Administrator',
      children: [
        { key: 'u-admin', label: 'John Admin (Super Administrator)' },
      ],
    },
  ];

  const handlePersonaSelect = ({ key }) => {
    const switched = switchPersona(key);
    if (switched) {
      if (switched.roleId === 'role-admin') {
        navigate('/admin/workflows');
      } else if (switched.roleId === 'role-citizen') {
        navigate('/dashboard');
      } else {
        navigate('/assigned');
      }
    }
  };

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
        label: <Link to="/admin/workflows">Workflows & SLAs</Link>,
      },
      {
        key: '/admin/users',
        icon: <TeamOutlined />,
        label: <Link to="/admin/users">User Management</Link>,
      },
      {
        key: '/admin/analytics',
        icon: <BarChartOutlined />,
        label: <Link to="/admin/analytics">Analytics & Reports</Link>,
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
      {
        key: 'guide', label: 'Quick Start Guide', icon: <QuestionCircleOutlined />,
        onClick: () => setGuideModalOpen(true),
      },
      { type: 'divider' },
      {
        key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true,
        onClick: () => { logout(); navigate('/login'); },
      },
    ],
  };

  const NotificationContent = () => (
    <div className="notif-panel" style={{ background: 'var(--card-bg)', width: 340 }}>
      <div style={{
        padding: '14px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <Title level={5} style={{ margin: 0, fontSize: 14 }}>
          Notifications {unreadCount > 0 && <Badge count={unreadCount} style={{ marginLeft: 6 }} />}
        </Title>
        {unreadCount > 0 && (
          <Button type="link" size="small" style={{ padding: 0, fontSize: 12 }}
            onClick={() => markAllNotificationsRead(user?.uid || user?.id)}
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
          dataSource={myNotifications.slice(0, 6)}
          renderItem={item => (
            <div
              className={`notif-item ${!item.read ? 'unread' : ''}`}
              onClick={() => {
                markAsRead(item.id);
                if (item.complaintId) navigate(`/complaint/${item.complaintId}`);
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)',
                background: item.read ? 'transparent' : 'rgba(22,119,255,0.05)',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: item.read ? 'rgba(0,0,0,0.05)' : 'rgba(22,119,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BellOutlined style={{ fontSize: 13, color: item.read ? 'var(--text-muted)' : 'var(--primary-color)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{
                    fontSize: 12, color: 'var(--text-main)', display: 'block',
                    fontWeight: item.read ? 400 : 600, lineHeight: 1.4,
                  }}>
                    {item.message}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 10, marginTop: 2, display: 'block' }}>
                    {dayjs(item.timestamp).fromNow()}
                  </Text>
                </div>
                {!item.read && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0, marginTop: 4 }} />
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
        {/* Brand Header */}
        <div style={{
          padding: collapsed && !isMobile ? '20px 8px' : '18px 20px',
          display: 'flex',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 10,
        }}>
          <Logo
            size={collapsed && !isMobile ? 'small' : 'default'}
            showText={!collapsed || isMobile}
            theme={themeMode}
          />
        </div>

        {/* Current Role Pill */}
        {(!collapsed || isMobile) && userRole && (
          <div style={{ padding: '4px 20px 14px' }}>
            <div style={{
              background: 'rgba(22,119,255,0.08)',
              border: '1px solid rgba(22,119,255,0.2)',
              borderRadius: 12,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE ROLE</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1677ff' }}>{userRole.name}</div>
              </div>
              <Tag color={userRole.badgeColor || 'blue'} style={{ borderRadius: 10, fontSize: 10, margin: 0 }}>
                L{userRole.level}
              </Tag>
            </div>
          </div>
        )}

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0, padding: '4px 0', flex: 1, overflow: 'auto' }}
        />

        {/* System Engine Status pill in sidebar */}
        {(!collapsed || isMobile) && (
          <div style={{ padding: '12px 16px', margin: '0 12px 12px', borderRadius: 10, background: 'rgba(82,196,26,0.08)', border: '1px solid rgba(82,196,26,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', display: 'inline-block', boxShadow: '0 0 8px #52c41a' }} />
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#389e0d' }}>SLA Engine Live</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 2 }}>
              Dynamic Escalation: Active
            </Text>
          </div>
        )}

        {/* Bottom Theme & Guide buttons */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Space>
            <Switch
              checked={themeMode === 'dark'}
              checkedChildren={<BulbFilled style={{ fontSize: 12 }} />}
              unCheckedChildren={<BulbOutlined style={{ fontSize: 12 }} />}
              onChange={toggleTheme}
              size="small"
            />
            {(!collapsed || isMobile) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {themeMode === 'dark' ? 'Dark' : 'Light'}
              </Text>
            )}
          </Space>
          {(!collapsed || isMobile) && (
            <Space size={4}>
              <Button
                type="text"
                size="small"
                icon={<QuestionCircleOutlined />}
                onClick={() => setGuideModalOpen(true)}
                style={{ fontSize: 12, color: 'var(--text-muted)' }}
              >
                Guide
              </Button>
              <Tooltip title="Sign Out">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={() => { logout(); navigate('/login'); }}
                />
              </Tooltip>
            </Space>
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
            background: themeMode === 'dark' ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            padding: '0 24px',
            height: HEADER_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 150,
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Left side: Expand button & Search */}
          <Space size={16} style={{ flex: 1, maxWidth: 500 }}>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined style={{ fontSize: 18 }} />}
                onClick={() => setMobileOpen(true)}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <Tooltip title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'} placement="right">
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

            {/* Quick Search Bar */}
            <AutoComplete
              options={searchOptions}
              style={{ width: isMobile ? 180 : 320 }}
              onSelect={handleSelectSearch}
              value={searchVal}
              onChange={setSearchVal}
            >
              <Input
                placeholder="Search grievances by ID or keyword..."
                prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
                allowClear
                size="middle"
                style={{ borderRadius: 10 }}
              />
            </AutoComplete>
          </Space>

          {/* Right side: Persona Switcher, Notifications, Avatar */}
          <Space size={12}>
            {/* Quick Persona Switcher Dropdown */}
            <Dropdown
              menu={{ items: personaMenuItems, onClick: handlePersonaSelect }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="primary"
                ghost
                icon={<SwapOutlined />}
                style={{
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  height: 38,
                  borderColor: 'rgba(22,119,255,0.4)',
                }}
              >
                <span className="hide-mobile">Switch Persona: </span>
                <span style={{ fontWeight: 700 }}>{user?.name?.split(' ')[0]}</span>
              </Button>
            </Dropdown>

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

            {/* User Profile Dropdown */}
            <Dropdown menu={userMenuItems} placement="bottomRight" arrow={{ pointAtCenter: true }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '4px 10px', borderRadius: 10, transition: 'background 0.2s',
              }}
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
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>

      {/* Guided Tour & Portal Overview Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SafetyCertificateOutlined style={{ color: '#1677ff', fontSize: 22 }} />
            <span>How RESSOLVE Works (Quick Portal Guide)</span>
          </div>
        }
        open={guideModalOpen}
        onCancel={() => setGuideModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setGuideModalOpen(false)} style={{ borderRadius: 8 }}>
            Got it, Let's Explore!
          </Button>
        ]}
        width={720}
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph type="secondary" style={{ fontSize: 14 }}>
            RESSOLVE is a transparent civic and campus grievance redressal engine with guaranteed SLA enforcement, multi-tier escalation, and real-time citizen-officer communication.
          </Paragraph>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: 12, height: '100%', border: '1px solid rgba(22,119,255,0.2)' }}>
                <Title level={5} style={{ color: '#1677ff', margin: '0 0 6px' }}>1. Smart Grievance Filing</Title>
                <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Citizens submit issues using 1-click templates or custom descriptions. AI analyzes keywords and auto-recommends Category, Department, and Priority SLA.
                </Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: 12, height: '100%', border: '1px solid rgba(114,46,209,0.2)' }}>
                <Title level={5} style={{ color: '#722ed1', margin: '0 0 6px' }}>2. Level 1 Officer Assignment</Title>
                <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  System routes the complaint instantly to the active Level 1 responder (e.g., Warden, Inspector, or Medical Officer) with strict SLA countdown clocks.
                </Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: 12, height: '100%', border: '1px solid rgba(255,77,79,0.2)' }}>
                <Title level={5} style={{ color: '#ff4d4f', margin: '0 0 6px' }}>3. Auto SLA Escalation</Title>
                <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  If an officer fails to act before the SLA deadline, the automated engine escalates the grievance up the chain (Level 1 → Level 2 → Level 3) with audit log tracking.
                </Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: 12, height: '100%', border: '1px solid rgba(82,196,26,0.2)' }}>
                <Title level={5} style={{ color: '#52c41a', margin: '0 0 6px' }}>4. Verified Closure & Rating</Title>
                <Text style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Officers submit resolution proof. The citizen tests and accepts the resolution with a 1-5 star satisfaction rating or can reopen the grievance.
                </Text>
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 16, background: 'rgba(22,119,255,0.06)', padding: '12px 16px', borderRadius: 12 }}>
            <Text strong style={{ display: 'block', marginBottom: 4, color: '#1677ff' }}>
              💡 Pro-Tip for Evaluators:
            </Text>
            <Text style={{ fontSize: 13, color: 'var(--text-main)' }}>
              Use the <strong>"Switch Persona"</strong> button in the header bar to immediately test the system as <em>Citizen Bob</em> (filing), <em>Warden Alice</em> (responding/resolving), or <em>Super Admin John</em> (configuring workflows and viewing audit logs)!
            </Text>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default MainLayout;
