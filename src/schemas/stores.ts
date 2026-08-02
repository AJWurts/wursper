import { z } from 'zod'

// Settings Schema (for validation - types are generated from Rust)
export const settingsSchema = z.object({
  onboarding: z.object({
    completed: z.boolean(),
  }),
  voiceInput: z.object({
    shortcut: z.string(),
    microphoneDeviceId: z.string().nullable(),
  }),
  transcription: z.object({
    language: z.string(),
    autoPaste: z.boolean(),
    autoCopyToClipboard: z.boolean(),
    speechToTextModelId: z.string().nullable(),
  }),
  shortcuts: z.object({
    pasteLastTranscript: z.string(),
    globalShortcutsEnabled: z.boolean(),
  }),
  system: z.object({
    showInDock: z.boolean(),
    saveAudioRecordings: z.boolean(),
  }),
  privacy: z.object({
    analytics: z.boolean(),
  }),
})

// Map of file names to their schemas
export const storeSchemas: Record<string, z.ZodSchema> = {
  'settings.json': settingsSchema,
}

// Validate store data
export function validateStoreData(
  fileName: string,
  data: unknown
): { success: true; data: unknown } | { success: false; error: string } {
  const schema = storeSchemas[fileName]

  if (!schema) {
    return {
      success: false,
      error: `Unknown store file: ${fileName}`,
    }
  }

  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(
        err => `${err.path.join('.')}: ${err.message}`
      )
      return {
        success: false,
        error: `Invalid data format in ${fileName}: ${errorMessages.join(', ')}`,
      }
    }
    return {
      success: false,
      error: `Validation failed for ${fileName}`,
    }
  }
}
