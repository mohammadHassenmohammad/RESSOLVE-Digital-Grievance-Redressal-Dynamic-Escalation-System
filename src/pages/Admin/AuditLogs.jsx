import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Input, Space, Button, Select } from 'antd';
import { SearchOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useComplaints } from '../../context/ComplaintContext';
import { useSystemData } from '../../context/SystemDataContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AuditLogs = () => {
  const { auditLogs } = useComplaints();
  const { users } = useSystemData();
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState('All');

  // Dynamically extract unique action types for the filter select
  const uniqueActions = ['All', ...new Set(auditLogs.map(log => log.action).filter(Boolean))];

  // Filter audit logs dynamically
  const filteredLogs = auditLogs.filter(log => {
    const userObj = users.find(u => u.id === log.userId);
    const userName = (userObj?.name || log.userId || 'System').toLowerCase();
    const actionName = (log.action || '').toLowerCase();
    const detailsText = (log.details || '').toLowerCase();
    const searchLower = searchText.toLowerCase();

    const matchesSearch = 
      userName.includes(searchLower) ||
      actionName.includes(searchLower) ||
      detailsText.includes(searchLower);

    const matchesAction = 
      actionFilter === 'All' || 
      log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action', 'User/Officer', 'Activity Details'];
    
    const rows = filteredLogs.map(log => {
      const userObj = users.find(u => u.id === log.userId);
      const userName = userObj?.name || log.userId || 'System';
      const timestampFormatted = dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss');
      
      const escape = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      
      return [
        escape(timestampFormatted),
        escape(log.action),
        escape(userName),
        escape(log.details)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `system_audit_logs_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (t) => <Text type="secondary">{dayjs(t).format('YYYY-MM-DD HH:mm:ss')}</Text>,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        let color = 'default';
        if (action.includes('Created')) color = 'green';
        if (action.includes('Updated')) color = 'blue';
        if (action.includes('Escalated')) color = 'volcano';
        return <Tag color={color}>{action.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'User/Officer',
      dataIndex: 'userId',
      key: 'userId',
      render: (uid, record) => record.userName || users.find(u => u.id === uid)?.name || uid || 'System',
    },
    {
      title: 'Activity Details',
      dataIndex: 'details',
      key: 'details',
    },
  ];

  return (
    <div className="fade-in">
      <Title level={2}>System Audit Logs</Title>
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input 
              prefix={<SearchOutlined />} 
              placeholder="Search logs..." 
              style={{ width: 300 }} 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              value={actionFilter}
              style={{ width: 200 }}
              onChange={setActionFilter}
            >
              {uniqueActions.map(act => (
                <Select.Option key={act} value={act}>{act}</Select.Option>
              ))}
            </Select>
          </Space>
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>Export CSV</Button>
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredLogs} 
          rowKey="id" 
          pagination={{ pageSize: 12 }}
        />
      </Card>
    </div>
  );
};

export default AuditLogs;
