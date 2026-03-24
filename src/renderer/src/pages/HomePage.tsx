import React from 'react'
import { AppShell } from '../components/layout/AppShell'
import { SourceGrid } from '../components/home/SourceGrid'
import { PreviewPanel } from '../components/home/PreviewPanel'
import { SessionHistory } from '../components/home/SessionHistory'

export const HomePage: React.FC = () => {
  return (
    <AppShell>
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Home - Ready to Record
            </h2>
            <p className="text-on-surface-variant font-medium">
              Select a capture source to begin your session
            </p>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <SourceGrid />
            <PreviewPanel />
          </div>

          <SessionHistory />
        </div>
      </div>
    </AppShell>
  )
}
