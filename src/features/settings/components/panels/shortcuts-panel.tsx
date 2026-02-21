import { Switch } from '@/components/ui/switch'

import { useSettingsStore } from '../../store'
import { SettingsInfoTooltip } from '../settings-info-tooltip'
import { ShortcutRecorder } from '../shortcut-recorder'
import { SettingsPanel, SettingItem, SettingsSection } from './settings-panel'

export function ShortcutsPanel() {
  const {
    settings,
    setVoiceInputShortcut,
    setPushToTalkShortcut,
    setPasteShortcut,
    setGlobalShortcutsEnabled,
  } = useSettingsStore()

  return (
    <SettingsPanel
      title="Keyboard Shortcuts"
      description="Configure keyboard shortcuts for quick access"
    >
      <SettingsSection>
        <SettingItem
          title="Global shortcuts"
          description="Enable or disable all global keyboard shortcuts"
          action={
            <Switch
              checked={settings.shortcuts.globalShortcutsEnabled}
              onCheckedChange={setGlobalShortcutsEnabled}
            />
          }
          info={
            <SettingsInfoTooltip content="Global shortcuts work from any app, even when Dicta is in the background. Disable if they conflict with shortcuts in other applications." />
          }
        />

        <SettingItem
          title="Voice input activation (Toggle)"
          description={
            settings.shortcuts.globalShortcutsEnabled
              ? 'Click once to start recording, click again to stop'
              : 'Global shortcuts are disabled'
          }
          action={
            <ShortcutRecorder
              value={settings.voiceInput.shortcut}
              onChange={setVoiceInputShortcut}
              placeholder="Not set"
              disabled={!settings.shortcuts.globalShortcutsEnabled}
            />
          }
        />

        {settings.voiceInput.enablePushToTalk && (
          <SettingItem
            title="Push-to-Talk shortcut"
            description={
              settings.shortcuts.globalShortcutsEnabled
                ? 'Hold to record, release to stop'
                : 'Global shortcuts are disabled'
            }
            action={
              <ShortcutRecorder
                value={settings.voiceInput.pushToTalkShortcut}
                onChange={setPushToTalkShortcut}
                placeholder="Not set"
                disabled={!settings.shortcuts.globalShortcutsEnabled}
              />
            }
          />
        )}

        <SettingItem
          title="Paste last transcript"
          description={
            settings.shortcuts.globalShortcutsEnabled
              ? 'Quickly paste your most recent transcription'
              : 'Global shortcuts are disabled'
          }
          action={
            <ShortcutRecorder
              value={settings.shortcuts.pasteLastTranscript}
              onChange={setPasteShortcut}
              placeholder="Not set"
              disabled={!settings.shortcuts.globalShortcutsEnabled}
            />
          }
        />
      </SettingsSection>
    </SettingsPanel>
  )
}
