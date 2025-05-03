'use client'

import { createContext, useContext, useState } from 'react'

const SidebarContext = createContext({})

export function SidebarProvider({ children }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebarContext = () => useContext(SidebarContext) 