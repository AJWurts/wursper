import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AppLayout } from './components/app-layout'
import { AppToaster } from './components/app-toaster'
import { ProtectedRoute } from './components/protected-route'
import { HelpPage } from './features/help'
import { HomePageContent } from './features/home'
import { initializeModelStatusListener } from './features/models'
import { ModelsPage } from './features/models'
import { OnboardingPage } from './features/onboarding'
import { SnippetsPage } from './features/snippets'
import { VibesPage } from './features/vibes'
import { VocabularyPage } from './features/vocabulary'
import { useMicrophoneDeviceSync } from './hooks/use-microphone-device-sync'
import { useUpdateChecker } from './hooks/use-update-checker'
import { AnalyticsEvents, trackEvent } from './lib/analytics'
import { ThemeProvider } from './providers/theme-provider'

import './index.css'

function App() {
  // Initialize model status listener
  useEffect(() => {
    initializeModelStatusListener()
  }, [])

  // Sync microphone device changes from tray menu
  useMicrophoneDeviceSync()

  // Handle update checking and notifications
  useUpdateChecker()

  // Track app launch
  useEffect(() => {
    trackEvent(AnalyticsEvents.APP_LAUNCHED)
  }, [])

  return (
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <AppToaster />
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<HomePageContent />} />
                    <Route path="/snippets" element={<SnippetsPage />} />
                    <Route path="/vocabulary" element={<VocabularyPage />} />
                    <Route path="/vibes" element={<VibesPage />} />
                    <Route path="/help" element={<HelpPage />} />
                    <Route path="/models" element={<ModelsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
