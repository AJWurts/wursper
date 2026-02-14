import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import {
  Download,
  Check,
  AlertCircle,
  ArrowRight,
  HardDrive,
  Wifi,
  Lock,
  Cpu,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import {
  TranscriptionModel,
  useModelsStore,
  initializeModels,
} from '../../../models'
import { useOnboarding } from '../../hooks/use-onboarding'

interface DownloadProgress {
  downloaded: number
  total: number
  percentage: number
  modelId: string
}

const features = [
  {
    icon: HardDrive,
    title: 'Runs Locally',
    description: 'No internet after download',
  },
  {
    icon: Lock,
    title: 'Private',
    description: 'Audio stays on device',
  },
  {
    icon: Wifi,
    title: 'No API Costs',
    description: 'Unlimited & free forever',
  },
]

export function ModelDownloadStep() {
  const { completeCurrentStepAndGoNext, markStepComplete } = useOnboarding()
  const { selectModel, startLocalModel } = useModelsStore()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [downloadedMB, setDownloadedMB] = useState(0)
  const [totalMB, setTotalMB] = useState(75)
  const hasStartedModelRef = useRef(false)

  const checkIfDownloaded = useCallback(async () => {
    try {
      await initializeModels()
      const { models } = useModelsStore.getState()
      const tinyModel = models.find(m => m.id === 'whisper-tiny')
      if (tinyModel?.isDownloaded) {
        setIsDownloaded(true)
        markStepComplete('model-download')

        if (!hasStartedModelRef.current) {
          hasStartedModelRef.current = true
          if (!tinyModel.isSelected) {
            await selectModel('whisper-tiny')
          } else if (tinyModel.status === 'stopped') {
            await startLocalModel('whisper-tiny')
          }
        }
      }
    } catch (err) {
      console.error('Failed to check model status:', err)
    }
  }, [markStepComplete, selectModel, startLocalModel])

  useEffect(() => {
    checkIfDownloaded()

    const unlisten = listen<DownloadProgress>(
      'local-model-download-progress',
      event => {
        const { downloaded, total, percentage, modelId } = event.payload
        if (modelId === 'whisper-tiny') {
          setProgress(percentage)
          setDownloadedMB(Math.round(downloaded / 1024 / 1024))
          setTotalMB(Math.round(total / 1024 / 1024))

          if (percentage >= 100) {
            setIsDownloaded(true)
            setIsDownloading(false)
            markStepComplete('model-download')

            if (!hasStartedModelRef.current) {
              hasStartedModelRef.current = true
              setTimeout(async () => {
                try {
                  await initializeModels()
                  const { models } = useModelsStore.getState()
                  const tinyModel = models.find(m => m.id === 'whisper-tiny')
                  if (tinyModel && !tinyModel.isSelected) {
                    await selectModel('whisper-tiny')
                  }
                } catch (err) {
                  console.error(
                    'Failed to select/start model after download:',
                    err
                  )
                }
              }, 500)
            }
          }
        }
      }
    )

    return () => {
      unlisten.then(fn => fn())
    }
  }, [markStepComplete, checkIfDownloaded, selectModel, startLocalModel])

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)
    setProgress(0)

    try {
      const models = await invoke<TranscriptionModel[]>('get_all_models')
      const tinyModel = models.find(m => m.id === 'whisper-tiny')

      if (
        !tinyModel ||
        !tinyModel.downloadUrl ||
        !tinyModel.filename ||
        !tinyModel.engine
      ) {
        throw new Error('Model configuration not found')
      }

      await invoke('download_local_model', {
        modelId: tinyModel.id,
        downloadUrl: tinyModel.downloadUrl,
        filename: tinyModel.filename,
        engineType: tinyModel.engine,
      })
    } catch (err) {
      console.error('Download failed:', err)
      setError(err instanceof Error ? err.message : 'Download failed')
      setIsDownloading(false)
    }
  }

  const handleContinue = () => {
    if (isDownloaded) {
      completeCurrentStepAndGoNext()
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Download AI Model
        </h1>
        <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
          Get Whisper Tiny for fast, private transcription directly on your
          device.
        </p>
      </motion.div>

      {/* Model Icon with glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative mb-10"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150 -z-10" />

        <motion.div
          animate={
            isDownloaded
              ? {}
              : isDownloading
                ? { rotate: 360 }
                : { scale: [1, 1.05, 1] }
          }
          transition={
            isDownloading
              ? { duration: 2, repeat: Infinity, ease: 'linear' }
              : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
          className={`
            relative flex items-center justify-center w-28 h-28 rounded-2xl
            ${
              isDownloaded
                ? 'bg-primary/20 border border-primary/30'
                : 'bg-white/5 border border-white/10'
            }
            transition-colors duration-500
          `}
        >
          {isDownloaded ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Check className="w-12 h-12 text-primary" strokeWidth={2} />
            </motion.div>
          ) : isDownloading ? (
            <Cpu className="w-12 h-12 text-primary" strokeWidth={1.5} />
          ) : (
            <Download className="w-12 h-12 text-white/60" strokeWidth={1.5} />
          )}
        </motion.div>
      </motion.div>

      {/* Model name and size */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <h3 className="text-xl font-semibold text-white mb-1">Whisper Tiny</h3>
        <p className="text-sm text-white/40">75 MB • Fast & lightweight</p>
      </motion.div>

      {/* Progress section */}
      {isDownloading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mb-8"
        >
          <div className="flex justify-between text-sm mb-3">
            <span className="text-white/50">Downloading...</span>
            <span className="text-white/70 font-medium">
              {downloadedMB} / {totalMB} MB
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-emerald-400 rounded-full"
            />
            {/* Shimmer effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </div>
          <p className="text-xs text-white/30 mt-2">
            {progress.toFixed(0)}% complete
          </p>
        </motion.div>
      )}

      {/* Error */}
      {error && !isDownloaded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-8 max-w-sm text-left"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Download failed</p>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Success message */}
      {isDownloaded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-8"
        >
          <Check className="w-5 h-5 text-primary" strokeWidth={2.5} />
          <div className="text-left">
            <p className="text-sm font-medium text-primary">Model ready</p>
            <p className="text-xs text-primary/70">
              Whisper Tiny is installed and ready to use
            </p>
          </div>
        </motion.div>
      )}

      {/* Features */}
      {!isDownloading && !isDownloaded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center gap-8 mb-10 text-sm text-white/40"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{feature.title}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Button
          onClick={isDownloaded ? handleContinue : handleDownload}
          disabled={isDownloading}
          size="lg"
          className="h-12 px-8 text-sm font-medium bg-primary hover:bg-primary/90 text-black gap-2 group"
        >
          {isDownloaded ? (
            <>
              Continue
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          ) : isDownloading ? (
            'Downloading...'
          ) : error ? (
            'Try Again'
          ) : (
            <>
              Download Model
              <span className="text-black/50 font-normal">75 MB</span>
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}
