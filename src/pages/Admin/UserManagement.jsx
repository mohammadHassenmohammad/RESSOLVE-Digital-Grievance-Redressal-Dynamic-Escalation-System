import React, { useState } from 'react';
import {
  Card, Table, Tag, Typography, Button, Space, Modal, Form,
  Input, Select, Avatar, App, Popconfirm, Badge, Divider, Row, Col, Statistic, Tooltip,
} from 'antd';
import {
  UserAddOutlined, EditOutlined, StopOutlined, SearchOutlined,
  ReloadOutlined, TeamOutlined, UserOutlined, CrownOutlined, SafetyOutlined, DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useSystemData } from '../../context/SystemDataContext';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const { message } = App.useApp();
  const { user: adminUser } = useAuth();
  const { users, roles, departments, saveUser, deleteUser, toggleUserStatus } = useSystemData();
  const { addAuditLog } = useComplaints();

  const [searchText, setSearchText] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const handleEditRole = (u) => {
    setEditingUser(u);
    form.setFieldsValue({
      name: u.name,
      email: u.email,
      roleId: u.roleId,
      deptId: u.deptId || undefined,
      phone: u.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editingUser) {
        await saveUser({
          ...editingUser,
          name: values.name,
          roleId: values.roleId,
          deptId: values.deptId || null,
          phone: values.phone || '',
        });
        addAuditLog('User Updated', adminUser?.uid || 'admin', `Updated user "${values.name}" (${editingUser.email})`);
        message.success('User updated successfully!');
      } else {
        const newId = `u-${Date.now()}`;
        await saveUser({
          id: newId,
          name: values.name,
          email: values.email,
          password: values.password || 'Demo@123',
          roleId: values.roleId,
          deptId: values.deptId || null,
          phone: values.phone || '',
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        addAuditLog('User Created', adminUser?.uid || 'admin', `Created user account for "${values.name}" (${values.email})`);
        message.success('New user account created successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u) => {
    await toggleUserStatus(u.id);
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    addAuditLog(newStatus === 'active' ? 'User Activated' : 'User Deactivated', adminUser?.uid || 'admin', `User ${u.name} set to ${newStatus}`);
    message.success(`User ${newStatus === 'active' ? 'reactivated' : 'deactivated'}!`);
  };

  const handleDelete = async (u) => {
    await deleteUser(u.id);
    addAuditLog('User Deleted', adminUser?.uid || 'admin', `Permanently deleted user ${u.name} (${u.email})`);
    message.success('User removed from system.');
  };

  // Filtering
  const filteredUsers = users.filter(u => {
    if (deptFilter !== 'ALL' && u.deptId !== deptFilter) return false;
    if (roleFilter !== 'ALL' && u.roleId !== roleFilter) return false;

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const totalOfficers = users.filter(u => u.roleId !== 'role-citizen' && u.roleId !== 'role-admin').length;
  const totalCitizens = users.filter(u => u.roleId === 'role-citizen').length;

  const columns = [
    {
      title: 'User Profile',
      key: 'name',
      render: (_, u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name || 'User'}`}
            size={40}
            style={{ border: '2px solid #1677ff' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>{u.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Assigned Role & Level',
      key: 'role',
      render: (_, u) => {
        const r = roles.find(role => role.id === u.roleId);
        return (
          <Space>
            <Tag color={r?.badgeColor || 'blue'} style={{ borderRadius: 12, fontWeight: 700, fontSize: 11 }}>
              {r?.name || u.roleId}
            </Tag>
            {r && r.level > 0 && (
              <Tag style={{ borderRadius: 10, fontSize: 10 }}>Level {r.level}</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Department Jurisdiction',
      key: 'dept',
      render: (_, u) => {
        const d = departments.find(dept => dept.id === u.deptId);
        return d ? (
          <Tag color="cyan" style={{ borderRadius: 10, fontSize: 11 }}>{d.name}</Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>All Jurisdictions / Citizen</Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st) => (
        <Badge
          status={st === 'inactive' ? 'error' : 'success'}
          text={
            <span style={{ fontSize: 12, fontWeight: 700, color: st === 'inactive' ? '#ff4d4f' : '#52c41a' }}>
              {st === 'inactive' ? 'INACTIVE' : 'ACTIVE'}
            </span>
          }
        />
      ),
    },
    {
      title: 'Registered Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => <Text type="secondary" style={{ fontSize: 12 }}>{t ? dayjs(t).format('MMM D, YYYY') : '—'}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, u) => (
        <Space size={4}>
          <Tooltip title="Edit Role & Details">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEditRole(u)} />
          </Tooltip>

          <Tooltip title={u.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}>
            <Button
              size="small"
              icon={<StopOutlined />}
              danger={u.status === 'active'}
              onClick={() => handleToggleStatus(u)}
            />
          </Tooltip>

          {u.roleId !== 'role-admin' && (
            <Popconfirm
              title="Delete User"
              description={`Permanently remove ${u.name}?`}
              onConfirm={() => handleDelete(u)}
              okText="Delete"
              cancelText="Cancel"
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
            User & Authority Management
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Control user access roles, departmental jurisdictions, and active officer duty rosters.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleCreateUser}
          style={{ borderRadius: 10, fontWeight: 700, height: 40 }}
        >
          Add New Officer / Citizen
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <Card size="small" style={{ borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
            <Statistic title="Total System Accounts" value={users.length} prefix={<TeamOutlined style={{ color: '#1677ff' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" style={{ borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
            <Statistic title="Active Department Officers" value={totalOfficers} prefix={<SafetyOutlined style={{ color: '#722ed1' }} />} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" style={{ borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
            <Statistic title="Registered Citizens" value={totalCitizens} prefix={<UserOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}
        title={
          <Space wrap size={12}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Search by name or email..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: 240, borderRadius: 10 }}
            />

            <Select value={deptFilter} onChange={setDeptFilter} style={{ width: 200 }}>
              <Option value="ALL">All Departments</Option>
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>

            <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 180 }}>
              <Option value="ALL">All Roles</Option>
              {roles.map(r => (
                <Option key={r.id} value={r.id}>{r.name}</Option>
              ))}
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: true }}
        />
      </Card>

      {/* Add / Edit User Modal */}
      <Modal
        title={<span>{editingUser ? '✏️ Edit User Authority & Role' : '➕ Register New Officer or User'}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ padding: '12px 0' }}>
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="e.g., Dr. Alice Smith" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
          >
            <Input placeholder="e.g., alice@domain.com" disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Temporary Password"
              initialValue="Demo@123"
              rules={[{ required: true, min: 6 }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="roleId"
            label="Authority Role"
            rules={[{ required: true, message: 'Select role' }]}
          >
            <Select placeholder="Select role">
              {roles.map(r => (
                <Option key={r.id} value={r.id}>
                  {r.name} (Level {r.level})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="deptId"
            label="Department Jurisdiction (Leave blank for Citizen or Admin)"
          >
            <Select placeholder="Optional: Select department" allowClear>
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="Contact Phone Number"
          >
            <Input placeholder="e.g., +91 98765 43210" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
