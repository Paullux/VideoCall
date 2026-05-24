import { useState, useEffect } from 'react'

type CallState = 'idle' | 'calling' | 'incoming' | 'in-call'

function generateRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Écran de premier démarrage ───────────────────────────────────────────────

function Setup({ loading }: { loading: boolean }) {
  return (
    <div className="setup">
      <h1>VideoCall</h1>
      <p className="setup-subtitle">Connexion sécurisée via Kinde</p>
      <button
        className="btn-kinde"
        onClick={() => window.api.auth.login()}
        disabled={loading}
      >
        {loading ? 'Chargement…' : 'Se connecter'}
      </button>
    </div>
  )
}

// ─── App principale ───────────────────────────────────────────────────────────

export default function App() {
  const [authStatus, setAuthStatus] = useState<{ isAuthenticated: boolean; displayName?: string } | null>(null)
  const [peerOnline, setPeerOnline] = useState(false)
  const [peerName, setPeerName] = useState('…')
  const [callState, setCallState] = useState<CallState>('idle')
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)

  useEffect(() => {
    // Auth
    window.api.auth.getStatus().then(setAuthStatus)
    window.api.auth.onUpdated((status) => setAuthStatus(status))

    // Signaling
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
    window.api.onCallRejected(() => {
      setCallState('idle')
      setCurrentRoomId(null)
    })
    window.api.onCallHangup(() => {
      setCallState('idle')
      setCurrentRoomId(null)
    })
  }, [])

  // Pas encore de réponse du processus principal
  if (authStatus === null) return <Setup loading={true} />

  // Non authentifié
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

  const rejectCall = () => {
    window.api.reject()
    setCallState('idle')
    setCurrentRoomId(null)
  }

  const hangup = () => {
    window.api.hangup()
    setCallState('idle')
    setCurrentRoomId(null)
  }

  return (
    <div className="app">
      {callState !== 'in-call' && (
        <>
          <header className="app-header">
            <h1>VideoCall</h1>
            <button className="btn-logout" onClick={() => window.api.auth.logout()} title="Déconnexion">
              ⏻
            </button>
          </header>

          <main className="app-main">
            <div className="contact-card">
              <div className="avatar">{peerName[0]?.toUpperCase()}</div>
              <div className="contact-info">
                <span className="contact-name">{peerName}</span>
                <span className={`status ${peerOnline ? 'online' : 'offline'}`}>
                  {peerOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
            </div>

            <div className="call-controls">
              {callState === 'idle' && (
                <button className="btn-call" onClick={startCall} disabled={!peerOnline}>
                  Appeler
                </button>
              )}
              {callState === 'calling' && (
                <div className="call-status">
                  <p className="status-text">Appel en cours…</p>
                  <button className="btn-hangup" onClick={hangup}>Raccrocher</button>
                </div>
              )}
              {callState === 'incoming' && (
                <div className="call-incoming">
                  <p className="status-text">Appel entrant</p>
                  <div className="call-actions">
                    <button className="btn-accept" onClick={acceptCall}>Décrocher</button>
                    <button className="btn-reject" onClick={rejectCall}>Refuser</button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {callState === 'in-call' && (
        <div className="call-bar">
          <button className="btn-hangup" onClick={hangup}>Raccrocher</button>
        </div>
      )}
    </div>
  )
}
