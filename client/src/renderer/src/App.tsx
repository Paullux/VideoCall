import { useState, useEffect } from 'react'

// ─── Icons ───────────────────────────────────────────────────────────────────

const AppLogo = ({ size = 28 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 1024 1024" style={{ borderRadius: size * 0.25, flexShrink: 0 }}>
    <path fill="#240c5a" d="M743 942.2c-11.4 1.3-399.6 2-436 .8-22.8-.8-29-1.3-49-4.4a202 202 0 0 1-124.4-71.1c-5-6-10.3-12.8-11.7-15l-5.8-9A200 200 0 0 1 91.4 778c-6.2-35.2-6.7-60.1-6.1-296 .4-198 .7-213.8 4.2-234.1l2-12.3c.4-1.6 1.6-7 3-12 7-27 21.2-54.1 38.6-74.1a256 256 0 0 1 40.6-37.4c29.8-20.3 60.5-30.7 104.8-35.7 14.8-1.7 31.3-1.9 219.5-2.2 232.3-.3 244 0 277 6.5a189 189 0 0 1 105 57c12 12.2 15 16 24 29.8l4.8 7c1 1.3 10.2 20 13 27A223 223 0 0 1 934 248l2.2 17c1 7.6 1.3 54.9 1.3 237.5L935.7 749c-1 10.2-2.8 23-3.9 28.5l-2.5 12.5a206 206 0 0 1-9.3 28.7c0 2.4-12.8 26.1-18.5 34.3a218 218 0 0 1-53.5 53.7 189 189 0 0 1-34 18.8 254 254 0 0 1-71 16.7"/>
    <path fill="#9350f6" d="M306.3 702.9c4 .5 75.7.8 159.3.7h31.7c112.7-.1 123.3-.1 132.3-3.7l5.7-2.5a83 83 0 0 0 46-52.6l2.3-7.3.3-127.4c.2-125.3.2-127.6-1.8-135.5a78 78 0 0 0-23.8-39.8 78 78 0 0 0-31.2-18l-7.5-2.3h-318l-8 2.7a82 82 0 0 0-54.3 58.3c-1.6 5.5-1.7 17.5-1.7 132.5v126.5l2.2 8a80 80 0 0 0 22.8 39 79 79 0 0 0 43.7 21.4m503.6-30c7.6 2.1 17.8-.6 22.9-6 1.2-1.3 3-4.4 4.2-6.9 2-4.5 2-5.7 2-150.5v-146l-3-5.2c-1.6-3-4.7-6.4-7-8-7.6-5-20-4-28 2.3L775.5 372c-53.4 40.5-66.9 51.4-69.5 56l-2.5 4.5V510c0 76.7 0 77.5 2 81.5 2.6 4.8 6.5 8.2 39.4 33.5 48.5 37.4 61.3 46.8 65 47.9m-467.8-26.4c3 1.3 18.3 1.5 117.8 1.5h12c98.8 0 105.8 0 110-3.4l1.5-1.4c8.4-7.5 7.4-27.6-2.3-48C564.8 561.8 529 540 480.4 534c-12.3-1.5-40-.8-52.2 1.5-42 7.6-73.7 28.2-88.5 57.5-5.5 11-8 20.2-8.7 31-.5 8.3-.3 10.1 1.5 13.6 2.4 4.7 4.6 6.8 9.2 8.9m106.5-134.5c2.8.5 9.3.8 14.5.6q26.7-1 46-20.6c13.8-14 20-28 20.8-47.1a65 65 0 0 0-7.5-36.2c-3.8-7.6-6.1-10.7-13.7-18.2a63 63 0 0 0-49.1-20.5c-19.3 0-34 6.4-48.5 21a61 61 0 0 0-12.8 16.7A72 72 0 0 0 448.2 512"/>
    <path fill="#fdfbfe" d="M0 512V0h1024v1024H0zm743 430.2c29.3-3.3 44.6-6.8 71-16.7 8.1-3 21.2-10.2 34-18.8 19-12.8 39-33 53.5-53.7 5.7-8.2 18.5-32 18.5-34.3a206 206 0 0 0 9.3-28.7l2.5-12.5c1.1-5.5 2.9-18.3 3.9-28.5 1.7-17.3 1.8-33 1.8-246.5L936.2 265l-2.2-17a223 223 0 0 0-12.1-46.5c-3-7-12-25.7-13-27l-4.9-7c-9-13.9-12-17.6-24-29.8a189 189 0 0 0-105-57c-33-6.6-44.7-6.8-277-6.5l-219.5 2.2c-44.3 5-75 15.4-104.8 35.7a256 256 0 0 0-40.6 37.4 189 189 0 0 0-41.5 86.1L89.5 248c-3.5 20.3-3.8 36-4.2 234.1-.6 235.9 0 260.8 6.2 296 3.8 22 14 49.3 24.6 65.5l5.8 9c1.4 2.2 6.7 9 11.7 15A202 202 0 0 0 258 938.6c20 3 26.2 3.6 49 4.4 36.4 1.2 424.6.5 436-.8"/>
  </svg>
)

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
      <AppLogo size={80} />
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
              <AppLogo size={28} />
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
