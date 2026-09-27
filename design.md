# Shethil — Mobile FPS Prototype Design

## Product direction

Shethil is a compact **portrait-first tactical survival shooter** designed for quick, touch-friendly arena matches. The first release is a local training prototype with intelligent simulated opponents and a multiplayer-ready game-state boundary. It deliberately focuses on a complete three-to-five-minute match loop rather than attempting to duplicate the content volume, live-service infrastructure, or visual fidelity of a large commercial battle-royale game.

> The prototype uses a stylised tactical arena and an overhead tactical camera to preserve legibility and one-handed accessibility on a 9:16 screen. Weapon handling, aim, damage, loot, a shrinking zone, and placement rewards model the core FPS battle-royale loop.

## Screen list and layout

| Screen | Primary content and functionality | Portrait layout and control model |
| --- | --- | --- |
| **Command Lobby** | Player callsign, current rank, best placement, match mode, and primary `DEPLOY` action. | Hero status at top, mode card in the centre, full-width deploy button within the lower thumb zone. |
| **Loadout Sheet** | Weapon preference, armour choice, control sensitivity, aim assist, and sound toggles. | Bottom sheet with large segmented controls and 48px minimum targets. |
| **Drop Briefing** | Match roster, objective, named map sector, and a short deployment countdown. | Readable tactical card with one clear `BEGIN MATCH` action. |
| **Arena Match** | Stylised arena viewport, player and bot indicators, safe-zone ring, loot drops, health/ammo, crosshair, fire, reload, movement, and map. | Left lower movement pad; right lower fire button; reload and inventory above the right thumb; HUD stays clear of the top safe area. |
| **Pause / Settings** | Resume, restart, leave match, sound setting, aim assist, and controls reminder. | iOS-style sheet using a dimmed game backdrop and a destructive leave action separated from regular actions. |
| **Match Report** | Placement, eliminations, damage, survival time, XP, result narrative, and rematch / return actions. | Reward total has visual priority; full-width `RUN IT BACK` button supports rapid repeat play. |

## Core gameplay loop

| Stage | Player action | Game response |
| --- | --- | --- |
| Deploy | Taps `DEPLOY` from the lobby. | The game instantiates a deterministic arena session with the selected loadout and six simulated combatants. |
| Scavenge | Moves toward supply crates and armour plates. | Loot immediately updates weapon/ammo/armour state and the HUD communicates each pickup. |
| Engage | Uses the fire control or tap-to-aim gesture while enemies move, seek cover, and return fire. | Aim assistance chooses a target near the crosshair; weapon cooldown, damage falloff, and reload rules are enforced. |
| Rotate | Stays inside the contracting safe zone. | The zone contracts in phases; players outside take escalating damage and receive a clear warning. |
| Survive | Eliminates rivals or outlasts them. | The match ends at a single remaining combatant or on player elimination, then opens the Match Report. |

## Key user flows

The main path is **Command Lobby → choose loadout → Deploy → Drop Briefing → Arena Match → Match Report → Run It Back or Command Lobby**. The player may open the pause sheet from the arena, change an accessibility option, then resume without discarding the match. Persistent settings and career totals are saved locally so the lobby reflects the previous session.

The initial multiplayer boundary is intentionally explicit. The deterministic `MatchSession`, `Combatant`, `InputCommand`, and `MatchEvent` domain models are organized so a future authoritative server can replace the local bot adapter without rewriting the HUD, player controls, or result screens. The released prototype does not claim a production online matchmaking service.

## Color choices and visual language

Shethil uses a dark tactical palette that avoids generic military camouflage while retaining high-action contrast. The canvas is **Obsidian #091016**, arena ground is **Slate Field #13242E**, navigation panels are **Graphite #111B22**, action emphasis is **Signal Lime #B9F227**, friendly UI is **Aqua Beacon #46D9FF**, warning state is **Amber #FFB84D**, and damage is **Pulse Red #FF5F5F**. Fine grid lines, soft glows, and map contour marks create a polished recon-screen feeling. Typography favours high contrast, compact all-caps labels with large numerical telemetry.

## Interaction, accessibility, and technical constraints

The game is optimized for a one-handed portrait hold. Essential motion and fire actions have assisted alternatives: player movement can be set to auto-run, aim assist defaults on, and target acquisition prioritises visibility and proximity. Buttons expose clear pressed states, status data is not colour-only, and the HUD uses readable labels at regular mobile text sizes. Haptic feedback is limited to deploy, hit confirmation, armour pickup, zone warning, and match end.

The first deliverable is deliberately an **offline playable arena prototype**, using local storage for preferences and career progress. A production-scale online FPS requires an authoritative, persistent real-time game service, anti-cheat, matchmaking, observability, and load testing; those are outside the container-hosted mobile prototype. The source will retain a clear networking interface and an implementation note for the future service boundary.
