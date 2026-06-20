import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Row, Col, List, Tag, Select, Divider, App, Spin, Modal, Form, Input, Popconfirm } from 'antd';
import { DragOutlined, PlusOutlined, DeleteOutlined, BranchesOutlined, SaveOutlined } from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSystemData } from '../../context/SystemDataContext';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, setDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const WorkflowBuilder = () => {
  const { message } = App.useApp();
  const { user: adminUser } = useAuth();
  const { workflows, roles, departments, loading } = useSystemData();
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [levels, setLevels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newForm] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [lastWfId, setLastWfId] = useState(null);

  // Sync activeWorkflow object reference to the latest from Firestore (snapshot updates)
  useEffect(() => {
    if (workflows && workflows.length > 0) {
      if (!activeWorkflow) {
        setActiveWorkflow(workflows[0]);
      } else {
        const found = workflows.find(w => w.id === activeWorkflow.id);
        if (found) {
          setActiveWorkflow(found);
        } else {
          setActiveWorkflow(workflows[0]);
        }
      }
    } else {
      setActiveWorkflow(null);
    }
  }, [workflows]);

  // Sync levels state ONLY when activeWorkflow ID changes (e.g. initial load, switching workflows, or delete)
  useEffect(() => {
    if (activeWorkflow) {
      if (activeWorkflow.id !== lastWfId) {
        setLevels(activeWorkflow.levels || []);
        setLastWfId(activeWorkflow.id);
      }
    } else {
      setLevels([]);
      setLastWfId(null);
    }
  }, [activeWorkflow, lastWfId]);

  // Filter roles belonging to the same department as the workflow
  const deptRoles = roles.filter(r => r.departmentId === activeWorkflow?.deptId);
  const availableRolesForLevels = deptRoles.length > 0 
    ? deptRoles 
    : roles.filter(r => r.id !== 'role-citizen' && r.id !== 'role-admin');

  const handleCreateWorkflow = async (values) => {
    setCreating(true);
    try {
      const id = `wf-${Date.now()}`;
      
      // Get the default role for the new workflow
      const newWfDeptRoles = roles.filter(r => r.departmentId === values.deptId);
      const defaultRole = newWfDeptRoles.length > 0 ? newWfDeptRoles[0].id : 'role-warden';

      const newWf = {
        id,
        name: values.name,
        deptId: values.deptId,
        levels: [defaultRole] // Start with one valid role
      };
      
      await setDoc(doc(db, 'workflows', id), newWf);
      await addDoc(collection(db, 'auditLogs'), {
        action: 'Workflow Created',
        userId: adminUser?.uid || 'admin',
        details: `Created new workflow "${values.name}" for department "${values.deptId}"`,
        timestamp: new Date().toISOString(),
      });
      message.success('New workflow created successfully!');
      setIsNewModalOpen(false);
      newForm.resetFields();
      setActiveWorkflow(newWf);
      setLevels(newWf.levels);
    } catch (err) {
      message.error('Failed to create workflow: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!activeWorkflow) return;
    try {
      const wfName = activeWorkflow.name;
      await deleteDoc(doc(db, 'workflows', activeWorkflow.id));
      await addDoc(collection(db, 'auditLogs'), {
        action: 'Workflow Deleted',
        userId: adminUser?.uid || 'admin',
        details: `Deleted workflow "${wfName}"`,
        timestamp: new Date().toISOString(),
      });
      message.success('Workflow deleted successfully!');
      
      // select another remaining workflow
      const remaining = workflows.filter(w => w.id !== activeWorkflow.id);
      if (remaining.length > 0) {
        setActiveWorkflow(remaining[0]);
        setLevels(remaining[0].levels || []);
      } else {
        setActiveWorkflow(null);
        setLevels([]);
      }
    } catch (err) {
      message.error('Failed to delete workflow: ' + err.message);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newLevels = Array.from(levels);
    const [reorderedItem] = newLevels.splice(result.source.index, 1);
    newLevels.splice(result.destination.index, 0, reorderedItem);
    setLevels(newLevels);
  };

  const addLevel = () => {
    const defaultRole = availableRolesForLevels.length > 0 ? availableRolesForLevels[0].id : 'role-warden';
    setLevels([...levels, defaultRole]);
  };

  const removeLevel = (index) => {
    const newLevels = [...levels];
    newLevels.splice(index, 1);
    setLevels(newLevels);
  };

  const updateLevelRole = (index, value) => {
    const newLevels = [...levels];
    newLevels[index] = value;
    setLevels(newLevels);
  };

  const handleSave = async () => {
    if (!activeWorkflow) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'workflows', activeWorkflow.id), {
        levels: levels
      });
      await addDoc(collection(db, 'auditLogs'), {
        action: 'Workflow Updated',
        userId: adminUser?.uid || 'admin',
        details: `Updated escalation levels for workflow "${activeWorkflow.name}": [${levels.join(' → ')}]`,
        timestamp: new Date().toISOString(),
      });
      message.success('Workflow configuration saved to database successfully!');
    } catch (err) {
      message.error('Failed to save workflow: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" description="Loading workflows..." />
      </div>
    );
  }

  return (
    <div className="fade-in">
       <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card className="glass-effect">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                   <Title level={2} style={{ margin: 0 }}>Workflow Builder</Title>
                   <Text type="secondary">Define escalation chains and priority routing rules.</Text>
                 </div>
                 <Space>
                   <Select 
                     value={activeWorkflow?.id} 
                     style={{ width: 250 }}
                     placeholder="No workflows available"
                     onChange={(val) => {
                       const wf = workflows.find(w => w.id === val);
                       setActiveWorkflow(wf);
                       setLevels(wf.levels || []);
                     }}
                   >
                     {workflows.map(w => (
                       <Option key={w.id} value={w.id}>{w.name}</Option>
                     ))}
                   </Select>
                   <Button icon={<PlusOutlined />} onClick={() => setIsNewModalOpen(true)}>New Workflow</Button>
                   <Popconfirm
                     title="Permanently delete this workflow? This cannot be undone."
                     onConfirm={handleDeleteWorkflow}
                     okText="Yes"
                     cancelText="No"
                     okButtonProps={{ danger: true }}
                     disabled={!activeWorkflow}
                   >
                     <Button danger icon={<DeleteOutlined />} disabled={!activeWorkflow}>Delete Workflow</Button>
                   </Popconfirm>
                   <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!activeWorkflow}>Save Changes</Button>
                 </Space>
               </div>
            </Card>
          </Col>

          {activeWorkflow ? (
            <>
              <Col lg={8} xs={24}>
                <Card title="Workflow Settings">
                   <Paragraph><b>Department:</b> {departments.find(d => d.id === activeWorkflow.deptId)?.name || 'Unknown'}</Paragraph>
                   <Paragraph><b>Auto Escalation:</b> Enabled</Paragraph>
                   <Paragraph><b>SLA Policy:</b> University Default</Paragraph>
                   <Divider />
                   <Button block style={{ marginBottom: 12 }}>Configure SLA</Button>
                   <Button block>View Category Mappings</Button>
                </Card>
              </Col>

              <Col lg={16} xs={24}>
                <Card title={<span><BranchesOutlined /> Escalation Chain</span>} extra={<Button icon={<PlusOutlined />} onClick={addLevel}>Add Level</Button>}>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="levels">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {levels.map((roleId, index) => {
                            const role = roles.find(r => r.id === roleId);
                            return (
                              <Draggable key={`${roleId}-${index}`} draggableId={`${roleId}-${index}`} index={index}>
                                {(provided) => (
                                  <Card 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{ marginBottom: 16, borderLeft: `4px solid var(--primary-color)` }}
                                    styles={{ body: { padding: '12px 24px' } }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Space size="large">
                                        <DragOutlined style={{ color: '#ccc' }} />
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                           {index + 1}
                                        </div>
                                        <div>
                                          <Select 
                                            value={roleId}
                                            style={{ width: 200 }}
                                            onChange={(val) => updateLevelRole(index, val)}
                                          >
                                            {availableRolesForLevels.map(r => (
                                              <Option key={r.id} value={r.id}>{r.name}</Option>
                                            ))}
                                          </Select>
                                          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                            Escalation Level {index + 1} Target
                                          </div>
                                        </div>
                                      </Space>
                                      <Space>
                                        <Tag color="blue">Level {index + 1}</Tag>
                                        <Button 
                                          icon={<DeleteOutlined />} 
                                          type="text" 
                                          danger 
                                          disabled={levels.length <= 1}
                                          onClick={() => removeLevel(index)}
                                        />
                                      </Space>
                                    </div>
                                  </Card>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Card>
              </Col>
            </>
          ) : (
            <Col span={24}>
              <Card style={{ padding: '60px 0', textAlign: 'center' }}>
                <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>
                  No workflows defined. Click "New Workflow" to set up your first escalation route.
                </Paragraph>
              </Card>
            </Col>
          )}
        </Row>
      
      {/* New Workflow Modal */}
      <Modal
        title="Create New Workflow"
        open={isNewModalOpen}
        onCancel={() => {
          setIsNewModalOpen(false);
          newForm.resetFields();
        }}
        footer={null}
        width={480}
      >
        <Form form={newForm} layout="vertical" onFinish={handleCreateWorkflow} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Workflow Name" rules={[{ required: true, message: 'Please enter workflow name' }]}>
            <Input placeholder="e.g. Health Department Workflow" />
          </Form.Item>
          <Form.Item name="deptId" label="Department" rules={[{ required: true, message: 'Please select a department' }]}>
            <Select placeholder="Select a department">
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => {
              setIsNewModalOpen(false);
              newForm.resetFields();
            }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Create Workflow
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkflowBuilder;
