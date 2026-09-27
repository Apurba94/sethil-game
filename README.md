# Shethil

Shethil is a **portrait-first tactical survival shooter prototype** built with Expo, React Native, and TypeScript. It offers a fast local arena match with simulated combatants, loot pickups, shrinking safe zones, touch controls, local career persistence, haptic feedback, and a deliberate transport boundary for a later authoritative multiplayer service.

## What is included

| Area | Included in this repository |
| --- | --- |
| Playable match loop | A deterministic local arena with six bots, a safe zone, loot, armour, ammo, health, reload, assisted target selection, match results, and rematch. |
| Mobile controls | One-handed portrait layout, press-and-hold movement controls, fire/reload actions, pause sheet, readable HUD, and native haptics. |
| Game architecture | Pure simulation functions in `lib/game/engine.ts`, persistence in `lib/game/storage.ts`, and a `MatchTransport` interface for a future realtime adapter. |
| Persistence | Career statistics and accessibility preferences are stored locally with AsyncStorage. |
| Branding | A custom Shethil launcher mark is applied through `app.config.ts` and the required Expo asset paths. |

## Run locally

Install dependencies, then use Expo to launch the project in a mobile simulator or on a device.

```bash
pnpm install
pnpm android
```

The repository also provides validation commands.

```bash
pnpm test
pnpm check
pnpm lint
```

## Android APK

The repository includes a generated `android/` project, native launcher assets, and an `eas.json` profile for an installable preview APK. A local `assembleRelease` attempt was made after Android prebuild, but the constrained sandbox terminated the Gradle daemon before it could produce an APK. The project itself is ready to build on a machine with the Android SDK installed. An APK from the original build (1.0.0) is attached to the [GitHub releases](https://github.com/Apurba94/sethil-game/releases); it predates the fixes in this repository.

For a local release build, set `ANDROID_HOME` to an installed Android SDK, then run:

```bash
cd android
./gradlew assembleRelease
```

The unsigned release output will be created under `android/app/build/outputs/apk/release/`. Alternatively, the included `preview` profile requests an APK from an Android cloud-build provider that supports Expo build profiles.

## Multiplayer roadmap

This deliverable is an **offline training prototype**, not a live online battle-royale service. The user interface talks to a `MatchTransport` boundary rather than directly coupling to local game logic. A production online mode should introduce an authoritative server, persistent room state, server-side hit validation, matchmaking, anti-cheat protections, performance telemetry, moderation, and load testing before inviting real players.

For a single-room proof of concept, a persistent Node process and WebSocket transport can replace `LocalTrainingTransport`. A production battle royale needs substantially more capacity and operations design than this mobile prototype intentionally includes.

## Configuration

Playing needs no configuration. The optional server (sign-in, database, Forge APIs) reads the variables listed in `.env.example`; copy it to `.env` to use them. `.env` is git-ignored.

On the very first web start after a fresh install, NativeWind can fail with `Failed to get the SHA-1 for ... react-native-css-interop/.cache/web.css`; run the command again.

## Source

<https://github.com/Apurba94/sethil-game>

No credentials or release signing keys are included. The Android `debug.keystore` is the standard public debug key.

## Credits

Created by **Janin A Apurba**. Released under the [MIT License](LICENSE).
