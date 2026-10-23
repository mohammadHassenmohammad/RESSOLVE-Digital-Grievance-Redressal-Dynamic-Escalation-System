import React, { useState } from 'react';
import {
  Card, Form, Input, Select, Button, Upload, Typography, Row, Col, Space, Alert, App,
  Result, Tag, Tooltip, Divider, Progress, Badge,
} from 'antd';
import {
  UploadOutlined, RobotOutlined, UserOutlined, BranchesOutlined,
  ThunderboltOutlined, AudioOutlined, CheckCircleOutlined, CopyOutlined,
  EnvironmentOutlined, PictureOutlined, FireOutlined, ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useSystemData } from '../../context/SystemDataContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TEMPLATES = [
  {
    icon: '🍲',
    label: 'Mess Food Hygiene Issue',
    title: 'Severe food contamination in student mess dining hall',
    description: 'During dinner hours, students noticed unhygienic preparation and insects near food counters. Multiple students complained of stomach ache.',
    category: 'cat-1',
    priority: 'Critical',
    location: 'Hostel Dining Complex, Block B',
  },
  {
    icon: '🚰',
    label: 'Brown Tap Water Supply',
    title: 'Contaminated brown mud water supply in residential taps',
    description: 'Domestic water supply is carrying dark mud and sewage odor for the past 24 hours. Poses severe public health hazard.',
    category: 'cat-4',
    priority: 'Critical',
    location: 'Sector 4, Main Pipeline Grid',
  },
  {
    icon: '📶',
    label: 'WiFi Backbone Offline',
    title: 'Optical fiber torn and hostel wireless routers down',
    description: 'Optical fiber line was severed on floor 2. Entire block of 100+ students unable to access academic portal or submit projects.',
    category: 'cat-8',
    priority: 'High',
    location: 'Hostel Block B, Corridors 2 & 3',
  },
  {
    icon: '🛣️',
    label: 'Dangerous Road Pothole',
    title: 'Deep crater pothole causing motorcycle accidents',
    description: 'A deep pothole has emerged near the bus stop junction without any barricading. Two commuter bikes have already skidded.',
    category: 'cat-12',
    priority: 'Medium',
    location: 'Main Ring Road, Near Bus Stop 14',
  },
];

