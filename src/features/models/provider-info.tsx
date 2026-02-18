import { cn } from '@/lib/cn'

import type { ModelProvider } from './types'

export interface ProviderInfo {
  name: string
  icon: React.ReactNode
  color: string
}

interface LocalIconProps {
  src: string
  alt: string
  className?: string
  invert?: boolean
}

const LocalIcon = ({ src, alt, className, invert = true }: LocalIconProps) => (
  <img
    alt={alt}
    className={cn('size-5 flex-shrink-0', invert && 'dark:invert', className)}
    height={20}
    src={src}
    width={20}
  />
)

export const getProviderInfo = (
  provider: ModelProvider,
  modelId?: string
): ProviderInfo => {
  switch (provider) {
    case 'openai':
      return {
        name: 'OpenAI',
        icon: (
          <img
            alt="OpenAI"
            className="size-5 flex-shrink-0 dark:invert"
            height={20}
            src="https://models.dev/logos/openai.svg"
            width={20}
          />
        ),
        color: 'text-green-600',
      }
    case 'anthropic':
      return {
        name: 'Anthropic',
        icon: <LocalIcon src="/icons/anthropic.svg" alt="Anthropic" />,
        color: 'text-orange-600',
      }
    case 'google':
      return {
        name: 'Google',
        icon: (
          <img
            alt="Google"
            className="size-5 flex-shrink-0 dark:invert"
            height={20}
            src="https://models.dev/logos/google.svg"
            width={20}
          />
        ),
        color: 'text-blue-600',
      }
    case 'assemblyai':
      return {
        name: 'AssemblyAI',
        icon: (
          <img
            alt="AssemblyAI"
            className="size-5 flex-shrink-0 dark:invert"
            height={20}
            src="https://models.dev/logos/assemblyai.svg"
            width={20}
          />
        ),
        color: 'text-indigo-600',
      }
    case 'elevenlabs':
      return {
        name: 'ElevenLabs',
        icon: <LocalIcon src="/icons/elevenlabs.svg" alt="ElevenLabs" />,
        color: 'text-orange-600',
      }
    case 'ollama':
      return {
        name: 'Ollama',
        icon: (
          <img
            alt="Ollama"
            className="size-5 flex-shrink-0 dark:invert"
            height={20}
            src="https://models.dev/logos/ollama.svg"
            width={20}
          />
        ),
        color: 'text-gray-600',
      }
    case 'lmstudio':
      return {
        name: 'LM Studio',
        icon: (
          <img
            alt="LM Studio"
            className="size-5 flex-shrink-0"
            height={20}
            src="https://models.dev/logos/lmstudio.svg"
            width={20}
          />
        ),
        color: 'text-gray-700',
      }
    case 'local-whisper':
      return {
        name: 'Whisper Local',
        icon: (
          <img
            alt="Whisper"
            className="size-5 flex-shrink-0 dark:invert"
            height={20}
            src="https://models.dev/logos/openai.svg"
            width={20}
          />
        ),
        color: 'text-purple-600',
      }
    case 'local-llm': {
      // Show specific icons based on model name
      // Note: Brand icons with their own colors should have invert={false}
      if (modelId?.includes('qwen')) {
        return {
          name: 'local-llm',
          icon: <LocalIcon src="/icons/qwen.svg" alt="Qwen" invert={false} />,
          color: 'text-blue-600',
        }
      }
      if (modelId?.includes('llama')) {
        return {
          name: 'local-llm',
          icon: (
            <LocalIcon src="/icons/meta.svg" alt="Meta Llama" invert={false} />
          ),
          color: 'text-blue-600',
        }
      }
      if (modelId?.includes('mistral')) {
        return {
          name: 'local-llm',
          icon: (
            <LocalIcon src="/icons/mistral.svg" alt="Mistral" invert={false} />
          ),
          color: 'text-orange-600',
        }
      }
      if (modelId?.includes('phi')) {
        return {
          name: 'local-llm',
          icon: (
            <LocalIcon
              src="/icons/microsoft.svg"
              alt="Microsoft Phi"
              invert={false}
            />
          ),
          color: 'text-blue-600',
        }
      }
      return {
        name: 'local-llm',
        icon: (
          <img
            alt="Local LLM"
            className="size-5 flex-shrink-0"
            height={20}
            src="/icons/huggingface.svg"
            width={20}
          />
        ),
        color: 'text-yellow-600',
      }
    }
    case 'candle':
      return {
        name: 'Candle (Metal)',
        icon: (
          <img
            alt="HuggingFace Candle"
            className="size-5 flex-shrink-0"
            height={20}
            src="/icons/huggingface.svg"
            width={20}
          />
        ),
        color: 'text-yellow-500',
      }
    case 'whisperkit':
      return {
        name: 'WhisperKit',
        icon: (
          <img
            alt="WhisperKit"
            className="size-5 flex-shrink-0"
            height={20}
            src="/icons/whisperkit-dark.png"
            width={20}
          />
        ),
        color: 'text-blue-500',
      }
    case 'apple-speech':
      return {
        name: 'Apple Speech',
        icon: <LocalIcon src="/icons/apple.svg" alt="Apple" />,
        color: 'text-gray-600',
      }
    default:
      return {
        name: provider,
        icon: (
          <img
            alt={provider}
            className="size-5 flex-shrink-0"
            height={20}
            src={`https://models.dev/logos/${provider}.svg`}
            width={20}
          />
        ),
        color: 'text-gray-600',
      }
  }
}
