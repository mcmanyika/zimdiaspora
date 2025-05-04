'use client';

import React from 'react';

function SmallLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-5xl mx-auto">
        {children}
      </div>
    </div>
  )
}

export default SmallLayout;