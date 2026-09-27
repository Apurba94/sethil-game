export type Vector = { x: number; y: number };

export type Combatant = {
  id: string;
  label: string;
  x: number;
  y: number;
  hp: number;
  armor: number;
  ammo: number;
  reserveAmmo: number;
  alive: boolean;
  isPlayer: boolean;
  lastActionAt: number;
  color: string;
};

export type LootKind = "ammo" | "armor" | "medkit";

export type Loot = { id: string; kind: LootKind; x: number; y: number; active: boolean };

export type MatchStatus = "briefing" | "playing" | "paused" | "victory" | "eliminated";

export type MatchEvent = { id: number; text: string; tone: "good" | "warning" | "danger" | "neutral" };

export type MatchState = {
  id: string;
  status: MatchStatus;
  elapsed: number;
  zoneRadius: number;
  zonePhase: number;
  player: Combatant;
  bots: Combatant[];
  loot: Loot[];
  eliminations: number;
  damageDealt: number;
  event: MatchEvent;
  randomState: number;
};

export const MAP_SIZE = 100;
export const STARTING_BOTS = 6;
const MAX_AMMO = 30;
const MATCH_DURATION = 175;

const BOT_NAMES = ["CIPHER", "VEX", "MIRAGE", "NOVA", "SABLE", "GHOST", "ORBIT", "KRAIT"];
const BOT_COLORS = ["#FF6B79", "#FFB84D", "#B98CFF", "#FF7DD0", "#F4F17A", "#FF8B5C"];

function nextRandom(seed: number): [number, number] {
  const value = (seed * 1664525 + 1013904223) >>> 0;
  return [value / 4294967296, value];
}

function clamp(value: number, lower: number, upper: number) {
  return Math.max(lower, Math.min(upper, value));
}

function distance(a: Vector, b: Vector) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function moveToward(source: Vector, target: Vector, amount: number): Vector {
  const length = distance(source, target) || 1;
  return {
    x: clamp(source.x + ((target.x - source.x) / length) * amount, 4, 96),
    y: clamp(source.y + ((target.y - source.y) / length) * amount, 4, 96),
  };
}

function pushEvent(state: MatchState, text: string, tone: MatchEvent["tone"]): MatchState {
  return { ...state, event: { id: state.event.id + 1, text, tone } };
}

function applyDamage(target: Combatant, rawDamage: number): Combatant {
  const armorDamage = Math.min(target.armor, rawDamage * 0.5);
  const hpDamage = rawDamage - armorDamage;
  const hp = Math.max(0, target.hp - hpDamage);
  return { ...target, armor: Math.max(0, target.armor - armorDamage), hp, alive: hp > 0 };
}

function finishIfNeeded(state: MatchState): MatchState {
  const aliveBots = state.bots.filter((bot) => bot.alive);
  if (!state.player.alive) {
    return { ...state, status: "eliminated" };
  }
  if (aliveBots.length === 0) {
    return { ...state, status: "victory", event: { id: state.event.id + 1, text: "ARENA SECURED", tone: "good" } };
  }
  return state;
}

