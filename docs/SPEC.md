# Formal Development Specification v0.1

## Product

`蓬萊異聞錄 Online` is a browser-based 2D pixel side-scroller MMORPG prototype inspired by Taiwanese geography, local history, temple streets, ports, mountain trails, and original fantasy martial arts.

It must avoid copyrighted MapleStory, Jin Yong, and Harry Potter names, characters, settings, spells, music, sprites, and UI.

## v0.1 Success Criteria

- Open a browser URL and enter a playable map.
- Move, jump, and attack with keyboard controls.
- Connect at least two browser clients to one WebSocket server.
- See basic remote player state.
- Keep the codebase structured for future map, monster, NPC, quest, and account work.

## Non-Goals

- Cash shop
- Public production MMORPG launch
- PvP
- Auction house
- Mobile-first controls
- Full account security
- Large content library

## Target Stack

- Client: Phaser 3, Vite, TypeScript
- Server: Node.js, TypeScript, WebSocket
- Shared contracts: TypeScript workspace package
- Database later: SQLite first, PostgreSQL when public
- Deployment later: Ubuntu Server, Nginx, PM2, HTTPS/WSS

## Hardware

School LAN prototype:

- Minimum: Dell 3060 SFF, i5-8500, 8GB RAM
- Better: 16GB RAM
- GPU is not required for the server
- A stronger i7-9700F machine is useful for development, recording, art tools, or multiple services

Expected early capacity:

- 10-30 concurrent players on i5-8500 / 8GB
- 50+ requires profiling and conservative broadcast rates

## Hosting Notes

Google Sites can host an information page or iframe entry point, but not the authoritative game server.

For LAN-only school testing, host the server on a local PC and let clients connect by local IP. For public access, use a VPS, Railway/Fly.io/Render, Cloudflare Tunnel, or a properly configured firewall and reverse proxy.

## Milestones

1. Project scaffold and local boot.
2. Player controller and collision.
3. WebSocket state sync.
4. Monster stub and attack hitbox.
5. NPC dialogue and quest stub.
6. Persistence and deployment.

