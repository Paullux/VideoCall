import { useState, useEffect } from 'react'
import appLogo from '../../../favicon.png'

// ─── Icons ───────────────────────────────────────────────────────────────────

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="14" height="10" rx="2"/>
    <polygon points="16 9 22 5 22 19 16 15"/>
  </svg>
)

const HangupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.9 8.81"/>
    <line x1="23" y1="1" x2="1" y2="23"/>
  </svg>
)

const AcceptIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const UserIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

// ─── Types ────────────────────────────────────────────────────────────────────

type CallState = 'idle' | 'calling' | 'incoming' | 'in-call'

function generateRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Écran de connexion ───────────────────────────────────────────────────────

function Setup({ loading }: { loading: boolean }) {
  return (
    <div className="setup">
      <img src={appLogo} alt="VideoCall" className="setup-logo" />
      <h1>VideoCall</h1>
      <p className="setup-subtitle">Connexion sécurisée via Kinde</p>
      <button className="btn-kinde" onClick={() => window.api.auth.login()} disabled={loading}>
        {loading ? 'Chargement…' : 'Se connecter'}
      </button>
    </div>
  )
}

// ─── App principale ───────────────────────────────────────────────────────────

export default function App() {
  const [authStatus, setAuthStatus] = useState<{ isAuthenticated: boolean; displayName?: string } | null>(null)
  const [peerOnline, setPeerOnline] = useState(false)
  const [peerName, setPeerName] = useState('')
  const [callState, setCallState] = useState<CallState>('idle')
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)

  useEffect(() => {
    window.api.auth.getStatus().then(setAuthStatus)
    window.api.auth.onUpdated((status) => setAuthStatus(status))

    window.api.onPeerStatus((online, name) => {
      setPeerOnline(online)
      if (name) setPeerName(name)
    })
    window.api.onIncomingCall((roomId) => {
      setCurrentRoomId(roomId)
      setCallState('incoming')
    })
    window.api.onCallAccepted((roomId) => {
      setCurrentRoomId(roomId)
      setCallState('in-call')
    })
    window.api.onCallRejected(() => { setCallState('idle'); setCurrentRoomId(null) })
    window.api.onCallHangup(() => { setCallState('idle'); setCurrentRoomId(null) })
  }, [])

  if (authStatus === null) return <Setup loading={true} />
  if (!authStatus.isAuthenticated) return <Setup loading={false} />

  const startCall = () => {
    const roomId = generateRoomId()
    setCurrentRoomId(roomId)
    setCallState('calling')
    window.api.call(roomId)
  }

  const acceptCall = () => {
    if (!currentRoomId) return
    window.api.accept(currentRoomId)
    setCallState('in-call')
  }

  const rejectCall = () => { window.api.reject(); setCallState('idle'); setCurrentRoomId(null) }
  const hangup    = () => { window.api.hangup(); setCallState('idle'); setCurrentRoomId(null) }

  return (
    <div className="app">
      {callState !== 'in-call' && (
        <>
          <header className="app-header">
            <div className="app-header-brand">
              <img src={appLogo} alt="" className="app-logo" />
              <h1>VideoCall</h1>
            </div>
            <button className="btn-logout" onClick={() => window.api.auth.logout()} title="Déconnexion">
              <LogoutIcon />
            </button>
          </header>

          <main className="app-main">
            <div className="contact-card">
              <div className="avatar">
                {peerName ? peerName[0].toUpperCase() : <UserIcon />}
              </div>
              <div className="contact-info">
                <span className="contact-name">{peerName || '—'}</span>
                <span className={`status ${peerOnline ? 'online' : 'offline'}`}>
                  <span className="status-dot" />
                  {peerOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            </div>

            <div className="call-controls">
              {callState === 'idle' && (
                <button className="btn-call" onClick={startCall} disabled={!peerOnline}>
                  <VideoIcon /> Appeler
                </button>
              )}
              {callState === 'calling' && (
                <div className="call-status">
                  <p className="status-text">Appel en cours…</p>
                  <button className="btn-hangup" onClick={hangup}>
                    <HangupIcon /> Raccrocher
                  </button>
                </div>
              )}
              {callState === 'incoming' && (
                <div className="call-incoming">
                  <p className="status-text">Appel de <strong>{peerName}</strong></p>
                  <div className="call-actions">
                    <button className="btn-accept" onClick={acceptCall}><AcceptIcon /> Décrocher</button>
                    <button className="btn-reject" onClick={rejectCall}><HangupIcon /> Refuser</button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {callState === 'in-call' && (
        <div className="call-bar">
          <button className="btn-hangup" onClick={hangup}>
            <HangupIcon /> Raccrocher
          </button>
        </div>
      )}
    </div>
  )
}
