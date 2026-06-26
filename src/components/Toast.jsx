import { useEffect } from 'react'

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

function Toast({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{ICONS[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => onRemove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

export default Toast