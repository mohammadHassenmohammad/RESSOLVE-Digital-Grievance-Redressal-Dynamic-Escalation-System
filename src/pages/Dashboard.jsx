import React, { useState, useMemo } from 'react';
import {
  Row, Col, Typography, Card, Table, Tag, Button, Space, Avatar, Spin, Badge, Tooltip, Progress,
  Input, Radio, Segmented,
} from 'antd';
import {
  FileDoneOutlined, HourglassOutlined, CheckCircleOutlined, WarningOutlined,
  PlusOutlined, ArrowRightOutlined, DownloadOutlined, UserOutlined,
  ClockCircleOutlined, RiseOutlined, TeamOutlined, SearchOutlined,
  FireOutlined, FilterOutlined,
} from '@ant-design/icons';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintContext';
import { useSystemData } from '../context/SystemDataContext';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { motion } from 'framer-motion';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

const DEPT_COLORS = ['#1677ff', '#722ed1', '#52c41a', '#fa8c16', '#eb2f96'];

const getSlaInfo = (deadline, status) => {
  if (['Resolved', 'Closed'].includes(status)) {
    return { label: 'Complied', color: '#52c41a', bg: 'rgba(82,196,26,0.1)' };
  }
  const now = dayjs();
  const dl = dayjs(deadline);
  const hoursLeft = dl.diff(now, 'hour');
  if (hoursLeft < 0) {
    return { label: `Overdue (${Math.abs(hoursLeft)}h)`, color: '#ff4d4f', bg: 'rgba(255,77,79,0.12)' };
  }
  if (hoursLeft < 24) {
    return { label: `${hoursLeft}h left`, color: '#fa8c16', bg: 'rgba(250,140,22,0.12)' };
  }
  const daysLeft = Math.round(hoursLeft / 24);
  return { label: `${daysLeft}d left`, color: '#52c41a', bg: 'rgba(82,196,26,0.1)' };
};

const StatusTag = ({ status }) => {
  const map = {
    Assigned: { color: '#1677ff', bg: 'rgba(22,119,255,0.1)', text: 'ASSIGNED' },
    Pending: { color: '#faad14', bg: 'rgba(250,173,20,0.1)', text: 'PENDING' },
    'In Progress': { color: '#722ed1', bg: 'rgba(114,46,209,0.1)', text: 'IN PROGRESS' },
    Resolved: { color: '#52c41a', bg: 'rgba(82,196,26,0.1)', text: 'RESOLVED' },
    Escalated: { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)', text: 'ESCALATED' },
    Closed: { color: '#595959', bg: 'rgba(0,0,0,0.06)', text: 'CLOSED' },
  };
  const s = map[status] || { color: '#999', bg: 'rgba(0,0,0,0.05)', text: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '4px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
      display: 'inline-block',
    }}>
      {s.text}
    </span>
  );
};

const PriorityTag = ({ priority }) => {
  const map = {
    Critical: { color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)' },
    High: { color: '#fa8c16', bg: 'rgba(250,140,22,0.1)' },
    Medium: { color: '#faad14', bg: 'rgba(250,173,20,0.1)' },
    Low: { color: '#52c41a', bg: 'rgba(82,196,26,0.1)' },
  };
  const p = map[priority] || { color: '#999', bg: 'transparent' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: p.bg, padding: '3px 8px', borderRadius: 8,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: p.color,
        display: 'inline-block',
        boxShadow: priority === 'Critical' ? `0 0 6px ${p.color}` : 'none',
      }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{priority}</span>
    </span>
  );
};

