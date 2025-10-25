import React, { useState } from 'react';

interface TooltipProps {
  text: React.ReactNode;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center group" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full mb-2 w-max max-w-xs p-3 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-700">
          {text}
        </div>
      )}
    </div>
  );
};