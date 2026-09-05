'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface MobileSidebarContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null)

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <MobileSidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext)
  if (!context) {
    throw new Error('useMobileSidebar must be used within a MobileSidebarProvider')
  }
  return context
}
