import React from 'react';

const Logo = ({ className,iconOnly=false }) => (
  <svg 
    viewBox={iconOnly ? "0 0 130 120" : "0 0 400 120"}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    width="160"
    height="48"
    className={className}
  >
    {/* Stylized Book Icon */}
    <path d="M40 40C40 34.4772 44.4772 30 50 30H80V90H50C44.4772 90 40 85.5228 40 80V40Z" fill="#0e4e1e"/>
    <path d="M120 40C120 34.4772 115.523 30 110 30H80V90H110C115.523 90 120 85.5228 120 80V40Z" fill="#2d7e3b" fillOpacity="0.85"/>
    <path d="M80 30V90" stroke="#fbf9f5" strokeWidth="2"/>
    
    {!iconOnly && (
    <text 
      x="140" 
      y="75" 
      fontFamily="Playfair Display, serif" 
      fontSize="42" 
      fontWeight="700" 
      fill="#2d7e3b" 
      letterSpacing="-1"
    >
      BookFolio
    </text>
    )}
  </svg>
);
export default Logo