import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CashFlowV2Draft from '../../prototypes/CashFlowV2Draft.canvas.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CashFlowV2Draft />
  </StrictMode>,
)
