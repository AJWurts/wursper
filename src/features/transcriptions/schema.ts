import { z } from 'zod'

export const sourceTypeSchema = z.enum(['recording', 'upload'])

export const transcriptionRecordSchema = z.object({
  id: z.string(),
  text: z.string(),
  timestamp: z.number(),
  duration: z.number().optional().nullable(),
  wordCount: z.number(),
  modelId: z.string(),
  provider: z.string(),
  hasAudio: z.boolean().optional().default(false),
  sourceType: sourceTypeSchema.optional().default('recording'),
  originalFilename: z.string().optional().nullable(),
})

export const transcriptionsStoreSchema = z.object({
  transcriptions: z.array(transcriptionRecordSchema),
})

export type SourceType = z.infer<typeof sourceTypeSchema>
export type Transcription = z.infer<typeof transcriptionRecordSchema>
export type Transcriptions = z.infer<typeof transcriptionsStoreSchema>
