
import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  width = 200, 
  height = 200 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200" 
      width={width} 
      height={height} 
      className={className}
    >
      {/* Casa */}
      <rect x="50" y="80" width="100" height="80" fill="#555" stroke="#333" strokeWidth="4"/>
      <polygon points="50,80 100,40 150,80" fill="#777" stroke="#333" strokeWidth="4"/>
      <rect x="85" y="110" width="30" height="50" fill="#333"/>
      
      {/* Llamas */}
      <path 
        d="M110 50 Q115 30 130 40 Q135 20 150 35 Q160 20 170 50 Q150 55 140 70 Q130 60 110 50" 
        fill="orange" 
        stroke="red" 
        strokeWidth="3"
      />
    </svg>
  );
};

export default Logo;
