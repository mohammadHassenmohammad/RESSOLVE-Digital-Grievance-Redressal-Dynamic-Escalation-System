import React, { useState } from 'react';
import {
  Form, Input, Button, Typography, Divider, App, Tabs, Row, Col, Card, Tag, Tooltip, Select,
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, ArrowRightOutlined, ThunderboltOutlined,
  ApartmentOutlined, GlobalOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../../components/Logo';

const { Title, Text, Paragraph } = Typography;

const DEMO_PERSONAS = [
  {
    category: 'Citizens & Residents',
    users: [
      { name: 'Bob Citizen', role: 'Citizen / Resident', email: 'bob@gmail.com', pass: 'Bob@12345', badge: 'Citizen L0', color: 'green' },
      { name: 'Sara Student', role: 'Campus Resident', email: 'sara@gmail.com', pass: 'Sara@1234', badge: 'Citizen L0', color: 'green' },
    ],
  },
  {
    category: 'Level 1 Department Responders',
    users: [
      { name: 'Alice Warden', role: 'Hostel Warden', email: 'alice@hostel.com', pass: 'Alice@123', badge: 'Hostel L1', color: 'blue' },
      { name: 'Carol Inspector', role: 'Municipal Sanitary Inspector', email: 'carol@municipal.com', pass: 'Carol@123', badge: 'Municipal L1', color: 'blue' },
      { name: 'Dr. Eve Medical', role: 'Chief Medical Officer', email: 'eve@health.com', pass: 'Eve@12345', badge: 'Health L1', color: 'blue' },
      { name: 'Victor VRO', role: 'Village Revenue Officer', email: 'vro@revenue.com', pass: 'Vro@12345', badge: 'Revenue L1', color: 'blue' },
      { name: 'Frank MVI', role: 'Motor Vehicle Inspector', email: 'frank@transport.com', pass: 'Frank@123', badge: 'Transport L1', color: 'blue' },
    ],
  },
  {
    category: 'Level 2 & 3 Senior Escalation Authorities',
    users: [
      { name: 'Dr. Henry Principal', role: 'Campus Principal', email: 'principal@hostel.com', pass: 'Principal@123', badge: 'Hostel L2', color: 'purple' },
      { name: 'Dave MRO', role: 'Mandal Revenue Officer', email: 'dave@govt.com', pass: 'Dave@1234', badge: 'Revenue L2', color: 'purple' },
      { name: 'Mike Commissioner', role: 'Municipal Commissioner', email: 'commissioner@municipal.com', pass: 'Commiss@123', badge: 'Municipal L2', color: 'purple' },
      { name: 'Cathy Collector (IAS)', role: 'District Collector', email: 'collector@revenue.com', pass: 'Collect@123', badge: 'Revenue L3', color: 'magenta' },
    ],
  },
  {
    category: 'System Administration',
    users: [
      { name: 'John Admin', role: 'Super Administrator', email: 'admin@system.com', pass: 'Admin@123', badge: 'System Admin', color: 'gold' },
    ],
  },
];

const Login = () => {
  const { message } = App.useApp();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('credentials'); // 'credentials' | 'personas'
  const [form] = Form.useForm();

  const handleLoginSubmit = async (values) => {
    setLoading(true);
    const result = await login(values.email, values.password);
    if (result.success) {
      message.success(`Authenticated successfully as ${result.user?.name || values.email}`);
      setTimeout(() => {
        if (result.roleId === 'role-admin') navigate('/admin/workflows');
        else navigate('/dashboard');
      }, 400);
    } else {
      message.error(result.error || 'Authentication failed. Please verify credentials.');
    }
    setLoading(false);
  };

  const handleSelectDemoUser = async (userObj) => {
    form.setFieldsValue({ email: userObj.email, password: userObj.pass });
    setLoading(true);
    const result = await login(userObj.email, userObj.pass);
    if (result.success) {
      message.success(`Access granted: ${userObj.name} (${userObj.role})`);
      setTimeout(() => {
        if (result.roleId === 'role-admin') navigate('/admin/workflows');
        else navigate('/dashboard');
      }, 350);
    } else {
      message.error('Failed to log in: ' + result.error);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#090d16',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      {/* LEFT COLUMN: Editorial / Civic Enterprise Showcase */}
      <div style={{
        flex: '1 1 55%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 64px',
        position: 'relative',
        background: 'linear-gradient(175deg, #0b1329 0%, #080d1a 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
      }} className="hide-mobile">
        {/* Subtle grid lines background overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px', pointerEvents: 'none',
        }} />

        {/* Top Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Logo size="large" theme="dark" />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 16, padding: '4px 12px', borderRadius: 20,
            background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.3)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              National Civic Infrastructure · 100% SLA Enforced
            </span>
          </div>
        </div>

        {/* Central Manifesto */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '40px 0' }}>
          <Title level={1} style={{
            color: '#f8fafc', fontWeight: 800, fontSize: 38,
            lineHeight: 1.2, letterSpacing: '-1px', margin: 0,
          }}>
            Radical transparency for every public grievance.
          </Title>
          <Paragraph style={{
            color: '#94a3b8', fontSize: 16, lineHeight: 1.7,
            marginTop: 18, marginBottom: 32, fontWeight: 400,
          }}>
            RESSOLVE bridges citizens and public administration with automated Level 1 dispatch, binding countdown clocks, and multi-tier authority escalations. No lost complaints, no silent backlogs.
          </Paragraph>

          {/* Dynamic Metric Tickers */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
            padding: '20px 24px', background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#60a5fa' }}>98.4%</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>SLA Compliance Rate</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>&lt; 24h</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Critical Emergency SLA</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#c084fc' }}>5 Tiers</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>Synchronized Workflows</div>
            </div>
          </div>
        </div>

        {/* Trust Badges & Institutional Footer */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 20,
        }}>
          <div style={{ display: 'flex', gap: 24, color: '#64748b', fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SafetyCertificateOutlined style={{ color: '#22c55e' }} /> ISO-Compliant Audit Ledger
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ApartmentOutlined style={{ color: '#38bdf8' }} /> Tiered RBAC Security
            </span>
          </div>
          <Text style={{ color: '#475569', fontSize: 11 }}>v2.4 Production Engine</Text>
        </div>
      </div>

      {/* RIGHT COLUMN: Human, Focused Authentication Form */}
      <div style={{
        flex: '1 1 45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '36px 40px',
        background: '#0d1322',
        position: 'relative',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Form Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Title level={2} style={{ color: '#f8fafc', fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: '-0.5px' }}>
                  Sign in to Portal
                </Title>
                <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, display: 'block' }}>
                  Enter official credentials or choose an evaluation persona.
                </Text>
              </div>
            </div>

            {/* Clean Segmented Tab Switcher */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: 4, borderRadius: 10, marginTop: 18,
            }}>
              <button
                type="button"
                onClick={() => setAuthMode('credentials')}
                style={{
                  padding: '8px 12px', border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: authMode === 'credentials' ? '#1e293b' : 'transparent',
                  color: authMode === 'credentials' ? '#f8fafc' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                Standard Credentials
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('personas')}
                style={{
                  padding: '8px 12px', border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: authMode === 'personas' ? '#2563eb' : 'transparent',
                  color: authMode === 'personas' ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <ThunderboltOutlined /> Evaluator Quick-Access
              </button>
            </div>
          </div>

          {authMode === 'credentials' ? (
            /* STANDARD LOGIN FORM */
            <Form form={form} layout="vertical" onFinish={handleLoginSubmit} requiredMark={false}>
              <Form.Item
                name="email"
                label={<span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>Official Email</span>}
                rules={[{ required: true, message: 'Please input your email' }]}
                style={{ marginBottom: 16 }}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#64748b' }} />}
                  placeholder="name@domain.com"
                  size="large"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    borderRadius: 10,
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>Password</span>
                    <span style={{ fontSize: 11, color: '#38bdf8', cursor: 'pointer' }} onClick={() => message.info('Demo accounts use passwords like Admin@123 or Bob@12345')}>
                      Forgot password?
                    </span>
                  </div>
                }
                rules={[{ required: true, message: 'Please input password' }]}
                style={{ marginBottom: 20 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#64748b' }} />}
                  placeholder="••••••••"
                  size="large"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    borderRadius: 10,
                  }}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                style={{
                  height: 46,
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  background: '#2563eb',
                  borderColor: '#2563eb',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                }}
              >
                Authenticate & Access Dashboard
              </Button>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>
                  Resident without an account?{' '}
                  <Link to="/register" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    Register for Citizen Portal
                  </Link>
                </Text>
              </div>

              {/* Quick Fill Dropdown Helper */}
              <div style={{
                marginTop: 24, padding: '12px 14px', borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>Fill with demo account:</Text>
                <Select
                  size="small"
                  placeholder="Select test account"
                  style={{ width: 170 }}
                  onChange={(val) => {
                    const found = DEMO_PERSONAS.flatMap(p => p.users).find(u => u.email === val);
                    if (found) form.setFieldsValue({ email: found.email, password: found.pass });
                  }}
                  options={DEMO_PERSONAS.flatMap(p => p.users).map(u => ({ value: u.email, label: u.name }))}
                />
              </div>
            </Form>
          ) : (
            /* EVALUATOR ROLE SELECTOR (Clean, High-Density Cards) */
            <div style={{ maxHeight: 440, overflowY: 'auto', paddingRight: 4 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                Click any official role to authenticate instantly into their workspace:
              </div>

              {DEMO_PERSONAS.map((group, gIdx) => (
                <div key={gIdx} style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '0.8px', color: '#64748b', marginBottom: 8,
                  }}>
                    {group.category}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.users.map((u, uIdx) => (
                      <div
                        key={uIdx}
                        onClick={() => handleSelectDemoUser(u)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.12)';
                          e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.role}</div>
                        </div>
                        <Tag color={u.color} style={{ borderRadius: 6, fontSize: 10, fontWeight: 700, margin: 0 }}>
                          {u.badge}
                        </Tag>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