const SAMPLE_PHOTOS = [
  { name: 'evidence_leakage.jpg', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60' },
  { name: 'food_hygiene.jpg', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60' },
  { name: 'road_damage.jpg', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=60' },
];

const SubmitComplaint = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const { addComplaint } = useComplaints();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories, departments, users } = useSystemData();

  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  // Dynamic AI Keyword Engine
  const analyzeText = (text) => {
    const t = (text || '').toLowerCase();
    if (t.length < 15) {
      setAiAnalysis(null);
      return;
    }

    if (t.includes('food') || t.includes('mess') || t.includes('meal') || t.includes('hygiene') || t.includes('cockroach') || t.includes('insect')) {
      setAiAnalysis({
        categoryId: 'cat-1',
        deptId: 'dept-1',
        priority: 'Critical',
        deptName: 'Hostel & Campus Facilities',
        confidence: 96,
        reason: 'Detected sanitation and food contamination keywords.',
        slaHours: 24,
      });
    } else if (t.includes('water') || t.includes('pipe') || t.includes('leak') || t.includes('drain') || t.includes('sewage')) {
      setAiAnalysis({
        categoryId: 'cat-4',
        deptId: 'dept-3',
        priority: 'Critical',
        deptName: 'Municipal & Civil Infrastructure',
        confidence: 94,
        reason: 'Water supply crisis and contamination indicators identified.',
        slaHours: 24,
      });
    } else if (t.includes('wifi') || t.includes('internet') || t.includes('router') || t.includes('network') || t.includes('connectivity')) {
      setAiAnalysis({
        categoryId: 'cat-8',
        deptId: 'dept-1',
        priority: 'High',
        deptName: 'Hostel & Campus Facilities',
        confidence: 92,
        reason: 'Campus IT infrastructure failure.',
        slaHours: 48,
      });
    } else if (t.includes('pothole') || t.includes('road') || t.includes('accident') || t.includes('streetlight') || t.includes('traffic')) {
      setAiAnalysis({
        categoryId: 'cat-12',
        deptId: 'dept-3',
        priority: 'High',
        deptName: 'Municipal & Civil Infrastructure',
        confidence: 89,
        reason: 'Public road safety & civil works classification.',
        slaHours: 48,
      });
    } else if (t.includes('doctor') || t.includes('hospital') || t.includes('medicine') || t.includes('ambulance') || t.includes('nurse')) {
      setAiAnalysis({
        categoryId: 'cat-6',
        deptId: 'dept-4',
        priority: 'Critical',
        deptName: 'Public Health & Medical Services',
        confidence: 95,
        reason: 'Emergency healthcare services alert.',
        slaHours: 12,
      });
    } else if (t.includes('land') || t.includes('encroach') || t.includes('property') || t.includes('patta') || t.includes('survey')) {
      setAiAnalysis({
        categoryId: 'cat-3',
        deptId: 'dept-2',
        priority: 'High',
        deptName: 'Revenue & Land Administration',
        confidence: 91,
        reason: 'Land registry and boundary dispute detected.',
        slaHours: 72,
      });
    } else {
      setAiAnalysis(null);
    }
  };

  const handleApplyAi = () => {
    if (aiAnalysis) {
      form.setFieldsValue({
        categoryId: aiAnalysis.categoryId,
        priority: aiAnalysis.priority,
      });
      message.success('Applied AI Category and Priority SLA!');
    }
  };

  const handleSelectTemplate = (template) => {
    form.setFieldsValue({
      title: template.title,
      description: template.description,
      categoryId: template.category,
      priority: template.priority,
      location: template.location,
    });
    analyzeText(template.description);
    message.info(`Loaded template: "${template.label}"`);
  };

  const handleVoiceInputSimulate = () => {
    setIsRecording(true);
    message.loading('Listening to audio speech input...', 2);
    setTimeout(() => {
      setIsRecording(false);
      const transcribedText = "The main water pipeline near Sector 4 community park has ruptured completely, leaking thousands of liters and mixing with roadside mud.";
      form.setFieldsValue({
        title: "Burst water pipeline in Sector 4 Community Park",
        description: transcribedText,
        location: "Sector 4 Community Park, Gate 2",
      });
      analyzeText(transcribedText);
      message.success('Speech transcribed accurately into grievance form!');
    }, 2000);
  };

  const handleAddSamplePhoto = (photo) => {
    if (attachments.some(a => a.url === photo.url)) return;
    setAttachments([...attachments, photo]);
    message.success(`Attached photo: ${photo.name}`);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const newId = await addComplaint({
        ...values,
        userId: user?.uid || user?.id || 'u-bob',
        citizenName: user?.name || 'Bob Citizen',
        attachments,
      });
      setSubmittedData({
        id: newId,
        title: values.title,
        priority: values.priority,
        category: categories.find(c => c.id === values.categoryId)?.name,
        slaHours: values.priority === 'Critical' ? 24 : values.priority === 'High' ? 48 : 96,
      });
      message.success('Grievance registered and assigned to officer successfully!');
    } catch (error) {
      message.error("Failed to submit complaint: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submittedData) {
    return (
      <div className="fade-in" style={{ maxWidth: 760, margin: '20px auto' }}>
        <Card bordered={false} style={{ borderRadius: 16, boxShadow: 'var(--shadow-md)', textAlign: 'center', padding: '24px 16px' }}>
          <Result
            status="success"
            title={
              <span style={{ fontWeight: 800, fontSize: 24 }}>
                Grievance Lodged Successfully!
              </span>
            }
            subTitle={
              <div style={{ maxWidth: 540, margin: '8px auto', fontSize: 14 }}>
                Your issue has been logged into the immutable civic ledger. An authorized Level 1 officer has been assigned under strict SLA enforcement.
              </div>
            }
          />

          {/* Grievance Ticket Receipt */}
          <div style={{
            background: 'rgba(22,119,255,0.05)',
            border: '1px dashed rgba(22,119,255,0.4)',
            borderRadius: 14,
            padding: '20px 24px',
            margin: '20px auto',
            maxWidth: 520,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>TRACKING NUMBER</Text>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#1677ff' }}>
                  #{submittedData.id}
                </div>
              </div>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(submittedData.id);
                  message.success('Tracking ID copied to clipboard!');
                }}
              >
                Copy ID
              </Button>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Subject</Text>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{submittedData.title}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Category</Text>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{submittedData.category}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Priority Tier</Text>
                <div>
                  <Tag color={submittedData.priority === 'Critical' ? 'red' : 'orange'} style={{ fontWeight: 700 }}>
                    {submittedData.priority} PRIORITY
                  </Tag>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Guaranteed Redressal SLA</Text>
                <div style={{ fontWeight: 700, color: '#389e0d', fontSize: 13 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Within {submittedData.slaHours} Hours
                </div>
              </div>
            </div>
          </div>

          <Space size={16} style={{ marginTop: 12 }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(`/complaint/${submittedData.id}`)}
              style={{ borderRadius: 10, fontWeight: 700, height: 44, padding: '0 28px' }}
            >
              Track Grievance Live
            </Button>
            <Button
              size="large"
              onClick={() => {
                setSubmittedData(null);
                form.resetFields();
                setAttachments([]);
                setAiAnalysis(null);
              }}
              style={{ borderRadius: 10, height: 44 }}
            >
              Submit Another Grievance
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
          File a Public Grievance
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 14, margin: '4px 0 0' }}>
          Describe your grievance below. Our smart routing engine uses AI to assign the correct department and enforce response timelines.
        </Paragraph>
      </div>

      {/* Common Grievance Presets */}
      <Card
        size="small"
        bordered={false}
        style={{ marginBottom: 20, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 14 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <BranchesOutlined style={{ color: '#2563eb' }} />
          <Text strong style={{ fontSize: 13 }}>Common Incident Presets:</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Select a standard template to auto-populate incident details.</Text>
        </div>
        <Space wrap size={8}>
          {TEMPLATES.map((tmpl, idx) => (
            <Button
              key={idx}
              size="small"
              onClick={() => handleSelectTemplate(tmpl)}
              style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
            >
              <span style={{ marginRight: 6 }}>{tmpl.icon}</span> {tmpl.label}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Main Form */}
        <Col xs={24} lg={15}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ priority: 'Medium' }}>
              <Form.Item
                name="title"
                label={<span style={{ fontWeight: 700 }}>Grievance Subject / Title</span>}
                rules={[{ required: true, message: 'Please provide a clear subject' }]}
              >
                <Input placeholder="e.g., Leaking water main pipe near community center" size="large" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item
                name="description"
                label={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>Detailed Description</span>
                    <Button
                      type="dashed"
                      size="small"
                      icon={<AudioOutlined style={{ color: isRecording ? '#ff4d4f' : '#1677ff' }} />}
                      onClick={handleVoiceInputSimulate}
                      loading={isRecording}
                      style={{ borderRadius: 12, fontSize: 11 }}
                    >
                      {isRecording ? 'Listening...' : '🎙️ Speak to Dictate'}
                    </Button>
                  </div>
                }
                rules={[{ required: true, message: 'Please provide a description of the issue' }]}
              >
                <TextArea
                  rows={5}
                  placeholder="Explain what happened, location references, and how long the issue has persisted..."
                  onChange={e => analyzeText(e.target.value)}
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="categoryId"
                    label={<span style={{ fontWeight: 700 }}>Category</span>}
                    rules={[{ required: true, message: 'Please pick a category' }]}
                  >
                    <Select placeholder="Select category" size="large" style={{ borderRadius: 10 }}>
                      {categories.map(c => (
                        <Option key={c.id} value={c.id}>
                          {c.icon || '📌'} {c.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="priority"
                    label={<span style={{ fontWeight: 700 }}>Requested Priority Tier</span>}
                    rules={[{ required: true }]}
                  >
                    <Select size="large">
                      <Option value="Critical">🔴 Critical (24-Hour SLA)</Option>
                      <Option value="High">🟠 High (48-Hour SLA)</Option>
                      <Option value="Medium">🟡 Medium (96-Hour SLA)</Option>
                      <Option value="Low">🟢 Low (7-Day SLA)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="location"
                label={<span style={{ fontWeight: 700 }}><EnvironmentOutlined style={{ marginRight: 6 }} />Location / Landmark Reference</span>}
              >
                <Input placeholder="e.g., Block B Second Floor Corridor or Ward 12 Main St" size="middle" style={{ borderRadius: 10 }} />
              </Form.Item>

              {/* Photos & Evidence */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 13 }}><PictureOutlined style={{ marginRight: 6 }} />Photo / Visual Evidence</Text>
                  <Space size={6}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Add Sample Evidence: </Text>
                    {SAMPLE_PHOTOS.map((sp, idx) => (
                      <Button key={idx} size="small" type="link" style={{ padding: 0, fontSize: 11 }} onClick={() => handleAddSamplePhoto(sp)}>
                        + Photo {idx + 1}
                      </Button>
                    ))}
                  </Space>
                </div>

                {attachments.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    {attachments.map((att, idx) => (
                      <div key={idx} style={{ position: 'relative', width: 90, height: 70, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={att.url} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span
                          style={{
                            position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff',
                            borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 10, cursor: 'pointer',
                          }}
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                block
                style={{
                  height: 48,
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  boxShadow: '0 4px 14px rgba(22,119,255,0.4)',
                }}
              >
                Submit Grievance to Portal
              </Button>
            </Form>
          </Card>
        </Col>

        {/* AI Assistant & Guidelines Sidebar */}
        <Col xs={24} lg={9}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            {/* Departmental Triage Advisory Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: 'rgba(37, 99, 235, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb',
                  }}>
                    <BranchesOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, display: 'block' }}>Departmental Triage Advisory</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>Automated jurisdictional classification & priority assignment</Text>
                  </div>
                </div>

                {aiAnalysis ? (
                  <div style={{ background: 'rgba(37, 99, 235, 0.03)', padding: 14, borderRadius: 12, border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                        {aiAnalysis.confidence}% Match Confidence
                      </Tag>
                      <Tag color={aiAnalysis.priority === 'Critical' ? 'red' : 'orange'} style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                        {aiAnalysis.priority} SLA Tier
                      </Tag>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                      Jurisdiction: {aiAnalysis.deptName}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                      {aiAnalysis.reason}
                    </Text>

                    <Button
                      type="primary"
                      size="small"
                      block
                      onClick={handleApplyAi}
                      style={{ borderRadius: 8, fontWeight: 700, background: '#2563eb' }}
                    >
                      Apply Recommended Triage
                    </Button>
                  </div>
                ) : (
                  <div style={{ padding: '16px 8px', textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      As you describe the incident, the triage engine cross-references departmental jurisdictions to determine the appropriate response agency and binding SLA.
                    </Text>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* SLA Protection Card */}
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
              <Title level={5} style={{ margin: '0 0 10px', fontWeight: 700 }}>
                🛡️ Guaranteed SLA Redressal
              </Title>
              <Paragraph style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Under the Digital Redressal Act, all grievances carry binding resolution deadlines:
              </Paragraph>
              <ul style={{ paddingLeft: 18, marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <li><strong>Critical:</strong> 24-Hour emergency response</li>
                <li><strong>High:</strong> 48-Hour mandatory inspection</li>
                <li><strong>Medium:</strong> 96-Hour resolution window</li>
                <li><strong>Auto-Escalation:</strong> Automatically moves to Higher Authority upon breach</li>
              </ul>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default SubmitComplaint;