export function createMatch(seed = Date.now()): MatchState {
  let randomState = seed >>> 0;
  const spawn = (baseX: number, baseY: number) => {
    const [xRoll, afterX] = nextRandom(randomState);
    const [yRoll, afterY] = nextRandom(afterX);
    randomState = afterY;
    return { x: baseX + xRoll * 18 - 9, y: baseY + yRoll * 18 - 9 };
  };

  const botBases = [
    [18, 17],
    [80, 20],
    [83, 72],
    [19, 78],
    [52, 13],
    [50, 86],
  ];

  const bots = botBases.map(([baseX, baseY], index) => {
    const point = spawn(baseX, baseY);
    return {
      id: `bot-${index}`,
      label: BOT_NAMES[index],
      ...point,
      hp: 100,
      armor: index % 2 === 0 ? 35 : 0,
      ammo: MAX_AMMO,
      reserveAmmo: 90,
      alive: true,
      isPlayer: false,
      lastActionAt: -index,
      color: BOT_COLORS[index],
    };
  });

  const lootPoints: Array<[LootKind, number, number]> = [
    ["ammo", 42, 42],
    ["armor", 64, 51],
    ["medkit", 31, 61],
    ["ammo", 71, 33],
    ["armor", 50, 73],
    ["medkit", 25, 35],
  ];

  return {
    id: `match-${seed}`,
    status: "briefing",
    elapsed: 0,
    zoneRadius: 48,
    zonePhase: 1,
    player: {
      id: "player",
      label: "SHE-01",
      x: 50,
      y: 50,
      hp: 100,
      armor: 35,
      ammo: MAX_AMMO,
      reserveAmmo: 90,
      alive: true,
      isPlayer: true,
      lastActionAt: -1,
      color: "#B9F227",
    },
    bots,
    loot: lootPoints.map(([kind, x, y], index) => ({ id: `loot-${index}`, kind, x, y, active: true })),
    eliminations: 0,
    damageDealt: 0,
    event: { id: 1, text: "DROP WINDOW OPEN", tone: "neutral" },
    randomState,
  };
}

export function beginMatch(state: MatchState): MatchState {
  return { ...state, status: "playing", event: { id: state.event.id + 1, text: "SAFE ZONE MARKED", tone: "good" } };
}

export function setPaused(state: MatchState, paused: boolean): MatchState {
  if (state.status === "victory" || state.status === "eliminated") return state;
  return { ...state, status: paused ? "paused" : "playing" };
}

export function movePlayer(state: MatchState, direction: Vector, deltaSeconds: number): MatchState {
  if (state.status !== "playing") return state;
  const magnitude = Math.hypot(direction.x, direction.y) || 1;
  const speed = 16 * deltaSeconds;
  const player = {
    ...state.player,
    x: clamp(state.player.x + (direction.x / magnitude) * speed, 4, 96),
    y: clamp(state.player.y + (direction.y / magnitude) * speed, 4, 96),
  };
  return { ...state, player };
}

export function firePlayer(state: MatchState, aimAssist = true): MatchState {
  if (state.status !== "playing") return state;
  if (state.player.ammo <= 0) return pushEvent(state, "MAG EMPTY — RELOAD", "warning");

  const target = state.bots
    .filter((bot) => bot.alive && (aimAssist || distance(state.player, bot) < 14))
    .sort((left, right) => distance(state.player, left) - distance(state.player, right))[0];
  const player = { ...state.player, ammo: state.player.ammo - 1 };

  if (!target || distance(player, target) > 34) {
    return pushEvent({ ...state, player }, "NO TARGET IN RANGE", "neutral");
  }

  const damage = distance(player, target) < 15 ? 31 : 22;
  const damagedTarget = applyDamage(target, damage);
  const bots = state.bots.map((bot) => (bot.id === target.id ? damagedTarget : bot));
  const wasEliminated = target.alive && !damagedTarget.alive;
  const advanced = {
    ...state,
    player,
    bots,
    eliminations: state.eliminations + (wasEliminated ? 1 : 0),
    damageDealt: state.damageDealt + damage,
  };
  const eventText = wasEliminated ? `${target.label} ELIMINATED` : `HIT ${target.label} · ${damage}`;
  return finishIfNeeded(pushEvent(advanced, eventText, wasEliminated ? "good" : "neutral"));
}

export function reloadPlayer(state: MatchState): MatchState {
  if (state.status !== "playing") return state;
  const missing = MAX_AMMO - state.player.ammo;
  const reload = Math.min(missing, state.player.reserveAmmo);
  if (!reload) return pushEvent(state, "NO RESERVE AMMO", "warning");
  const player = { ...state.player, ammo: state.player.ammo + reload, reserveAmmo: state.player.reserveAmmo - reload };
  return pushEvent({ ...state, player }, `RANGER RELOADED +${reload}`, "good");
}

