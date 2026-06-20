import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Typography, Button, Space, Modal, Form,
  Input, Select, Avatar, App, Popconfirm, Badge, Divider, Row, Col, Statistic
} from 'antd';
import {
  UserAddOutlined, EditOutlined, StopOutlined, SearchOutlined,
  ReloadOutlined, TeamOutlined, UserOutlined, CrownOutlined, SafetyOutlined, DeleteOutlined
} from '@ant-design/icons';
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp, deleteDoc, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, secondaryAuth } from '../../utils/firebase';
import { useSystemData } from '../../context/SystemDataContext';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const { message, modal } = App.useApp();
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { roles, departments } = useSystemData();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      message.error('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEditRole = (user) => {
    setEditingUser(user);
    form.setFieldsValue({ roleId: user.roleId, deptId: user.deptId, name: user.name });
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
        // Update existing user
        await updateDoc(doc(db, 'users', editingUser.id), {
          roleId: values.roleId,
          deptId: values.deptId || null,
          name: values.name,
          updatedAt: new Date().toISOString(),
        });
        await addDoc(collection(db, 'auditLogs'), {
          action: 'User Updated',
          userId: adminUser?.uid || 'admin',
          details: `User "${values.name}" (${editingUser.email}) role changed to "${values.roleId}", department to "${values.deptId || 'None'}"`,
          timestamp: new Date().toISOString(),
        });
        message.success('User updated successfully!');
      } else {
        // Create new user via Firebase Auth + Firestore using secondaryAuth
        const cred = await createUserWithEmailAndPassword(secondaryAuth, values.email, values.password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: values.name,
          email: values.email,
          roleId: values.roleId,
          deptId: values.deptId || null,
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        await addDoc(collection(db, 'auditLogs'), {
          action: 'User Created',
          userId: adminUser?.uid || 'admin',
          details: `New user "${values.name}" (${values.email}) created with role "${values.roleId}"`,
          timestamp: new Date().toISOString(),
        });
        await signOut(secondaryAuth);
        message.success('User created successfully!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (u) => {
    try {
      const newStatus = u.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'users', u.id), {
        status: newStatus,
      });
      await addDoc(collection(db, 'auditLogs'), {
        action: newStatus === 'active' ? 'User Activated' : 'User Deactivated',
        userId: adminUser?.uid || 'admin',
        details: `User "${u.name}" (${u.email}) status set to "${newStatus}"`,
        timestamp: new Date().toISOString(),
      });
      message.success(`User ${newStatus === 'active' ? 'reactivated' : 'deactivated'}!`);
      fetchUsers();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async (u) => {
    try {
      await deleteDoc(doc(db, 'users', u.id));
      await addDoc(collection(db, 'auditLogs'), {
        action: 'User Deleted',
        userId: adminUser?.uid || 'admin',
        details: `User "${u.name}" (${u.email}) permanently deleted from system`,
        timestamp: new Date().toISOString(),
      });
      message.success('User deleted successfully!');
      fetchUsers();
    } catch (err) {
      message.error('Failed to delete user: ' + err.message);
    }
  };

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roleId === 'role-admin').length,
    officers: users.filter(u => !['role-admin', 'role-citizen'].includes(u.roleId)).length,
    citizens: users.filter(u => u.roleId === 'role-citizen').length,
  };

  const roleColors = {
    'role-admin': 'gold',
    'role-warden': 'blue',
    'role-principal': 'purple',
    'role-dean': 'magenta',
    'role-vro': 'cyan',
    'role-mro': 'geekblue',
    'role-collector': 'volcano',
    'role-citizen': 'default',
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, u) => (
        <Space>
          <Avatar
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
            size={40}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{u.name || '—'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{u.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'roleId',
      key: 'roleId',
      render: (r) => (
        <Tag color={roleColors[r] || 'default'}>
          {roles.find(role => role.id === r)?.name || r}
        </Tag>
      ),
      filters: roles.map(r => ({ text: r.name, value: r.id })),
      onFilter: (val, r) => r.roleId === val,
    },
    {
      title: 'Department',
      dataIndex: 'deptId',
      key: 'deptId',
      render: (d) => departments.find(dept => dept.id === d)?.name || <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Badge
          status={s === 'inactive' ? 'error' : 'success'}
          text={s === 'inactive' ? 'Inactive' : 'Active'}
        />
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => t ? dayjs(t).format('MMM D, YYYY') : '—',
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, u) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRole(u)}
          >
            Edit
          </Button>
          <Popconfirm
            title={`${u.status === 'active' ? 'Deactivate' : 'Reactivate'} this user?`}
            onConfirm={() => handleDeactivate(u)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              icon={<StopOutlined />}
              danger={u.status !== 'inactive'}
              type={u.status === 'inactive' ? 'primary' : 'default'}
            >
              {u.status === 'inactive' ? 'Reactivate' : 'Deactivate'}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Permanently delete this user? This cannot be undone."
            onConfirm={() => handleDelete(u)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              type="text"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>User Management</Title>
          <Text type="secondary">Manage system users, roles, and permissions</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>Refresh</Button>
          <Button type="primary" icon={<UserAddOutlined />} onClick={handleCreateUser}>
            Add New User
          </Button>
        </Space>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Users', value: stats.total, icon: <TeamOutlined />, color: '#1677ff' },
          { title: 'Admins', value: stats.admins, icon: <CrownOutlined />, color: '#faad14' },
          { title: 'Officers', value: stats.officers, icon: <SafetyOutlined />, color: '#52c41a' },
          { title: 'Citizens', value: stats.citizens, icon: <UserOutlined />, color: '#722ed1' },
        ].map((s, i) => (
          <Col xs={12} lg={6} key={i}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value}
                prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                valueStyle={{ color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search by name or email..."
            style={{ width: 300 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Text type="secondary">{filtered.length} users found</Text>
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. John Smith" />
          </Form.Item>
          {!editingUser && (
            <>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="user@example.com" />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
                <Input.Password placeholder="Min. 6 characters" />
              </Form.Item>
            </>
          )}
          <Form.Item name="roleId" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select a role">
              {roles.map(r => (
                <Option key={r.id} value={r.id}>{r.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="deptId" label="Department">
            <Select placeholder="Select a department (optional)" allowClear>
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
