/**
 * Model pricing and resource requirements
 * Sources:
 * - OpenAI: https://platform.openai.com/docs/pricing
 * - Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
 * - Google: https://cloud.google.com/speech-to-text/pricing
 * - ElevenLabs: https://elevenlabs.io/pricing/api
 * - Whisper RAM: https://github.com/openai/whisper/discussions/5
 * - LLM RAM: https://localllm.in/blog/ollama-vram-requirements-for-local-llms
 */

export interface ModelPricing {
  /** Cost per minute for STT models (in USD) */
  costPerMinute?: number
  /** Cost per 1M input tokens for LLM models (in USD) */
  inputCostPer1M?: number
  /** Cost per 1M output tokens for LLM models (in USD) */
  outputCostPer1M?: number
  /** Whether the model is free to use */
  isFree?: boolean
}

export interface ModelResources {
  /** RAM required in GB */
  ramGB: number
  /** VRAM required in GB (for GPU acceleration) */
  vramGB?: number
}

// STT Cloud Model Pricing (per minute)
export const STT_PRICING: Record<string, ModelPricing> = {
  'whisper-1': { costPerMinute: 0.006 }, // $0.006/min
  'google-cloud-speech': { costPerMinute: 0.024 }, // $0.024/min standard
  scribe_v1: { costPerMinute: 0.007 }, // ~$0.40/hour
}

// Post-Processing Cloud Model Pricing (per 1M tokens)
export const PP_PRICING: Record<string, ModelPricing> = {
  'claude-3-5-sonnet-20241022': { inputCostPer1M: 3, outputCostPer1M: 15 },
  'claude-3-5-haiku-20241022': { inputCostPer1M: 0.8, outputCostPer1M: 4 },
  'gpt-4o': { inputCostPer1M: 2.5, outputCostPer1M: 10 },
  'gpt-4o-mini': { inputCostPer1M: 0.15, outputCostPer1M: 0.6 },
}

// Local Whisper Model RAM Requirements
export const WHISPER_RESOURCES: Record<string, ModelResources> = {
  'whisper-tiny': { ramGB: 1, vramGB: 1 },
  'whisper-base': { ramGB: 1.5, vramGB: 1 },
  'whisper-small': { ramGB: 2, vramGB: 2 },
  'whisper-medium': { ramGB: 5, vramGB: 5 },
  'whisper-large-v3-turbo': { ramGB: 6, vramGB: 6 },
  'whisper-distil-large-v3': { ramGB: 6, vramGB: 6 },
  'whisper-distil-medium.en': { ramGB: 3, vramGB: 3 },
  'whisper-distil-small.en': { ramGB: 2, vramGB: 2 },
}

// Local LLM Model RAM Requirements (Q4_K_M quantization)
export const LLM_RESOURCES: Record<string, ModelResources> = {
  'llm-qwen2.5-7b-instruct': { ramGB: 6, vramGB: 6 },
  'llm-llama-3.1-8b-instruct': { ramGB: 6, vramGB: 6 },
  'llm-mistral-7b-instruct': { ramGB: 6, vramGB: 6 },
  'llm-phi-3.5-mini-instruct': { ramGB: 3, vramGB: 3 },
  'llm-llama-3.2-3b-instruct': { ramGB: 3, vramGB: 3 },
  'llm-qwen2.5-3b-instruct': { ramGB: 3, vramGB: 3 },
}

export function getModelPricing(modelId: string): ModelPricing | undefined {
  return STT_PRICING[modelId] || PP_PRICING[modelId]
}

export function getModelResources(modelId: string): ModelResources | undefined {
  return WHISPER_RESOURCES[modelId] || LLM_RESOURCES[modelId]
}

export function formatCost(pricing: ModelPricing | undefined): string {
  if (!pricing) return '-'
  if (pricing.isFree) return 'Free'
  if (pricing.costPerMinute !== undefined) {
    return `$${pricing.costPerMinute.toFixed(3)}/min`
  }
  if (pricing.inputCostPer1M !== undefined) {
    // For LLMs, show input cost (simplified)
    if (pricing.inputCostPer1M < 1) {
      return `$${pricing.inputCostPer1M.toFixed(2)}/1M`
    }
    return `$${pricing.inputCostPer1M}/1M`
  }
  return '-'
}

export function formatRAM(resources: ModelResources | undefined): string {
  if (!resources) return '-'
  return `${resources.ramGB} GB`
}
