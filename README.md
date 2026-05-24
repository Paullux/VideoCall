# VideoCall

Application desktop de visioconférence privée entre deux utilisateurs sur une liaison transatlantique instable (France métropole ↔ Martinique).

Jitsi Meet gère la dégradation adaptative de la bande passante. Un serveur de signalisation léger sur VPS coordonne les appels. La vidéo transite exclusivement via les serveurs publics `meet.jit.si` — le VPS ne porte aucune charge média.

## Stack

| Composant | Technologie |
|-----------|-------------|
| Client desktop | Electron 33 + TypeScript + React |
| Build tool | electron-vite |
| Authentification | Kinde (OAuth 2.0 PKCE, sans client secret) |
| Signalisation | Node.js + WebSocket (`ws`) |
| Vidéo | Jitsi Meet via `WebContentsView` |
| Déploiement serveur | Docker + Coolify sur VPS Hostinger |

## Structure

```
VideoCall/
├── client/          # App Electron
│   ├── src/
│   │   ├── main/    # Processus principal (auth, signaling, jitsi)
│   │   ├── preload/ # Bridge contextBridge
│   │   └── renderer/# UI React
│   └── .env.example
├── server/          # Serveur de signalisation WebSocket
│   ├── src/
│   ├── Dockerfile
│   └── .env.example
└── docs/
    └── ARCHITECTURE.md
```

## Développement

### Prérequis

- Node.js 20+
- Deux fichiers `.env` à créer depuis les `.env.example`

### Client

```bash
cd client
cp .env.example .env   # renseigner KINDE_DOMAIN, KINDE_CLIENT_ID, SIGNALING_URL
npm install
npm run dev            # Electron en mode développement
npm run build          # Build de production (génère out/)
```

### Serveur

```bash
cd server
cp .env.example .env   # renseigner KINDE_DOMAIN
npm install
npm run dev            # Mode watch (nodemon + ts-node)
npm run build          # Compile TypeScript → dist/
```

### Variables d'environnement

**`client/.env`**
```
KINDE_DOMAIN=https://videocall.kinde.com
KINDE_CLIENT_ID=<client_id_kinde>
SIGNALING_URL=wss://<domaine-du-serveur>
```

**`server/.env`**
```
KINDE_DOMAIN=https://videocall.kinde.com
PORT=3000
```

## Déploiement du serveur (Coolify)

1. Dans Coolify : **New Resource → Application → GitHub**
2. Repo : `Paullux/VideoCall`
3. **Base directory : `server`** — **Dockerfile : `Dockerfile`**
4. Port exposé : `3000`
5. Variables d'environnement : `KINDE_DOMAIN` + `PORT`
6. Coolify gère automatiquement TLS (Let's Encrypt) et le reverse proxy

## Distribution du client

L'app n'est pas publiée sur un store. Elle est packagée avec `electron-builder` et distribuée directement entre les deux utilisateurs.

```bash
cd client
npm run build   # génère le .exe (Windows) ou .dmg (macOS) dans out/
```

## Architecture

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le schéma complet et le flux d'appel.

## Licence

GNU GPL v3 — voir [LICENSE.md](LICENSE.md).
