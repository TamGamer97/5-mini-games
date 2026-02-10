import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const embedParam = new URLSearchParams(window.location.search).get('embed')
const isEmbed = embedParam === '1'
if (isEmbed) {
  document.body.classList.add('embed-mode')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
