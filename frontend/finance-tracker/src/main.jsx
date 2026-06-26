import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Dev-only: if no user is present, inject a test user to make dashboard visible locally
if (import.meta.env.DEV) {
  try {
    const existing = localStorage.getItem('user');
    if (!existing) {
      localStorage.setItem('user', JSON.stringify({ fullName: 'Dev Test', profileImageUrl: '' }));
    }
  } catch {
    // Ignore localStorage errors
  }
}

import ErrorBoundary from './components/common/ErrorBoundary';

// Unregister any lingering service workers from previous PWA setup
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
