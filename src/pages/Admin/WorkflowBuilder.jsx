import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Button, Space, Row, Col, List, Tag, Select, Divider, App,
  Modal, Form, Input, InputNumber, Popconfirm, Tooltip, Alert,
} from 'antd';
import {
  BranchesOutlined, PlusOutlined, DeleteOutlined, SaveOutlined,
  ArrowDownOutlined, ArrowUpOutlined, ClockCircleOutlined,
  CheckCircleOutlined, UndoOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useSystemData } from '../../context/SystemDataContext';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { SEED_WORKFLOWS } from '../../data/seedData';
import { motion } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const WorkflowBuilder = () => {
  const { message } = App.useApp();
  const { user: adminUser } = useAuth();
  const { workflows, roles, departments, saveWorkflow, deleteWorkflow } = useSystemData();
  const { addAuditLog } = useComplaints();

  const [activeWorkflowId, setActiveWorkflowId] = useState(workflows[0]?.id || 'wf-1');
  const [levels, setLevels] = useState([]);
  const [slaRules, setSlaRules] = useState({ Critical: 24, High: 48, Medium: 96, Low: 168 });
  const [saving, setSaving] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newForm] = Form.useForm();

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId) || workflows[0];

  useEffect(() => {
    if (activeWorkflow) {
      setLevels(activeWorkflow.levels || []);
      setSlaRules(activeWorkflow.slaRules || { Critical: 24, High: 48, Medium: 96, Low: 168 });
    }
  }, [activeWorkflowId, activeWorkflow]);

  // Roles available for this department
  const deptRoles = roles.filter(r => r.departmentId === activeWorkflow?.deptId);
  const availableRoles = deptRoles.length > 0 ? deptRoles : roles.filter(r => r.id !== 'role-citizen' && r.id !== 'role-admin');

  const handleSave = async () => {
    if (levels.length === 0) {
      message.error('A workflow must have at least one escalation level.');
      return;
    }
    setSaving(true);
    const updated = {
      ...activeWorkflow,
      levels,
      slaRules,
      updatedAt: new Date().toISOString(),
    };
    await saveWorkflow(updated);
    addAuditLog('Workflow Updated', adminUser?.uid || 'admin', `Updated escalation levels & SLA rules for "${activeWorkflow.name}"`);
    setSaving(false);
    message.success(`Workflow "${activeWorkflow.name}" saved successfully!`);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newLevels = [...levels];
    const temp = newLevels[index - 1];
    newLevels[index - 1] = newLevels[index];
    newLevels[index] = temp;
    setLevels(newLevels);
  };

  const handleMoveDown = (index) => {
    if (index === levels.length - 1) return;
    const newLevels = [...levels];
    const temp = newLevels[index + 1];
    newLevels[index + 1] = newLevels[index];
    newLevels[index] = temp;
    setLevels(newLevels);
  };

  const handleRemoveLevel = (index) => {
    if (levels.length <= 1) {
      message.warning('Workflow must have at least one hierarchy tier.');
      return;
    }
    const newLevels = [...levels];
    newLevels.splice(index, 1);
    setLevels(newLevels);
  };

  const handleAddLevel = () => {
    const defaultRole = availableRoles.find(r => !levels.includes(r.id))?.id || availableRoles[0]?.id || 'role-warden';
    setLevels([...levels, defaultRole]);
  };

  const handleRoleChange = (index, newRoleId) => {
    const newLevels = [...levels];
    newLevels[index] = newRoleId;
    setLevels(newLevels);
  };

  const handleCreateWorkflow = async (values) => {
    const id = `wf-${Date.now()}`;
    const newWfRoles = roles.filter(r => r.departmentId === values.deptId);
    const defaultRole = newWfRoles[0]?.id || 'role-warden';

    const newWf = {
      id,
      name: values.name,
      deptId: values.deptId,
      levels: [defaultRole],
      slaRules: { Critical: 24, High: 48, Medium: 96, Low: 168 },
    };

    await saveWorkflow(newWf);
    addAuditLog('Workflow Created', adminUser?.uid || 'admin', `Created new workflow "${values.name}"`);
    message.success('New workflow created!');
    setIsNewModalOpen(false);
    newForm.resetFields();
    setActiveWorkflowId(id);
  };

  const handleDeleteActiveWorkflow = async () => {
    if (!activeWorkflow) return;
    await deleteWorkflow(activeWorkflow.id);
    addAuditLog('Workflow Deleted', adminUser?.uid || 'admin', `Deleted workflow "${activeWorkflow.name}"`);
    message.success('Workflow deleted.');
    const remaining = workflows.filter(w => w.id !== activeWorkflow.id);
    if (remaining.length > 0) setActiveWorkflowId(remaining[0].id);
  };

  const handleResetDefaults = async () => {
    for (const wf of SEED_WORKFLOWS) {
      await saveWorkflow(wf);
    }
    message.success('Reset all 5 departmental workflows to canonical defaults.');
  };

  const dept = departments.find(d => d.id === activeWorkflow?.deptId);

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            Workflow & SLA Escalation Builder
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Configure multi-tier departmental escalation chains, assign authority ranks, and define binding SLA thresholds.
          </Text>
        </div>

        <Space size={12}>
          <Button icon={<UndoOutlined />} onClick={handleResetDefaults} style={{ borderRadius: 10 }}>
            Reset Defaults
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsNewModalOpen(true)}
            style={{ borderRadius: 10, fontWeight: 700 }}
          >
            Create Workflow
          </Button>
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        {/* Left: Workflow Selection Sidebar */}
        <Col xs={24} md={8}>
          <Card
            title={<span style={{ fontWeight: 800 }}><BranchesOutlined style={{ marginRight: 8 }} />Department Chains</span>}
            bordered={false}
            style={{ borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workflows.map(wf => {
                const isActive = wf.id === activeWorkflow?.id;
                const wfDept = departments.find(d => d.id === wf.deptId);
                return (
                  <div
                    key={wf.id}
                    onClick={() => setActiveWorkflowId(wf.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: isActive ? '2px solid #1677ff' : '1px solid var(--border-color)',
                      background: isActive ? 'rgba(22,119,255,0.06)' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: isActive ? '#1677ff' : 'var(--text-main)' }}>
                      {wf.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>{wfDept?.name || 'Jurisdiction'}</Text>
                      <Tag color="blue" style={{ borderRadius: 10, fontSize: 10 }}>
                        {wf.levels?.length || 0} Levels
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Right: Active Hierarchy Builder & SLA Settings */}
        <Col xs={24} md={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 16, boxShadow: 'var(--shadow-sm)', marginBottom: 20 }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{activeWorkflow?.name}</span>
                  <Tag color="cyan" style={{ marginLeft: 8, borderRadius: 10 }}>{dept?.name}</Tag>
                </div>
                {workflows.length > 1 && (
                  <Popconfirm
                    title="Delete Workflow"
                    description="Are you sure you want to remove this workflow?"
                    onConfirm={handleDeleteActiveWorkflow}
                  >
                    <Button danger type="text" size="small" icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                )}
              </div>
            }
          >
            {/* Visual Escalation Ladder */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <Title level={5} style={{ margin: 0, fontWeight: 700 }}>Escalation Hierarchy Order</Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Complaints are initially routed to Level 1. If SLA breaches, complaints automatically escalate upward.
                  </Text>
                </div>
                <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={handleAddLevel} style={{ borderRadius: 8 }}>
                  Add Tier
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {levels.map((roleId, idx) => {
                  const roleObj = roles.find(r => r.id === roleId);
                  const isTop = idx === levels.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', background: 'rgba(22,119,255,0.04)',
                          borderRadius: 12, border: '1px solid rgba(22,119,255,0.2)',
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', background: '#1677ff',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 13, flexShrink: 0,
                          }}>
                            L{idx + 1}
                          </div>

                          <div style={{ flex: 1 }}>
                            <Select
                              value={roleId}
                              onChange={(newRole) => handleRoleChange(idx, newRole)}
                              style={{ width: '100%', maxWidth: 340 }}
                              size="middle"
                            >
                              {availableRoles.map(r => (
                                <Option key={r.id} value={r.id}>
                                  {r.name} (Rank Level {r.level})
                                </Option>
                              ))}
                            </Select>
                          </div>

                          <Space size={4}>
                            <Tooltip title="Move Up">
                              <Button
                                size="small"
                                icon={<ArrowUpOutlined />}
                                disabled={idx === 0}
                                onClick={() => handleMoveUp(idx)}
                              />
                            </Tooltip>
                            <Tooltip title="Move Down">
                              <Button
                                size="small"
                                icon={<ArrowDownOutlined />}
                                disabled={isTop}
                                onClick={() => handleMoveDown(idx)}
                              />
                            </Tooltip>
                            <Tooltip title="Remove Tier">
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                disabled={levels.length <= 1}
                                onClick={() => handleRemoveLevel(idx)}
                              />
                            </Tooltip>
                          </Space>
                        </div>
                      </motion.div>

                      {!isTop && (
                        <div style={{ textAlign: 'center', margin: '-4px 0' }}>
                          <ArrowDownOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <Divider />

            {/* SLA Threshold Rules per Priority Tier */}
            <div>
              <Title level={5} style={{ margin: '0 0 4px', fontWeight: 700 }}>
                <ClockCircleOutlined style={{ marginRight: 6 }} />
                Binding SLA Thresholds (Hours)
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
                Time limit allowed for an officer to take action before auto-escalation triggers.
              </Paragraph>

              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 10, border: '1px solid rgba(255,77,79,0.3)', background: 'rgba(255,77,79,0.03)' }}>
                    <Text strong style={{ color: '#ff4d4f', fontSize: 12 }}>Critical SLA</Text>
                    <div style={{ marginTop: 6 }}>
                      <InputNumber
                        min={1}
                        max={72}
                        value={slaRules.Critical}
                        onChange={v => setSlaRules({ ...slaRules, Critical: v || 24 })}
                        addonAfter="hrs"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </Card>
                </Col>

                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 10, border: '1px solid rgba(250,140,22,0.3)', background: 'rgba(250,140,22,0.03)' }}>
                    <Text strong style={{ color: '#fa8c16', fontSize: 12 }}>High SLA</Text>
                    <div style={{ marginTop: 6 }}>
                      <InputNumber
                        min={1}
                        max={168}
                        value={slaRules.High}
                        onChange={v => setSlaRules({ ...slaRules, High: v || 48 })}
                        addonAfter="hrs"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </Card>
                </Col>

                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 10, border: '1px solid rgba(250,173,20,0.3)', background: 'rgba(250,173,20,0.03)' }}>
                    <Text strong style={{ color: '#d48806', fontSize: 12 }}>Medium SLA</Text>
                    <div style={{ marginTop: 6 }}>
                      <InputNumber
                        min={1}
                        max={240}
                        value={slaRules.Medium}
                        onChange={v => setSlaRules({ ...slaRules, Medium: v || 96 })}
                        addonAfter="hrs"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </Card>
                </Col>

                <Col xs={12} sm={6}>
                  <Card size="small" style={{ borderRadius: 10, border: '1px solid rgba(82,196,26,0.3)', background: 'rgba(82,196,26,0.03)' }}>
                    <Text strong style={{ color: '#52c41a', fontSize: 12 }}>Low SLA</Text>
                    <div style={{ marginTop: 6 }}>
                      <InputNumber
                        min={1}
                        max={360}
                        value={slaRules.Low}
                        onChange={v => setSlaRules({ ...slaRules, Low: v || 168 })}
                        addonAfter="hrs"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
                style={{ borderRadius: 10, fontWeight: 700, padding: '0 28px' }}
              >
                Save Workflow & SLA Rules
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Create New Workflow Modal */}
      <Modal
        title={<span>➕ Create Department Grievance Workflow</span>}
        open={isNewModalOpen}
        onCancel={() => setIsNewModalOpen(false)}
        onOk={() => newForm.submit()}
        centered
      >
        <Form form={newForm} layout="vertical" onFinish={handleCreateWorkflow} style={{ padding: '12px 0' }}>
          <Form.Item
            name="name"
            label="Workflow Title"
            rules={[{ required: true, message: 'Please enter workflow name' }]}
          >
            <Input placeholder="e.g., Campus Sanitation Escalation Path" />
          </Form.Item>
          <Form.Item
            name="deptId"
            label="Target Department"
            rules={[{ required: true, message: 'Select a department' }]}
          >
            <Select placeholder="Select department">
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkflowBuilder;
