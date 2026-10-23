import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, App, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../../components/Logo';

const { Title, Text, Paragraph } = Typography;

const Register = () => {
  const { message } = App.useApp();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    const result = await register(values.email, values.password, values.name, values.phone);
    if (result.success) {
      message.success('Account registered successfully! Welcome to RESSOLVE.');
      setTimeout(() => navigate('/dashboard'), 400);
    } else {
      message.error(result.error || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(175deg, #0b1329 0%, #080d1a 100%)',
      padding: '24px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 2 }}
      >
        <div style={{
          background: '#0d1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          padding: '40px 36px',
        }}>
          {/* Logo Section */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Logo size="large" theme="dark" style={{ justifyContent: 'center', marginBottom: 16 }} />
            <Title level={3} style={{ color: '#f8fafc', fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
              Create Resident Account
            </Title>
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, display: 'block' }}>
              Register for guaranteed public grievance redressal & tracking.
            </Text>
          </div>

          <Form name="register" onFinish={onFinish} layout="vertical" size="large" requiredMark={false}>
            <Form.Item
              name="name"
              label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 12 }}>Full Legal Name</span>}
              rules={[{ required: true, message: 'Please input your full name' }]}
              style={{ marginBottom: 14 }}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#64748b' }} />} 
                placeholder="e.g. Sara Student" 
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  borderRadius: 10,
                  height: 44,
                }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 12 }}>Email Address</span>}
              rules={[{ required: true, type: 'email', message: 'Please input a valid email' }]}
              style={{ marginBottom: 14 }}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#64748b' }} />} 
                placeholder="name@example.com" 
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  borderRadius: 10,
                  height: 44,
                }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 12 }}>Contact Phone (For SMS SLA Alerts)</span>}
              style={{ marginBottom: 14 }}
            >
              <Input 
                prefix={<PhoneOutlined style={{ color: '#64748b' }} />} 
                placeholder="+91 98765 43210" 
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  borderRadius: 10,
                  height: 44,
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 12 }}>Account Password</span>}
              rules={[{ required: true, min: 6, message: 'Minimum 6 characters required' }]}
              style={{ marginBottom: 22 }}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#64748b' }} />} 
                placeholder="••••••••" 
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  borderRadius: 10,
                  height: 44,
                }}
              />
            </Form.Item>

            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
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
              Complete Registration
            </Button>
          </Form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600 }}>
                Sign in to your portal
              </Link>
            </Text>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
