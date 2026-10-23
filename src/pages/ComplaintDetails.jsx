import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Typography, Tag, Steps, Button, Space, Divider,
  Avatar, Input, App, Modal, Rate, Spin, Progress, Tooltip, Badge,
  Tabs, List, Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined, SendOutlined, CheckCircleOutlined,
  WarningOutlined, HistoryOutlined, ClockCircleOutlined,
  FireOutlined, UserOutlined, CalendarOutlined, ApartmentOutlined,
  MessageOutlined, FileTextOutlined, PrinterOutlined, SafetyCertificateOutlined,
  UploadOutlined,
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
  Submitted:    { color: '#1677ff', bg: 'rgba(22,119,255,0.1)',  icon: '📝', step: 0 },
  Assigned:     { color: '#1677ff', bg: 'rgba(22,119,255,0.1)', icon: '👤', step: 1 },
  'In Progress':{ color: '#722ed1', bg: 'rgba(114,46,209,0.1)', icon: '⚙️', step: 2 },
  Resolved:     { color: '#52c41a', bg: 'rgba(82,196,26,0.1)',  icon: '✅', step: 3 },
  Closed:       { color: '#595959', bg: 'rgba(0,0,0,0.06)',     icon: '🔒', step: 4 },
  Escalated:    { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)',  icon: '🔺', step: 2 },
  Pending:      { color: '#faad14', bg: 'rgba(250,173,20,0.1)', icon: '⏳', step: 0 },
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
  const {
    complaints, loading: dataLoading, updateComplaintStatus,
    escalateComplaint, addComplaintMessage, rateComplaint,
  } = useComplaints();
  const { user, userRole } = useAuth();
  const { users, roles, departments, categories } = useSystemData();

  const complaint = complaints.find(c => c.id === id);

  const [remark, setRemark] = useState('');
  const [resolutionProof, setResolutionProof] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" description="Loading complaint details..." />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Title level={4}>Grievance Not Found</Title>
        <Paragraph type="secondary">The ticket ID #{id} does not exist in the database.</Paragraph>
        <Button type="primary" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const assignedOfficer = users.find(u => u.id === complaint?.assignedOfficerId);
  const officerRole = roles.find(r => r.id === assignedOfficer?.roleId);
  const dept = departments.find(d => d.id === complaint.deptId);
  const category = categories.find(c => c.id === complaint.categoryId);

  const isCitizen = userRole?.id === 'role-citizen';
  const isAssignedOfficer = user?.uid === complaint.assignedOfficerId || user?.id === complaint.assignedOfficerId;
  const isAdmin = userRole?.id === 'role-admin';
  const canUpdate = isAssignedOfficer || isAdmin || (user?.deptId && user?.deptId === complaint.deptId);

  const priorityMeta = PRIORITY_META[complaint.priority] || PRIORITY_META.Medium;
  const statusMeta = STATUS_META[complaint.status] || STATUS_META.Assigned;

  // SLA calculation
  const slaTotal = dayjs(complaint.slaDeadline).diff(dayjs(complaint.createdAt), 'hour');
  const slaLeft = dayjs(complaint.slaDeadline).diff(dayjs(), 'hour');
  const slaOverdue = dayjs().isAfter(complaint.slaDeadline) && !['Resolved', 'Closed'].includes(complaint.status);
  const slaColor = slaOverdue ? '#ff4d4f' : slaLeft < 24 ? '#fa8c16' : '#52c41a';

  const handleUpdate = async (status) => {
    if (!remark.trim()) {
      message.warning('Please provide an official remark before updating status.');
      return;
    }
    await updateComplaintStatus(complaint.id, status, remark, user?.uid || user?.id);
    setRemark('');
    message.success(`Status updated to "${status}"`);
  };

  const handleConfirmResolve = async () => {
    if (!resolutionProof.trim()) {
      message.warning('Please provide a brief summary of how the issue was resolved.');
      return;
    }
    await updateComplaintStatus(
      complaint.id,
      'Resolved',
      `Resolved: ${resolutionProof}`,
      user?.uid || user?.id,
      resolutionProof
    );
    setResolveModalOpen(false);
    setResolutionProof('');
    message.success('Grievance marked as Resolved!');
  };

  const handleConfirmEscalate = async () => {
    if (!escalateReason.trim()) {
      message.warning('Please state the justification for escalation.');
      return;
    }
    await escalateComplaint(complaint.id, escalateReason);
    setEscalateModalOpen(false);
    setEscalateReason('');
    message.success('Grievance successfully escalated to senior authority!');
  };

  const handleSatisfaction = async (type) => {
    if (type === 'accept') {
      setShowRating(true);
    } else {
      await escalateComplaint(complaint.id, 'Citizen rejected resolution as unsatisfactory. Escalated for formal review.');
      message.info('Resolution reopened and escalated to senior officer.');
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    await addComplaintMessage(complaint.id, chatInput, user);
    setChatInput('');
    message.success('Message sent to grievance docket');
  };

  const handlePrintDocket = () => {
    window.print();
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16, marginBottom: 20,
      }}>
        <Space size={12}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ borderRadius: 10 }}>
            Back
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                Grievance Docket
              </Title>
              <Tag style={{ fontFamily: 'monospace', fontSize: 13, borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
                #{complaint.id}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Submitted {dayjs(complaint.createdAt).fromNow()} · {dept?.name}
            </Text>
          </div>
        </Space>

        <Space size={12}>
          <Button icon={<PrinterOutlined />} onClick={handlePrintDocket} style={{ borderRadius: 10 }}>
            Print Docket
          </Button>
          <span style={{
            background: statusMeta.bg, color: statusMeta.color,
            padding: '6px 16px', borderRadius: 20,
            fontSize: 13, fontWeight: 800, letterSpacing: '0.5px',
          }}>
            {statusMeta.icon} {complaint.status?.toUpperCase()}
          </span>
        </Space>
      </div>

      {/* 5-Step Visual Progress Stepper */}
      <Card bordered={false} style={{ marginBottom: 20, borderRadius: 14 }}>
        <Steps
          current={statusMeta.step}
          status={complaint.status === 'Escalated' ? 'error' : 'process'}
          items={[
            { title: 'Grievance Filed', description: dayjs(complaint.createdAt).format('MMM D, HH:mm') },
            { title: 'Officer Assigned', description: assignedOfficer?.name || 'Triage Assigned' },
            {
              title: complaint.status === 'Escalated' ? `Escalated (L${complaint.escalationLevel})` : 'Under Investigation',
              description: complaint.status === 'Escalated' ? 'Higher authority review' : 'Action in progress',
            },
            { title: 'Resolution Proposed', description: complaint.status === 'Resolved' ? 'Verified by officer' : 'Pending resolution' },
            { title: 'Citizen Verified', description: complaint.rating ? `${complaint.rating} ★ Rating` : 'Closed' },
          ]}
        />
      </Card>

      <Row gutter={[20, 20]}>
        {/* Left Column: Complaint Details, Evidence, and Tabs */}
        <Col xs={24} lg={15}>
          {/* Grievance Core Card */}
          <Card bordered={false} style={{ borderRadius: 16, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <Space wrap>
                <Tag color={priorityMeta.color} style={{ fontWeight: 800, borderRadius: 8 }}>
                  {priorityMeta.label} PRIORITY
                </Tag>
                {dept && <Tag color="blue" style={{ borderRadius: 8 }}>{dept.name}</Tag>}
                {category && <Tag color="cyan" style={{ borderRadius: 8 }}>{category.name}</Tag>}
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {dayjs(complaint.createdAt).format('MMMM D, YYYY [at] HH:mm')}
              </Text>
            </div>

            <Title level={4} style={{ fontWeight: 800, marginBottom: 8 }}>{complaint.title}</Title>
            <Paragraph style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)' }}>
              {complaint.description}
            </Paragraph>

            {complaint.location && (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <Text strong>📍 Location Reference: </Text>
                <Text type="secondary">{complaint.location}</Text>
              </div>
            )}

            {/* Photos & Visual Evidence */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Visual Evidence Attachments:</Text>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {complaint.attachments.map((att, idx) => (
                    <div key={idx} style={{ width: 120, height: 85, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <img src={att.url} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SLA Progress Monitor */}
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ClockCircleOutlined style={{ color: slaColor, fontSize: 18 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: 700 }}>SLA Resolution Clock</Text>
                  <Text style={{ fontSize: 12, fontWeight: 800, color: slaColor }}>
                    {slaOverdue
                      ? '⚠️ SLA DEADLINE BREACHED (AUTO-ESCALATED)'
                      : ['Resolved', 'Closed'].includes(complaint.status)
                      ? '✅ Resolved within SLA Threshold'
                      : `Deadline: ${dayjs(complaint.slaDeadline).format('MMM D, HH:mm')} (${slaLeft}h left)`}
                  </Text>
                </div>
                <Progress
                  percent={['Resolved', 'Closed'].includes(complaint.status) ? 100 : Math.min(100, Math.max(10, Math.round(((slaTotal - slaLeft) / slaTotal) * 100)))}
                  strokeColor={slaColor}
                  showInfo={false}
                  size="small"
                />
              </div>
            </div>
          </Card>

          {/* Activity Timeline & Live Direct Officer Chat Tabs */}
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <Tabs
              defaultActiveKey="timeline"
              items={[
                {
                  key: 'timeline',
                  label: <span style={{ fontWeight: 700 }}><HistoryOutlined style={{ marginRight: 6 }} />Activity Audit Timeline</span>,
                  children: (
                    <div style={{ padding: '8px 0' }}>
                      {complaint.timeline.map((item, idx) => {
                        const meta = STATUS_META[item.status] || STATUS_META.Assigned;
                        const isLast = idx === complaint.timeline.length - 1;
                        return (
                          <div key={idx} style={{ display: 'flex', gap: 14, marginBottom: isLast ? 0 : 20 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: meta.bg, border: `2px solid ${meta.color}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, flexShrink: 0,
                              }}>
                                {meta.icon}
                              </div>
                              {!isLast && (
                                <div style={{ width: 2, flex: 1, background: 'var(--border-color)', marginTop: 4, minHeight: 24 }} />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong style={{ color: meta.color, fontSize: 13 }}>
                                  {item.status} {item.user && `· ${item.user}`}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {dayjs(item.timestamp).format('MMM D, HH:mm')}
                                </Text>
                              </div>
                              <Text style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                                {item.remark}
                              </Text>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ),
                },
                {
                  key: 'chat',
                  label: (
                    <span style={{ fontWeight: 700 }}>
                      <MessageOutlined style={{ marginRight: 6 }} />
                      Direct Officer Chat
                      {complaint.messages?.length > 0 && (
                        <Badge count={complaint.messages.length} style={{ marginLeft: 6, background: '#1677ff' }} />
                      )}
                    </span>
                  ),
                  children: (
                    <div>
                      {/* Message list */}
                      <div style={{
                        maxHeight: 280, minHeight: 140, overflowY: 'auto',
                        padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: 12, marginBottom: 12,
                      }}>
                        {(!complaint.messages || complaint.messages.length === 0) ? (
                          <div style={{ textAlign: 'center', padding: 24 }}>
                            <MessageOutlined style={{ fontSize: 28, color: 'var(--text-muted)', marginBottom: 8 }} />
                            <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                              No messages exchanged yet. Send a direct inquiry to the officer below.
                            </Text>
                          </div>
                        ) : (
                          complaint.messages.map(msg => {
                            const isMe = msg.senderId === user?.uid || msg.senderId === user?.id;
                            return (
                              <div key={msg.id} style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: isMe ? 'flex-end' : 'flex-start',
                                marginBottom: 12,
                              }}>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                                  {msg.senderName} ({msg.senderRole}) · {dayjs(msg.timestamp).fromNow()}
                                </div>
                                <div style={{
                                  background: isMe ? '#1677ff' : 'var(--card-bg)',
                                  color: isMe ? '#fff' : 'var(--text-main)',
                                  padding: '8px 14px', borderRadius: 12,
                                  fontSize: 13, maxWidth: '80%',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                  border: isMe ? 'none' : '1px solid var(--border-color)',
                                }}>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Chat input box */}
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          placeholder="Type an inquiry or status update..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onPressEnter={handleSendChatMessage}
                          style={{ borderRadius: '10px 0 0 10px' }}
                        />
                        <Button type="primary" icon={<SendOutlined />} onClick={handleSendChatMessage} style={{ borderRadius: '0 10px 10px 0' }}>
                          Send
                        </Button>
                      </Space.Compact>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right Column: Officer Info, Actions & Citizen Verification */}
        <Col xs={24} lg={9}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Assigned Officer Hierarchy Card */}
            <Card bordered={false} style={{ borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar
                  size={52}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${assignedOfficer?.name || 'Officer'}`}
                  style={{ border: '2px solid #1677ff' }}
                />
                <div>
                  <Text strong style={{ fontSize: 15, display: 'block' }}>
                    {assignedOfficer?.name || complaint.assignedOfficerName || 'Assigned Officer'}
                  </Text>
                  <Tag color="blue" style={{ borderRadius: 10, marginTop: 2 }}>
                    {officerRole?.name || 'Authorized Officer'}
                  </Tag>
                  <Tag color="purple" style={{ borderRadius: 10, marginTop: 2 }}>
                    <ApartmentOutlined /> Level {complaint.escalationLevel || 1} Authority
                  </Tag>
                </div>
              </div>

              {assignedOfficer?.phone && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  📞 Official Contact: <strong>{assignedOfficer.phone}</strong>
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                🏢 Department: <strong>{dept?.name}</strong>
              </div>
            </Card>

            {/* Citizen Resolution Acceptance & Rating Banner */}
            {isCitizen && complaint.status === 'Resolved' && (
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(82,196,26,0.3)',
                    background: 'rgba(82,196,26,0.06)',
                  }}
                >
                  <Title level={5} style={{ color: '#389e0d', margin: '0 0 6px' }}>
                    ✅ Officer Reported Resolution
                  </Title>
                  <Paragraph style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {complaint.resolutionProof
                      ? `Proof note: "${complaint.resolutionProof}"`
                      : 'The assigned officer has marked this issue as completed. Please verify if the issue is solved.'}
                  </Paragraph>

                  <Space style={{ width: '100%' }} size={10}>
                    <Button
                      type="primary"
                      block
                      style={{ background: '#52c41a', borderColor: '#52c41a', borderRadius: 10, fontWeight: 700 }}
                      onClick={() => handleSatisfaction('accept')}
                    >
                      Accept & Rate
                    </Button>
                    <Popconfirm
                      title="Reopen Grievance"
                      description="Are you sure the issue remains unresolved? This will escalate it to Level 2."
                      onConfirm={() => handleSatisfaction('reject')}
                      okText="Yes, Reopen"
                      cancelText="Cancel"
                    >
                      <Button danger block style={{ borderRadius: 10, fontWeight: 700 }}>
                        Reopen / Dissatisfied
                      </Button>
                    </Popconfirm>
                  </Space>
                </Card>
              </motion.div>
            )}

            {/* Already Rated Card */}
            {complaint.rating && (
              <Card bordered={false} style={{ borderRadius: 16, background: 'rgba(250,173,20,0.06)', border: '1px solid rgba(250,173,20,0.25)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ fontSize: 13, color: '#d48806' }}>Citizen Satisfaction Verified</Text>
                  <div style={{ margin: '6px 0' }}>
                    <Rate disabled defaultValue={complaint.rating} style={{ fontSize: 20 }} />
                  </div>
                  {complaint.feedback && (
                    <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                      "{complaint.feedback}"
                    </Text>
                  )}
                </div>
              </Card>
            )}

            {/* Officer Action Hub */}
            {canUpdate && !['Closed', 'Resolved'].includes(complaint.status) && (
              <Card
                title={<span style={{ fontWeight: 800 }}>Officer Action Station</span>}
                bordered={false}
                style={{ borderRadius: 16, border: '1px solid rgba(22,119,255,0.2)' }}
              >
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Add Investigation Remark:</Text>
                  <TextArea
                    rows={2}
                    placeholder="Enter official remark..."
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                    style={{ borderRadius: 8 }}
                  />
                </div>

                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {complaint.status !== 'In Progress' && (
                    <Button
                      block
                      type="primary"
                      ghost
                      onClick={() => handleUpdate('In Progress')}
                      style={{ borderRadius: 8, fontWeight: 700 }}
                    >
                      ⚙️ Mark as In Progress
                    </Button>
                  )}

                  <Button
                    block
                    type="primary"
                    onClick={() => setResolveModalOpen(true)}
                    style={{ background: '#52c41a', borderColor: '#52c41a', borderRadius: 8, fontWeight: 700 }}
                  >
                    ✅ Complete & Mark as Resolved
                  </Button>

                  <Button
                    block
                    danger
                    icon={<WarningOutlined />}
                    onClick={() => setEscalateModalOpen(true)}
                    style={{ borderRadius: 8, fontWeight: 700 }}
                  >
                    🔺 Manual Escalation to Next Authority
                  </Button>
                </Space>
              </Card>
            )}

            {/* Ticket Metadata Spec Sheet */}
            <Card title={<span style={{ fontWeight: 700 }}>Ticket Specifications</span>} bordered={false} style={{ borderRadius: 16 }}>
              {[
                { label: 'Tracking ID', value: <Text code style={{ fontSize: 11 }}>#{complaint.id}</Text> },
                { label: 'Citizen Filer', value: complaint.citizenName || 'Registered Resident' },
                { label: 'Jurisdiction', value: dept?.name || 'General' },
                { label: 'Sub-Category', value: category?.name || 'General' },
                { label: 'Escalation Level', value: `Level ${complaint.escalationLevel || 1} Authority` },
                { label: 'Last System Update', value: dayjs(complaint.updatedAt).fromNow() },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
                  <Text type="secondary">{label}</Text>
                  <Text strong>{value}</Text>
                </div>
              ))}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Resolve Grievance Modal */}
      <Modal
        title={<span>✅ Resolution Summary & Proof</span>}
        open={resolveModalOpen}
        onOk={handleConfirmResolve}
        onCancel={() => setResolveModalOpen(false)}
        okText="Confirm Resolution"
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>
            Please summarize the remedial actions taken (e.g., parts replaced, staff deployed, repairs certified). This will be shown to the citizen for sign-off.
          </Paragraph>
          <TextArea
            rows={4}
            placeholder="e.g. Broken pipe repaired with heavy-duty seal; pressure tested for 2 hours with clean outflow."
            value={resolutionProof}
            onChange={e => setResolutionProof(e.target.value)}
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>

      {/* Manual Escalation Modal */}
      <Modal
        title={<span>🔺 Manual Authority Escalation</span>}
        open={escalateModalOpen}
        onOk={handleConfirmEscalate}
        onCancel={() => setEscalateModalOpen(false)}
        okText="Escalate Grievance"
        okButtonProps={{ danger: true }}
        centered
      >
        <div style={{ padding: '12px 0' }}>
          <Paragraph type="secondary" style={{ fontSize: 13 }}>
            Escalating transfers this grievance to the next authority level in the workflow chain (e.g. Principal, Commissioner, or Collector). State the reason:
          </Paragraph>
          <TextArea
            rows={3}
            placeholder="e.g., Requires capital budget approval or inter-departmental permissions."
            value={escalateReason}
            onChange={e => setEscalateReason(e.target.value)}
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>

      {/* Citizen 5-Star Rating Modal */}
      <Modal
        title={<span>⭐ Rate Your Grievance Redressal Experience</span>}
        open={showRating}
        onOk={async () => {
          await rateComplaint(complaint.id, rating, feedback);
          setShowRating(false);
          message.success('Thank you for rating! The grievance is now formally verified and closed.');
        }}
        onCancel={() => setShowRating(false)}
        okText="Submit Rating"
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
          <Title level={4} style={{ margin: '0 0 8px' }}>Was your issue resolved satisfactorily?</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Your feedback directly impacts officer performance scorecards.</Text>
          <div style={{ margin: '18px 0' }}>
            <Rate value={rating} onChange={setRating} style={{ fontSize: 32 }} />
          </div>
          <TextArea
            rows={3}
            placeholder="Optional comments or feedback for the department..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ComplaintDetails;