const Dashboard = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { complaints, loading: dataLoading } = useComplaints();
  const { departments, categories, users } = useSystemData();
  const navigate = useNavigate();

  const [filterTab, setFilterTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = userRole?.id === 'role-admin';
  const isCitizen = userRole?.id === 'role-citizen';
  const isOfficer = !isAdmin && !isCitizen;

  // Role-based complaint visibility
  const myComplaints = useMemo(() => {
    if (isAdmin) return complaints;
    if (isCitizen) {
      return complaints.filter(c =>
        c.userId === user?.uid ||
        c.userId === user?.id ||
        (user?.email === 'bob@gmail.com' && (c.userId === 'u-bob' || c.citizenName?.includes('Bob'))) ||
        (user?.email === 'sara@gmail.com' && (c.userId === 'u-sara' || c.citizenName?.includes('Sara')))
      );
    }
    // Officer view: complaints assigned directly or belonging to their department
    return complaints.filter(c =>
      c.assignedOfficerId === user?.uid ||
      c.assignedOfficerId === user?.id ||
      (user?.deptId && c.deptId === user?.deptId)
    );
  }, [complaints, user, isCitizen, isAdmin]);

  // Tab & Search filtered complaints
  const filteredComplaints = useMemo(() => {
    return myComplaints.filter(c => {
      // Filter tab
      if (filterTab === 'CRITICAL' && c.priority !== 'Critical') return false;
      if (filterTab === 'ACTIVE' && ['Resolved', 'Closed'].includes(c.status)) return false;
      if (filterTab === 'RESOLVED' && !['Resolved', 'Closed'].includes(c.status)) return false;
      if (filterTab === 'ESCALATED' && c.status !== 'Escalated') return false;
      if (filterTab === 'OVERDUE') {
        if (['Resolved', 'Closed'].includes(c.status)) return false;
        if (!c.slaDeadline || !dayjs().isAfter(c.slaDeadline)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (c.title || '').toLowerCase().includes(q);
        const matchId = (c.id || '').toLowerCase().includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchDesc) return false;
      }

      return true;
    });
  }, [myComplaints, filterTab, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: myComplaints.length,
      active: myComplaints.filter(c => !['Resolved', 'Closed'].includes(c.status)).length,
      resolved: myComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length,
      escalated: myComplaints.filter(c => c.status === 'Escalated').length,
      critical: myComplaints.filter(c => c.priority === 'Critical').length,
      overdue: myComplaints.filter(c =>
        c.slaDeadline && dayjs().isAfter(c.slaDeadline) && !['Resolved', 'Closed'].includes(c.status)
      ).length,
    };
  }, [myComplaints]);

  // 7-day trend data
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = dayjs().subtract(6 - idx, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const submitted = myComplaints.filter(c => dayjs(c.createdAt).format('YYYY-MM-DD') === dateStr).length;
      const resolved = myComplaints.filter(c =>
        ['Resolved', 'Closed'].includes(c.status) && dayjs(c.updatedAt).format('YYYY-MM-DD') === dateStr
      ).length;
      return { name: date.format('ddd'), Submitted: submitted, Resolved: resolved };
    });
  }, [myComplaints]);

  // Department distribution
  const deptData = useMemo(() => {
    return departments.map((d, i) => ({
      name: d.code || d.name.slice(0, 8),
      fullName: d.name,
      Complaints: complaints.filter(c => c.deptId === d.id).length,
      fill: DEPT_COLORS[i % DEPT_COLORS.length],
    })).filter(d => d.Complaints > 0);
  }, [departments, complaints]);

  const handleDownloadReport = () => {
    const headers = ['ID', 'Title', 'Citizen', 'Department', 'Category', 'Priority', 'Status', 'Escalation Level', 'SLA Deadline', 'Date Submitted'];
    const rows = filteredComplaints.map(c => {
      const esc = v => `"${(v || '').toString().replace(/"/g, '""')}"`;
      const dept = departments.find(d => d.id === c.deptId)?.name || '';
      const cat = categories.find(cat => cat.id === c.categoryId)?.name || '';
      return [
        esc(c.id),
        esc(c.title),
        esc(c.citizenName || ''),
        esc(dept),
        esc(cat),
        esc(c.priority),
        esc(c.status),
        esc(`Level ${c.escalationLevel || 1}`),
        esc(dayjs(c.slaDeadline).format('YYYY-MM-DD HH:mm')),
        esc(dayjs(c.createdAt).format('YYYY-MM-DD HH:mm')),
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grievances_${userRole?.id}_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: 'Grievance / Subject',
      key: 'title',
      render: (_, c) => {
        const cat = categories.find(cat => cat.id === c.categoryId);
        return (
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}
                onClick={() => navigate(`/complaint/${c.id}`)}
              >
                {c.title}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{c.id}</span>
              {cat && <span> · {cat.icon} {cat.name}</span>}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Department',
      key: 'dept',
      render: (_, c) => {
        const dept = departments.find(d => d.id === c.deptId);
        return (
          <Tag color="blue" style={{ borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
            {dept?.code || dept?.name || 'General'}
          </Tag>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (p) => <PriorityTag priority={p} />,
      sorter: (a, b) => {
        const weight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      },
    },
    {
      title: 'SLA Status',
      key: 'sla',
      render: (_, c) => {
        const sla = getSlaInfo(c.slaDeadline, c.status);
        return (
          <span style={{
            background: sla.bg, color: sla.color,
            padding: '3px 8px', borderRadius: 6,
            fontSize: 11, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <ClockCircleOutlined style={{ fontSize: 10 }} />
            {sla.label}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <StatusTag status={s} />,
    },
    {
      title: 'Assigned Officer',
      key: 'officer',
      render: (_, c) => {
        const off = users.find(u => u.id === c.assignedOfficerId);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={24} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${off?.name || 'Officer'}`} />
            <Text style={{ fontSize: 12 }}>{off?.name || c.assignedOfficerName || 'Triage'}</Text>
          </div>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, c) => (
        <Button
          type="primary"
          size="small"
          onClick={() => navigate(`/complaint/${c.id}`)}
          style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}
        >
          Track <ArrowRightOutlined style={{ fontSize: 10 }} />
        </Button>
      ),
    },
  ];

  return (
    <div className="fade-in">
      {/* Top Welcome & Actions Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
      }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {isCitizen ? 'Citizen Grievance Portal' : isOfficer ? `${userRole?.name} Dashboard` : 'System Operations Control'}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {isCitizen
              ? 'Real-time status tracking, direct officer messaging, and guaranteed resolution.'
              : 'Assigned task queue, automated SLA tracking, and resolution station.'}
          </Text>
        </div>

        <Space size={12}>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadReport} style={{ borderRadius: 10, height: 40, fontWeight: 600 }}>
            Export CSV
          </Button>
          {isCitizen && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/submit')}
              style={{
                borderRadius: 10,
                height: 40,
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(22,119,255,0.35)',
              }}
            >
              Submit New Grievance
            </Button>
          )}
        </Space>
      </div>

      {/* Metric Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title={isCitizen ? "My Filed Grievances" : "Total Workload"}
            value={stats.total}
            icon={<FileDoneOutlined />}
            color="#1677ff"
            subtext="Lifetime tickets recorded"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="In Progress / Active"
            value={stats.active}
            icon={<HourglassOutlined />}
            color="#fa8c16"
            subtext="Under active investigation"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="Resolved & Verified"
            value={stats.resolved}
            icon={<CheckCircleOutlined />}
            color="#52c41a"
            subtext="Successfully closed"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <StatCard
            title="Escalated / Critical"
            value={stats.escalated}
            icon={<WarningOutlined />}
            color="#ff4d4f"
            subtext="Level 2+ senior review"
          />
        </Col>
      </Row>

      {/* Visual Analytics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 7-Day Resolution Flow Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>
                  <RiseOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                  7-Day Grievance Intake vs Resolution Rate
                </span>
                <Tag color="blue" style={{ borderRadius: 12 }}>Last 7 Days</Tag>
              </div>
            }
            bordered={false}
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                  <RTooltip
                    contentStyle={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Area type="monotone" dataKey="Submitted" stroke="#1677ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmitted)" />
                  <Area type="monotone" dataKey="Resolved" stroke="#52c41a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Department Workload Distribution */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontWeight: 700 }}>
                <TeamOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                Department Breakdown
              </span>
            }
            bordered={false}
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={60} />
                  <RTooltip
                    formatter={(val, name, item) => [`${val} tickets`, item.payload.fullName]}
                    contentStyle={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                    }}
                  />
                  <Bar dataKey="Complaints" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Interactive Grievance Table */}
      <Card
        bordered={false}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Grievance Records</span>
            {/* Quick Filter Segmented Control */}
            <Segmented
              value={filterTab}
              onChange={setFilterTab}
              options={[
                { label: `All (${myComplaints.length})`, value: 'ALL' },
                { label: `Active (${stats.active})`, value: 'ACTIVE' },
                { label: `Critical (${stats.critical})`, value: 'CRITICAL' },
                { label: `Escalated (${stats.escalated})`, value: 'ESCALATED' },
                { label: `Resolved (${stats.resolved})`, value: 'RESOLVED' },
              ]}
              style={{ padding: 3, borderRadius: 10 }}
            />
          </div>
        }
        extra={
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder="Filter by keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: 220, borderRadius: 10 }}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filteredComplaints}
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: true }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: 36, color: '#52c41a', marginBottom: 12 }} />
                <Title level={5} style={{ margin: 0 }}>No grievances match current filters</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>You're all caught up! Great job.</Text>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