export function advanceMatch(state: MatchState, direction: Vector, deltaSeconds: number): MatchState {
  if (state.status !== "playing") return state;
  let next = movePlayer(state, direction, deltaSeconds);
  const elapsed = next.elapsed + deltaSeconds;
  const zoneRadius = clamp(48 - (elapsed / MATCH_DURATION) * 39, 9, 48);
  const zonePhase = zoneRadius > 36 ? 1 : zoneRadius > 24 ? 2 : zoneRadius > 14 ? 3 : 4;
  let randomState = next.randomState;

  const bots = next.bots.map((bot, index) => {
    if (!bot.alive) return bot;
    const [roll, nextSeed] = nextRandom(randomState);
    randomState = nextSeed;
    const playerDistance = distance(bot, next.player);
    const centerDistance = distance(bot, { x: 50, y: 50 });
    let moved = bot;

    if (centerDistance > zoneRadius - 2) {
      const position = moveToward(bot, { x: 50, y: 50 }, 9 * deltaSeconds);
      moved = { ...moved, ...position };
    } else if (playerDistance < 40) {
      const strafe = roll > 0.5 ? 1 : -1;
      const desired = playerDistance > 20
        ? { x: next.player.x + strafe * 5, y: next.player.y - strafe * 5 }
        : { x: bot.x + strafe * 7, y: bot.y - strafe * 7 };
      const position = moveToward(bot, desired, 7 * deltaSeconds);
      moved = { ...moved, ...position };
    } else {
      const patrol = { x: 50 + Math.cos(elapsed + index) * 26, y: 50 + Math.sin(elapsed * 0.8 + index) * 26 };
      const position = moveToward(bot, patrol, 4 * deltaSeconds);
      moved = { ...moved, ...position };
    }

    if (playerDistance < 29 && elapsed - moved.lastActionAt > 1.4 + roll * 0.9) {
      return { ...moved, lastActionAt: elapsed };
    }
    return moved;
  });

  next = { ...next, elapsed, zoneRadius, zonePhase, bots, randomState };
  let player = next.player;
  let incomingDamage = 0;
  for (const bot of bots) {
    if (!bot.alive || distance(bot, player) >= 29 || Math.abs(bot.lastActionAt - elapsed) > 0.02) continue;
    incomingDamage += 9;
  }

  const outsideZone = distance(player, { x: 50, y: 50 }) > zoneRadius;
  if (outsideZone) incomingDamage += 4 * deltaSeconds * zonePhase;
  if (incomingDamage) player = applyDamage(player, incomingDamage);

  const loot = next.loot.map((item) => {
    if (!item.active || distance(player, item) > 6) return item;
    if (item.kind === "ammo") {
      player = { ...player, reserveAmmo: Math.min(150, player.reserveAmmo + 30) };
    } else if (item.kind === "armor") {
      player = { ...player, armor: Math.min(75, player.armor + 25) };
    } else {
      player = { ...player, hp: Math.min(100, player.hp + 25) };
    }
    return { ...item, active: false };
  });

  next = { ...next, player, loot };
  if (outsideZone && Math.floor(elapsed * 2) !== Math.floor((elapsed - deltaSeconds) * 2)) {
    next = pushEvent(next, "RETURN TO SAFE ZONE", "danger");
  } else if (incomingDamage && Math.floor(elapsed) !== Math.floor(elapsed - deltaSeconds)) {
    next = pushEvent(next, "INCOMING FIRE", "danger");
  }

  return finishIfNeeded(next);
}

/** Finishing position: everyone still standing ranks ahead of an eliminated player. */
export function getPlacement(state: MatchState) {
  return state.bots.filter((bot) => bot.alive).length + 1;
}

export function formatMatchTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}
