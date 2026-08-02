import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useTranscriptionsStore } from '@/features/transcriptions'

import { SettingsPanel, SettingItem, SettingsSection } from './settings-panel'
import { useSettingsStore } from '../../store'

export function PrivacyPanel() {
  const { resetSettings } = useSettingsStore()
  const { clearAll } = useTranscriptionsStore()

  const handleClearHistory = async () => {
    if (
      confirm(
        'Delete every transcription from the local database? This action cannot be undone.'
      )
    ) {
      try {
        await clearAll()
        toast.success('Transcription history cleared')
      } catch (error) {
        toast.error('Failed to clear transcription history')
        console.error('Failed to clear transcription history:', error)
      }
    }
  }

  const handleReset = async () => {
    if (
      confirm(
        'Are you sure you want to reset all settings to defaults? This action cannot be undone.'
      )
    ) {
      try {
        await resetSettings()
        toast.success('Settings reset successfully')
      } catch (error) {
        toast.error('Failed to reset settings')
        console.error('Failed to reset settings:', error)
      }
    }
  }

  return (
    <SettingsPanel
      title="Privacy & Data"
      description="Everything stays on this Mac — transcriptions live in a local SQLite database"
    >
      <SettingsSection title="Danger Zone">
        <SettingItem
          title="Clear transcription history"
          description="Permanently delete every transcription stored on this Mac"
          action={
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleClearHistory}
            >
              Clear
            </Button>
          }
        />

        <SettingItem
          title="Reset settings"
          description="Reset all settings to their default values"
          action={
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleReset}
            >
              Reset
            </Button>
          }
        />
      </SettingsSection>
    </SettingsPanel>
  )
}
