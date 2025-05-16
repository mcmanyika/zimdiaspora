'use client';

import React from 'react';

function SmallLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="">
        {children}
      </div>
    </div>
  )
}

export default SmallLayout;