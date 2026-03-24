import { ipcMain, desktopCapturer } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import type { Result, CaptureSource } from '../../shared/types'

// Register IPC handlers for screen and window enumeration
export function registerCaptureHandlers(): void {
  ipcMain.handle(
    IPC.CAPTURE_LIST_SOURCES,
    async (): Promise<Result<CaptureSource[]>> => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 640, height: 360 },
          fetchWindowIcons: true
        })

        const mapped: CaptureSource[] = sources.map((s) => ({
          id: s.id,
          name: s.name,
          thumbnailDataUrl: s.thumbnail.toDataURL(),
          displayId: s.display_id,
          appIconDataUrl: s.appIcon?.toDataURL()
        }))

        return { success: true, data: mapped }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    }
  )
}
