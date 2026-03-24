import React from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'

interface AppShellProps {
  children: React.ReactNode
  showSidebar?: boolean
  minimalNav?: boolean
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showSidebar = true,
  minimalNav = false
}) => {
  return (
    <div className="flex h-screen w-full bg-surface">
      {showSidebar && <Sidebar />}
      <main className={`flex-1 flex flex-col overflow-hidden ${showSidebar ? 'ml-64' : ''}`}>
        <TopNav minimal={minimalNav} />
        <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
      </main>
    </div>
  )
}
