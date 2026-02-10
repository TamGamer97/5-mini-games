import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Detect embed mode from URL parameter
if (new URLSearchParams(window.location.search).get('embed') === '1') {
  document.body.classList.add('embed-mode')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
