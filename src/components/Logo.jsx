import React from 'react';

export const LogoIcon = ({ size = 36, color = '#2563eb', secondaryColor = '#0f172a' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    {/* Subtle backdrop shield */}
    <path
      d="M24 4L7 11V23.5C7 34.2 14.3 43.1 24 45.8C33.7 43.1 41 34.2 41 23.5V11L24 4Z"
      fill={color}
      fillOpacity="0.12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Stylized equilibrium scales / check-crest */}
    <path
      d="M24 13V33M16 20L24 13L32 20"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Dynamic horizontal balance line with circular focal nodes */}
    <path
      d="M14 26H34"
      stroke={secondaryColor}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="14" cy="26" r="2.5" fill={color} />
    <circle cx="34" cy="26" r="2.5" fill={color} />
    <circle cx="24" cy="35" r="2.5" fill={color} />
  </svg>
);

export const Logo = ({
  size = 'default',
  showText = true,
  theme = 'light',
  className = '',
  style = {},
}) => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';
  const iconSize = isLarge ? 44 : isSmall ? 28 : 34;

  const textColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const subColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const primaryColor = '#2563eb';
  const secondaryColor = theme === 'dark' ? '#cbd5e1' : '#334155';

  return (
    <div
      className={`logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 8 : 12,
        userSelect: 'none',
        ...style,
      }}
    >
      <LogoIcon size={iconSize} color={primaryColor} secondaryColor={secondaryColor} />
      {showText && (
        <div style={{ lineHeight: 1.15 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: isLarge ? 22 : isSmall ? 15 : 18,
              letterSpacing: '-0.4px',
              color: textColor,
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            }}
          >
            RES<span style={{ color: primaryColor }}>SOLVE</span>
          </div>
          <div
            style={{
              fontSize: isLarge ? 10 : isSmall ? 8 : 9,
              fontWeight: 700,
              letterSpacing: '1.2px',
              color: subColor,
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            Digital Redressal Authority
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
