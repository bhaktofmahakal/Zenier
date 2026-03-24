import React, { useEffect, useCallback } from 'react'
import { useRecorderStore } from '../../stores/recorder-store'
import type { CaptureSource } from '@shared/types'

export const SourceGrid: React.FC = () => {
  const sources = useRecorderStore((s) => s.sources)
  const selectedSource = useRecorderStore((s) => s.selectedSource)
  const sourceFilter = useRecorderStore((s) => s.sourceFilter)
  const setSources = useRecorderStore((s) => s.setSources)
  const setSelectedSource = useRecorderStore((s) => s.setSelectedSource)
  const setSourceFilter = useRecorderStore((s) => s.setSourceFilter)

  const loadSources = useCallback(async () => {
    if (!window.api) return
    try {
      const result = await window.api.listSources()
      if (result.success) {
        setSources(result.data)
        if (!selectedSource && result.data.length > 0) {
          const firstScreen = result.data.find((s) => s.id.startsWith('screen:'))
          if (firstScreen) setSelectedSource(firstScreen)
        }
      } else {
        console.error('Failed to list sources:', result.error)
      }
    } catch (err) {
      console.error('IPC Error listing sources:', err)
    }
  }, [setSources, selectedSource, setSelectedSource])

  useEffect(() => {
    loadSources()
    const interval = setInterval(loadSources, 5000)
    return () => clearInterval(interval)
  }, [loadSources])

  const filteredSources = sources.filter((s) => {
    if (sourceFilter === 'screen') return s.id.startsWith('screen:')
    return s.id.startsWith('window:')
  })

  const isSelected = (source: CaptureSource) =>
    selectedSource?.id === source.id

  return (
    <div className="col-span-12 lg:col-span-7 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">desktop_windows</span>
          Available Screens
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSourceFilter('screen')}
            className={`p-1.5 rounded text-xs font-label uppercase tracking-wider transition-all ${
              sourceFilter === 'screen'
                ? 'bg-surface-container-high text-white'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Screens
          </button>
          <button
            onClick={() => setSourceFilter('window')}
            className={`p-1.5 rounded text-xs font-label uppercase tracking-wider transition-all ${
              sourceFilter === 'window'
                ? 'bg-surface-container-high text-white'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Windows
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredSources.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-3 text-outline">
              desktop_access_disabled
            </span>
            <p className="text-sm font-medium">No sources found</p>
            <p className="text-xs mt-1">
              {sourceFilter === 'window'
                ? 'No windows detected'
                : 'No screens detected'}
            </p>
          </div>
        )}

        {filteredSources.map((source) => (
          <div
            key={source.id}
            onClick={() => setSelectedSource(source)}
            className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              isSelected(source)
                ? 'active-glow bg-surface-container-high'
                : 'bg-surface-container hover:bg-surface-container-high'
            }`}
          >
            <div
              className={`aspect-video relative overflow-hidden ${
                isSelected(source) ? '' : 'grayscale group-hover:grayscale-0'
              } transition-all duration-500`}
            >
              <img
                src={source.thumbnailDataUrl}
                alt={source.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div
                className={`absolute inset-0 ${
                  isSelected(source)
                    ? 'bg-black/20 group-hover:bg-black/0'
                    : 'bg-black/40'
                } transition-colors`}
              />
              {isSelected(source) && (
                <div className="absolute top-3 right-3 bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                  Active
                </div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isSelected(source)
                      ? 'text-white'
                      : 'text-on-surface-variant group-hover:text-white'
                  } transition-colors truncate max-w-[180px]`}
                >
                  {source.name}
                </p>
                <p className="text-[10px] font-label text-on-surface-variant">
                  {source.id.startsWith('screen:') ? 'Display' : 'Application Window'}
                  {source.displayId ? ` • ID: ${source.displayId}` : ''}
                </p>
              </div>
              {isSelected(source) ? (
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              ) : (
                <span className="material-symbols-outlined text-outline group-hover:text-white transition-colors">
                  {source.id.startsWith('screen:') ? 'monitor' : 'tab'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
