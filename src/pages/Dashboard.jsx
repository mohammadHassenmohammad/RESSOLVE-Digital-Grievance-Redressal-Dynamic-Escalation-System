import React, { useMemo } from 'react';
import {
  Row, Col, Typography, Card, Table, Tag, Button, Space, Avatar, Spin, Badge, Tooltip, Progress,
} from 'antd';
import {
  FileDoneOutlined, HourglassOutlined, CheckCircleOutlined, WarningOutlined,
  PlusOutlined, ArrowRightOutlined, DownloadOutlined, UserOutlined,
  ClockCircleOutlined, RiseOutlined, TeamOutlined,
} from '@ant-design/icons';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintContext';
import { useSystemData } from '../context/SystemDataContext';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

const SLA_COLORS = { overdue: '#ff4d4f', warning: '#fa8c16', ok: '#52c41a' };
const DEPT_COLORS = ['#1677ff', '#722ed1', '#52c41a', '#fa8c16', '#eb2f96'];

const getSlaInfo = (deadline) => {
  const now = dayjs();
  const dl = dayjs(deadline);
  const hoursLeft = dl.diff(now, 'hour');
  if (hoursLeft < 0) return { label: 'Overdue', color: '#ff4d4f', class: 'sla-overdue' };
  if (hoursLeft < 24) return { label: `${hoursLeft}h left`, color: '#fa8c16', class: 'sla-critical' };
  return { label: dl.format('MMM D'), color: '#52c41a', class: 'sla-ok' };
};

const StatusTag = ({ status }) => {
  const map = {
    Assigned: { color: 'blue', bg: 'rgba(22,119,255,0.1)' },
    Pending: { color: '#d48806', bg: 'rgba(250,173,20,0.1)' },
    'In Progress': { color: '#096dd9', bg: 'rgba(9,109,217,0.1)' },
    Resolved: { color: '#389e0d', bg: 'rgba(82,196,26,0.1)' },
    Escalated: { color: '#cf1322', bg: 'rgba(255,77,79,0.1)' },
    Closed: { color: '#595959', bg: 'rgba(0,0,0,0.06)' },
  };
  const s = map[status] || { color: '#999', bg: 'rgba(0,0,0,0.05)' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {status}
    </span>
  );
};

const PriorityTag = ({ priority }) => {
  const map = { Critical: '#ff4d4f', High: '#fa8c16', Medium: '#faad14', Low: '#52c41a' };
  const color = map[priority] || '#999';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: priority === 'Critical' ? `0 0 6px ${color}` : 'none' }} />
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{priority}</span>
    </span>
  );
};

