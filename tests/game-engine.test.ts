import { describe, expect, it } from "vitest";

import { advanceMatch, beginMatch, createMatch, firePlayer, getPlacement, reloadPlayer } from "../lib/game/engine";

describe("Shethil arena simulation", () => {
  it("creates a ready briefing with a player and six combatants", () => {
    const match = createMatch(42);
    expect(match.status).toBe("briefing");
    expect(match.bots).toHaveLength(6);
    expect(match.player.hp).toBe(100);
  });

  it("runs simulation time and contracts the safe zone", () => {
    const match = beginMatch(createMatch(42));
    const advanced = advanceMatch(match, { x: 0, y: 0 }, 10);
    expect(advanced.elapsed).toBe(10);
    expect(advanced.zoneRadius).toBeLessThan(match.zoneRadius);
  });

  it("uses reserve ammunition to refill an incomplete magazine", () => {
    const match = beginMatch(createMatch(42));
    const fired = firePlayer(match);
    const reloaded = reloadPlayer(fired);
    expect(reloaded.player.ammo).toBe(30);
    expect(reloaded.player.reserveAmmo).toBeLessThan(fired.player.reserveAmmo);
  });

  it("limits target acquisition when assisted targeting is disabled", () => {
    const match = beginMatch(createMatch(42));
    const fired = firePlayer(match, false);
    expect(fired.event.text).toBe("NO TARGET IN RANGE");
  });

  it("calculates a placement within the original roster", () => {
    const match = createMatch(42);
    expect(getPlacement(match)).toBe(7);
  });

  it("ranks an eliminated player behind every survivor", () => {
    const match = createMatch(42);
    const bots = match.bots.map((bot, index) => ({ ...bot, alive: index === 0 }));
    const eliminated = { ...match, bots, player: { ...match.player, hp: 0, alive: false } };
    expect(getPlacement(eliminated)).toBe(2);
  });

  it("ranks the last player standing first", () => {
    const match = createMatch(42);
    const won = { ...match, bots: match.bots.map((bot) => ({ ...bot, alive: false })) };
    expect(getPlacement(won)).toBe(1);
  });
});
