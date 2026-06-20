import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, App, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

const Register = () => {
  const { message } = App.useApp();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    const result = await register(values.email, values.password, values.name);
    if (result.success) {
      message.success('Registration successful! Please log in.');
      navigate('/login');
    } else {
      message.error(result.error || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Floating dynamic orbs (reused from login styling for visual alignment) */}
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
          width: 440,
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
              initial={{ scale: 0.5, rotate: 15 }}
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
              Create Account
            </Title>
            <Text style={{ color: 'rgba(241,245,249,0.5)', fontSize: 13, marginTop: 4, display: 'block', fontWeight: 500 }}>
              Join RESolve Transparent Grievance Redressal
            </Text>
          </div>

          <Form name="register" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="name"
              label={<span style={{ color: 'rgba(241,245,249,0.8)', fontWeight: 600, fontSize: 13 }}>Full Name</span>}
              rules={[{ required: true, message: 'Please input your full name!' }]}
              style={{ marginBottom: 16 }}
            >
              <Input 
                prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} 
                placeholder="John Smith" 
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
              name="email"
              label={<span style={{ color: 'rgba(241,245,249,0.8)', fontWeight: 600, fontSize: 13 }}>Email Address</span>}
              rules={[{ required: true, type: 'email', message: 'Please input a valid email!' }]}
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
              rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters!' }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />} 
                placeholder="Min. 6 characters" 
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
                Sign Up
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Text style={{ color: 'rgba(241,245,249,0.4)', fontSize: 13 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1677ff', fontWeight: 700, textDecoration: 'none' }}>
                Log in
              </Link>
            </Text>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
