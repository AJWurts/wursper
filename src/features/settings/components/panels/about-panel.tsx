import { open } from '@tauri-apps/plugin-shell'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { appConfig } from '@/config'

import { SettingsPanel, SettingItem, SettingsSection } from './settings-panel'

export function AboutPanel() {
  const handleOpenUpstream = async () => {
    try {
      await open('https://github.com/nitintf/dicta')
    } catch (error) {
      toast.error(`Failed to open link: ${error}`)
    }
  }

  return (
    <SettingsPanel title="About" description="Information about Wursper">
      <SettingsSection title="Application">
        <SettingItem
          title="Version"
          description={`Wursper ${appConfig.version}`}
        />

      </SettingsSection>

      <SettingsSection title="Resources">
        <SettingItem
          title="Upstream project"
          description="Wursper is a fork of dicta by nitintf (MIT)"
          action={
            <Button variant="outline" onClick={handleOpenUpstream}>
              View
            </Button>
          }
        />
      </SettingsSection>

    </SettingsPanel>
  )
}
