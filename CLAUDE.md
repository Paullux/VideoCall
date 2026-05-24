# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexte du projet

Application desktop de visioconférence privée entre deux utilisateurs fixes sur une liaison transatlantique instable (France métropole ↔ Martinique). Jitsi est retenu comme moteur vidéo pour sa gestion native de la dégradation de bande passante.

## Stack technique

| Composant | Technologie |
|-----------|------------|
| Client desktop | Electron + TypeScript |
| Signalisation (appels) | Node.js + WebSocket (ws) |
| Vidéo | Jitsi Meet API (meet.jit.si) |
| Déploiement serveur | Docker via Coolify sur VPS Hostinger |

## Architecture

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le schéma complet.

En résumé :
- Le **client Electron** embarque la Jitsi Meet External API dans un `BrowserView`
- Le **serveur de signalisation** (Node.js WebSocket) tourne sur le VPS via Coolify — il relaie uniquement les événements d'appel (ring, accept, reject, hangup)
- La **vidéo transite exclusivement via meet.jit.si** — le VPS ne porte pas la charge média
- Chaque salle Jitsi est identifiée par un **token aléatoire 64 bits** généré à l'appel

## Contraintes à respecter

- Ne jamais auto-héberger Jitsi sur le VPS actuel (KVM1, 1 vCPU, 4 Go RAM — insuffisant)
- Le serveur de signalisation doit rester léger : il ne transporte que des événements JSON, jamais de médias
- L'app est conçue pour **exactement 2 utilisateurs** — ne pas abstraire pour une usage multi-utilisateurs

## Structure du monorepo (cible)

```
VideoCall/
├── client/          # App Electron + TypeScript
│   ├── src/
│   │   ├── main/    # Processus principal Electron
│   │   ├── renderer/# UI (React ou Vue)
│   │   └── preload/ # Bridge main ↔ renderer
│   └── package.json
├── server/          # Serveur de signalisation Node.js
│   ├── src/
│   └── package.json
├── docs/
│   └── ARCHITECTURE.md
└── CLAUDE.md
```

## Commandes de développement

> À compléter au fur et à mesure de la mise en place du projet.

```bash
# Client
cd client && npm install
npm run dev        # Electron en mode développement
npm run build      # Build de production

# Serveur
cd server && npm install
npm run dev        # Serveur WebSocket en mode watch
npm run build      # Compilation TypeScript
docker build -t videocall-server .  # Image Docker pour Coolify
```
