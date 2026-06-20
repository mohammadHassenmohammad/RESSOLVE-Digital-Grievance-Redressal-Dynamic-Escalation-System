import React from 'react';
import { Card, Row, Col, Typography, Avatar, Descriptions, Tag, Button, Divider, Space, App } from 'antd';
import { UserOutlined, MailOutlined, SafetyOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useSystemData } from '../context/SystemDataContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Profile = () => {
  const { user, userRole } = useAuth();
  const { departments } = useSystemData();
  const { message } = App.useApp();

  const userDept = user?.deptId ? departments.find(d => d.id === user.deptId)?.name : null;

  const handleUpdateProfile = () => {
    message.info('Profile update features are locked in demo environment.');
  };

  return (
    <div className="fade-in" style={{ padding: '12px 0 24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0 }}>My Profile</Title>
            <Text type="secondary">View and manage your account settings and preferences.</Text>
          </div>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ textAlign: 'center', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Avatar 
              size={120} 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
              icon={<UserOutlined />}
              style={{ border: '4px solid var(--primary-color)', background: '#f5f7fa', marginBottom: 16 }}
            />
            <Title level={3} style={{ marginBottom: 4 }}>{user?.name}</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{user?.email}</Text>
            
            <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20 }}>
              {userRole?.name || 'Citizen'}
            </Tag>
            
            {userDept && (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">Department: </Text>
                <Text strong>{userDept}</Text>
              </div>
            )}

            <Divider />
            
            <Button type="primary" icon={<EditOutlined />} onClick={handleUpdateProfile} block style={{ borderRadius: 8, height: 40 }}>
              Edit Account Details
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Account Overview" bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <Descriptions column={1} bordered labelStyle={{ fontWeight: 600, width: 200 }}>
              <Descriptions.Item label={<span><UserOutlined /> Full Name</span>}>
                {user?.name || 'Not Provided'}
              </Descriptions.Item>
              <Descriptions.Item label={<span><MailOutlined /> Email Address</span>}>
                {user?.email}
              </Descriptions.Item>
              <Descriptions.Item label={<span><SafetyOutlined /> Role Authority Level</span>}>
                {userRole ? `Level ${userRole.level} (${userRole.name})` : 'Level 0 (Citizen)'}
              </Descriptions.Item>
              {userDept && (
                <Descriptions.Item label={<span><SafetyOutlined /> Assigned Jurisdiction</span>}>
                  {userDept} Department
                </Descriptions.Item>
              )}
              <Descriptions.Item label={<span><CalendarOutlined /> Account Registered</span>}>
                {user?.createdAt ? dayjs(user.createdAt).format('MMMM D, YYYY') : 'Not Available'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Title level={4}>Portal Guidelines</Title>
              <ul>
                <li>Citizens can submit grievances and trace their statuses through the timeline.</li>
                <li>Officers must respond to grievances and update timeline statuses within the stipulated SLA threshold.</li>
                <li>System escalation routes complaints automatically upon SLA breach to higher hierarchy levels.</li>
                <li>All user operations (status changes, updates, registrations) are audited and preserved in immutable system logs.</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
