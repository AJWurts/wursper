import type { TranscriptionModel, ModelProvider } from '../types'

export interface ModelGroup {
  id: string
  name: string
  description: string
  icon: 'whisper' | 'candle' | 'whisperkit' | 'apple' | 'cloud' | 'ollama'
  providers: ModelProvider[]
  models: TranscriptionModel[]
  isExpanded?: boolean
}

// Define model families/groups
const MODEL_GROUP_DEFINITIONS: Omit<ModelGroup, 'models'>[] = [
  {
    id: 'whisper-local',
    name: 'Whisper (Local)',
    description: 'OpenAI Whisper running locally via whisper.cpp',
    icon: 'whisper',
    providers: ['local-whisper'],
  },
  {
    id: 'candle',
    name: 'Candle (Metal GPU)',
    description: 'Pure Rust ML with Metal acceleration',
    icon: 'candle',
    providers: ['candle'],
  },
  {
    id: 'whisperkit',
    name: 'WhisperKit (CoreML)',
    description: 'Optimized for Apple Neural Engine',
    icon: 'whisperkit',
    providers: ['whisperkit'],
  },
  {
    id: 'apple-speech',
    name: 'Apple Speech',
    description: 'Built-in macOS speech recognition',
    icon: 'apple',
    providers: ['apple-speech'],
  },
  {
    id: 'cloud-apis',
    name: 'Cloud APIs',
    description: 'Cloud-based transcription services',
    icon: 'cloud',
    providers: ['openai', 'google', 'assemblyai', 'anthropic', 'elevenlabs'],
  },
  {
    id: 'local-llm',
    name: 'Local LLM',
    description: 'Local language models for post-processing',
    icon: 'ollama',
    providers: ['ollama', 'lmstudio'],
  },
]

/**
 * Groups models by their family/category
 */
export function groupModels(models: TranscriptionModel[]): ModelGroup[] {
  const groups: ModelGroup[] = []

  for (const groupDef of MODEL_GROUP_DEFINITIONS) {
    const groupModels = models.filter(m =>
      groupDef.providers.includes(m.provider)
    )

    if (groupModels.length > 0) {
      groups.push({
        ...groupDef,
        models: groupModels,
        isExpanded: false,
      })
    }
  }

  return groups
}

/**
 * Gets a flat list of models with group headers for display
 */
export interface GroupedModelRow {
  type: 'group' | 'model'
  group?: ModelGroup
  model?: TranscriptionModel
  groupId: string
  isFirst?: boolean
  isLast?: boolean
}

export function getGroupedModelRows(
  models: TranscriptionModel[],
  expandedGroups: Set<string>
): GroupedModelRow[] {
  const groups = groupModels(models)
  const rows: GroupedModelRow[] = []

  for (const group of groups) {
    // Add group header row
    rows.push({
      type: 'group',
      group: { ...group, isExpanded: expandedGroups.has(group.id) },
      groupId: group.id,
    })

    // Add model rows if group is expanded
    if (expandedGroups.has(group.id)) {
      group.models.forEach((model, index) => {
        rows.push({
          type: 'model',
          model,
          groupId: group.id,
          isFirst: index === 0,
          isLast: index === group.models.length - 1,
        })
      })
    }
  }

  return rows
}
