import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  beginMatch,
  firePlayer,
  formatMatchTime,
  getPlacement,
  reloadPlayer,
  setPaused,
  type MatchState,
  type Vector,
} from "@/lib/game/engine";
import { loadProfile, recordMatch } from "@/lib/game/storage";
import { LocalTrainingTransport } from "@/lib/game/transport";
import { gameHaptics } from "@/lib/haptics";

const STARTING_VECTOR: Vector = { x: 0, y: 0 };

const percent = (value: number): `${number}%` => `${value}%`;

function Metric({ label, value, tone = "#EAF5F7" }: { label: string; value: string | number; tone?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function ControlButton({ label, onPress, onPressIn, onPressOut, accent = false, wide = false }: {
  label: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [styles.controlButton, accent && styles.controlAccent, wide && styles.controlWide, pressed && styles.controlPressed]}
    >
      <Text style={[styles.controlLabel, accent && styles.controlAccentLabel]}>{label}</Text>
    </Pressable>
  );
}

export default function MatchScreen() {
  const router = useRouter();
  const [match, setMatch] = useState<MatchState>(() => LocalTrainingTransport.createSession());
  const [movement, setMovement] = useState<Vector>(STARTING_VECTOR);
  const [stored, setStored] = useState(false);
  const [preferences, setPreferences] = useState({ aimAssist: true, haptics: true });
  const resultHaptic = useRef<string | null>(null);

  useEffect(() => {
    loadProfile().then((profile) => setPreferences({ aimAssist: profile.aimAssist, haptics: profile.haptics })).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (match.status !== "playing") return;
    const clock = setInterval(() => {
      setMatch((current) => LocalTrainingTransport.submitMovement(current, movement, 0.18));
    }, 180);
    return () => clearInterval(clock);
  }, [match.status, movement]);

  useEffect(() => {
    if (match.status !== "victory" && match.status !== "eliminated") return;
    if (!stored) {
      setStored(true);
      recordMatch({ won: match.status === "victory", eliminations: match.eliminations, placement: getPlacement(match) }).catch(() => undefined);
    }
    if (resultHaptic.current !== match.status) {
      resultHaptic.current = match.status;
      if (match.status === "victory") {
        gameHaptics.success(preferences.haptics);
      } else {
        gameHaptics.warning(preferences.haptics);
      }
    }
  }, [match, preferences.haptics, stored]);

  const resetMatch = () => {
    resultHaptic.current = null;
    setStored(false);
    setMovement(STARTING_VECTOR);
    setMatch(LocalTrainingTransport.createSession());
  };

  const deploy = () => {
    gameHaptics.light(preferences.haptics);
    setMatch((current) => beginMatch(current));
  };

  const fire = () => {
    setMatch((current) => firePlayer(current, preferences.aimAssist));
    gameHaptics.hit(preferences.haptics);
  };

  const reload = () => {
    setMatch((current) => reloadPlayer(current));
    gameHaptics.light(preferences.haptics);
  };

  const togglePause = () => {
    setMovement(STARTING_VECTOR);
    setMatch((current) => setPaused(current, current.status !== "paused"));
    gameHaptics.light(preferences.haptics);
  };

  const healthPct = percent(Math.max(0, match.player.hp));
  const armorPct = percent(Math.max(0, match.player.armor));
  const zoneDiameter = percent(Math.min(96, match.zoneRadius * 2));
  const alive = match.bots.filter((bot) => bot.alive).length + (match.player.alive ? 1 : 0);
  const eventTone = match.event.tone === "danger" ? "#FF5F5F" : match.event.tone === "good" ? "#B9F227" : match.event.tone === "warning" ? "#FFB84D" : "#46D9FF";

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.hudTop}>
        <View>
          <Text style={styles.wordmark}>SHETHIL <Text style={styles.wordmarkMuted}>/ ARENA</Text></Text>
          <Text style={styles.sector}>SECTOR 07 · TRAINING ARRAY</Text>
        </View>
        <Pressable onPress={togglePause} style={({ pressed }) => [styles.pauseButton, pressed && styles.controlPressed]}>
          <Text style={styles.pauseText}>{match.status === "paused" ? "▶" : "Ⅱ"}</Text>
        </Pressable>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="ALIVE" value={String(alive).padStart(2, "0")} tone="#B9F227" />
        <Metric label="KILLS" value={String(match.eliminations).padStart(2, "0")} />
        <Metric label={`ZONE ${match.zonePhase}`} value={formatMatchTime(Math.max(0, 175 - match.elapsed))} tone="#46D9FF" />
      </View>

      <View style={styles.arenaFrame}>
        <View style={styles.arena}>
          <View style={[styles.zoneRing, { width: zoneDiameter, height: zoneDiameter }]} />
          <View style={styles.gridVertical} />
          <View style={styles.gridHorizontal} />
          {[20, 50, 80].map((position) => <View key={`v-${position}`} style={[styles.mapLine, { left: `${position}%` }]} />)}
          {[20, 50, 80].map((position) => <View key={`h-${position}`} style={[styles.mapLineHorizontal, { top: `${position}%` }]} />)}

          {match.loot.filter((item) => item.active).map((item) => (
            <View key={item.id} style={[styles.loot, { left: `${item.x}%`, top: `${item.y}%`, backgroundColor: item.kind === "armor" ? "#46D9FF" : item.kind === "medkit" ? "#FF5F5F" : "#FFB84D" }]} />
          ))}
          {match.bots.filter((bot) => bot.alive).map((bot) => (
            <View key={bot.id} style={[styles.combatant, styles.bot, { left: `${bot.x}%`, top: `${bot.y}%`, borderColor: bot.color }]}>
              <View style={[styles.combatantCore, { backgroundColor: bot.color }]} />
            </View>
          ))}
          {match.player.alive && (
            <View style={[styles.combatant, styles.player, { left: `${match.player.x}%`, top: `${match.player.y}%` }]}>
              <View style={styles.playerArrow} />
              <View style={styles.playerCore} />
            </View>
          )}
          <View style={styles.crosshair}><View style={styles.crosshairDot} /></View>
          <View style={styles.mapLegend}><Text style={styles.mapLegendText}>LOOT: <Text style={{ color: "#FFB84D" }}>AMMO</Text> · <Text style={{ color: "#46D9FF" }}>ARMOR</Text> · <Text style={{ color: "#FF5F5F" }}>MED</Text></Text></View>
        </View>
      </View>

      <View style={styles.eventBar}><Text style={[styles.eventText, { color: eventTone }]}>{match.event.text}</Text></View>

      <View style={styles.statusCluster}>
        <View style={styles.statusLine}><Text style={styles.statusLabel}>HP</Text><View style={styles.statusTrack}><View style={[styles.statusFill, { width: healthPct, backgroundColor: match.player.hp > 30 ? "#B9F227" : "#FF5F5F" }]} /></View><Text style={styles.statusNumber}>{Math.ceil(match.player.hp)}</Text></View>
        <View style={styles.statusLine}><Text style={styles.statusLabel}>AR</Text><View style={styles.statusTrack}><View style={[styles.statusFill, { width: armorPct, backgroundColor: "#46D9FF" }]} /></View><Text style={styles.statusNumber}>{Math.ceil(match.player.armor)}</Text></View>
      </View>

      <View style={styles.controls}>
        <View style={styles.movePad}>
          <ControlButton label="▲" onPressIn={() => setMovement({ x: 0, y: -1 })} onPressOut={() => setMovement(STARTING_VECTOR)} />
          <View style={styles.moveRow}>
            <ControlButton label="◀" onPressIn={() => setMovement({ x: -1, y: 0 })} onPressOut={() => setMovement(STARTING_VECTOR)} />
            <View style={styles.moveCenter}><Text style={styles.moveCenterText}>MOVE</Text></View>
            <ControlButton label="▶" onPressIn={() => setMovement({ x: 1, y: 0 })} onPressOut={() => setMovement(STARTING_VECTOR)} />
          </View>
          <ControlButton label="▼" onPressIn={() => setMovement({ x: 0, y: 1 })} onPressOut={() => setMovement(STARTING_VECTOR)} />
        </View>

        <View style={styles.weaponPanel}>
          <Text style={styles.weaponName}>RANGER <Text style={styles.weaponTier}>MK.1</Text></Text>
          <Text style={styles.ammoText}>{String(match.player.ammo).padStart(2, "0")}<Text style={styles.reserveAmmo}> / {String(match.player.reserveAmmo).padStart(3, "0")}</Text></Text>
          <View style={styles.weaponButtons}>
            <ControlButton label="RELOAD" onPress={reload} />
            <ControlButton label="FIRE" accent wide onPress={fire} />
          </View>
        </View>
      </View>

      {match.status === "briefing" && (
        <View style={styles.overlay}>
          <View style={styles.briefingCard}>
            <Text style={styles.eyebrow}>DROP BRIEFING</Text>
            <Text style={styles.briefingTitle}>SURVIVE THE{`\n`}CLOSING RING.</Text>
            <Text style={styles.briefingBody}>Six hostile simulation units. Scavenge field supplies, use assisted target acquisition, and own the final safe zone.</Text>
            <View style={styles.briefingStats}><Metric label="SQUAD" value="01" /><Metric label="HOSTILES" value="06" tone="#FF6B79" /><Metric label="RISK" value="HIGH" tone="#FFB84D" /></View>
            <Pressable onPress={deploy} style={({ pressed }) => [styles.deployButton, pressed && styles.controlPressed]}><Text style={styles.deployText}>DEPLOY TO SECTOR 07</Text></Pressable>
          </View>
        </View>
      )}

      {match.status === "paused" && (
        <View style={styles.overlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.eyebrow}>TACTICAL PAUSE</Text>
            <Text style={styles.pauseTitle}>HOLD POSITION.</Text>
            <Text style={styles.briefingBody}>The local simulation is paused. Resume when you are ready to continue.</Text>
            <Pressable onPress={togglePause} style={({ pressed }) => [styles.deployButton, pressed && styles.controlPressed]}><Text style={styles.deployText}>RESUME MATCH</Text></Pressable>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.leaveButton, pressed && styles.controlPressed]}><Text style={styles.leaveText}>LEAVE ARENA</Text></Pressable>
          </View>
        </View>
      )}

      {(match.status === "victory" || match.status === "eliminated") && (
        <View style={styles.overlay}>
          <View style={styles.resultCard}>
            <Text style={[styles.eyebrow, { color: match.status === "victory" ? "#B9F227" : "#FF5F5F" }]}>{match.status === "victory" ? "MATCH WON" : "MATCH COMPLETE"}</Text>
            <Text style={styles.resultTitle}>{match.status === "victory" ? "ARENA{`\n`}SECURED." : "SIGNAL{`\n`}LOST."}</Text>
            <View style={styles.resultGrid}>
              <Metric label="PLACEMENT" value={`#${getPlacement(match)}`} tone="#B9F227" />
              <Metric label="ELIMS" value={String(match.eliminations).padStart(2, "0")} />
              <Metric label="DAMAGE" value={match.damageDealt} tone="#46D9FF" />
              <Metric label="SURVIVAL" value={formatMatchTime(match.elapsed)} />
            </View>
            <Pressable onPress={resetMatch} style={({ pressed }) => [styles.deployButton, pressed && styles.controlPressed]}><Text style={styles.deployText}>RUN IT BACK</Text></Pressable>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.leaveButton, pressed && styles.controlPressed]}><Text style={styles.leaveText}>RETURN TO COMMAND</Text></Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#091016", paddingHorizontal: 16, paddingTop: 58, paddingBottom: 18 },
  hudTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  wordmark: { color: "#F0FBFF", fontSize: 19, fontWeight: "900", letterSpacing: 1.6 },
  wordmarkMuted: { color: "#5E7680", fontSize: 12 },
  sector: { color: "#8098A1", fontSize: 9, fontWeight: "800", letterSpacing: 1.3, marginTop: 4 },
  pauseButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: "#2D4651", backgroundColor: "#111B22" },
  pauseText: { color: "#EAF5F7", fontSize: 18, fontWeight: "900" },
  metricsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  metric: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: "#203641", backgroundColor: "#111B22", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  metricLabel: { color: "#72909A", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  metricValue: { color: "#EAF5F7", fontSize: 17, fontWeight: "900", letterSpacing: 0.7, marginTop: 2 },
  arenaFrame: { flex: 1, minHeight: 270, marginTop: 12, borderWidth: 1, borderColor: "#2A4851", backgroundColor: "#0D1A20", borderRadius: 22, overflow: "hidden", padding: 7 },
  arena: { flex: 1, borderRadius: 17, overflow: "hidden", backgroundColor: "#13242E", borderWidth: 1, borderColor: "#1F3E49" },
  zoneRing: { position: "absolute", alignSelf: "center", top: "2%", borderWidth: 2, borderColor: "rgba(70, 217, 255, 0.82)", borderRadius: 999, backgroundColor: "rgba(70, 217, 255, 0.025)" },
  gridVertical: { position: "absolute", left: "50%", width: 1, height: "100%", backgroundColor: "rgba(91, 158, 169, 0.13)" },
  gridHorizontal: { position: "absolute", top: "50%", height: 1, width: "100%", backgroundColor: "rgba(91, 158, 169, 0.13)" },
  mapLine: { position: "absolute", width: 1, height: "100%", backgroundColor: "rgba(91, 158, 169, 0.07)" },
  mapLineHorizontal: { position: "absolute", width: "100%", height: 1, backgroundColor: "rgba(91, 158, 169, 0.07)" },
  combatant: { position: "absolute", width: 22, height: 22, marginLeft: -11, marginTop: -11, alignItems: "center", justifyContent: "center" },
  bot: { borderRadius: 12, borderWidth: 1.5, backgroundColor: "#111B22" },
  combatantCore: { width: 7, height: 7, borderRadius: 7 },
  player: { borderRadius: 14, borderWidth: 2, borderColor: "#D9FF5D", backgroundColor: "rgba(185, 242, 39, 0.18)" },
  playerCore: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#B9F227" },
  playerArrow: { position: "absolute", top: -6, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 7, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#E9FF9F" },
  loot: { position: "absolute", width: 8, height: 8, borderRadius: 2, marginLeft: -4, marginTop: -4, transform: [{ rotate: "45deg" }], shadowColor: "#FFFFFF", shadowOpacity: 0.75, shadowRadius: 4 },
  crosshair: { position: "absolute", left: "50%", top: "50%", width: 36, height: 36, marginLeft: -18, marginTop: -18, borderRadius: 20, borderWidth: 1, borderColor: "rgba(234,245,247,0.7)", alignItems: "center", justifyContent: "center" },
  crosshairDot: { width: 4, height: 4, borderRadius: 4, backgroundColor: "#FFFFFF" },
  mapLegend: { position: "absolute", bottom: 10, alignSelf: "center", backgroundColor: "rgba(9,16,22,0.75)", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  mapLegendText: { color: "#98B6BF", fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  eventBar: { minHeight: 28, justifyContent: "center", alignItems: "center" },
  eventText: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  statusCluster: { gap: 6, marginBottom: 10 },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusLabel: { width: 21, color: "#9DB8C1", fontSize: 9, fontWeight: "900" },
  statusTrack: { flex: 1, height: 8, borderRadius: 10, backgroundColor: "#1B3039", overflow: "hidden" },
  statusFill: { height: "100%", borderRadius: 10 },
  statusNumber: { width: 26, color: "#DCEEF2", fontSize: 10, textAlign: "right", fontWeight: "800" },
  controls: { flexDirection: "row", gap: 18, alignItems: "flex-end" },
  movePad: { width: 124, alignItems: "center", gap: 2 },
  moveRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  moveCenter: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#162A33", borderWidth: 1, borderColor: "#31515C", alignItems: "center", justifyContent: "center" },
  moveCenterText: { color: "#7FA1AA", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  controlButton: { minWidth: 42, height: 42, paddingHorizontal: 9, borderRadius: 13, borderWidth: 1, borderColor: "#31515C", backgroundColor: "#111B22", alignItems: "center", justifyContent: "center" },
  controlWide: { minWidth: 80 },
  controlAccent: { backgroundColor: "#B9F227", borderColor: "#D8FF70" },
  controlPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  controlLabel: { color: "#D6EAF0", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  controlAccentLabel: { color: "#101B0A" },
  weaponPanel: { flex: 1, alignItems: "flex-end" },
  weaponName: { color: "#D6EAF0", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  weaponTier: { color: "#B9F227" },
  ammoText: { color: "#F5FEFF", fontSize: 34, fontWeight: "900", letterSpacing: -1, lineHeight: 39 },
  reserveAmmo: { color: "#7F9EA8", fontSize: 16, letterSpacing: 0 },
  weaponButtons: { flexDirection: "row", gap: 7, marginTop: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2, 8, 11, 0.76)", paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  briefingCard: { width: "100%", backgroundColor: "#111B22", borderWidth: 1, borderColor: "#34505B", borderRadius: 24, padding: 24 },
  pauseCard: { width: "100%", backgroundColor: "#111B22", borderWidth: 1, borderColor: "#34505B", borderRadius: 24, padding: 24 },
  resultCard: { width: "100%", backgroundColor: "#111B22", borderWidth: 1, borderColor: "#34505B", borderRadius: 24, padding: 24 },
  eyebrow: { color: "#46D9FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.7 },
  briefingTitle: { color: "#F0FBFF", fontSize: 34, lineHeight: 35, fontWeight: "900", letterSpacing: -1.2, marginTop: 13 },
  pauseTitle: { color: "#F0FBFF", fontSize: 30, lineHeight: 32, fontWeight: "900", letterSpacing: -1, marginTop: 13 },
  briefingBody: { color: "#9FB9C1", fontSize: 13, lineHeight: 20, marginTop: 14 },
  briefingStats: { flexDirection: "row", gap: 8, marginTop: 20 },
  deployButton: { height: 56, borderRadius: 16, backgroundColor: "#B9F227", alignItems: "center", justifyContent: "center", marginTop: 22 },
  deployText: { color: "#111B0B", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  leaveButton: { height: 48, alignItems: "center", justifyContent: "center", marginTop: 5 },
  leaveText: { color: "#9BB5BE", fontSize: 11, fontWeight: "900", letterSpacing: 0.9 },
  resultTitle: { color: "#F0FBFF", fontSize: 40, lineHeight: 38, fontWeight: "900", letterSpacing: -1.4, marginTop: 14 },
  resultGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 22 },
});