const Dashboard = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { complaints, loading: dataLoading } = useComplaints();
  const { departments, users } = useSystemData();
  const navigate = useNavigate();

  if (authLoading || dataLoading || !userRole) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" description="Loading dashboard..." />
      </div>
    );
  }

  const isAdmin = userRole.id === 'role-admin';
  const isCitizen = userRole.id === 'role-citizen';
  const isOfficer = !isAdmin && !isCitizen;

  const filteredComplaints = useMemo(() => {
    if (isCitizen) return complaints.filter(c => c.userId === user.uid);
    if (isAdmin) return complaints;
    return complaints.filter(c => c.assignedOfficerId === user.uid || c.deptId === user.deptId);
  }, [complaints, user, isCitizen, isAdmin]);

  const stats = {
    total: filteredComplaints.length,
    active: filteredComplaints.filter(c => !['Resolved', 'Closed'].includes(c.status)).length,
    resolved: filteredComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length,
    escalated: filteredComplaints.filter(c => c.status === 'Escalated').length,
    overdue: filteredComplaints.filter(c => c.slaDeadline && dayjs().isAfter(c.slaDeadline) && !['Resolved', 'Closed'].includes(c.status)).length,
  };

  // 7-day chart data
  const chartData = Array.from({ length: 7 }).map((_, idx) => {
    const date = dayjs().subtract(6 - idx, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const submitted = filteredComplaints.filter(c => dayjs(c.createdAt).format('YYYY-MM-DD') === dateStr).length;
    const resolved = filteredComplaints.filter(c =>
      c.status === 'Resolved' && dayjs(c.updatedAt).format('YYYY-MM-DD') === dateStr
    ).length;
    return { name: date.format('ddd'), submitted, resolved };
  });

  // Department breakdown (admin only)
  const deptData = isAdmin
    ? departments.map((d, i) => ({
        name: d.name,
        value: complaints.filter(c => c.deptId === d.id).length,
        color: DEPT_COLORS[i % DEPT_COLORS.length],
      })).filter(d => d.value > 0)
    : [];

  const handleDownloadReport = () => {
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Department', 'SLA Deadline', 'Date Submitted'];
    const rows = filteredComplaints.map(c => {
      const esc = v => `"${(v || '').toString().replace(/"/g, '""')}"`;
      const dept = departments.find(d => d.id === c.deptId)?.name || '';
      return [esc(c.id), esc(c.title), esc(c.status), esc(c.priority), esc(dept), esc(c.slaDeadline || ''), esc(dayjs(c.createdAt).format('YYYY-MM-DD HH:mm'))].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grievance_report_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: 'Complaint',
      key: 'complaint',
      render: (_, c) => (
        <div>
          <Text strong style={{ display: 'block', fontSize: 13 }}>{c.title}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>#{c.id?.slice(-8)}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: s => <StatusTag status={s} />,
      responsive: ['md'],
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: p => <PriorityTag priority={p} />,
      responsive: ['lg'],
    },
    ...(isOfficer || isAdmin ? [{
      title: 'SLA',
      key: 'sla',
      responsive: ['md'],
      render: (_, c) => {
        if (!c.slaDeadline || ['Resolved', 'Closed'].includes(c.status)) return <Text type="secondary">—</Text>;
        const info = getSlaInfo(c.slaDeadline);
        return <span style={{ color: info.color, fontWeight: 600, fontSize: 12 }}>{info.label}</span>;
      },
    }] : []),
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: d => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('MMM D')}</Text>,
      responsive: ['sm'],
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, c) => (
        <Button type="text" icon={<ArrowRightOutlined />} size="small"
          onClick={() => navigate(`/complaint/${c.id}`)}
          style={{ color: 'var(--primary-color)' }}
        />
      ),
    },
  ];

  return (
    <div className="fade-in">
      {/* Header row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }} align="middle">
        <Col flex="auto">
          <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {isAdmin ? 'System Overview' : isOfficer ? 'My Assignments' : 'My Grievances'}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {isAdmin
              ? 'Real-time overview across all departments'
              : isOfficer
              ? `Handling complaints for ${departments.find(d => d.id === user.deptId)?.name || 'your'} department`
              : 'Track and manage your submitted grievances'}
          </Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadReport}>Export CSV</Button>
            {isCitizen && (
              <Button type="primary" icon={<PlusOutlined />} size="large"
                onClick={() => navigate('/submit')}
                style={{ borderRadius: 12, fontWeight: 700, height: 44 }}
              >
                New Complaint
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total', value: stats.total, icon: <FileDoneOutlined />, gradient: 'linear-gradient(135deg,#1677ff,#4096ff)', delay: 0 },
          { title: 'Active', value: stats.active, icon: <HourglassOutlined />, gradient: 'linear-gradient(135deg,#fa8c16,#ffc53d)', delay: 0.07 },
          { title: 'Resolved', value: stats.resolved, icon: <CheckCircleOutlined />, gradient: 'linear-gradient(135deg,#52c41a,#95de64)', delay: 0.14 },
          { title: 'Escalated', value: stats.escalated, icon: <WarningOutlined />, gradient: 'linear-gradient(135deg,#ff4d4f,#ff7875)', delay: 0.21 },
        ].map((s, i) => (
          <Col xs={12} lg={6} key={i}>
            <StatCard {...s} />
          </Col>
        ))}
      </Row>

      {/* Charts row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* Area chart */}
        <Col xs={24} lg={isAdmin && deptData.length > 0 ? 15 : 24}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Submission Trends</span>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>Last 7 Days</Text>}
          >
            <div style={{ height: 240, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1677ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#52c41a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} allowDecimals={false} />
                  <RTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 13 }} />
                  <Area type="monotone" dataKey="submitted" stroke="#1677ff" strokeWidth={2.5} fill="url(#gradSubmitted)" name="Submitted" dot={false} />
                  <Area type="monotone" dataKey="resolved" stroke="#52c41a" strokeWidth={2.5} fill="url(#gradResolved)" name="Resolved" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Department Pie (admin only) */}
        {isAdmin && deptData.length > 0 && (
          <Col xs={24} lg={9}>
            <Card title={<span style={{ fontWeight: 700 }}>By Department</span>} style={{ height: '100%' }}>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="value" paddingAngle={3} nameKey="name"
                    >
                      {deptData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11 }}>{v}</span>} />
                    <RTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Overdue alert for officers */}
      {isOfficer && stats.overdue > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            background: 'linear-gradient(135deg,rgba(255,77,79,0.12),rgba(250,140,22,0.08))',
            border: '1px solid rgba(255,77,79,0.3)',
            borderRadius: 14,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <WarningOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
          <div>
            <Text strong style={{ color: '#cf1322', fontSize: 14 }}>
              {stats.overdue} complaint{stats.overdue > 1 ? 's' : ''} past SLA deadline
            </Text>
            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
              Please resolve or escalate these urgently.
            </Text>
          </div>
        </motion.div>
      )}

      {/* Admin quick stats row */}
      {isAdmin && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          {[
            { label: 'Total Users', value: users.length, icon: <TeamOutlined />, color: '#722ed1' },
            { label: 'SLA Breaches', value: complaints.filter(c => c.slaDeadline && dayjs().isAfter(c.slaDeadline) && !['Resolved', 'Closed'].includes(c.status)).length, icon: <ClockCircleOutlined />, color: '#ff4d4f' },
            { label: 'Resolution Rate', value: complaints.length > 0 ? `${Math.round((complaints.filter(c => ['Resolved','Closed'].includes(c.status)).length / complaints.length) * 100)}%` : '0%', icon: <RiseOutlined />, color: '#52c41a' },
          ].map((s, i) => (
            <Col xs={8} key={i}>
              <Card style={{ textAlign: 'center', borderRadius: 14 }}>
                <div style={{ fontSize: 22, color: s.color, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Complaints table */}
      <Card
        title={<span style={{ fontWeight: 700 }}>Recent Complaints</span>}
        extra={
          <Button type="link" style={{ fontWeight: 600, padding: 0 }}
            onClick={() => navigate(isCitizen ? '/my-complaints' : '/assigned')}
          >
            View All →
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredComplaints.slice(0, 8)}
          pagination={false}
          rowKey="id"
          rowClassName="complaint-row"
          onRow={record => ({ onClick: () => navigate(`/complaint/${record.id}`) })}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
