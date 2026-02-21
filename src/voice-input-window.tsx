import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { VoiceInput } from '@/features/voice-input/components/voice-input'
import { AnalyticsProvider } from '@/lib/analytics'

import './index.css'

function VoiceInputWindowApp() {
  return (
    <StrictMode>
      <AnalyticsProvider>
        <VoiceInput />
      </AnalyticsProvider>
    </StrictMode>
  )
}

const rootElement = document.getElementById('voice-input-root')!
const root = ReactDOM.createRoot(rootElement)
root.render(<VoiceInputWindowApp />)
