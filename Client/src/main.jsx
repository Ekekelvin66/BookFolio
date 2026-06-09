import   React, {StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/globals.css'
import './styles/layout.css'    
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

 
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>
)
 
  
