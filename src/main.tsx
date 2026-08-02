import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './app'
import { initializeSettings, setupSettingsSync } from './features/settings'
import { initializePermissions } from './lib/init-permissions'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

setupSettingsSync()

Promise.all([initializeSettings(), initializePermissions()]).then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
