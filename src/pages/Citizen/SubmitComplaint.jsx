import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Upload, Typography, Row, Col, Space, Alert, App, Result, Switch } from 'antd';
import { UploadOutlined, RobotOutlined, UserOutlined, BranchesOutlined } from '@ant-design/icons';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemData } from '../../context/SystemDataContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SubmitComplaint = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { addComplaint } = useComplaints();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories, users, roles } = useSystemData();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [manualOfficer, setManualOfficer] = useState(false);

  // AI Suggestion Simulation
  const handleDescriptionChange = (e) => {
    const text = e.target.value.toLowerCase();
    if (text.length > 20) {
      if (text.includes('food') || text.includes('hostel') || text.includes('mess')) {
        setAiAnalysis({
          category: 'cat-1', // Food Quality
          priority: 'High',
          reason: 'Mention of essential services (food/housing) detected.'
        });
      } else if (text.includes('safety') || text.includes('harassment') || text.includes('emergency')) {
        setAiAnalysis({
          category: 'cat-6', // Medical/Safety
          priority: 'Critical',
          reason: 'Safety-critical keywords identified.'
        });
      }
    } else {
      setAiAnalysis(null);
    }
  };

  const applyAiSuggestions = () => {
    if (aiAnalysis) {
      form.setFieldsValue({
        categoryId: aiAnalysis.category,
        priority: aiAnalysis.priority
      });
      message.success('AI suggestions applied!');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await addComplaint({
        ...values,
        userId: user.uid // Use uid for firebase
      });
      setSubmitted(true);
    } catch (error) {
      message.error("Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <Result
          status="success"
          title="Complaint Submitted Successfully!"
          subTitle="A unique ID has been generated and an officer has been assigned. You can track the progress in your dashboard."
          extra={[
            <Button type="primary" key="dashboard" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>,
            <Button key="new" onClick={() => setSubmitted(false)}>
              Submit Another
            </Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <div className="fade-in">
      <Title level={2}>New Grievance Redressal</Title>
      <Paragraph type="secondary"> Please provide detailed information. Our AI system will automatically route your complaint to the appropriate department.</Paragraph>

      <Row gutter={24}>
        <Col lg={16} xs={24}>
          <Card bordered={false} className="glass-effect">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="title"
                label="Complaint Title"
                rules={[{ required: true, message: 'Please enter a title' }]}
              >
                <Input placeholder="Brief summary of the issue" size="large" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Detailed Description"
                rules={[{ required: true, message: 'Please explain the issue' }]}
              >
                <TextArea 
                  rows={6} 
                  placeholder="Provide as much detail as possible..." 
                  onChange={handleDescriptionChange}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="categoryId"
                    label="Category"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Select Category" size="large">
                      {categories.map(c => (
                        <Option key={c.id} value={c.id}>{c.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="priority"
                    label="Priority"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="Select Priority" size="large">
                      <Option value="Low">Low</Option>
                      <Option value="Medium">Medium</Option>
                      <Option value="High">High</Option>
                      <Option value="Critical">Critical</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Manual Officer Selection (Optional)">
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Switch checked={manualOfficer} onChange={setManualOfficer} />
                    <Text type="secondary">Override automatic routing</Text>
                  </div>
                  {manualOfficer && (
                    <Form.Item name="manualOfficerId" noStyle>
                      <Select placeholder="Choose an Officer" size="large">
                         {users.filter(u => u.roleId !== 'role-citizen').map(u => (
                           <Option key={u.id} value={u.id}>{u.name} ({roles.find(r => r.id === u.roleId)?.name || 'Officer'})</Option>
                         ))}
                      </Select>
                    </Form.Item>
                  )}
                </Space>
              </Form.Item>

              <Form.Item label="Attachments">
                <Upload.Dragger name="files" multiple={true} action="/upload">
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Click or drag images/PDFs to this area to upload</p>
                  <p className="ant-upload-hint">Support for single or bulk upload. Max size 5MB.</p>
                </Upload.Dragger>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 50, borderRadius: 10 }}>
                  Submit Formal Grievance
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col lg={8} xs={24}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {aiAnalysis && (
              <Card 
                title={<span><RobotOutlined style={{ color: 'var(--primary-color)' }} /> AI Analysis</span>}
                className="fade-in"
                style={{ borderColor: 'var(--primary-color)' }}
              >
                <Alert
                  message="Suggested Category & Priority"
                  description={aiAnalysis.reason}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Button block type="dashed" onClick={applyAiSuggestions}>
                  Apply Suggestions
                </Button>
              </Card>
            )}

            <Card title="Submission Policy">
              <Space direction="vertical">
                <div style={{ display: 'flex', gap: 12 }}>
                  <BranchesOutlined style={{ color: '#52c41a' }} />
                  <Text style={{ fontSize: 13 }}>Automatic routing ensures your complaint reaches the right desk in seconds.</Text>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <UserOutlined style={{ color: '#faad14' }} />
                  <Text style={{ fontSize: 13 }}>Transparency: You will see who is handling your case at every level.</Text>
                </div>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default SubmitComplaint;
