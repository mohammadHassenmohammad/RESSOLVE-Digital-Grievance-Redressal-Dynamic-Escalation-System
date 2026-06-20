import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Typography, Tag, Steps, Button, Space, Divider,
  Avatar, Input, App, Modal, Rate, Spin, Progress, Tooltip, Badge,
} from 'antd';
import {
  ArrowLeftOutlined, SendOutlined, CheckCircleOutlined,
  WarningOutlined, HistoryOutlined, ClockCircleOutlined,
  FireOutlined, UserOutlined, CalendarOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import { useSystemData } from '../context/SystemDataContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion } from 'framer-motion';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_META = {
  Submitted:    { color: '#1677ff', bg: 'rgba(22,119,255,0.1)',  icon: '📝' },
  Assigned:     { color: '#722ed1', bg: 'rgba(114,46,209,0.1)', icon: '👤' },
  'In Progress':{ color: '#fa8c16', bg: 'rgba(250,140,22,0.1)', icon: '⚙️' },
  Resolved:     { color: '#52c41a', bg: 'rgba(82,196,26,0.1)',  icon: '✅' },
  Escalated:    { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)',  icon: '🔺' },
  Pending:      { color: '#faad14', bg: 'rgba(250,173,20,0.1)', icon: '⏳' },
  Closed:       { color: '#595959', bg: 'rgba(0,0,0,0.06)',     icon: '🔒' },
  Rejected:     { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)',  icon: '❌' },
};

const PRIORITY_META = {
  Critical: { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)', label: 'CRITICAL' },
  High:     { color: '#fa8c16', bg: 'rgba(250,140,22,0.1)', label: 'HIGH' },
  Medium:   { color: '#faad14', bg: 'rgba(250,173,20,0.1)', label: 'MEDIUM' },
  Low:      { color: '#52c41a', bg: 'rgba(82,196,26,0.1)',  label: 'LOW' },
};

