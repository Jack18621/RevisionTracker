// src/main.tsx
import { HashRouter } from 'react-router-dom'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>
)
