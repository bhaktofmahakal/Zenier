import React from 'react'
import { TopNav } from '../components/layout/TopNav'
import { RecordingCanvas } from '../components/recording/RecordingCanvas'
import { ControlBar } from '../components/recording/ControlBar'

export const RecordingPage: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-background text-on-background overflow-hidden">
      <TopNav minimal />
      <RecordingCanvas />
      <ControlBar />
    </div>
  )
}
