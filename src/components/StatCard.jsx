import React from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const StatCard = ({ title, value, icon, color, gradient, subtitle, trend, trendValue, delay = 0 }) => {
  const trendIcon =
    trend === 'up' ? <ArrowUpOutlined /> :
    trend === 'down' ? <ArrowDownOutlined /> :
    <MinusOutlined />;

  const trendColor =
    trend === 'up' ? '#52c41a' :
    trend === 'down' ? '#ff4d4f' :
    '#999';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{ height: '100%' }}
    >
      <div style={{
        background: gradient || `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        borderRadius: 16,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        minHeight: 120,
        boxShadow: `0 8px 24px ${color}40`,
        cursor: 'default',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
        }} />
        <div style={{
          position: 'absolute', right: 20, bottom: -30,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)', marginBottom: 6,
              }}>
                {title}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              {subtitle && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                  {subtitle}
                </div>
              )}
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              {React.cloneElement(icon, { style: { fontSize: 22, color: '#fff' } })}
            </div>
          </div>

          {trendValue !== undefined && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 20,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}>
                {trendIcon} {trendValue}%
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginLeft: 2 }}>vs last 7d</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