const ComplaintDetails = () => {
  const { message } = App.useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const { complaints, loading: dataLoading, updateComplaintStatus, escalateComplaint } = useComplaints();
  const { user, userRole } = useAuth();
  const { users, roles, departments, categories } = useSystemData();

  const complaint = complaints.find(c => c.id === id);
  const [remark, setRemark] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" description="Loading complaint..." />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 16 }}>Complaint not found or you do not have access.</Text>
        <br />
        <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const assignedOfficer = users.find(u => u.id === complaint?.assignedOfficerId);
  const officerRole = roles.find(r => r.id === assignedOfficer?.roleId);
  const dept = departments.find(d => d.id === complaint.deptId);
  const category = categories.find(c => c.id === complaint.categoryId);
  const isCitizen = userRole?.id === 'role-citizen';
  const isAssignedOfficer = user?.uid === complaint.assignedOfficerId;
  const isAdmin = userRole?.id === 'role-admin';
  const canUpdate = isAssignedOfficer || isAdmin;

  const priorityMeta = PRIORITY_META[complaint.priority] || PRIORITY_META.Medium;
  const statusMeta = STATUS_META[complaint.status] || STATUS_META.Assigned;

  // SLA calculation
  const slaTotal = dayjs(complaint.slaDeadline).diff(dayjs(complaint.createdAt), 'hour');
  const slaUsed = dayjs().diff(dayjs(complaint.createdAt), 'hour');
  const slaPercent = Math.min(100, Math.round((slaUsed / Math.max(slaTotal, 1)) * 100));
  const slaOverdue = dayjs().isAfter(complaint.slaDeadline);
  const slaColor = slaOverdue ? '#ff4d4f' : slaPercent > 75 ? '#fa8c16' : '#52c41a';

  const handleUpdate = async (status) => {
    if (!remark.trim()) {
      message.warning('Please add a remark before updating status.');
      return;
    }
    await updateComplaintStatus(complaint.id, status, remark, user.uid);
    setRemark('');
    message.success(`Status updated to "${status}"`);
  };

  const handleEscalate = async () => {
    await escalateComplaint(complaint.id);
    message.success('Complaint escalated to higher authority.');
  };

  const handleSatisfaction = async (type) => {
    if (type === 'accept') {
      await updateComplaintStatus(complaint.id, 'Closed', 'Citizen accepted the resolution', user.uid);
      setShowRating(true);
    } else {
      await escalateComplaint(complaint.id);
      await updateComplaintStatus(complaint.id, 'Escalated', 'Citizen dissatisfied – escalated', user.uid);
      message.info('Complaint escalated due to dissatisfaction.');
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ borderRadius: 10 }}>Back</Button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Grievance Details
            </Title>
            <Tag style={{ fontFamily: 'monospace', fontSize: 11, borderRadius: 6, fontWeight: 600 }}>
              #{id?.slice(-12)}
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Submitted {dayjs(complaint.createdAt).fromNow()} · {category?.name} · {dept?.name}
          </Text>
        </div>
        <span style={{
          background: statusMeta.bg, color: statusMeta.color,
          padding: '6px 16px', borderRadius: 20,
          fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
        }}>
          {statusMeta.icon} {complaint.status}
        </span>
      </div>

      <Row gutter={[20, 20]}>
        {/* Main left column */}
        <Col lg={16} xs={24}>
          {/* Issue description */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <Space wrap>
                  <span style={{
                    background: priorityMeta.bg, color: priorityMeta.color,
                    padding: '4px 12px', borderRadius: 20, fontSize: 11,
                    fontWeight: 800, letterSpacing: 1, display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    {complaint.priority === 'Critical' && <FireOutlined />}
                    {priorityMeta.label} PRIORITY
                  </span>
                  {dept && <Tag color="blue" style={{ borderRadius: 20 }}>{dept.name}</Tag>}
                  {category && <Tag color="cyan" style={{ borderRadius: 20 }}>{category.name}</Tag>}
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {dayjs(complaint.createdAt).format('MMM D, YYYY [at] HH:mm')}
                </Text>
              </div>

              <Title level={4} style={{ marginBottom: 12, fontWeight: 700 }}>{complaint.title}</Title>
              <Paragraph style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-muted)' }}>
                {complaint.description}
              </Paragraph>

              {/* SLA progress bar */}
              <Divider />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ClockCircleOutlined style={{ color: slaColor, fontSize: 16 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>SLA Progress</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: slaColor }}>
                      {slaOverdue ? 'OVERDUE' : `Deadline: ${dayjs(complaint.slaDeadline).format('MMM D, HH:mm')}`}
                    </Text>
                  </div>
                  <Progress
                    percent={slaPercent}
                    strokeColor={slaColor}
                    trailColor="rgba(0,0,0,0.06)"
                    showInfo={false}
                    size="small"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card title={<span style={{ fontWeight: 700 }}><HistoryOutlined style={{ marginRight: 8 }} />Activity Timeline</span>}>
              <div style={{ position: 'relative' }}>
                {complaint.timeline.map((item, idx) => {
                  const meta = STATUS_META[item.status] || STATUS_META.Assigned;
                  const isLast = idx === complaint.timeline.length - 1;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 16, marginBottom: isLast ? 0 : 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: isLast ? meta.color : meta.bg,
                          border: `2px solid ${meta.color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, flexShrink: 0,
                          boxShadow: isLast ? `0 0 12px ${meta.color}60` : 'none',
                        }}>
                          {meta.icon}
                        </div>
                        {!isLast && (
                          <div style={{ width: 2, flex: 1, background: 'var(--border-color)', marginTop: 4, minHeight: 20 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                          <Text strong style={{ color: meta.color, fontSize: 13 }}>{item.status}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(item.timestamp).format('MMM D, HH:mm')}</Text>
                        </div>
                        <Text style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                          {item.remark}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </Col>

        {/* Right sidebar */}
        <Col lg={8} xs={24}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* Assigned officer */}
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
              <Card title={<span style={{ fontWeight: 700 }}><UserOutlined style={{ marginRight: 8 }} />Assigned Officer</span>}>
                {assignedOfficer ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Avatar
                      size={56}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${assignedOfficer.name}`}
                      style={{ border: '2px solid var(--primary-color)', flexShrink: 0 }}
                    />
                    <div>
                      <Text strong style={{ display: 'block', fontSize: 15 }}>{assignedOfficer.name}</Text>
                      <Tag color="blue" style={{ borderRadius: 20, marginTop: 2 }}>{officerRole?.name || 'Officer'}</Tag>
                      <div style={{ marginTop: 4 }}>
                        <Tag color="purple" style={{ borderRadius: 20, fontSize: 11 }}>
                          <ApartmentOutlined /> Level {complaint.escalationLevel}
                        </Tag>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Avatar size={48} icon={<UserOutlined />} style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }} />
                    <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 13 }}>
                      Pending officer assignment
                    </Text>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Officer update panel */}
            {canUpdate && !['Closed', 'Resolved'].includes(complaint.status) && (
              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
                <Card title={<span style={{ fontWeight: 700 }}>Update Progress</span>}
                  style={{ border: '1px solid rgba(22,119,255,0.2)' }}
                >
                  <TextArea
                    rows={3}
                    placeholder="Official remark (required)..."
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                    style={{ borderRadius: 10, marginBottom: 12 }}
                  />
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    <Button block type="primary" onClick={() => handleUpdate('In Progress')}
                      style={{ borderRadius: 10, fontWeight: 700 }}
                    >
                      Mark In Progress
                    </Button>
                    <Button block
                      style={{ borderRadius: 10, fontWeight: 700, background: 'rgba(82,196,26,0.1)', color: '#389e0d', border: '1px solid rgba(82,196,26,0.3)' }}
                      onClick={() => handleUpdate('Resolved')}
                    >
                      ✅ Mark as Resolved
                    </Button>
                    <Button block danger icon={<WarningOutlined />} onClick={handleEscalate}
                      style={{ borderRadius: 10, fontWeight: 700 }}
                    >
                      Manual Escalation
                    </Button>
                  </Space>
                </Card>
              </motion.div>
            )}

            {/* Citizen satisfaction */}
            {isCitizen && complaint.status === 'Resolved' && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <Card
                  title={<span style={{ fontWeight: 700 }}>Resolution Feedback</span>}
                  style={{ border: '1px solid rgba(82,196,26,0.3)', background: 'rgba(82,196,26,0.04)' }}
                >
                  <Paragraph style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    The officer has marked your complaint as resolved. Are you satisfied with the resolution?
                  </Paragraph>
                  <Space style={{ width: '100%' }} size={8}>
                    <Button
                      type="primary"
                      style={{ flex: 1, background: '#52c41a', border: 'none', borderRadius: 10, fontWeight: 700 }}
                      onClick={() => handleSatisfaction('accept')}
                    >
                      ✅ Accept
                    </Button>
                    <Button
                      danger
                      style={{ flex: 1, borderRadius: 10, fontWeight: 700 }}
                      onClick={() => handleSatisfaction('reject')}
                    >
                      ❌ Reopen
                    </Button>
                  </Space>
                </Card>
              </motion.div>
            )}

            {/* Complaint metadata */}
            <Card title={<span style={{ fontWeight: 700 }}>Details</span>}>
              {[
                { label: 'Complaint ID', value: <Text code style={{ fontSize: 11 }}>#{id?.slice(-12)}</Text> },
                { label: 'Department', value: dept?.name || '—' },
                { label: 'Category', value: category?.name || '—' },
                { label: 'Escalation Level', value: `Level ${complaint.escalationLevel}` },
                { label: 'Last Updated', value: dayjs(complaint.updatedAt).fromNow() },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>{value}</Text>
                </div>
              ))}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Rating modal */}
      <Modal
        title="Rate Your Experience"
        open={showRating}
        onOk={() => {
          setShowRating(false);
          message.success('Thank you for your feedback!');
          navigate('/dashboard');
        }}
        onCancel={() => { setShowRating(false); navigate('/dashboard'); }}
        okText="Submit Feedback"
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <Text style={{ fontSize: 15, display: 'block', marginBottom: 16, fontWeight: 600 }}>
            How would you rate the resolution experience?
          </Text>
          <Rate value={rating} onChange={setRating} style={{ fontSize: 32 }} />
          <TextArea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Any additional comments... (optional)"
            rows={3}
            style={{ marginTop: 20, borderRadius: 10 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ComplaintDetails;
