import React, { useState } from 'react';
import {
  Card, Row, Col, Typography, Avatar, Descriptions, Tag, Button,
  Divider, Space, App, Modal, Form, Input, Switch,
} from 'antd';
import {
  UserOutlined, MailOutlined, SafetyOutlined, CalendarOutlined,
  EditOutlined, PhoneOutlined, BellOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useSystemData } from '../context/SystemDataContext';
import { useComplaints } from '../context/ComplaintContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const Profile = () => {
  const { user, userRole, switchPersona } = useAuth();
  const { departments, saveUser } = useSystemData();
  const { addAuditLog } = useComplaints();
  const { message } = App.useApp();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const userDept = user?.deptId ? departments.find(d => d.id === user.deptId)?.name : null;

  const handleOpenEdit = () => {
    form.setFieldsValue({
      name: user?.name,
      phone: user?.phone || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (values) => {
    setSaving(true);
    try {
      const updatedUser = {
        ...user,
        name: values.name,
        phone: values.phone,
        updatedAt: new Date().toISOString(),
      };
      await saveUser(updatedUser);
      switchPersona(updatedUser);
      addAuditLog('Profile Updated', user?.uid || user?.id, `User updated profile contact details`);
      message.success('Account profile updated successfully!');
      setEditModalOpen(false);
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Account Profile & Security</Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Manage your contact credentials, role authority specifications, and notification alerts.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Avatar & Quick Actions */}
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ textAlign: 'center', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <Avatar 
              size={120} 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
              icon={<UserOutlined />}
              style={{ border: '4px solid #1677ff', background: '#f5f7fa', marginBottom: 16 }}
            />
            <Title level={3} style={{ marginBottom: 4, fontWeight: 800 }}>{user?.name}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>{user?.email}</Text>
            
            <Tag color={userRole?.badgeColor || 'blue'} style={{ fontSize: 13, padding: '4px 14px', borderRadius: 20, fontWeight: 700 }}>
              {userRole?.name || 'Citizen / Resident'}
            </Tag>
            
            {userDept && (
              <div style={{ marginTop: 14, fontSize: 13 }}>
                <Text type="secondary">Department Jurisdiction: </Text>
                <div style={{ fontWeight: 700, color: '#1677ff', marginTop: 2 }}>{userDept}</div>
              </div>
            )}

            <Divider />
            
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleOpenEdit}
              block
              style={{ borderRadius: 10, height: 42, fontWeight: 700 }}
            >
              Edit Account Profile
            </Button>
          </Card>
        </Col>

        {/* Right Column: Descriptions & Notifications */}
        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ fontWeight: 800 }}>Profile Overview & Official Jurisdictions</span>}
            bordered={false}
            style={{ borderRadius: 16, boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}
          >
            <Descriptions column={1} bordered labelStyle={{ fontWeight: 700, width: 220 }}>
              <Descriptions.Item label={<span><UserOutlined /> Full Name</span>}>
                <span style={{ fontWeight: 700 }}>{user?.name || 'Not Provided'}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span><MailOutlined /> Official Email Address</span>}>
                {user?.email}
              </Descriptions.Item>
              <Descriptions.Item label={<span><PhoneOutlined /> Contact Phone</span>}>
                {user?.phone || '+91 98765 43210 (Default)'}
              </Descriptions.Item>
              <Descriptions.Item label={<span><SafetyOutlined /> Authority Hierarchy Rank</span>}>
                <Tag color={userRole?.badgeColor || 'blue'} style={{ borderRadius: 10, fontWeight: 700 }}>
                  Level {userRole?.level || 0} — {userRole?.name || 'Citizen'}
                </Tag>
              </Descriptions.Item>
              {userDept && (
                <Descriptions.Item label={<span><SafetyOutlined /> Jurisdictional Scope</span>}>
                  {userDept} Department
                </Descriptions.Item>
              )}
              <Descriptions.Item label={<span><CalendarOutlined /> Account Registered</span>}>
                {user?.createdAt ? dayjs(user.createdAt).format('MMMM D, YYYY') : 'June 18, 2026'}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '20px 0' }} />

            {/* Notification Preferences */}
            <div>
              <Title level={5} style={{ margin: '0 0 12px', fontWeight: 700 }}>
                <BellOutlined style={{ marginRight: 6 }} /> Alert Preferences
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>In-App Push & Real-time Alerts</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Receive notifications when status changes or officers respond.</Text>
                  </div>
                  <Switch checked={emailAlerts} onChange={setEmailAlerts} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Emergency SLA Escalation SMS Chimes</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Urgent SMS alerts when an emergency issue approaches deadline.</Text>
                  </div>
                  <Switch checked={smsAlerts} onChange={setSmsAlerts} />
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <Modal
        title={<span>✏️ Edit Account Profile</span>}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSaveProfile} style={{ padding: '12px 0' }}>
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Contact Phone Number"
            rules={[{ required: true, message: 'Please enter contact phone' }]}
          >
            <Input placeholder="e.g. +91 98765 43210" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
