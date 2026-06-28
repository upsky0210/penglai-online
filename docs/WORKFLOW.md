# Development Workflow

## Phase 1: Codex Desktop Owns the Project

Use Codex Desktop for broad changes:

- Project planning
- File structure
- Multi-file edits
- Local dev server checks
- UI/gameplay inspection
- Bug triage

Keep the project in `C:\AI\Codex\penglai-online`.

## Phase 2: CLI Handoffs

Use Codex CLI or Antigravity CLI only after the current work is committed.

Recommended handoff rule:

1. Commit the current known-good state.
2. Assign one narrow task to one CLI tool.
3. Do not let two tools edit the same files at the same time.
4. Run `npm.cmd run typecheck` before accepting the result.
5. Commit again before the next handoff.

Good CLI tasks:

- Add one monster type.
- Add one NPC dialogue.
- Add one server message type.
- Fix one TypeScript error.
- Implement one small UI panel.

Bad CLI tasks:

- "Make the whole MMORPG."
- "Improve everything."
- "Rewrite the architecture."

## Phase 3: Open Design

Use Open Design after the gameplay loop exists.

Open Design should refine:

- Login screen
- Character select
- HUD
- Dialogue box
- Inventory
- Quest tracker
- Landing/announcement page

Do not spend design time before movement, attack, and multiplayer sync are stable.

## Local Commands

Use `npm.cmd`, not `npm`, on this Windows machine:

```powershell
npm.cmd install --cache .\.npm-cache
npm.cmd run dev
npm.cmd run typecheck
npm.cmd --workspace client run build
```

## LAN Testing

When the dev server is running, Vite prints local network URLs such as:

```text
http://192.168.x.x:5173/
```

Students on the same LAN can test with that URL if Windows Firewall allows inbound access.

For a school LAN server, start with:

- Dell 3060 SFF i5-8500
- 16GB RAM preferred
- Wired Ethernet
- Static LAN IP

The GPU machines are not necessary for the game server. Save them for development, recording, image generation tools, or future asset workflows.

