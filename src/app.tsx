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
import { useLanguageSync } from './hooks/use-language-sync'
import { useMicrophoneDeviceSync } from './hooks/use-microphone-device-sync'
import { ThemeProvider } from './providers/theme-provider'

import './index.css'

function AppContent() {
  useEffect(() => {
    initializeModelStatusListener()
  }, [])

  useMicrophoneDeviceSync()
  useLanguageSync()

  return (
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
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AppContent />
    </ThemeProvider>
  )
}

export default App
