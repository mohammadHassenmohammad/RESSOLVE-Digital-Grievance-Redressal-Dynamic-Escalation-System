import React, { useState } from 'react';
import { Form, Input, Button, Typography, Divider, App, Tabs, Row, Col, Card, Tag, Tooltip } from 'antd';
import { 
  UserOutlined, LockOutlined, MailOutlined, IdcardOutlined,
  CrownOutlined, BookOutlined, InteractionOutlined, EnvironmentOutlined,
  MedicineBoxOutlined, CarOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

const CORE_ACCOUNTS = [
  { label: 'Super Admin', email: 'admin@system.com', password: 'Admin@123', color: '#faad14', desc: 'Manage workflows, audit logs, and users.', icon: <CrownOutlined /> },
  { label: 'Citizen (Bob)', email: 'bob@gmail.com', password: 'Bob@12345', color: '#13c2c2', desc: 'File new complaints and track redressal.', icon: <UserOutlined /> },
  { label: 'Citizen (Sara)', email: 'sara@gmail.com', password: 'Sara@1234', color: '#1890ff', desc: 'File complaints and receive alerts.', icon: <UserOutlined /> },
];

const HOSTEL_ACCOUNTS = [
  { label: 'Warden (L1)', email: 'alice@hostel.com', password: 'Alice@123', color: '#f5222d', desc: 'First responder for hostel issues.', icon: <BookOutlined /> },
  { label: 'Principal (L2)', email: 'principal@hostel.com', password: 'Principal@123', color: '#fa8c16', desc: 'Escalation authority for hostels.', icon: <InteractionOutlined /> },
  { label: 'Dean (L3)', email: 'dean@hostel.com', password: 'Dean@123', color: '#722ed1', desc: 'Final university grievance authority.', icon: <CrownOutlined /> },
];

const REVENUE_ACCOUNTS = [
  { label: 'VRO (L1)', email: 'vro@revenue.com', password: 'Vro@12345', color: '#13c2c2', desc: 'Village Revenue Officer.', icon: <EnvironmentOutlined /> },
  { label: 'MRO (L2)', email: 'dave@govt.com', password: 'Dave@1234', color: '#52c41a', desc: 'Mandal Revenue Officer.', icon: <InteractionOutlined /> },
  { label: 'Collector (L3)', email: 'collector@revenue.com', password: 'Collect@123', color: '#eb2f96', desc: 'District Revenue Collector.', icon: <CrownOutlined /> },
];

const MUNICIPAL_ACCOUNTS = [
  { label: 'Inspector (L1)', email: 'carol@municipal.com', password: 'Carol@123', color: '#2f54eb', desc: 'Municipal Inspector for civil issues.', icon: <EnvironmentOutlined /> },
  { label: 'Commissioner (L2)', email: 'commissioner@municipal.com', password: 'Commiss@123', color: '#722ed1', desc: 'Municipal Commissioner.', icon: <CrownOutlined /> },
];

const HEALTH_TRANSPORT_ACCOUNTS = [
  { label: 'Doctor (L1)', email: 'eve@health.com', password: 'Eve@12345', color: '#eb2f96', desc: 'Medical Officer for health alerts.', icon: <MedicineBoxOutlined /> },
  { label: 'Director (L2)', email: 'director@health.com', password: 'Direct@123', color: '#f5222d', desc: 'State Health Director.', icon: <CrownOutlined /> },
  { label: 'MVI (L1)', email: 'frank@transport.com', password: 'Frank@123', color: '#fa8c16', desc: 'Motor Vehicle Inspector.', icon: <CarOutlined /> },
  { label: 'RTO (L2)', email: 'rto@transport.com', password: 'Rto@123456', color: '#2f54eb', desc: 'Regional Transport Officer.', icon: <CrownOutlined /> },
];

const Login = () => {
  const { message } = App.useApp();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('core');
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    const result = await login(values.email, values.password);
    if (result.success) {
      message.success('Welcome back! Redirecting...');
      setTimeout(() => {
        if (result.roleId === 'role-admin') navigate('/admin/workflows');
        else navigate('/dashboard');
      }, 600);
    } else {
      message.error(result.error || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const quickLogin = async (account) => {
    form.setFieldsValue({ email: account.email, password: account.password });
    setLoading(true);
    const result = await login(account.email, account.password);
    if (result.success) {
      message.success(`Logged in as ${account.label}`);
      setTimeout(() => {
        if (result.roleId === 'role-admin') navigate('/admin/workflows');
        else navigate('/dashboard');
      }, 400);
    } else {
      message.error('Quick login failed: ' + result.error);
    }
    setLoading(false);
  };

  const renderRoleGrid = (accounts) => (
    <Row gutter={[10, 10]} style={{ marginTop: 12 }}>
      {accounts.map(acc => (
        <Col span={12} key={acc.email}>
          <Tooltip title={acc.desc} color="#1e293b" overlayInnerStyle={{ fontSize: 11, borderRadius: 8 }}>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                block
                size="middle"
                onClick={() => quickLogin(acc)}
                disabled={loading}
                style={{
                  height: 48,
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${acc.color}35`,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '0 12px',
                  gap: '8px',
                  textAlign: 'left',
                }}
              >
                <div style={{ 
                  width: 24, height: 24, 
                  borderRadius: 6, 
                  background: `${acc.color}22`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: acc.color,
                  fontSize: 14 
                }}>
                  {acc.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.label}</div>
                  <div style={{ fontSize: 9, color: 'rgba(241, 245, 249, 0.45)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.email}</div>
                </div>
              </Button>
            </motion.div>
          </Tooltip>
        </Col>
      ))}
    </Row>
  );

  return (
    <div className="login-page">
      {/* Dynamic flowing background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'center', padding: '24px' }}
      >
        <div className="login-card" style={{
          width: 520,
          background: 'rgba(15, 22, 41, 0.7)',
          backdropFilter: 'blur(30px) saturate(1.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 28,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)',
          padding: '36px 40px',
        }}>
          {/* Logo Section */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <motion.div
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 15, delay: 0.15 }}
              style={{
                width: 72, height: 72,
                background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                borderRadius: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 10px 30px rgba(22,119,255,0.4), 0 0 0 1px rgba(255,255,255,0.15)',
              }}
            >
              <IdcardOutlined style={{ fontSize: 36, color: '#fff' }} />
            </motion.div>
            <Title level={2} style={{ margin: 0, color: '#f8fafc', fontWeight: 800, letterSpacing: '-0.5px' }}>
              RES<span style={{ color: '#4096ff' }}>SOLVE</span>
            </Title>
            <Text style={{ color: 'rgba(241,245,249,0.5)', fontSize: 13, marginTop: 4, display: 'block', fontWeight: 500 }}>
              Grievance Redressal & Dynamic Escalation Portal
            </Text>
          </div>

          {/* Main Credentials Login Form */}
          <Form name="login" form={form} onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="email"
              label={<span style={{ color: 'rgba(241,245,249,0.8)', fontWeight: 600, fontSize: 13 }}>Email Address</span>}
              rules={[{ required: true, message: 'Please enter your email' }]}
              style={{ marginBottom: 16 }}
            >
              <Input
                prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                placeholder="you@example.com"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  borderRadius: 12,
                  height: 48,
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: 'rgba(241,245,249,0.8)', fontWeight: 600, fontSize: 13 }}>Password</span>}
              rules={[{ required: true, message: 'Please enter your password' }]}
              style={{ marginBottom: 20 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                placeholder="Your secure password"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: '#f8fafc',
                  borderRadius: 12,
                  height: 48,
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="login-btn"
                style={{
                  height: 48,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                  boxShadow: '0 8px 24px rgba(22, 119, 255, 0.3)',
                  border: 'none',
                }}
              >
                Sign In to Portal
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '24px 0 16px' }}>
            <span style={{ color: 'rgba(241,245,249,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Quick Demo Login Selector
            </span>
          </Divider>

          {/* Quick Login Tabs */}
          <div className="login-quick-tabs">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab} 
              centered
              size="small"
              tabBarStyle={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}
            >
              <Tabs.TabPane tab="Core" key="core">
                {renderRoleGrid(CORE_ACCOUNTS)}
              </Tabs.TabPane>
              <Tabs.TabPane tab="Hostel" key="hostel">
                {renderRoleGrid(HOSTEL_ACCOUNTS)}
              </Tabs.TabPane>
              <Tabs.TabPane tab="Revenue" key="revenue">
                {renderRoleGrid(REVENUE_ACCOUNTS)}
              </Tabs.TabPane>
              <Tabs.TabPane tab="Govt Depts" key="govt">
                {renderRoleGrid(HEALTH_TRANSPORT_ACCOUNTS)}
              </Tabs.TabPane>
              <Tabs.TabPane tab="Municipal" key="municipal">
                {renderRoleGrid(MUNICIPAL_ACCOUNTS)}
              </Tabs.TabPane>
            </Tabs>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Text style={{ color: 'rgba(241,245,249,0.4)', fontSize: 13 }}>
              New citizen?{' '}
              <Link to="/register" style={{ color: '#1677ff', fontWeight: 700, textDecoration: 'none' }}>
                Create an account
              </Link>
            </Text>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
