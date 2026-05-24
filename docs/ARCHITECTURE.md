# Architecture — VideoCall

Application desktop de visioconférence privée, conçue pour deux utilisateurs sur une liaison transatlantique instable.

## Vue d'ensemble

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│     PC Paul (France)        │        │    PC Marysa (Martinique)   │
│                             │        │                             │
│  ┌─────────────────────┐    │        │  ┌─────────────────────┐    │
│  │   App Electron      │    │        │  │   App Electron      │    │
│  │  ┌───────────────┐  │    │        │  │  ┌───────────────┐  │    │
│  │  │  UI (React)   │  │    │        │  │  │  UI (React)   │  │    │
│  │  │  - Contacts   │  │    │        │  │  │  - Contacts   │  │    │
│  │  │  - Appel      │  │    │        │  │  │  - Appel      │  │    │
│  │  └───────┬───────┘  │    │        │  │  └───────┬───────┘  │    │
│  │          │          │    │        │  │          │          │    │
│  │  ┌───────▼───────┐  │    │  WS    │  │  ┌───────▼───────┐  │    │
│  │  │ WS Client     │◄─┼────┼────────┼──┼──►  WS Client   │  │    │
│  │  └───────┬───────┘  │    │        │  │  └───────┬───────┘  │    │
│  │          │          │    │        │  │          │          │    │
│  │  ┌───────▼───────┐  │    │        │  │  ┌───────▼───────┐  │    │
│  │  │ BrowserView   │  │    │        │  │  │ BrowserView   │  │    │
│  │  │ Jitsi Meet    │  │    │        │  │  │ Jitsi Meet    │  │    │
│  │  └───────┬───────┘  │    │        │  │  └───────┬───────┘  │    │
│  └──────────┼──────────┘    │        │  └──────────┼──────────┘    │
└─────────────┼───────────────┘        └─────────────┼───────────────┘
              │                                       │
              │         ┌─────────────────┐           │
              │  WS     │   VPS Hostinger │  WS       │
              └────────►│                │◄──────────┘
                        │  Signaling     │
                        │  Server        │
                        │  (Node.js/ws)  │
                        │  via Coolify   │
                        └────────────────┘
                                │
                                │ (ne transporte PAS la vidéo)
                                │
              ┌─────────────────▼─────────────────┐
              │         meet.jit.si                │
              │   Serveurs publics Jitsi           │
              │   (vidéo + audio adaptatifs)       │
              └────────────────────────────────────┘
```

## Flux d'un appel

```
Paul                    Serveur (VPS)              Marysa
 │                           │                       │
 │──── connect(userId) ─────►│◄── connect(userId) ───│
 │                           │                       │
 │── call(token, roomId) ───►│                       │
 │                           │──── incoming_call ───►│
 │                           │      (token, roomId)  │
 │                           │                       │ [notification système]
 │                           │◄──── accept() ────────│
 │◄── call_accepted() ───────│                       │
 │                           │                       │
 │══ rejoint meet.jit.si/roomId ══════════════════════│
 │              (vidéo P2P via Jitsi)                 │
 │                           │                       │
 │── hangup() ──────────────►│──── hangup() ────────►│
```

## Composants

### Client Electron (`/client`)

| Module | Rôle |
|--------|------|
| `main/` | Processus principal : fenêtre, menu, notifications système, gestion du cycle de vie |
| `renderer/` | UI React : liste de contacts, écran d'appel entrant/sortant |
| `preload/` | Bridge sécurisé entre main et renderer (contextBridge) |
| `BrowserView` | Intègre Jitsi Meet External API dans une vue dédiée, isolée de l'UI |

### Serveur de signalisation (`/server`)

Serveur WebSocket minimaliste. Il ne fait que relayer des événements JSON entre les deux clients connectés. Il ne stocke aucune donnée persistante et ne touche jamais aux flux médias.

Événements gérés :
- `register` — un client s'identifie à la connexion
- `call` — Paul initie un appel (envoie le roomId/token à Marysa)
- `accept` / `reject` — Marysa répond
- `hangup` — fin d'appel
- `heartbeat` — maintien de connexion

### Sécurité des salles

À chaque appel, le client appelant génère un identifiant de salle aléatoire :

```typescript
import { randomBytes } from 'crypto'
const roomId = randomBytes(32).toString('hex') // 64 chars hex
```

Cet identifiant est transmis à Marysa via le serveur de signalisation. Seules les deux personnes qui connaissent le `roomId` peuvent rejoindre la salle Jitsi — il n'y a pas d'annuaire public.

## Déploiement

### Serveur de signalisation (VPS via Coolify)

```
VPS Hostinger KVM1
├── Ubuntu 24.04
├── Coolify (gestionnaire de déploiement Docker)
└── Container: videocall-server
    ├── Port: 443 (WSS avec TLS géré par Coolify/Caddy)
    └── Image: node:20-alpine
```

Coolify gère automatiquement :
- Le reverse proxy (Caddy)
- Les certificats TLS (Let's Encrypt)
- Les redémarrages automatiques

### Client (distribution)

L'app Electron est packagée avec `electron-builder` pour Windows (et éventuellement macOS/Linux) et distribuée directement entre Paul et Marysa — pas de store public.

## Choix techniques et alternatives écartées

| Sujet | Choix retenu | Alternative écartée | Raison |
|-------|-------------|---------------------|--------|
| Moteur vidéo | meet.jit.si (public) | Jitsi auto-hébergé | VPS trop limité (1 vCPU, ~2 Go libres) |
| Signalisation | WebSocket centralisé (VPS) | P2P | Jitsi est déjà centralisé ; P2P = complexité sans bénéfice |
| Auth contacts | Token simple | Kinde / OAuth | Sur-complexe pour 2 utilisateurs fixes |
| UI framework | React (dans Electron) | Vue / Svelte | Écosystème mature, compatible Electron |
| Déploiement serveur | Coolify | Gestion Docker manuelle | Coolify déjà installé sur le VPS |
