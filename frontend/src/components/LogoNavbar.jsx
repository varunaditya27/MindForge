import React from 'react';

const LogoNavbar = ({ size = 'medium', className = '', showSeparator = true, opacity = 'full' }) => {
  // Size configurations based on logo dimensions
  const sizeConfig = {
    small: {
      rvce: 'h-4 max-w-[60px]',
      cc: 'h-4 max-w-[24px]',
      separator: 'h-3'
    },
    medium: {
      rvce: 'h-6 sm:h-8 max-w-[80px] sm:max-w-[120px]',
      cc: 'h-6 sm:h-8 max-w-[36px] sm:max-w-[48px]',
      separator: 'h-4 sm:h-6'
    },
    large: {
      rvce: 'h-10 sm:h-12 max-w-[140px] sm:max-w-[180px]',
      cc: 'h-8 sm:h-10 max-w-[48px] sm:max-w-[60px]',
      separator: 'h-8 sm:h-10'
    }
  };

  const opacityClass = opacity === 'muted' ? 'opacity-70' : 'opacity-100';
  const config = sizeConfig[size];

  return (
  <div className={`flex items-center space-x-2 sm:space-x-3 ${className}`}>
      <img 
        src="/RVCE_Logo.png" 
        alt="RVCE" 
        className={`${config.rvce} w-auto object-contain ${opacityClass}`}
      />
      {showSeparator && (
    <div className={`hidden sm:block w-px ${config.separator} bg-gradient-to-b from-[#ff9a3c] via-[#ff6b00] to-[#3a2516] opacity-70 rounded-full shadow-[0_0_4px_rgba(255,107,0,0.5)] ${opacityClass}`}></div>
      )}
      <img 
        src="/CCLogo_BG_Removed.png" 
        alt="Coding Club" 
        className={`${config.cc} w-auto object-contain ${opacityClass}`}
      />
    </div>
  );
};

export default LogoNavbar;
