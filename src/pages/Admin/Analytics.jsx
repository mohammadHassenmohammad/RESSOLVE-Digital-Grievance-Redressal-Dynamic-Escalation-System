import React, { useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Select, Button, Table, Progress, Space, Tag } from 'antd';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  DownloadOutlined, 
  DashboardOutlined, 
  SafetyOutlined, 
  HourglassOutlined, 
  CheckCircleOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { useComplaints } from '../../context/ComplaintContext';
import { useSystemData } from '../../context/SystemDataContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30days');

  const { complaints } = useComplaints();
  const { departments } = useSystemData();

  // 1. Backlog calculations
  const activeBacklog = complaints.filter(c => !['Resolved', 'Closed'].includes(c.status));
  const activeBacklogCount = activeBacklog.length;
  const priorityBacklogCount = activeBacklog.filter(c => ['Critical', 'High'].includes(c.priority)).length;

  // 2. SLA Breach calculations
  const isBreached = (c) => {
    const deadline = dayjs(c.slaDeadline);
    const resolvedEntry = c.timeline?.find(t => ['Resolved', 'Closed'].includes(t.status));
    const resolutionTime = resolvedEntry ? dayjs(resolvedEntry.timestamp) : null;
    
    if (resolutionTime) {
      return resolutionTime.isAfter(deadline);
    }
    return dayjs().isAfter(deadline);
  };

  const breachedComplaints = complaints.filter(isBreached);
  const breachedCount = breachedComplaints.length;

  // 3. System SLA Compliance
  const totalComplaintsCount = complaints.length;
  const slaCompliance = totalComplaintsCount > 0 
    ? Math.round(((totalComplaintsCount - breachedCount) / totalComplaintsCount) * 100) 
    : 100;

  // 4. Average Resolution Time
  const resolvedComplaints = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status));
  const getResolutionDays = (c) => {
    const start = dayjs(c.createdAt);
    const resolvedEntry = c.timeline?.find(t => ['Resolved', 'Closed'].includes(t.status));
    const end = resolvedEntry ? dayjs(resolvedEntry.timestamp) : dayjs(c.updatedAt);
    return Math.max(0, end.diff(start, 'day', true));
  };

  const avgResolutionTime = resolvedComplaints.length > 0
    ? (resolvedComplaints.reduce((acc, c) => acc + getResolutionDays(c), 0) / resolvedComplaints.length).toFixed(1)
    : '0.0';

  // 5. Department Performance Data
  const deptPerformanceData = departments.map(dept => {
    const deptComplaints = complaints.filter(c => c.deptId === dept.id);
    const totalCount = deptComplaints.length;
    const resolvedCount = deptComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    const deptBreachedCount = deptComplaints.filter(isBreached).length;
    
    const deptSla = totalCount > 0 
      ? Math.round(((totalCount - deptBreachedCount) / totalCount) * 100)
      : 100;

    const deptResolved = deptComplaints.filter(c => ['Resolved', 'Closed'].includes(c.status));
    const deptAvgDays = deptResolved.length > 0
      ? (deptResolved.reduce((acc, c) => acc + getResolutionDays(c), 0) / deptResolved.length).toFixed(1)
      : '0.0';

    return {
      name: dept.name,
      complaints: totalCount,
      resolved: resolvedCount,
      SLA: deptSla,
      avgDays: parseFloat(deptAvgDays)
    };
  });

  // 6. Overall Status Distribution
  const statusCounts = {
    Resolved: complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length,
    Assigned: complaints.filter(c => c.status === 'Assigned').length,
    Pending: complaints.filter(c => c.status === 'In Progress').length,
    Escalated: complaints.filter(c => ['Escalated', 'Rejected'].includes(c.status)).length,
  };

  const statusData = [
    { name: 'Resolved', value: statusCounts.Resolved, color: '#52c41a' },
    { name: 'Assigned', value: statusCounts.Assigned, color: '#1890ff' },
    { name: 'Pending', value: statusCounts.Pending, color: '#faad14' },
    { name: 'Escalated', value: statusCounts.Escalated, color: '#ff4d4f' },
  ];

  const COLORS = ['#52c41a', '#1890ff', '#faad14', '#ff4d4f'];

  // 7. Trend Data (Period 1 to Period 4 based on selected time range)
  const daysLimit = timeRange === '7days' ? 7 : timeRange === '90days' ? 90 : 30;
  const segmentDays = daysLimit / 4;

  const trendData = Array.from({ length: 4 }).map((_, idx) => {
    const label = timeRange === '7days' ? `Day ${idx * 2 + 1}-${idx * 2 + 2}` : `Week ${idx + 1}`;
    const startDaysAgo = daysLimit - (idx * segmentDays);
    const endDaysAgo = daysLimit - ((idx + 1) * segmentDays);

    const periodStart = dayjs().subtract(startDaysAgo, 'day');
    const periodEnd = dayjs().subtract(endDaysAgo, 'day');

    const periodComplaints = complaints.filter(c => {
      const created = dayjs(c.createdAt);
      return created.isAfter(periodStart) && created.isBefore(periodEnd);
    });

    const periodResolved = complaints.filter(c => {
      if (!['Resolved', 'Closed'].includes(c.status)) return false;
      const resolvedEntry = c.timeline?.find(t => ['Resolved', 'Closed'].includes(t.status));
      const resTime = resolvedEntry ? dayjs(resolvedEntry.timestamp) : dayjs(c.updatedAt);
      return resTime.isAfter(periodStart) && resTime.isBefore(periodEnd);
    });

    return {
      label,
      submitted: periodComplaints.length,
      resolved: periodResolved.length
    };
  });

  const columns = [
    {
      title: 'Department',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Total Grievances',
      dataIndex: 'complaints',
      key: 'complaints',
      sorter: (a, b) => a.complaints - b.complaints,
    },
    {
      title: 'Resolution Rate',
      key: 'resolutionRate',
      render: (_, r) => {
        const rate = Math.round((r.resolved / r.complaints) * 100);
        return (
          <Space style={{ width: 120 }}>
            <Progress percent={rate} size="small" status={rate > 85 ? 'success' : 'normal'} />
          </Space>
        );
      }
    },
    {
      title: 'SLA Compliance',
      dataIndex: 'SLA',
      key: 'SLA',
      render: (sla) => (
        <Tag color={sla >= 90 ? 'green' : sla >= 80 ? 'orange' : 'red'}>
          {sla}% Compliance
        </Tag>
      ),
      sorter: (a, b) => a.SLA - b.SLA,
    },
    {
      title: 'Avg. Resolution Time',
      dataIndex: 'avgDays',
      key: 'avgDays',
      render: (days) => `${days} days`,
      sorter: (a, b) => a.avgDays - b.avgDays,
    }
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: 24 }}>
      {/* Page Header */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>System Reports & Analytics</Title>
            <Text type="secondary">System-wide performance indicators, SLA tracking, and resolution trends.</Text>
          </div>
          <Space>
            <Select value={timeRange} onChange={setTimeRange} style={{ width: 150 }}>
              <Option value="7days">Last 7 Days</Option>
              <Option value="30days">Last 30 Days</Option>
              <Option value="90days">Last 90 Days</Option>
            </Select>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => {
                const headers = ['Department', 'Total Grievances', 'Resolved Grievances', 'SLA Compliance %', 'Avg Resolution Days'];
                const rows = deptPerformanceData.map(d => [
                  `"${d.name}"`, d.complaints, d.resolved, `${d.SLA}%`, d.avgDays
                ].join(','));
                const csv = [headers.join(','), ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `department_analytics_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              style={{ borderRadius: 8, fontWeight: 700 }}
            >
              Export Report
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Metrics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
            <Statistic 
              title="System SLA Compliance" 
              value={slaCompliance} 
              precision={1}
              valueStyle={{ color: '#52c41a' }} 
              prefix={<SafetyOutlined />}
              suffix="%" 
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>Target threshold: 90% minimum</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
            <Statistic 
              title="Avg. Resolution Time" 
              value={parseFloat(avgResolutionTime)} 
              precision={1}
              valueStyle={{ color: '#1890ff' }} 
              prefix={<HourglassOutlined />}
              suffix=" days" 
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>Based on closed grievances</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
            <Statistic 
              title="Active Backlog" 
              value={activeBacklogCount} 
              valueStyle={{ color: '#faad14' }} 
              prefix={<DashboardOutlined />} 
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>{priorityBacklogCount} Critical / High priority items</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', borderRadius: 12 }}>
            <Statistic 
              title="SLA Breached Grievances" 
              value={breachedCount} 
              valueStyle={{ color: '#ff4d4f' }} 
              prefix={<AlertOutlined />} 
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>SLA breaches require immediate escalation</div>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col lg={16} xs={24}>
          <Card title="Grievance Volumetrics & Resolution Trends" bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="submitted" stroke="#1890ff" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmitted)" name="Grievances Received" />
                  <Area type="monotone" dataKey="resolved" stroke="#52c41a" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Grievances Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col lg={8} xs={24}>
          <Card title="Overall Status Distribution" bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 16 }}>
              {statusData.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS[idx] }}></span>
                  <Text style={{ fontSize: 12 }}>{entry.name} ({entry.value})</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Department Breakdown Table */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Departmental Performance Metrics" bordered={false} style={{ borderRadius: 12 }}>
            <Table 
              columns={columns} 
              dataSource={deptPerformanceData} 
              pagination={false} 
              rowKey="name"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
