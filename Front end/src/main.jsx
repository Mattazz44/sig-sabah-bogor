import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import './index.css'
import App from './App.jsx'

setWorkerUrl(maplibreWorkerUrl)

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error caught by ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          width: '100%',
          margin: 0,
          backgroundColor: '#111711',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            Terjadi Kendala Memuat Aplikasi
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.8, maxWidth: '360px', marginBottom: '20px' }}>
            {this.state.error?.message || 'Silakan muat ulang halaman untuk melanjutkan.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#EBF0EB',
              color: '#161E16',
              borderRadius: '9999px',
              padding: '10px 24px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

