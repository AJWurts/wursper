import type { ModelCapabilities, ModelProvider } from './types'

export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  // OpenAI Whisper
  'whisper-1': {
    accuracy: 'high',
    speed: 'fast',
    languages: 99,
    features: ['Multilingual', 'Timestamps', 'Word-level confidence'],
    bestFor: [
      'General purpose transcription',
      'Multiple languages',
      'High accuracy needed',
    ],
  },

  // Google Cloud Speech
  'google-cloud-speech': {
    accuracy: 'high',
    speed: 'fast',
    languages: 125,
    features: [
      'Speaker diarization',
      'Automatic punctuation',
      'Word-level timestamps',
    ],
    bestFor: [
      'Enterprise applications',
      'Multi-speaker conversations',
      'Professional meetings',
    ],
  },

  // AssemblyAI
  'assemblyai-best': {
    accuracy: 'high',
    speed: 'medium',
    languages: 30,
    features: [
      'Speaker detection',
      'Sentiment analysis',
      'Auto highlights',
      'Content moderation',
    ],
    bestFor: [
      'Podcast transcription',
      'Interview analysis',
      'Content creation',
    ],
  },

  // ElevenLabs Scribe
  scribe_v1: {
    accuracy: 'high',
    speed: 'fast',
    languages: 30,
    features: [
      'Multilingual support',
      'High accuracy',
      'Fast processing',
      'Speaker identification',
    ],
    bestFor: ['Voice notes', 'Quick transcriptions', 'Multiple languages'],
  },

  // Apple Speech Recognition
  'apple-speech': {
    accuracy: 'medium',
    speed: 'fast',
    languages: 50,
    features: [
      'On-device processing',
      'Privacy focused',
      'No internet required',
    ],
    bestFor: ['Privacy-sensitive content', 'Offline usage', 'Quick notes'],
  },

  // Local Whisper Models - Standard
  'whisper-tiny': {
    accuracy: 'low',
    speed: 'fast',
    languages: 99,
    features: ['Offline', 'Privacy focused', '32x real-time speed'],
    bestFor: ['Quick drafts', 'Real-time captioning', 'Low-resource devices'],
  },

  'whisper-base': {
    accuracy: 'medium',
    speed: 'fast',
    languages: 99,
    features: ['Offline', 'Privacy focused', '16x real-time speed'],
    bestFor: [
      'General offline use',
      'Privacy-sensitive content',
      'Balanced accuracy/speed',
    ],
  },

  'whisper-small': {
    accuracy: 'high',
    speed: 'medium',
    languages: 99,
    features: ['Offline', 'Privacy focused', '6x real-time speed'],
    bestFor: [
      'Professional transcription',
      'Important documents',
      'Offline workflows',
    ],
  },

  'whisper-medium': {
    accuracy: 'high',
    speed: 'medium',
    languages: 99,
    features: ['Offline', 'Privacy focused', '2x real-time speed'],
    bestFor: [
      'Critical transcriptions',
      'Legal/medical documents',
      'High accuracy needed',
    ],
  },

  // Local Whisper Models - Turbo (Recommended)
  'whisper-large-v3-turbo': {
    accuracy: 'high',
    speed: 'fast',
    languages: 99,
    features: [
      'Offline',
      'Privacy focused',
      '8x faster than large-v3',
      'Best quality/speed ratio',
    ],
    bestFor: [
      'Production use',
      'Best overall quality',
      'All languages',
      'Professional transcription',
    ],
  },

  // Local Whisper Models - Distilled (6x faster)
  'whisper-distil-large-v3': {
    accuracy: 'high',
    speed: 'fast',
    languages: 99,
    features: [
      'Offline',
      'Privacy focused',
      '6x faster',
      'Less than 1% quality loss',
    ],
    bestFor: [
      'Fast production use',
      'Multilingual content',
      'High throughput needed',
    ],
  },

  'whisper-distil-medium.en': {
    accuracy: 'high',
    speed: 'fast',
    languages: 1,
    features: ['Offline', 'Privacy focused', '6x faster', 'English optimized'],
    bestFor: [
      'English-only content',
      'Fast English transcription',
      'High quality English',
    ],
  },

  'whisper-distil-small.en': {
    accuracy: 'medium',
    speed: 'fast',
    languages: 1,
    features: ['Offline', 'Privacy focused', '6x faster', 'English optimized'],
    bestFor: [
      'Quick English drafts',
      'Fast English notes',
      'Balanced size and quality',
    ],
  },

  // Candle Engine Models (Pure Rust + Metal GPU)
  'candle-large-v3-turbo': {
    accuracy: 'high',
    speed: 'fast',
    languages: 99,
    features: [
      'Metal GPU acceleration',
      'Pure Rust implementation',
      'Offline',
      'Privacy focused',
    ],
    bestFor: [
      'GPU-accelerated transcription',
      'Production use',
      'Best performance on Apple Silicon',
    ],
  },

  'candle-large-v3': {
    accuracy: 'high',
    speed: 'medium',
    languages: 99,
    features: [
      'Metal GPU acceleration',
      'Pure Rust',
      'Offline',
      'Highest accuracy',
    ],
    bestFor: [
      'Critical transcriptions',
      'Maximum accuracy needed',
      'GPU acceleration',
    ],
  },

  'candle-distil-large-v3': {
    accuracy: 'high',
    speed: 'fast',
    languages: 99,
    features: ['Metal GPU acceleration', 'Pure Rust', 'Offline', '6x faster'],
    bestFor: [
      'Fast GPU transcription',
      'Multilingual content',
      'High throughput',
    ],
  },

  'candle-medium': {
    accuracy: 'high',
    speed: 'medium',
    languages: 99,
    features: ['Metal GPU acceleration', 'Pure Rust', 'Offline', 'Balanced'],
    bestFor: ['General transcription', 'Multi-language', 'GPU acceleration'],
  },

  'candle-small': {
    accuracy: 'medium',
    speed: 'fast',
    languages: 99,
    features: ['Metal GPU acceleration', 'Pure Rust', 'Offline', 'Compact'],
    bestFor: ['Quick transcriptions', 'Lower VRAM usage', 'GPU acceleration'],
  },

  'candle-base': {
    accuracy: 'medium',
    speed: 'fast',
    languages: 99,
    features: ['Metal GPU acceleration', 'Pure Rust', 'Offline', 'Fast'],
    bestFor: ['Real-time use', 'Minimal VRAM', 'Quick drafts'],
  },

  'candle-tiny': {
    accuracy: 'low',
    speed: 'fast',
    languages: 99,
    features: ['Metal GPU acceleration', 'Pure Rust', 'Offline', 'Fastest'],
    bestFor: ['Real-time captioning', 'Minimal resources', 'Quick notes'],
  },

  // WhisperKit Models (CoreML + Neural Engine)
  'whisperkit-large-v3-turbo': {
    accuracy: 'high',
    speed: 'fast',
    languages: 99,
    features: [
      'Apple Neural Engine',
      'CoreML optimized',
      'Offline',
      'Fastest on Apple Silicon',
    ],
    bestFor: [
      'Best Apple Silicon performance',
      'Production use',
      'Power efficient',
    ],
  },

  'whisperkit-large-v3': {
    accuracy: 'high',
    speed: 'medium',
    languages: 99,
    features: [
      'Apple Neural Engine',
      'CoreML optimized',
      'Offline',
      'Highest accuracy',
    ],
    bestFor: [
      'Maximum accuracy',
      'Critical transcriptions',
      'Apple Silicon optimized',
    ],
  },

  'whisperkit-distil-large-v3': {
    accuracy: 'high',
    speed: 'fast',
    languages: 99,
    features: [
      'Apple Neural Engine',
      'CoreML optimized',
      'Offline',
      '6x faster',
    ],
    bestFor: ['Fast transcription', 'High throughput', 'Power efficient'],
  },

  'whisperkit-small': {
    accuracy: 'medium',
    speed: 'fast',
    languages: 99,
    features: ['Apple Neural Engine', 'CoreML optimized', 'Offline', 'Compact'],
    bestFor: ['Quick transcriptions', 'Smaller model size', 'Efficient'],
  },

  'whisperkit-base': {
    accuracy: 'medium',
    speed: 'fast',
    languages: 99,
    features: ['Apple Neural Engine', 'CoreML optimized', 'Offline', 'Fast'],
    bestFor: ['Real-time use', 'Quick drafts', 'Minimal footprint'],
  },

  'whisperkit-tiny': {
    accuracy: 'low',
    speed: 'fast',
    languages: 99,
    features: ['Apple Neural Engine', 'CoreML optimized', 'Offline', 'Fastest'],
    bestFor: ['Real-time captioning', 'Instant transcription', 'Minimal size'],
  },
}

export function getModelCapabilities(
  modelId: string
): ModelCapabilities | undefined {
  return MODEL_CAPABILITIES[modelId]
}

export function getProviderCapabilitySummary(provider: ModelProvider): string {
  switch (provider) {
    case 'openai':
      return 'Fast, accurate, supports 99 languages'
    case 'google':
      return 'Enterprise-grade with speaker detection'
    case 'assemblyai':
      return 'Advanced features including sentiment analysis'
    case 'elevenlabs':
      return 'High-quality multilingual transcription'
    case 'local-whisper':
      return 'Fully offline, privacy-first, no API costs'
    case 'candle':
      return 'Pure Rust with Metal GPU acceleration'
    case 'whisperkit':
      return 'CoreML with Apple Neural Engine (fastest)'
    case 'apple-speech':
      return 'Built-in macOS recognition, no download required'
    default:
      return 'Speech-to-text transcription'
  }
}
