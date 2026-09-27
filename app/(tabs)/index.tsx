import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ScreenContainer } from "@/components/screen-container";
import { defaultProfile, loadProfile, saveProfile, type CareerProfile } from "@/lib/game/storage";
import { gameHaptics } from "@/lib/haptics";

const SHEHIL_ICON = require("../../assets/images/icon.png");

export default function CommandScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<CareerProfile>(defaultProfile);
  const [loadoutOpen, setLoadoutOpen] = useState(false);

  useEffect(() => {
    loadProfile().then(setProfile).catch(() => undefined);
  }, []);

  const updateProfile = (update: Partial<CareerProfile>) => {
    const next = { ...profile, ...update };
    setProfile(next);
    saveProfile(next).catch(() => undefined);
    gameHaptics.light();
  };

  const deploy = () => {
    gameHaptics.light();
    router.push("/match" as never);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandLine}><View style={styles.liveDot} /><Text style={styles.networkText}>LOCAL TRAINING ARRAY</Text></View>
          <Text style={styles.title}>SHETHIL</Text>
          <Text style={styles.subtitle}>TACTICAL SURVIVAL SYSTEM</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.logoWrap}><Image source={SHEHIL_ICON} style={styles.logo} /></View>
          <View style={styles.identityText}><Text style={styles.callsignLabel}>OPERATOR CALLSIGN</Text><Text style={styles.callsign}>{profile.callsign}</Text><Text style={styles.rank}>RANK: FIELD RECRUIT</Text></View>
          <View style={styles.rankBadge}><Text style={styles.rankBadgeTop}>LVL</Text><Text style={styles.rankBadgeValue}>{Math.max(1, profile.matches + 1)}</Text></View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}><Text style={styles.statLabel}>MATCHES</Text><Text style={styles.statValue}>{String(profile.matches).padStart(2, "0")}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>WINS</Text><Text style={[styles.statValue, { color: "#B9F227" }]}>{String(profile.wins).padStart(2, "0")}</Text></View>
          <View style={styles.statCard}><Text style={styles.statLabel}>BEST</Text><Text style={[styles.statValue, { color: "#46D9FF" }]}>#{profile.bestPlacement}</Text></View>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeTop}><View><Text style={styles.modeEyebrow}>SELECTED OPERATIONS</Text><Text style={styles.modeTitle}>SOLO TRAINING</Text></View><View style={styles.modeChip}><Text style={styles.modeChipText}>READY</Text></View></View>
          <Text style={styles.modeCopy}>Outlast six simulated rivals in a contracting reconnaissance zone. No network connection is required for this local training run.</Text>
          <View style={styles.modeDetails}><Text style={styles.modeDetail}>01 OPERATOR</Text><Text style={styles.modeDetail}>06 HOSTILES</Text><Text style={styles.modeDetail}>~03 MIN</Text></View>
        </View>

        <Pressable onPress={() => { setLoadoutOpen((open) => !open); gameHaptics.light(); }} style={({ pressed }) => [styles.loadoutButton, pressed && styles.pressed]}>
          <View><Text style={styles.loadoutLabel}>LOADOUT</Text><Text style={styles.loadoutValue}>RANGER MK.1 · RECON ARMOR</Text></View><Text style={styles.chevron}>{loadoutOpen ? "−" : "+"}</Text>
        </Pressable>

        {loadoutOpen && <View style={styles.settingsPanel}>
          <View style={styles.settingRow}><View><Text style={styles.settingTitle}>ASSISTED TARGETING</Text><Text style={styles.settingCopy}>Prioritises the closest threat in range.</Text></View><Switch value={profile.aimAssist} onValueChange={(value) => updateProfile({ aimAssist: value })} trackColor={{ false: "#2E4650", true: "#708C24" }} thumbColor={profile.aimAssist ? "#D9FF5D" : "#A3B8BD"} /></View>
          <View style={styles.settingRow}><View><Text style={styles.settingTitle}>HAPTIC SIGNALS</Text><Text style={styles.settingCopy}>Feedback for deploy, hits, and match results.</Text></View><Switch value={profile.haptics} onValueChange={(value) => updateProfile({ haptics: value })} trackColor={{ false: "#2E4650", true: "#708C24" }} thumbColor={profile.haptics ? "#D9FF5D" : "#A3B8BD"} /></View>
        </View>}

        <Pressable onPress={deploy} style={({ pressed }) => [styles.deployButton, pressed && styles.pressed]}><Text style={styles.deployText}>DEPLOY</Text><Text style={styles.deployArrow}>→</Text></Pressable>
        <Text style={styles.disclaimer}>OFFLINE PROTOTYPE · LOCAL BOT SIMULATION · MULTIPLAYER TRANSPORT READY</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 26 },
  header: { paddingTop: 8 },
  brandLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: "#B9F227" },
  networkText: { color: "#86A0A9", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#F2FBFF", fontSize: 46, fontWeight: "900", letterSpacing: 2.2, marginTop: 12, lineHeight: 48 },
  subtitle: { color: "#46D9FF", fontSize: 10, fontWeight: "900", letterSpacing: 2.3, marginTop: 3 },
  identityCard: { flexDirection: "row", alignItems: "center", marginTop: 26, padding: 14, borderRadius: 22, backgroundColor: "#111B22", borderWidth: 1, borderColor: "#29434D" },
  logoWrap: { width: 62, height: 62, borderRadius: 16, overflow: "hidden", backgroundColor: "#1C313A", borderWidth: 1, borderColor: "#46606A" },
  logo: { width: "100%", height: "100%" },
  identityText: { flex: 1, marginLeft: 12 },
  callsignLabel: { color: "#73909A", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  callsign: { color: "#F2FBFF", fontSize: 24, fontWeight: "900", letterSpacing: 0.9, marginTop: 3 },
  rank: { color: "#B9F227", fontSize: 9, fontWeight: "800", letterSpacing: 1, marginTop: 2 },
  rankBadge: { width: 49, height: 49, borderRadius: 13, borderWidth: 1, borderColor: "#4A6417", backgroundColor: "#1E2A10", alignItems: "center", justifyContent: "center" },
  rankBadgeTop: { color: "#A8C260", fontSize: 8, fontWeight: "900" },
  rankBadgeValue: { color: "#E8FFA2", fontSize: 17, fontWeight: "900" },
  statRow: { flexDirection: "row", gap: 9, marginTop: 11 },
  statCard: { flex: 1, backgroundColor: "#111B22", borderWidth: 1, borderColor: "#243E48", borderRadius: 14, padding: 11 },
  statLabel: { color: "#72909A", fontSize: 8, letterSpacing: 1, fontWeight: "900" },
  statValue: { color: "#F2FBFF", fontSize: 21, fontWeight: "900", marginTop: 4 },
  modeCard: { marginTop: 18, borderRadius: 22, padding: 18, backgroundColor: "#13242E", borderWidth: 1, borderColor: "#31525C" },
  modeTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  modeEyebrow: { color: "#46D9FF", fontSize: 8, letterSpacing: 1.2, fontWeight: "900" },
  modeTitle: { color: "#F2FBFF", fontSize: 21, fontWeight: "900", letterSpacing: 0.3, marginTop: 4 },
  modeChip: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#213D1B" },
  modeChipText: { color: "#CFFC5A", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  modeCopy: { color: "#A1BBC3", fontSize: 13, lineHeight: 20, marginTop: 14 },
  modeDetails: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#294852", marginTop: 16, paddingTop: 12 },
  modeDetail: { color: "#78A0A8", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  loadoutButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, minHeight: 62, paddingHorizontal: 17, borderWidth: 1, borderColor: "#29434D", borderRadius: 18, backgroundColor: "#111B22" },
  loadoutLabel: { color: "#73909A", fontSize: 8, letterSpacing: 1.1, fontWeight: "900" },
  loadoutValue: { color: "#E3F2F5", fontSize: 11, fontWeight: "800", marginTop: 4, letterSpacing: 0.2 },
  chevron: { color: "#B9F227", fontSize: 24, fontWeight: "400" },
  settingsPanel: { borderWidth: 1, borderTopWidth: 0, borderColor: "#29434D", borderBottomLeftRadius: 18, borderBottomRightRadius: 18, backgroundColor: "#0E171C", marginTop: -18, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 8 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#203640" },
  settingTitle: { color: "#D9EBEF", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  settingCopy: { color: "#718E97", fontSize: 10, marginTop: 3, maxWidth: 230 },
  deployButton: { height: 62, marginTop: 18, borderRadius: 18, backgroundColor: "#B9F227", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 11 },
  deployText: { color: "#152009", fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },
  deployArrow: { color: "#152009", fontSize: 21, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  disclaimer: { textAlign: "center", color: "#53717B", fontSize: 8, lineHeight: 13, letterSpacing: 0.8, fontWeight: "800", marginTop: 14, paddingHorizontal: 18 },
});
