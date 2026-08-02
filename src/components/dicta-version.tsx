import { appConfig } from '@/config'

export const DictaVersion = () => {
  return (
    <div className="px-2 py-2 text-xs text-muted-foreground">
      Wursper v{appConfig.version}
    </div>
  )
}
